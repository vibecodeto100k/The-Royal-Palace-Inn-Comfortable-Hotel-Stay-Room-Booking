import { Router, Response } from 'express';
import { db } from '../db.js';
import {
  AuthenticatedRequest,
  requireAdminAuth,
  verifyPassword,
  hashPassword,
  generateToken,
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
  recordAuditLog
} from '../auth.js';
import { getCategoryAvailability } from './public.js';

export const adminRouter = Router();

// ==========================================
// 1. AUTHENTICATION & PROFILE
// ==========================================

// POST /api/admin/login
adminRouter.post('/login', (req, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const rateLimit = checkLoginRateLimit(ip);

  if (!rateLimit.allowed) {
    res.status(429).json({
      error: `Too many failed attempts. Login locked for ${rateLimit.waitSeconds} seconds.`
    });
    return;
  }

  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }

  const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(String(username).trim()) as any;

  if (!admin || !verifyPassword(password, admin.password_hash)) {
    recordFailedLogin(ip);
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }

  resetLoginAttempts(ip);
  recordAuditLog('ADMIN_LOGIN', `Admin ${admin.username} logged in successfully`, admin.username, ip);

  const token = generateToken({
    id: admin.id,
    username: admin.username,
    name: admin.name,
    role: admin.role
  });

  res.json({
    success: true,
    token,
    user: {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role: admin.role
    }
  });
});

// GET /api/admin/me
adminRouter.get('/me', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const admin = db.prepare('SELECT id, username, name, role, created_at FROM admin_users WHERE id = ?').get(req.admin!.id);
  res.json({ success: true, user: admin });
});

// POST /api/admin/change-password
adminRouter.post('/change-password', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required.' });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    return;
  }

  const admin = db.prepare('SELECT password_hash FROM admin_users WHERE id = ?').get(req.admin!.id) as { password_hash: string };
  if (!verifyPassword(currentPassword, admin.password_hash)) {
    res.status(400).json({ error: 'Incorrect current password.' });
    return;
  }

  const newHash = hashPassword(newPassword);
  db.prepare('UPDATE admin_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, req.admin!.id);

  recordAuditLog('PASSWORD_CHANGED', `Admin ${req.admin!.username} updated their password`, req.admin!.username, req.ip);

  res.json({ success: true, message: 'Password updated successfully.' });
});

// ==========================================
// 2. DASHBOARD OVERVIEW & STATS
// ==========================================

