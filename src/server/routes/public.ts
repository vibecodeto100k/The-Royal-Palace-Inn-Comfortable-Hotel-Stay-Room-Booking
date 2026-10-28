import { Router, Request, Response } from 'express';
import { db } from '../db.js';

export const publicRouter = Router();

// Ensure all public API responses are never cached by browsers or proxies
publicRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Helper: parse date to YYYY-MM-DD
function parseDate(dStr: string): string | null {
  if (!dStr) return null;
  const match = dStr.match(/^\d{4}-\d{2}-\d{2}$/);
  return match ? dStr : null;
}

function calculateNights(checkIn: string, checkOut: string): number {
  const t1 = new Date(checkIn + 'T00:00:00Z').getTime();
  const t2 = new Date(checkOut + 'T00:00:00Z').getTime();
  const diffDays = Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Check availability for a category between checkIn and checkOut
export function getCategoryAvailability(categoryId: string, checkIn: string, checkOut: string) {
  // 1. Get all active physical rooms belonging to this category
  const physicalRooms = db.prepare(`
    SELECT id, room_number, name, floor, status
    FROM physical_rooms
    WHERE category_id = ? AND status = 'active'
  `).all(categoryId) as Array<{ id: string; room_number: string; name: string; floor: string; status: string }>;

  const totalRooms = physicalRooms.length;

  if (totalRooms === 0) {
    return { availableRoomsCount: 0, totalRooms: 0, availableRoomIds: [] };
  }

  // 2. Find which rooms have confirmed or checked-in bookings in the date range
  // Check-out boundary: booking check_out_date = checkIn is fine (guest leaves before new guest checks in)
  const overlappingBookings = db.prepare(`
    SELECT DISTINCT physical_room_id
    FROM bookings
    WHERE physical_room_id IS NOT NULL
      AND status IN ('confirmed', 'checked_in')
      AND check_in_date < ?
      AND check_out_date > ?
  `).all(checkOut, checkIn) as Array<{ physical_room_id: string }>;

  const bookedRoomIds = new Set(overlappingBookings.map(b => b.physical_room_id));

  // 3. Find which rooms have maintenance / private blocks in date range
  const overlappingBlocks = db.prepare(`
    SELECT DISTINCT physical_room_id
    FROM room_blocks
    WHERE start_date < ? AND end_date > ?
  `).all(checkOut, checkIn) as Array<{ physical_room_id: string }>;

  overlappingBlocks.forEach(b => bookedRoomIds.add(b.physical_room_id));

  const availableRooms = physicalRooms.filter(r => !bookedRoomIds.has(r.id));

  return {
    availableRoomsCount: availableRooms.length,
    totalRooms,
    availableRoomIds: availableRooms.map(r => r.id),
    availableRooms
  };
}

// 1. GET /api/hotel/info - Public hotel profile, contact, amenities, policies
publicRouter.get('/hotel/info', (_req: Request, res: Response) => {
  try {
    const settingsRows = db.prepare('SELECT key, value FROM hotel_settings').all() as Array<{ key: string; value: string }>;
    const settings: Record<string, any> = {};
    for (const row of settingsRows) {
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

    res.json({
      success: true,
      hotel: settings
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch hotel details: ' + err.message });
  }
});

// 2. GET /api/rooms/categories - Room categories with full details & base price
publicRouter.get('/rooms/categories', (_req: Request, res: Response) => {
  try {
    const categories = db.prepare(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM physical_rooms r WHERE r.category_id = c.id AND r.status = 'active') as active_rooms_count
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
    res.status(500).json({ error: 'Failed to fetch room categories: ' + err.message });
  }
});

// 3. GET /api/rooms/availability - Check availability for specific date range
publicRouter.get('/rooms/availability', (req: Request, res: Response) => {
  try {
    const checkIn = parseDate(req.query.checkIn as string);
    const checkOut = parseDate(req.query.checkOut as string);
    const categoryId = req.query.categoryId as string;

    if (!checkIn || !checkOut) {
      res.status(400).json({ error: 'Valid checkIn and checkOut dates (YYYY-MM-DD) are required.' });
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (checkIn < todayStr) {
      res.status(400).json({ error: 'Check-in date cannot be in the past.' });
      return;
    }

    if (checkOut <= checkIn) {
      res.status(400).json({ error: 'Check-out date must be after check-in date.' });
      return;
    }

    const nights = calculateNights(checkIn, checkOut);

    const categories = db.prepare('SELECT * FROM room_categories ORDER BY sort_order ASC').all() as any[];
    const availabilityMap: Record<string, any> = {};

    for (const cat of categories) {
      if (categoryId && cat.id !== categoryId) continue;

      const avail = getCategoryAvailability(cat.id, checkIn, checkOut);

      // Check seasonal pricing override
      const seasonal = db.prepare(`
        SELECT price_per_night, name
        FROM seasonal_prices
        WHERE category_id = ?
          AND is_active = 1
          AND start_date <= ?
          AND end_date >= ?
        LIMIT 1
      `).get(cat.id, checkIn, checkOut) as { price_per_night: number; name: string } | undefined;

      const ratePerNight = seasonal ? seasonal.price_per_night : cat.base_price;
      const subtotal = ratePerNight * nights;
      
      // Get tax rate from settings
      const taxRow = db.prepare("SELECT value FROM hotel_settings WHERE key = 'tax_rate'").get() as { value: string };
      const taxPercent = taxRow ? parseFloat(taxRow.value) : 12;
      const taxAmount = Math.round(subtotal * (taxPercent / 100));
      const totalEstimated = subtotal + taxAmount;

      availabilityMap[cat.id] = {
        categoryId: cat.id,
        categoryName: cat.name,
        availableCount: avail.availableRoomsCount,
        totalConfiguredRooms: avail.totalRooms,
        isAvailable: avail.availableRoomsCount > 0,
        ratePerNight,
        nights,
        subtotal,
        taxPercent,
        taxAmount,
        totalEstimated,
        seasonalName: seasonal ? seasonal.name : null
      };
    }

    res.json({
      success: true,
      checkIn,
      checkOut,
      nights,
      availability: availabilityMap
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Availability check failed: ' + err.message });
  }
});

// 4. POST /api/bookings/enquire - Customer submits booking enquiry & generates WhatsApp message
publicRouter.post('/bookings/enquire', (req: Request, res: Response) => {
  try {
    const {
      guest_name,
      guest_phone,
      guest_email,
      category_id,
      check_in_date,
      check_out_date,
      adults = 2,
      children = 0,
      rooms_count = 1,
      special_requests = '',
      payment_method = 'pay_at_hotel'
    } = req.body;

    // Strict validation
    if (!guest_name || typeof guest_name !== 'string' || guest_name.trim().length < 2) {
      res.status(400).json({ error: 'Please enter a valid guest name (at least 2 characters).' });
      return;
    }

    // Phone validation (+91 Indian phone or min 10 digits)
    const cleanPhone = (guest_phone || '').replace(/[\s\-\(\)]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      res.status(400).json({ error: 'Please enter a valid 10-digit mobile number for WhatsApp communication.' });
      return;
    }

    const checkIn = parseDate(check_in_date);
    const checkOut = parseDate(check_out_date);

    if (!checkIn || !checkOut) {
      res.status(400).json({ error: 'Valid check-in and check-out dates are required.' });
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (checkIn < todayStr) {
      res.status(400).json({ error: 'Check-in date cannot be in the past.' });
      return;
    }

    if (checkOut <= checkIn) {
      res.status(400).json({ error: 'Check-out date must be strictly after check-in date.' });
      return;
    }

    const numAdults = parseInt(String(adults), 10) || 1;
    const numChildren = parseInt(String(children), 10) || 0;
    const numRooms = parseInt(String(rooms_count), 10) || 1;

    // Check category exists
    const category = db.prepare('SELECT * FROM room_categories WHERE id = ?').get(category_id) as any;
    if (!category) {
      res.status(400).json({ error: 'Invalid room category selected.' });
      return;
    }

    // Verify guest capacity per room
    const totalGuests = numAdults + numChildren;
    if (totalGuests > category.max_occupancy * numRooms) {
      res.status(400).json({
        error: `Selected room accommodates maximum ${category.max_occupancy} guests. Please adjust guests or book additional rooms.`
      });
      return;
    }

    // Availability validation in SQLite transaction
    const nights = calculateNights(checkIn, checkOut);
    const availability = getCategoryAvailability(category.id, checkIn, checkOut);

    if (availability.availableRoomsCount < numRooms) {
      res.status(409).json({
        error: `Sorry, only ${availability.availableRoomsCount} physical room(s) available for "${category.name}" on the selected dates (${checkIn} to ${checkOut}).`
      });
      return;
    }

    // Calculate rates
    const seasonal = db.prepare(`
      SELECT price_per_night, name
      FROM seasonal_prices
      WHERE category_id = ?
        AND is_active = 1
        AND start_date <= ?
        AND end_date >= ?
      LIMIT 1
    `).get(category.id, checkIn, checkOut) as { price_per_night: number; name: string } | undefined;

    const ratePerNight = seasonal ? seasonal.price_per_night : category.base_price;
    const subtotal = ratePerNight * nights * numRooms;

    const taxRow = db.prepare("SELECT value FROM hotel_settings WHERE key = 'tax_rate'").get() as { value: string };
    const taxPercent = taxRow ? parseFloat(taxRow.value) : 12;
    const taxAmount = Math.round(subtotal * (taxPercent / 100));
    const totalAmount = subtotal + taxAmount;

    // Generate unique booking reference: RPI-YEAR-RANDOM
    const year = new Date().getFullYear();
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reference = `RPI-${year}-${randomHex}`;
    const bookingId = 'book-' + Date.now() + '-' + randomHex;

    // Insert into database with status 'pending' (enquiry)
    // Transaction ensures consistency
    const insertBookingTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO bookings (
          id, reference, guest_name, guest_phone, guest_email, category_id,
          check_in_date, check_out_date, nights, adults, children, rooms_count,
          rate_per_night, subtotal, tax_amount, total_amount, special_requests,
          status, payment_status, payment_method, whatsapp_sent
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          'pending', 'pending', ?, 1
        )
      `).run(
        bookingId,
        reference,
        guest_name.trim(),
        cleanPhone,
        guest_email ? guest_email.trim() : null,
        category.id,
        checkIn,
        checkOut,
        nights,
        numAdults,
        numChildren,
        numRooms,
        ratePerNight,
        subtotal,
        taxAmount,
        totalAmount,
        special_requests ? special_requests.trim() : '',
        payment_method
      );
    });

    insertBookingTx();

    // Fetch customized WhatsApp settings
    const waSettingsRow = db.prepare("SELECT value FROM hotel_settings WHERE key = 'whatsapp_settings_json'").get() as { value: string };
    let waNumber = '917700869635';
    let waTemplate = `Hello The Royal Palace Inn,

I would like to request a room booking.

Guest Name: {guest_name}
Phone: {guest_phone}
Room Category: {room_category}
Number of Rooms: {num_rooms}
Check-in: {check_in}
Check-out: {check_out}
Total Nights: {nights}
Adults: {adults}
Children: {children}
Rate per Night: ₹{rate_per_night}
Estimated Total: ₹{estimated_total}
Special Requests: {special_requests}
Booking Reference: {booking_reference}

Please confirm room availability and the final payable amount.

Thank you.`;

    if (waSettingsRow && waSettingsRow.value) {
      try {
        const parsed = JSON.parse(waSettingsRow.value);
        if (parsed.phone) waNumber = parsed.phone.replace(/[^0-9]/g, '');
        if (parsed.template) waTemplate = parsed.template;
      } catch (e) {
        // use default
      }
    }

    // Populate template fields exactly
    const populatedMessage = waTemplate
      .replace(/{guest_name}/g, guest_name.trim())
      .replace(/{guest_phone}/g, cleanPhone)
      .replace(/{room_category}/g, category.name)
      .replace(/{num_rooms}/g, String(numRooms))
      .replace(/{check_in}/g, checkIn)
      .replace(/{check_out}/g, checkOut)
      .replace(/{nights}/g, String(nights))
      .replace(/{adults}/g, String(numAdults))
      .replace(/{children}/g, String(numChildren))
      .replace(/{rate_per_night}/g, ratePerNight.toLocaleString('en-IN'))
      .replace(/{estimated_total}/g, totalAmount.toLocaleString('en-IN'))
      .replace(/{special_requests}/g, special_requests ? special_requests.trim() : 'None')
      .replace(/{booking_reference}/g, reference);

    const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(populatedMessage)}`;

    res.json({
      success: true,
      message: 'Booking enquiry recorded successfully.',
      reference,
      booking: {
        id: bookingId,
        reference,
        guest_name: guest_name.trim(),
        guest_phone: cleanPhone,
        category_name: category.name,
        check_in_date: checkIn,
        check_out_date: checkOut,
        nights,
        adults: numAdults,
        children: numChildren,
        rooms_count: numRooms,
        rate_per_night: ratePerNight,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'pending'
      },
      whatsapp: {
        number: waNumber,
        formatted_phone: '+91 7700 869 635',
        message: populatedMessage,
        url: whatsappUrl
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record booking enquiry: ' + err.message });
  }
});

// 5. GET /api/bookings/lookup - Check booking status by Reference & Phone
publicRouter.get('/bookings/lookup', (req: Request, res: Response) => {
  try {
    const { reference, phone } = req.query;
    if (!reference) {
      res.status(400).json({ error: 'Booking reference is required.' });
      return;
    }

    const booking = db.prepare(`
      SELECT b.*, c.name as category_name, c.primary_image as category_image, r.room_number as assigned_room_number
      FROM bookings b
      LEFT JOIN room_categories c ON b.category_id = c.id
      LEFT JOIN physical_rooms r ON b.physical_room_id = r.id
      WHERE UPPER(b.reference) = UPPER(?)
    `).get(String(reference).trim()) as any;

    if (!booking) {
      res.status(404).json({ error: 'Booking reservation not found with reference: ' + reference });
      return;
    }

    // Optional phone match verification if provided
    if (phone) {
      const cleanPhone = String(phone).replace(/[\s\-\(\)\+]/g, '');
      const cleanDbPhone = (booking.guest_phone || '').replace(/[\s\-\(\)\+]/g, '');
      if (!cleanDbPhone.endsWith(cleanPhone) && !cleanPhone.endsWith(cleanDbPhone)) {
        res.status(403).json({ error: 'Phone number does not match this booking record.' });
        return;
      }
    }

    res.json({ success: true, booking });
  } catch (err: any) {
    res.status(500).json({ error: 'Lookup failed: ' + err.message });
  }
});

// 6. GET /api/gallery - Curated photography
publicRouter.get('/gallery', (_req: Request, res: Response) => {
  try {
    const images = db.prepare('SELECT * FROM gallery_images ORDER BY sort_order ASC').all();
    res.json({ success: true, images });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch gallery: ' + err.message });
  }
});
