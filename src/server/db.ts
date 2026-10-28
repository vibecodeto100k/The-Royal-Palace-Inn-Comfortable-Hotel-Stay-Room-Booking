import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'royal_palace.db');
export const db = new Database(DB_PATH);

// Enable WAL mode for high concurrency & foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    -- Hotel settings key-value store
    CREATE TABLE IF NOT EXISTS hotel_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Admin users
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Room categories
    CREATE TABLE IF NOT EXISTS room_categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      base_price INTEGER NOT NULL,
      max_adults INTEGER NOT NULL,
      max_children INTEGER NOT NULL,
      max_occupancy INTEGER NOT NULL,
      bed_type TEXT NOT NULL,
      room_size TEXT NOT NULL,
      view_type TEXT NOT NULL,
      description TEXT NOT NULL,
      amenities_json TEXT NOT NULL,
      primary_image TEXT NOT NULL,
      images_json TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Exactly 6 physical rooms
    CREATE TABLE IF NOT EXISTS physical_rooms (
      id TEXT PRIMARY KEY,
      room_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      floor TEXT NOT NULL,
      category_id TEXT NOT NULL,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
      maintenance_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES room_categories(id) ON UPDATE CASCADE
    );

    -- Seasonal pricing overrides
    CREATE TABLE IF NOT EXISTS seasonal_prices (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      price_per_night INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES room_categories(id) ON DELETE CASCADE
    );

    -- Room maintenance / private blocks
    CREATE TABLE IF NOT EXISTS room_blocks (
      id TEXT PRIMARY KEY,
      physical_room_id TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (physical_room_id) REFERENCES physical_rooms(id) ON DELETE CASCADE
    );

    -- Customer bookings and enquiries
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      reference TEXT UNIQUE NOT NULL,
      guest_name TEXT NOT NULL,
      guest_phone TEXT NOT NULL,
      guest_email TEXT,
      category_id TEXT NOT NULL,
      physical_room_id TEXT,
      check_in_date TEXT NOT NULL,
      check_out_date TEXT NOT NULL,
      nights INTEGER NOT NULL,
      adults INTEGER NOT NULL,
      children INTEGER DEFAULT 0,
      rooms_count INTEGER DEFAULT 1,
      rate_per_night INTEGER NOT NULL,
      subtotal INTEGER NOT NULL,
      tax_amount INTEGER NOT NULL,
      total_amount INTEGER NOT NULL,
      special_requests TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show')),
      payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partially_paid', 'paid', 'refunded')),
      payment_method TEXT DEFAULT 'pay_at_hotel',
      whatsapp_sent INTEGER DEFAULT 0,
      internal_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES room_categories(id),
      FOREIGN KEY (physical_room_id) REFERENCES physical_rooms(id)
    );

    -- Gallery images
    CREATE TABLE IF NOT EXISTS gallery_images (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      url TEXT NOT NULL,
      caption TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Audit logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      performed_by TEXT NOT NULL,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indices for performance and fast date queries
    CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings (check_in_date, check_out_date, status);
    CREATE INDEX IF NOT EXISTS idx_bookings_room ON bookings (physical_room_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_category ON bookings (category_id);
    CREATE INDEX IF NOT EXISTS idx_room_blocks_dates ON room_blocks (physical_room_id, start_date, end_date);
  `);

  seedInitialData();
}

function seedInitialData() {
  // 1. Seed Admin User if not exists
  const adminCheck = db.prepare('SELECT id FROM admin_users LIMIT 1').get();
  if (!adminCheck) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('RoyalPalace2026!', salt);
    db.prepare(`
      INSERT INTO admin_users (id, username, password_hash, name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin-default', 'admin', hash, 'Hotel General Manager', 'admin');
  }

  // 2. Seed Hotel Settings
  const defaultSettings: Record<string, string> = {
    hotel_name: 'The Royal Palace Inn',
    tagline: 'An Intimate Heritage Sanctuary of Understated Luxury',
    description: 'The Royal Palace Inn is an exclusive six-room boutique retreat designed for discerning travellers, couples, and families. Immersed in tranquil courtyard gardens and refined Indian heritage, we offer bespoke hospitality, authentic culinary experiences, and calm sanctuary away from the bustling city.',
    address: '14, Heritage Palace Enclave, Civil Lines',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302006',
    country: 'India',
    phone: '+91 7700 869 635',
    whatsapp_number: '+91 7700 869 635',
    whatsapp_normalized: '917700869635',
    email: 'reservations@theroyalpalaceinn.com',
    google_maps_url: 'https://maps.google.com/?q=Civil+Lines+Jaipur+Rajasthan',
    google_maps_embed_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14232.894318357777!2d75.77665241774903!3d26.905953334588965!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396db415a77f9839%3A0x6b6df5ea8283a30!2sCivil%20Lines%2C%20Jaipur%2C%20Rajasthan!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin',
    latitude: '26.905953',
    longitude: '75.776652',
    location_heading: 'Our Location & Directions',
    location_description: 'Conveniently situated in Jaipur\'s quiet residential Civil Lines enclave, minutes from historical monuments, transit hubs, and authentic bazaars.',
    check_in_time: '14:00 (2:00 PM)',
    check_out_time: '11:00 (11:00 AM)',
    tax_rate: '12',
    currency: 'INR',
    currency_symbol: '₹',
    hero_headline: 'Where Heritage Grace Meets Understated Luxury',
    hero_subheadline: 'An intimate 6-room sanctuary in Rajasthan, thoughtfully curated for tranquil stays, bespoke service, and authentic Indian hospitality.',
    hero_image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2000&q=85',
    cancellation_policy: 'Free cancellation up to 48 hours prior to check-in (14:00 local time). Cancellations made within 48 hours will be subject to a fee equal to the first night room charge.',
    house_rules: 'Government-approved photo identification (Aadhaar, Passport, or Driving License) is mandatory for all adult guests at check-in. The Royal Palace Inn is a quiet sanctuary; peaceful hours are observed from 22:00 to 07:00.',
    facilities_json: JSON.stringify([
      'Complimentary High-Speed Fibre Wi-Fi',
      'Artisanal Fresh Breakfast & In-Room Dining',
      '24-Hour Attentive Front Desk & Concierge',
      'Individual Climate-Controlled Air Conditioning',
      'En-Suite Italian Marble Bathrooms with Rain Shower',
      'Complimentary Artisanal Tea & Espresso Maker',
      '24-Hour 100% Uninterrupted Power Backup',
      'Secure On-Site Valet Parking',
      'Airport & Railway Station Chauffeur Transfers on Request',
      'Private Courtyard Garden & Evening Tea Service'
    ]),
    payment_methods_json: JSON.stringify({
      pay_at_hotel: {
        enabled: true,
        title: 'Pay Upon Arrival',
        instructions: 'Settle your booking via Cash, Credit/Debit Card, or UPI directly at the front desk during check-in.'
      },
      upi: {
        enabled: true,
        title: 'Instant UPI Transfer',
        vpa: 'royalpalaceinn@okhdfcbank',
        instructions: 'Scan our official hotel QR code or send to VPA: royalpalaceinn@okhdfcbank using Google Pay, PhonePe, Paytm, or BHIM. Share the transaction screenshot via WhatsApp to confirm instantly.'
      },
      online_gateway: {
        enabled: false,
        provider: 'razorpay',
        key_id: '',
        instructions: 'Direct online card payment (Configure your merchant keys in the Admin Settings to activate).'
      }
    }),
    whatsapp_settings_json: JSON.stringify({
      mode: 'mode_a',
      phone: '917700869635',
      template: `Hello The Royal Palace Inn,

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

Thank you.`,
      meta_phone_number_id: '',
      meta_api_token: ''
    })
  };

  const getSetting = db.prepare('SELECT value FROM hotel_settings WHERE key = ?');
  const insertSetting = db.prepare('INSERT OR REPLACE INTO hotel_settings (key, value) VALUES (?, ?)');

  for (const [key, value] of Object.entries(defaultSettings)) {
    const existing = getSetting.get(key);
    if (!existing) {
      insertSetting.run(key, value);
    }
  }

  // 3. Seed Room Categories (3 categories specified in prompt)
  const catCheck = db.prepare('SELECT count(*) as count FROM room_categories').get() as { count: number };
  if (catCheck.count === 0) {
    const insertCat = db.prepare(`
      INSERT INTO room_categories (
        id, slug, name, base_price, max_adults, max_children, max_occupancy,
        bed_type, room_size, view_type, description, amenities_json, primary_image, images_json, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Category 1: Superior King Suite — ₹2,490 per night
    insertCat.run(
      'cat-superior-king',
      'superior-king-suite',
      'Superior King Suite',
      2490,
      2,
      1,
      3,
      '1 King Size Bed',
      '350 sq.ft (33 m²)',
      'Garden Courtyard View',
      'An exquisitely appointed suite featuring a hand-crafted teak king bed with 400-thread-count Egyptian cotton linens. Enjoy private courtyard views, warm wooden aesthetics, ambient evening lighting, and a serene en-suite marble bath with a relaxing rain shower.',
      JSON.stringify([
        'Custom King Bed with 400TC Linens',
        'Garden Courtyard Facing Windows',
        'Italian Marble En-Suite Bathroom with Rain Shower',
        'Smart 43" 4K Television',
        'Artisanal Tea & French Press Coffee Setup',
        'Silent In-Room Mini Refrigerator',
        'High-Speed Fibre Wi-Fi',
        'Plush Bathrobes & Ayurvedic Toiletries',
        'Dedicated Teak Work Desk'
      ]),
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      JSON.stringify([
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80'
      ]),
      1
    );

    // Category 2: Deluxe Double Room — ₹3,850 per night
    insertCat.run(
      'cat-deluxe-double',
      'deluxe-double-room',
      'Deluxe Double Room',
      3850,
      2,
      1,
      3,
      '1 Queen / Twin Bed Option',
      '410 sq.ft (38 m²)',
      'Heritage City & Balcony View',
      'Designed for travellers seeking elevated comfort and ample living space. Features authentic heritage wall frescoes, high ceilings, a sunlit private balcony overlooking the city skyline, a separate sitting lounge, and curated antique brass accents.',
      JSON.stringify([
        'Plush Queen Bed / Twin Bed Arrangement',
        'Private Sunlit Balcony with Seating',
        'Spacious Heritage Sitting Lounge',
        'Spacious Marble Bathroom with Bathtub & Rain Shower',
        'Smart 50" 4K TV with Streaming Services',
        'Gourmet In-Room Refreshment Bar',
        'Digital Safe for Laptop & Valuables',
        'Complimentary Daily Bottled Mineral Water',
        'Individual Climate Control'
      ]),
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
      JSON.stringify([
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80'
      ]),
      2
    );

    // Category 3: Luxury Quadruple Room — ₹4,199 per night
    insertCat.run(
      'cat-luxury-quad',
      'luxury-quadruple-room',
      'Luxury Quadruple Room',
      4199,
      4,
      2,
      5,
      '2 Grand King Beds',
      '550 sq.ft (51 m²)',
      'Inner Palace Courtyard View',
      'Our most generous suite, perfectly crafted for families and small groups travelling together. Includes two opulent king-sized beds, a distinct family dining and lounge area, dressing room, double-vanity bathroom, and premium amenities tailored for shared indulgence.',
      JSON.stringify([
        'Two Grand King Beds with Premium Pillow-Top Mattresses',
        'Expansive 550 sq.ft Family Suite Layout',
        'Double Vanity Marble Bathroom with Walk-In Shower',
        'Comfortable Family Dining & Living Area',
        'Walk-In Wardrobe & Luggage Storage',
        '55" 4K Ultra HD Smart Television',
        'Espresso Pod Machine & Artisanal Teas',
        'Ironing Set & Hairdryer',
        '24-Hour Dedicated Room Butler Service'
      ]),
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
      JSON.stringify([
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=80'
      ]),
      3
    );
  }

  // 4. Seed the 6 physical rooms (strictly 6 rooms as specified)
  const roomCheck = db.prepare('SELECT count(*) as count FROM physical_rooms').get() as { count: number };
  if (roomCheck.count === 0) {
    const insertRoom = db.prepare(`
      INSERT INTO physical_rooms (id, room_number, name, floor, category_id, status, maintenance_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertRoom.run('room-101', '101', 'Gulab Suite (Room 101)', 'Ground Floor', 'cat-superior-king', 'active', null);
    insertRoom.run('room-102', '102', 'Champa Suite (Room 102)', 'Ground Floor', 'cat-superior-king', 'active', null);
    insertRoom.run('room-103', '103', 'Mogra Room (Room 103)', 'Ground Floor', 'cat-deluxe-double', 'active', null);
    insertRoom.run('room-201', '201', 'Neelkamal Room (Room 201)', 'First Floor', 'cat-deluxe-double', 'active', null);
    insertRoom.run('room-202', '202', 'Sheesh Mahal Quad (Room 202)', 'First Floor', 'cat-luxury-quad', 'active', null);
    insertRoom.run('room-203', '203', 'Rajputana Quad (Room 203)', 'First Floor', 'cat-luxury-quad', 'active', null);
  }

  // 5. Seed Curated Gallery Images
  const galleryCheck = db.prepare('SELECT count(*) as count FROM gallery_images').get() as { count: number };
  if (galleryCheck.count === 0) {
    const insertGallery = db.prepare(`
      INSERT INTO gallery_images (id, title, category, url, caption, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const photos = [
      { id: 'gal-1', title: 'The Royal Courtyard & Arches', category: 'courtyard', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', caption: 'Quiet evening courtyard with traditional sandstone architecture' },
      { id: 'gal-2', title: 'Superior King Suite Sanctuary', category: 'rooms', url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', caption: 'Handcrafted teak furnishings and 400-thread count linens' },
      { id: 'gal-3', title: 'Deluxe Double Balcony Suite', category: 'rooms', url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80', caption: 'Sunlit balcony and relaxing heritage lounge seating' },
      { id: 'gal-4', title: 'Luxury Quadruple Suite Bedroom', category: 'rooms', url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80', caption: 'Grand accommodations designed for discerning family getaways' },
      { id: 'gal-5', title: 'Heritage Morning Dining Veranda', category: 'dining', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80', caption: 'Freshly prepared breakfast in our sun-drenched veranda' },
      { id: 'gal-6', title: 'Private En-Suite Marble Bath', category: 'rooms', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80', caption: 'Italian marble bathrooms equipped with high-pressure rain showers' },
      { id: 'gal-7', title: 'Evening Lanterns & Lounge', category: 'lounge', url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80', caption: 'Warm ambient lighting under starlit evening skies' },
      { id: 'gal-8', title: 'Heritage Facade by Sunset', category: 'exterior', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', caption: 'Timeless architectural details bathed in golden hour light' }
    ];

    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      insertGallery.run(p.id, p.title, p.category, p.url, p.caption, i + 1);
    }
  }

  // 6. Seed sample bookings for realistic initial demonstration (without taking up all rooms)
  const bookingCount = db.prepare('SELECT count(*) as count FROM bookings').get() as { count: number };
  if (bookingCount.count === 0) {
    const insertBooking = db.prepare(`
      INSERT INTO bookings (
        id, reference, guest_name, guest_phone, guest_email, category_id, physical_room_id,
        check_in_date, check_out_date, nights, adults, children, rooms_count, rate_per_night,
        subtotal, tax_amount, total_amount, special_requests, status, payment_status,
        payment_method, whatsapp_sent, internal_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Today's date helper
    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    
    // Confirmed booking for next week
    const d1 = new Date(now.getTime() + 5 * 86400000);
    const d2 = new Date(now.getTime() + 7 * 86400000);
    insertBooking.run(
      'b-seed-1',
      'RPI-2026-8812',
      'Aditya Sharma',
      '+91 98201 44521',
      'aditya.sharma@example.com',
      'cat-superior-king',
      'room-101',
      formatDate(d1),
      formatDate(d2),
      2,
      2,
      0,
      1,
      2490,
      4980,
      598,
      5578,
      'Early check-in around 12:30 PM if possible. Celebrating wedding anniversary.',
      'confirmed',
      'paid',
      'upi',
      1,
      'VIP guest. Complimentary welcome drink and flower arrangement prepared.'
    );

    // Pending WhatsApp enquiry
    const d3 = new Date(now.getTime() + 10 * 86400000);
    const d4 = new Date(now.getTime() + 13 * 86400000);
    insertBooking.run(
      'b-seed-2',
      'RPI-2026-9430',
      'Priya Mehta',
      '+91 98711 02941',
      'priya.mehta@example.com',
      'cat-deluxe-double',
      null, // Not assigned yet, pending owner confirmation
      formatDate(d3),
      formatDate(d4),
      3,
      2,
      1,
      1,
      3850,
      11550,
      1386,
      12936,
      'Prefer room with upper floor balcony view.',
      'pending',
      'pending',
      'pay_at_hotel',
      1,
      'Enquiry submitted via WhatsApp link. Awaiting confirmation call.'
    );
  }
}