// GET /api/admin/dashboard-stats
adminRouter.get('/dashboard-stats', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Total rooms count
    const totalRoomsRow = db.prepare('SELECT COUNT(*) as count FROM physical_rooms').get() as { count: number };
    const totalRooms = totalRoomsRow.count;

    // Active rooms
    const activeRoomsRow = db.prepare("SELECT COUNT(*) as count FROM physical_rooms WHERE status = 'active'").get() as { count: number };
    const activeRooms = activeRoomsRow.count;

    // Today's occupied rooms
    const occupiedTodayRow = db.prepare(`
      SELECT COUNT(DISTINCT physical_room_id) as count
      FROM bookings
      WHERE physical_room_id IS NOT NULL
        AND status IN ('confirmed', 'checked_in')
        AND check_in_date <= ? AND check_out_date > ?
    `).get(today, today) as { count: number };
    const occupiedToday = occupiedTodayRow.count;

    // Today's check-ins
    const checkInsTodayRow = db.prepare(`
      SELECT COUNT(*) as count FROM bookings
      WHERE check_in_date = ? AND status IN ('confirmed', 'pending')
    `).get(today) as { count: number };

    // Today's check-outs
    const checkOutsTodayRow = db.prepare(`
      SELECT COUNT(*) as count FROM bookings
      WHERE check_out_date = ? AND status IN ('checked_in', 'confirmed')
    `).get(today) as { count: number };

    // Pending booking enquiries needing attention
    const pendingEnquiriesRow = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'").get() as { count: number };

    // Revenue statistics
    const revenueRow = db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as collected_revenue
      FROM bookings
      WHERE status NOT IN ('cancelled', 'no_show')
    `).get() as { total_revenue: number; collected_revenue: number };

    // Recent 5 bookings
    const recentBookings = db.prepare(`
      SELECT b.*, c.name as category_name, r.room_number as assigned_room_number
      FROM bookings b
      LEFT JOIN room_categories c ON b.category_id = c.id
      LEFT JOIN physical_rooms r ON b.physical_room_id = r.id
      ORDER BY b.created_at DESC
      LIMIT 6
    `).all();

    res.json({
      success: true,
      stats: {
        totalRooms,
        activeRooms,
        occupiedToday,
        availableToday: Math.max(0, activeRooms - occupiedToday),
        occupancyRate: activeRooms > 0 ? Math.round((occupiedToday / activeRooms) * 100) : 0,
        checkInsToday: checkInsTodayRow.count,
        checkOutsToday: checkOutsTodayRow.count,
        pendingEnquiries: pendingEnquiriesRow.count,
        totalRevenue: revenueRow.total_revenue,
        collectedRevenue: revenueRow.collected_revenue
      },
      recentBookings
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats: ' + err.message });
  }
});

// ==========================================
// 3. BOOKINGS MANAGEMENT
// ==========================================

// GET /api/admin/bookings
adminRouter.get('/bookings', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, category_id, search, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT b.*, c.name as category_name, r.room_number as assigned_room_number, r.name as assigned_room_name
      FROM bookings b
      LEFT JOIN room_categories c ON b.category_id = c.id
      LEFT JOIN physical_rooms r ON b.physical_room_id = r.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ' AND b.status = ?';
      params.push(status);
    }

    if (category_id && category_id !== 'all') {
      query += ' AND b.category_id = ?';
      params.push(category_id);
    }

    if (search) {
      query += ' AND (b.guest_name LIKE ? OR b.guest_phone LIKE ? OR b.reference LIKE ? OR b.guest_email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY b.check_in_date DESC, b.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(String(limit), 10), parseInt(String(offset), 10));

    const bookings = db.prepare(query).all(...params);

    // Total count for pagination
    let countQuery = 'SELECT COUNT(*) as count FROM bookings b WHERE 1=1';
    const countParams: any[] = [];
    if (status && status !== 'all') {
      countQuery += ' AND b.status = ?';
      countParams.push(status);
    }
    if (category_id && category_id !== 'all') {
      countQuery += ' AND b.category_id = ?';
      countParams.push(category_id);
    }
    if (search) {
      countQuery += ' AND (b.guest_name LIKE ? OR b.guest_phone LIKE ? OR b.reference LIKE ? OR b.guest_email LIKE ?)';
      const s = `%${search}%`;
      countParams.push(s, s, s, s);
    }
    const countResult = db.prepare(countQuery).get(...countParams) as { count: number };

    res.json({
      success: true,
      bookings,
      total: countResult.count
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch bookings: ' + err.message });
  }
});

// POST /api/admin/bookings - Create direct walk-in / phone booking
adminRouter.post('/bookings', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      guest_name,
      guest_phone,
      guest_email,
      category_id,
      physical_room_id,
      check_in_date,
      check_out_date,
      adults = 2,
      children = 0,
      rate_per_night,
      status = 'confirmed',
      payment_status = 'paid',
      payment_method = 'pay_at_hotel',
      special_requests = '',
      internal_notes = ''
    } = req.body;

    if (!guest_name || !guest_phone || !category_id || !check_in_date || !check_out_date) {
      res.status(400).json({ error: 'Missing required fields for booking.' });
      return;
    }

    const t1 = new Date(check_in_date + 'T00:00:00Z').getTime();
    const t2 = new Date(check_out_date + 'T00:00:00Z').getTime();
    const nights = Math.max(1, Math.round((t2 - t1) / (1000 * 60 * 60 * 24)));

    // Verify room assignment if provided
    if (physical_room_id) {
      const conflict = db.prepare(`
        SELECT reference, guest_name FROM bookings
        WHERE physical_room_id = ?
          AND status IN ('confirmed', 'checked_in')
          AND check_in_date < ?
          AND check_out_date > ?
      `).get(physical_room_id, check_out_date, check_in_date) as any;

      if (conflict) {
        res.status(409).json({
          error: `Room is already occupied by ${conflict.guest_name} (${conflict.reference}) during these dates.`
        });
        return;
      }
    }

    const category = db.prepare('SELECT base_price FROM room_categories WHERE id = ?').get(category_id) as any;
    const finalRate = rate_per_night ? parseInt(rate_per_night, 10) : (category ? category.base_price : 2490);
    const subtotal = finalRate * nights;

    const taxRow = db.prepare("SELECT value FROM hotel_settings WHERE key = 'tax_rate'").get() as { value: string };
    const taxPercent = taxRow ? parseFloat(taxRow.value) : 12;
    const taxAmount = Math.round(subtotal * (taxPercent / 100));
    const totalAmount = subtotal + taxAmount;

    const year = new Date().getFullYear();
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reference = `RPI-${year}-${randomHex}`;
    const id = 'book-' + Date.now() + '-' + randomHex;

    db.prepare(`
      INSERT INTO bookings (
        id, reference, guest_name, guest_phone, guest_email, category_id, physical_room_id,
        check_in_date, check_out_date, nights, adults, children, rooms_count,
        rate_per_night, subtotal, tax_amount, total_amount, special_requests,
        status, payment_status, payment_method, internal_notes
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, 1,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `).run(
      id,
      reference,
      guest_name.trim(),
      guest_phone.trim(),
      guest_email ? guest_email.trim() : null,
      category_id,
      physical_room_id || null,
      check_in_date,
      check_out_date,
      nights,
      adults,
      children,
      finalRate,
      subtotal,
      taxAmount,
      totalAmount,
      special_requests,
      status,
      payment_status,
      payment_method,
      internal_notes
    );

    recordAuditLog('CREATE_BOOKING', `Created manual reservation ${reference} for ${guest_name}`, req.admin!.username, req.ip);

    res.json({ success: true, reference, id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create booking: ' + err.message });
  }
});

// PATCH /api/admin/bookings/:id - Confirm, assign room, update status or payment
adminRouter.patch('/bookings/:id', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      status,
      physical_room_id,
      payment_status,
      payment_method,
      internal_notes,
      guest_name,
      guest_phone,
      guest_email,
      special_requests
    } = req.body;

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as any;
    if (!booking) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    // If changing physical room or status to confirmed/checked_in, check for conflicts
    const targetRoomId = physical_room_id !== undefined ? physical_room_id : booking.physical_room_id;
    const targetStatus = status !== undefined ? status : booking.status;

    if (targetRoomId && ['confirmed', 'checked_in'].includes(targetStatus)) {
      const conflict = db.prepare(`
        SELECT id, reference, guest_name FROM bookings
        WHERE physical_room_id = ?
          AND id != ?
          AND status IN ('confirmed', 'checked_in')
          AND check_in_date < ?
          AND check_out_date > ?
      `).get(targetRoomId, id, booking.check_out_date, booking.check_in_date) as any;

      if (conflict) {
        res.status(409).json({
          error: `Room conflict! Physical room is already reserved for ${conflict.guest_name} (${conflict.reference}) during ${booking.check_in_date} to ${booking.check_out_date}.`
        });
        return;
      }

      // Check maintenance blocks
      const blockConflict = db.prepare(`
        SELECT reason FROM room_blocks
        WHERE physical_room_id = ?
          AND start_date < ?
          AND end_date > ?
      `).get(targetRoomId, booking.check_out_date, booking.check_in_date) as any;

      if (blockConflict) {
        res.status(409).json({
          error: `Room is blocked for maintenance: "${blockConflict.reason}". Please select another room.`
        });
        return;
      }
    }

    db.prepare(`
      UPDATE bookings SET
        status = COALESCE(?, status),
        physical_room_id = ?,
        payment_status = COALESCE(?, payment_status),
        payment_method = COALESCE(?, payment_method),
        internal_notes = COALESCE(?, internal_notes),
        guest_name = COALESCE(?, guest_name),
        guest_phone = COALESCE(?, guest_phone),
        guest_email = COALESCE(?, guest_email),
        special_requests = COALESCE(?, special_requests),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      status ?? null,
      targetRoomId ?? null,
      payment_status ?? null,
      payment_method ?? null,
      internal_notes ?? null,
      guest_name ?? null,
      guest_phone ?? null,
      guest_email ?? null,
      special_requests ?? null,
      id
    );

    recordAuditLog(
      'UPDATE_BOOKING',
      `Updated booking ${booking.reference}: Status -> ${targetStatus}, Room -> ${targetRoomId || 'Unassigned'}`,
      req.admin!.username,
      req.ip
    );

    const updated = db.prepare(`
      SELECT b.*, c.name as category_name, r.room_number as assigned_room_number, r.name as assigned_room_name
      FROM bookings b
      LEFT JOIN room_categories c ON b.category_id = c.id
      LEFT JOIN physical_rooms r ON b.physical_room_id = r.id
      WHERE b.id = ?
    `).get(id);

    res.json({ success: true, booking: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update booking: ' + err.message });
  }
});

