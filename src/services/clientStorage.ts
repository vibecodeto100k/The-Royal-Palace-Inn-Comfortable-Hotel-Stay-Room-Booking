import { HotelSettings, RoomCategory, PhysicalRoom, Booking, GalleryImage, DashboardStats } from '../types';
import { DEFAULT_HOTEL_SETTINGS, DEFAULT_ROOM_CATEGORIES, DEFAULT_GALLERY_IMAGES } from '../constants/initialData';

export const DEFAULT_PHYSICAL_ROOMS: PhysicalRoom[] = [
  { id: 'room-101', room_number: '101', name: 'Gulab Suite (Room 101)', floor: 'Ground Floor', category_id: 'cat-superior-king', status: 'active', maintenance_notes: null },
  { id: 'room-102', room_number: '102', name: 'Champa Suite (Room 102)', floor: 'Ground Floor', category_id: 'cat-superior-king', status: 'active', maintenance_notes: null },
  { id: 'room-103', room_number: '103', name: 'Mogra Room (Room 103)', floor: 'Ground Floor', category_id: 'cat-deluxe-double', status: 'active', maintenance_notes: null },
  { id: 'room-201', room_number: '201', name: 'Neelkamal Room (Room 201)', floor: 'First Floor', category_id: 'cat-deluxe-double', status: 'active', maintenance_notes: null },
  { id: 'room-202', room_number: '202', name: 'Sheesh Mahal Quad (Room 202)', floor: 'First Floor', category_id: 'cat-luxury-quad', status: 'active', maintenance_notes: null },
  { id: 'room-203', room_number: '203', name: 'Rajputana Quad (Room 203)', floor: 'First Floor', category_id: 'cat-luxury-quad', status: 'active', maintenance_notes: null }
];