// ==========================================
// 4. PHYSICAL ROOMS INVENTORY (STRICT 6 ROOMS)
// ==========================================

// GET /api/admin/rooms - All 6 physical rooms
adminRouter.get('/rooms', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const rooms = db.prepare(`
      SELECT 
        r.*,
        c.name as category_name,
        c.base_price as category_price,
        (
          SELECT b.reference || ' - ' || b.guest_name || ' (' || b.status || ')'
          FROM bookings b
          WHERE b.physical_room_id = r.id
            AND b.status IN ('confirmed', 'checked_in')
            AND b.check_in_date <= ? AND b.check_out_date > ?
          LIMIT 1
        ) as current_occupant,
        (
          SELECT rb.reason
          FROM room_blocks rb
          WHERE rb.physical_room_id = r.id
            AND rb.start_date <= ? AND rb.end_date > ?
          LIMIT 1
        ) as active_block_reason
      FROM physical_rooms r
      LEFT JOIN room_categories c ON r.category_id = c.id
      ORDER BY r.room_number ASC
    `).all(today, today, today, today);

    res.json({ success: true, rooms });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch rooms: ' + err.message });
  }
});

// POST /api/admin/rooms/:id - Update room configuration, category assignment, maintenance status
adminRouter.post('/rooms/:id', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category_id, floor, status, maintenance_notes } = req.body;

    const existing = db.prepare('SELECT * FROM physical_rooms WHERE id = ?').get(id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Physical room not found.' });
      return;
    }

    db.prepare(`
      UPDATE physical_rooms SET
        name = COALESCE(?, name),
        category_id = COALESCE(?, category_id),
        floor = COALESCE(?, floor),
        status = COALESCE(?, status),
        maintenance_notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name ?? null,
      category_id ?? null,
      floor ?? null,
      status ?? null,
      maintenance_notes ?? null,
      id
    );

    recordAuditLog(
      'UPDATE_ROOM',
      `Updated room ${existing.room_number}: Category -> ${category_id || existing.category_id}, Status -> ${status || existing.status}`,
      req.admin!.username,
      req.ip
    );

    res.json({ success: true, message: `Room ${existing.room_number} updated successfully.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update physical room: ' + err.message });
  }
});

// ==========================================
// 5. ROOM CATEGORIES & RATES MANAGEMENT
// ==========================================

// GET /api/admin/categories
adminRouter.get('/categories', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = db.prepare(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM physical_rooms r WHERE r.category_id = c.id) as assigned_rooms_count
      FROM room_categories c
      ORDER BY c.sort_order ASC
    `).all() as any[];

    const formatted = categories.map(cat => ({
      ...cat,
      amenities: JSON.parse(cat.amenities_json || '[]'),
      images: JSON.parse(cat.images_json || '[]')
    }));

    res.json({ success: true, categories: formatted });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch categories: ' + err.message });
  }
});

// PUT /api/admin/categories/:id - Update category details, prices, images, descriptions
adminRouter.put('/categories/:id', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      base_price,
      max_adults,
      max_children,
      max_occupancy,
      bed_type,
      room_size,
      view_type,
      description,
      amenities,
      primary_image,
      images
    } = req.body;

    const existing = db.prepare('SELECT * FROM room_categories WHERE id = ?').get(id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Room category not found.' });
      return;
    }

    db.prepare(`
      UPDATE room_categories SET
        name = COALESCE(?, name),
        base_price = COALESCE(?, base_price),
        max_adults = COALESCE(?, max_adults),
        max_children = COALESCE(?, max_children),
        max_occupancy = COALESCE(?, max_occupancy),
        bed_type = COALESCE(?, bed_type),
        room_size = COALESCE(?, room_size),
        view_type = COALESCE(?, view_type),
        description = COALESCE(?, description),
        amenities_json = COALESCE(?, amenities_json),
        primary_image = COALESCE(?, primary_image),
        images_json = COALESCE(?, images_json),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name ?? null,
      base_price ? parseInt(base_price, 10) : null,
      max_adults ? parseInt(max_adults, 10) : null,
      max_children ? parseInt(max_children, 10) : null,
      max_occupancy ? parseInt(max_occupancy, 10) : null,
      bed_type ?? null,
      room_size ?? null,
      view_type ?? null,
      description ?? null,
      amenities ? JSON.stringify(amenities) : null,
      primary_image ?? null,
      images ? JSON.stringify(images) : null,
      id
    );

    recordAuditLog('UPDATE_CATEGORY', `Updated category "${name || existing.name}" (₹${base_price || existing.base_price})`, req.admin!.username, req.ip);

    res.json({ success: true, message: 'Room category updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update category: ' + err.message });
  }
});