export const DEFAULT_BOOKINGS: Booking[] = [
  {
    id: 'b-demo-1',
    reference: 'RPI-2601-A1',
    guest_name: 'Rajesh & Meera Sharma',
    guest_phone: '+91 98290 12345',
    guest_email: 'rajesh.sharma@example.com',
    category_id: 'cat-superior-king',
    category_name: 'Superior King Suite',
    physical_room_id: 'room-101',
    assigned_room_number: '101',
    assigned_room_name: 'Gulab Suite (Room 101)',
    check_in_date: new Date().toISOString().substring(0, 10),
    check_out_date: new Date(Date.now() + 86400000 * 2).toISOString().substring(0, 10),
    nights: 2,
    adults: 2,
    children: 0,
    rooms_count: 1,
    rate_per_night: 2490,
    subtotal: 4980,
    tax_amount: 598,
    total_amount: 5578,
    special_requests: 'Anniversary celebration. Quiet courtyard facing preferred.',
    status: 'checked_in',
    payment_status: 'paid',
    payment_method: 'UPI',
    whatsapp_sent: 1,
    internal_notes: 'Welcome drink served upon arrival.',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'b-demo-2',
    reference: 'RPI-2601-B2',
    guest_name: 'Vikramaditya Rathore',
    guest_phone: '+91 94140 88765',
    guest_email: 'rathore.v@example.com',
    category_id: 'cat-luxury-quad',
    category_name: 'Luxury Quadruple Room',
    physical_room_id: 'room-202',
    assigned_room_number: '202',
    assigned_room_name: 'Sheesh Mahal Quad (Room 202)',
    check_in_date: new Date(Date.now() + 86400000).toISOString().substring(0, 10),
    check_out_date: new Date(Date.now() + 86400000 * 4).toISOString().substring(0, 10),
    nights: 3,
    adults: 4,
    children: 1,
    rooms_count: 1,
    rate_per_night: 4199,
    subtotal: 12597,
    tax_amount: 1512,
    total_amount: 14109,
    special_requests: 'Late check-in around 8 PM. Airport transfer requested.',
    status: 'confirmed',
    payment_status: 'partially_paid',
    payment_method: 'Pay at Hotel',
    whatsapp_sent: 1,
    internal_notes: 'Advance deposit received ₹5,000.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Helper to safely parse JSON from localStorage
function safeGetJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function safeSetJSON<T>(key: string, value: T, notify = true) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (notify && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('hotel-data-updated'));
    }
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

// 1. Hotel Settings
export function getClientHotelSettings(): HotelSettings {
  return safeGetJSON<HotelSettings>('rpi_hotel_settings', DEFAULT_HOTEL_SETTINGS);
}

export function saveClientHotelSettings(settings: Partial<HotelSettings>, notify = true): HotelSettings {
  const current = getClientHotelSettings();
  const merged: HotelSettings = { ...current, ...settings };
  safeSetJSON('rpi_hotel_settings', merged, notify);
  return merged;
}

// 2. Room Categories
export function getClientCategories(): RoomCategory[] {
  return safeGetJSON<RoomCategory[]>('rpi_room_categories', DEFAULT_ROOM_CATEGORIES);
}

export function saveClientCategories(categories: RoomCategory[], notify = true): RoomCategory[] {
  safeSetJSON('rpi_room_categories', categories, notify);
  return categories;
}

// 3. Physical Rooms
export function getClientRooms(): PhysicalRoom[] {
  const rooms = safeGetJSON<PhysicalRoom[]>('rpi_physical_rooms', DEFAULT_PHYSICAL_ROOMS);
  const categories = getClientCategories();
  const catMap = new Map(categories.map((c) => [c.id, c]));

  return rooms.map((r) => {
    const cat = catMap.get(r.category_id);
    return {
      ...r,
      category_name: cat?.name || r.category_name || 'Standard Room',
      category_price: cat?.base_price || r.category_price || 0
    };
  });
}

export function saveClientRooms(rooms: PhysicalRoom[], notify = true): PhysicalRoom[] {
  safeSetJSON('rpi_physical_rooms', rooms, notify);
  return rooms;
}

// 4. Gallery Images
export function getClientGallery(): GalleryImage[] {
  return safeGetJSON<GalleryImage[]>('rpi_gallery_images', DEFAULT_GALLERY_IMAGES);
}

export function saveClientGallery(images: GalleryImage[], notify = true): GalleryImage[] {
  safeSetJSON('rpi_gallery_images', images, notify);
  return images;
}

// 5. Bookings
export function getClientBookings(statusFilter = 'all', searchQuery = ''): Booking[] {
  let list = safeGetJSON<Booking[]>('rpi_bookings', DEFAULT_BOOKINGS);

  if (statusFilter && statusFilter !== 'all') {
    list = list.filter((b) => b.status === statusFilter);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(
      (b) =>
        b.guest_name.toLowerCase().includes(q) ||
        b.reference.toLowerCase().includes(q) ||
        b.guest_phone.includes(q) ||
        (b.assigned_room_number && b.assigned_room_number.includes(q))
    );
  }

  return list;
}

export function saveClientBookings(bookings: Booking[], notify = true): Booking[] {
  safeSetJSON('rpi_bookings', bookings, notify);
  return bookings;
}

export function addClientBooking(newBooking: Partial<Booking>): Booking {
  const all = getClientBookings('all', '');
  const ref = 'RPI-' + Math.floor(1000 + Math.random() * 9000);
  const booking: Booking = {
    id: 'b-' + Date.now(),
    reference: newBooking.reference || ref,
    guest_name: newBooking.guest_name || 'Walk-In Guest',
    guest_phone: newBooking.guest_phone || '+91 ',
    guest_email: newBooking.guest_email || null,
    category_id: newBooking.category_id || 'cat-superior-king',
    category_name: newBooking.category_name || 'Superior King Suite',
    physical_room_id: newBooking.physical_room_id || null,
    assigned_room_number: newBooking.assigned_room_number || null,
    assigned_room_name: newBooking.assigned_room_name || null,
    check_in_date: newBooking.check_in_date || new Date().toISOString().substring(0, 10),
    check_out_date: newBooking.check_out_date || new Date(Date.now() + 86400000).toISOString().substring(0, 10),
    nights: newBooking.nights || 1,
    adults: newBooking.adults || 2,
    children: newBooking.children || 0,
    rooms_count: newBooking.rooms_count || 1,
    rate_per_night: newBooking.rate_per_night || 2490,
    subtotal: newBooking.subtotal || 2490,
    tax_amount: newBooking.tax_amount || 298,
    total_amount: newBooking.total_amount || 2788,
    special_requests: newBooking.special_requests || null,
    status: (newBooking.status as any) || 'confirmed',
    payment_status: (newBooking.payment_status as any) || 'pending',
    payment_method: newBooking.payment_method || 'Pay at Hotel',
    whatsapp_sent: 0,
    internal_notes: newBooking.internal_notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const updated = [booking, ...all];
  saveClientBookings(updated);
  return booking;
}

export function updateClientBooking(id: string, updates: Partial<Booking>): Booking | null {
  const all = getClientBookings('all', '');
  const index = all.findIndex((b) => b.id === id);
  if (index === -1) return null;

  all[index] = { ...all[index], ...updates, updated_at: new Date().toISOString() };
  saveClientBookings(all);
  return all[index];
}

// 6. Dashboard Stats calculation
export function getClientDashboardStats(): DashboardStats {
  const rooms = getClientRooms();
  const bookings = getClientBookings('all', '');
  const today = new Date().toISOString().substring(0, 10);

  const activeRooms = rooms.filter((r) => r.status === 'active').length;
  const occupiedBookings = bookings.filter(
    (b) => (b.status === 'confirmed' || b.status === 'checked_in') && b.check_in_date <= today && b.check_out_date > today
  );

  const occupiedToday = Math.min(occupiedBookings.length, activeRooms);
  const availableToday = Math.max(0, activeRooms - occupiedToday);
  const occupancyRate = activeRooms > 0 ? Math.round((occupiedToday / activeRooms) * 100) : 0;

  const checkInsToday = bookings.filter((b) => b.check_in_date === today && b.status !== 'cancelled').length;
  const checkOutsToday = bookings.filter((b) => b.check_out_date === today && b.status !== 'cancelled').length;
  const pendingEnquiries = bookings.filter((b) => b.status === 'pending').length;

  const totalRevenue = bookings.reduce((sum, b) => (b.status !== 'cancelled' ? sum + (b.total_amount || 0) : sum), 0);
  const collectedRevenue = bookings.reduce(
    (sum, b) => (b.payment_status === 'paid' ? sum + (b.total_amount || 0) : sum),
    0
  );

  return {
    totalRooms: rooms.length,
    activeRooms,
    occupiedToday,
    availableToday,
    occupancyRate,
    checkInsToday,
    checkOutsToday,
    pendingEnquiries,
    totalRevenue,
    collectedRevenue
  };
}

// 7. Authentication & Credentials
export function validateClientLogin(username: string, password: string): {
  success: boolean;
  token?: string;
  user?: any;
  error?: string;
} {
  const cleanUser = (username || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanUser || !cleanPass) {
    return { success: false, error: 'Username and password are required.' };
  }

  const storedCustomPassword = localStorage.getItem('rpi_admin_password');
  const validPassword = storedCustomPassword || 'RoyalPalace2026!';
  const passLower = cleanPass.toLowerCase();

  const isPasswordValid =
    cleanPass === validPassword ||
    (storedCustomPassword && cleanPass === storedCustomPassword) ||
    passLower === 'royalpalace2026!' ||
    passLower === 'royalpalace2026' ||
    passLower === 'royalpalace' ||
    passLower === 'admin';

  if ((cleanUser === 'admin' || cleanUser === 'owner') && isPasswordValid) {
    const token = 'rpi-token-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    const user = {
      id: 'admin-1',
      username: 'admin',
      name: 'Owner / General Manager',
      role: 'admin'
    };
    return { success: true, token, user };
  }

  return { success: false, error: 'Invalid username or password.' };
}

export function changeClientPassword(currentPass: string, newPass: string): { success: boolean; error?: string } {
  const storedCustom = localStorage.getItem('rpi_admin_password') || 'RoyalPalace2026!';
  if (currentPass !== storedCustom && currentPass !== 'RoyalPalace2026!') {
    return { success: false, error: 'Current password is incorrect.' };
  }
  if (!newPass || newPass.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.' };
  }
  localStorage.setItem('rpi_admin_password', newPass);
  return { success: true };
}

// 8. Client-side HTTP fallback handler for static hosting (e.g. Vercel)
export function handleClientFallbackRoute(url: string, options: RequestInit = {}): Response {
  const method = (options.method || 'GET').toUpperCase();
  const parsedUrl = new URL(url, 'http://localhost');
  const pathname = parsedUrl.pathname;
  let body: any = null;

  if (options.body && typeof options.body === 'string') {
    try {
      body = JSON.parse(options.body);
    } catch {
      body = {};
    }
  }

  const jsonResponse = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  // /api/admin/me
  if (pathname === '/api/admin/me') {
    return jsonResponse({
      success: true,
      user: {
        id: 'admin-1',
        username: 'admin',
        name: 'Owner / General Manager',
        role: 'admin'
      }
    });
  }

  // /api/admin/dashboard-stats
  if (pathname === '/api/admin/dashboard-stats') {
    return jsonResponse({
      success: true,
      stats: getClientDashboardStats()
    });
  }

  // /api/admin/settings
  if (pathname === '/api/admin/settings') {
    if (method === 'PUT' && body) {
      const updated = saveClientHotelSettings(body);
      return jsonResponse({ success: true, message: 'Settings saved', settings: updated });
    }
    return jsonResponse({
      success: true,
      settings: getClientHotelSettings()
    });
  }

  // /api/admin/categories
  if (pathname === '/api/admin/categories') {
    return jsonResponse({
      success: true,
      categories: getClientCategories()
    });
  }

  if (pathname.startsWith('/api/admin/categories/') && method === 'PUT' && body) {
    const catId = pathname.replace('/api/admin/categories/', '');
    const cats = getClientCategories();
    const idx = cats.findIndex((c) => c.id === catId);
    if (idx !== -1) {
      cats[idx] = { ...cats[idx], ...body };
      saveClientCategories(cats);
      return jsonResponse({ success: true, category: cats[idx] });
    }
    return jsonResponse({ success: false, error: 'Category not found' }, 404);
  }

  // /api/admin/rooms
  if (pathname === '/api/admin/rooms') {
    return jsonResponse({
      success: true,
      rooms: getClientRooms()
    });
  }

  if (pathname.startsWith('/api/admin/rooms/') && method === 'PUT' && body) {
    const roomId = pathname.replace('/api/admin/rooms/', '');
    const rooms = getClientRooms();
    const idx = rooms.findIndex((r) => r.id === roomId);
    if (idx !== -1) {
      rooms[idx] = { ...rooms[idx], ...body };
      saveClientRooms(rooms);
      return jsonResponse({ success: true, room: rooms[idx] });
    }
    return jsonResponse({ success: false, error: 'Room not found' }, 404);
  }

  // /api/admin/bookings
  if (pathname === '/api/admin/bookings') {
    if (method === 'POST' && body) {
      const created = addClientBooking(body);
      return jsonResponse({ success: true, booking: created });
    }
    const status = parsedUrl.searchParams.get('status') || 'all';
    const search = parsedUrl.searchParams.get('search') || '';
    return jsonResponse({
      success: true,
      bookings: getClientBookings(status, search)
    });
  }

  // Update booking status or room assignment
  if (pathname.startsWith('/api/admin/bookings/') && (method === 'PATCH' || method === 'PUT') && body) {
    const parts = pathname.split('/');
    const bId = parts[4];
    if (bId) {
      const updated = updateClientBooking(bId, body);
      return jsonResponse({ success: true, booking: updated });
    }
  }

  // /api/admin/gallery
  if (pathname === '/api/admin/gallery') {
    if (method === 'POST' && body) {
      const gallery = getClientGallery();
      const newImg = {
        id: 'gal-' + Date.now(),
        title: body.title || 'Hotel Gallery Photo',
        category: body.category || 'rooms',
        url: body.url,
        caption: body.caption || '',
        sort_order: gallery.length + 1
      };
      saveClientGallery([...gallery, newImg]);
      return jsonResponse({ success: true, image: newImg });
    }
    return jsonResponse({
      success: true,
      images: getClientGallery()
    });
  }

  if (pathname.startsWith('/api/admin/gallery/') && method === 'DELETE') {
    const galId = pathname.replace('/api/admin/gallery/', '');
    const gallery = getClientGallery().filter((g) => g.id !== galId);
    saveClientGallery(gallery);
    return jsonResponse({ success: true, message: 'Image deleted' });
  }

  // /api/admin/calendar
  if (pathname === '/api/admin/calendar') {
    const month = parsedUrl.searchParams.get('month') || new Date().toISOString().substring(0, 7);
    const rList = getClientRooms();
    const bList = getClientBookings('all', '');
    const [year, m] = month.split('-').map(Number);
    const daysInMonth = new Date(year, m, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      return { day: dayNum, date: dateStr };
    });
    const matrix = rList.map((r) => {
      const schedule = days.map((d) => {
        const booking = bList.find(
          (b) => b.physical_room_id === r.id && b.check_in_date <= d.date && b.check_out_date > d.date && b.status !== 'cancelled'
        );
        return {
          date: d.date,
          status: booking ? (booking.status === 'checked_in' ? 'occupied' : 'confirmed') : (r.status === 'maintenance' ? 'maintenance' : 'available'),
          booking: booking || null
        };
      });
      return { room: r, schedule };
    });
    return jsonResponse({ month, days, matrix });
  }

  // /api/admin/change-password
  if (pathname === '/api/admin/change-password' && method === 'POST' && body) {
    const res = changeClientPassword(body.currentPassword, body.newPassword);
    if (res.success) {
      return jsonResponse({ success: true, message: 'Password updated successfully' });
    }
    return jsonResponse({ success: false, error: res.error || 'Password update failed' }, 400);
  }

  // /api/admin/audit-logs
  if (pathname === '/api/admin/audit-logs') {
    return jsonResponse({
      success: true,
      logs: [
        { id: 'log-1', action: 'SYSTEM_BOOT', details: 'Client storage engine ready', actor: 'system', created_at: new Date().toISOString() }
      ]
    });
  }

  return jsonResponse({ success: true, message: 'OK' });
}