// ==========================================
// 6. CALENDAR & AVAILABILITY GRID (6 ROOMS)
// ==========================================

// GET /api/admin/calendar?month=YYYY-MM
adminRouter.get('/calendar', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const month = (req.query.month as string) || new Date().toISOString().substring(0, 7);
    const startDate = `${month}-01`;

    // Calculate end date for month
    const parts = month.split('-').map(Number);
    const lastDay = new Date(parts[0], parts[1], 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

    // Get all 6 physical rooms
    const rooms = db.prepare(`
      SELECT r.id, r.room_number, r.name, r.category_id, r.status, c.name as category_name
      FROM physical_rooms r
      LEFT JOIN room_categories c ON r.category_id = c.id
      ORDER BY r.room_number ASC
    `).all() as any[];

    // Get all active bookings in this month
    const bookings = db.prepare(`
      SELECT b.id, b.reference, b.guest_name, b.guest_phone, b.physical_room_id,
             b.check_in_date, b.check_out_date, b.status, b.payment_status, b.total_amount
      FROM bookings b
      WHERE b.physical_room_id IS NOT NULL
        AND b.status IN ('confirmed', 'checked_in')
        AND b.check_in_date <= ? AND b.check_out_date >= ?
    `).all(endDate, startDate) as any[];

    // Get all blocks in this month
    const blocks = db.prepare(`
      SELECT rb.id, rb.physical_room_id, rb.start_date, rb.end_date, rb.reason
      FROM room_blocks rb
      WHERE rb.start_date <= ? AND rb.end_date >= ?
    `).all(endDate, startDate) as any[];

    res.json({
      success: true,
      month,
      daysInMonth: lastDay,
      startDate,
      endDate,
      rooms,
      bookings,
      blocks
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch calendar: ' + err.message });
  }
});

// ==========================================
// 7. MAINTENANCE ROOM BLOCKS
// ==========================================

// GET /api/admin/blocks
adminRouter.get('/blocks', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const blocks = db.prepare(`
      SELECT rb.*, r.room_number, r.name as room_name
      FROM room_blocks rb
      LEFT JOIN physical_rooms r ON rb.physical_room_id = r.id
      ORDER BY rb.start_date DESC
    `).all();
    res.json({ success: true, blocks });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch room blocks: ' + err.message });
  }
});

// POST /api/admin/blocks
adminRouter.post('/blocks', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { physical_room_id, start_date, end_date, reason } = req.body;
    if (!physical_room_id || !start_date || !end_date || !reason) {
      res.status(400).json({ error: 'Missing required block fields.' });
      return;
    }

    const id = 'block-' + Date.now();
    db.prepare(`
      INSERT INTO room_blocks (id, physical_room_id, start_date, end_date, reason, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, physical_room_id, start_date, end_date, reason.trim(), req.admin!.username);

    recordAuditLog('CREATE_BLOCK', `Blocked room ${physical_room_id} from ${start_date} to ${end_date} for ${reason}`, req.admin!.username, req.ip);

    res.json({ success: true, id, message: 'Room maintenance block created.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create block: ' + err.message });
  }
});

// DELETE /api/admin/blocks/:id
adminRouter.delete('/blocks/:id', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM room_blocks WHERE id = ?').run(id);
    recordAuditLog('DELETE_BLOCK', `Removed room block ${id}`, req.admin!.username, req.ip);
    res.json({ success: true, message: 'Block removed.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to remove block: ' + err.message });
  }
});

// ==========================================
// 8. HOTEL SETTINGS & WEBSITE CONTENT
// ==========================================

// GET /api/admin/settings
adminRouter.get('/settings', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const rows = db.prepare('SELECT key, value FROM hotel_settings').all() as Array<{ key: string; value: string }>;
    const settings: Record<string, any> = {};
    for (const row of rows) {
      if (row.key.endsWith('_json')) {
        try {
          settings[row.key.replace('_json', '')] = JSON.parse(row.value);
        } catch {
          settings[row.key] = row.value;
        }
      } else {
        settings[row.key] = row.value;
      }
    }
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch settings: ' + err.message });
  }
});

// PUT /api/admin/settings - Save hotel profile, WhatsApp, policies, etc.
adminRouter.put('/settings', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updates = req.body;
    const upsertStmt = db.prepare('INSERT OR REPLACE INTO hotel_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');

    const tx = db.transaction(() => {
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined) continue;

        let dbKey = key;
        let strVal = '';

        if (['facilities', 'payment_methods', 'whatsapp_settings'].includes(key)) {
          dbKey = key + '_json';
          strVal = typeof value === 'string' ? value : JSON.stringify(value);
        } else if (typeof value === 'object') {
          dbKey = key.endsWith('_json') ? key : key + '_json';
          strVal = JSON.stringify(value);
        } else {
          strVal = String(value);
        }

        upsertStmt.run(dbKey, strVal);

        // Keep whatsapp_normalized in sync
        if ((key === 'phone' || key === 'whatsapp_number') && value) {
          upsertStmt.run('whatsapp_normalized', String(value).replace(/[^0-9]/g, ''));
        }
        if (key === 'whatsapp_settings' && value && typeof value === 'object' && (value as any).phone) {
          upsertStmt.run('whatsapp_normalized', String((value as any).phone).replace(/[^0-9]/g, ''));
        }
      }
    });

    tx();

    recordAuditLog('UPDATE_SETTINGS', 'Updated hotel settings and website configuration', req.admin!.username, req.ip);

    res.json({ success: true, message: 'Settings saved successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save settings: ' + err.message });
  }
});

// ==========================================
// 9. GALLERY MANAGEMENT
// ==========================================

// GET /api/admin/gallery
adminRouter.get('/gallery', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const images = db.prepare('SELECT * FROM gallery_images ORDER BY sort_order ASC').all();
    res.json({ success: true, images });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch gallery: ' + err.message });
  }
});

// POST /api/admin/gallery
adminRouter.post('/gallery', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, category, url, caption, sort_order } = req.body;
    if (!title || !url) {
      res.status(400).json({ error: 'Title and image URL are required.' });
      return;
    }

    const id = 'gal-' + Date.now();
    db.prepare(`
      INSERT INTO gallery_images (id, title, category, url, caption, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, title.trim(), category || 'rooms', url.trim(), caption || '', sort_order || 99);

    recordAuditLog('ADD_GALLERY_IMAGE', `Added photo: ${title}`, req.admin!.username, req.ip);

    res.json({ success: true, id, message: 'Photo added to gallery.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add photo: ' + err.message });
  }
});

// DELETE /api/admin/gallery/:id
adminRouter.delete('/gallery/:id', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM gallery_images WHERE id = ?').run(id);
    recordAuditLog('DELETE_GALLERY_IMAGE', `Deleted photo ID: ${id}`, req.admin!.username, req.ip);
    res.json({ success: true, message: 'Photo removed.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete photo: ' + err.message });
  }
});

// ==========================================
// 10. EXPORT BOOKINGS TO CSV
// ==========================================

adminRouter.get('/export/bookings.csv', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const bookings = db.prepare(`
      SELECT 
        b.reference, b.guest_name, b.guest_phone, b.guest_email,
        c.name as category_name, r.room_number as assigned_room,
        b.check_in_date, b.check_out_date, b.nights, b.adults, b.children,
        b.rate_per_night, b.subtotal, b.tax_amount, b.total_amount,
        b.status, b.payment_status, b.payment_method, b.created_at
      FROM bookings b
      LEFT JOIN room_categories c ON b.category_id = c.id
      LEFT JOIN physical_rooms r ON b.physical_room_id = r.id
      ORDER BY b.check_in_date DESC
    `).all() as any[];

    const headers = [
      'Reference', 'Guest Name', 'Phone', 'Email', 'Category', 'Assigned Room',
      'Check In', 'Check Out', 'Nights', 'Adults', 'Children',
      'Rate/Night (INR)', 'Subtotal', 'Tax', 'Total Amount (INR)',
      'Booking Status', 'Payment Status', 'Payment Method', 'Booked On'
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    let csv = headers.join(',') + '\n';
    for (const b of bookings) {
      const row = [
        escapeCsv(b.reference),
        escapeCsv(b.guest_name),
        escapeCsv(b.guest_phone),
        escapeCsv(b.guest_email),
        escapeCsv(b.category_name),
        escapeCsv(b.assigned_room || 'Unassigned'),
        escapeCsv(b.check_in_date),
        escapeCsv(b.check_out_date),
        b.nights,
        b.adults,
        b.children,
        b.rate_per_night,
        b.subtotal,
        b.tax_amount,
        b.total_amount,
        escapeCsv(b.status),
        escapeCsv(b.payment_status),
        escapeCsv(b.payment_method),
        escapeCsv(b.created_at)
      ];
      csv += row.join(',') + '\n';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=royal-palace-bookings-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to export CSV: ' + err.message });
  }
});

// ==========================================
// 11. AUDIT LOGS
// ==========================================

adminRouter.get('/audit-logs', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all();
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch audit logs: ' + err.message });
  }
});
