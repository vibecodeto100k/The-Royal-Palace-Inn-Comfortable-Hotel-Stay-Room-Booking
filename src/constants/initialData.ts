import { HotelSettings, RoomCategory, GalleryImage } from '../types';

export const FALLBACK_ROOM_IMAGE = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80';

export const DEFAULT_HOTEL_SETTINGS: HotelSettings = {
  hotel_name: 'The Royal Palace Inn',
  tagline: 'An Intimate Heritage Sanctuary of Understated Luxury',
  description: 'An exclusive six-room boutique retreat designed for discerning travellers, couples, and families in Rajasthan.',
  address: '14, Heritage Palace Enclave, Civil Lines',
  city: 'Jaipur',
  state: 'Rajasthan',
  pincode: '302006',
  country: 'India',
  phone: '+91 7700 869 635',
  whatsapp_number: '+91 7700 869 635',
  whatsapp_normalized: '917700869635',
  email: 'reservations@theroyalpalaceinn.com',
  google_maps_url: 'https://maps.google.com/?q=Civil+Lines+Jaipur',
  google_maps_embed_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14232.894318357777!2d75.77665241774903!3d26.905953334588965!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396db415a77f9839%3A0x6b6df5ea8283a30!2sCivil%20Lines%2C%20Jaipur%2C%20Rajasthan!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin',
  latitude: '26.905953',
  longitude: '75.776652',
  location_heading: 'Our Location & Directions',
  location_description: 'Conveniently situated in Jaipur\'s quiet residential Civil Lines enclave, minutes from historical monuments, transit hubs, and authentic bazaars.',
  check_in_time: '14:00 (2:00 PM)',
  check_out_time: '11:00 (11:00 AM)',
  tax_rate: 12,
  currency: 'INR',
  currency_symbol: '₹',
  hero_headline: 'Where Heritage Grace Meets Understated Luxury',
  hero_subheadline: 'An intimate 6-room sanctuary in Rajasthan, thoughtfully curated for tranquil stays, bespoke service, and authentic Indian hospitality.',
  hero_image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2000&q=85',
  cancellation_policy: 'Free cancellation up to 48 hours prior to check-in (14:00 local time).',
  house_rules: 'Valid government photo ID is mandatory for all adult guests at check-in.',
  facilities: [
    'High-Speed Fibre Wi-Fi',
    'Artisanal Breakfast & Dining',
    '24-Hour Front Desk',
    'Climate Control',
    'Italian Marble Bathrooms',
    '24x7 Power Backup',
    'Secure Valet Parking'
  ],
  payment_methods: {
    pay_at_hotel: { enabled: true, title: 'Pay at Hotel', instructions: 'Cash, Card, or UPI upon check-in' },
    upi: { enabled: true, title: 'UPI Transfer', vpa: 'royalpalaceinn@okhdfcbank', instructions: 'Direct UPI transfer' },
    online_gateway: { enabled: false, provider: 'razorpay', key_id: '', instructions: '' }
  },
  whatsapp_settings: {
    mode: 'mode_a',
    phone: '917700869635',
    template: `Hello The Royal Palace Inn,

I would like to request a room booking.

Guest Name: {guest_name}
Phone: {guest_phone}
Room Category: {room_category}
Number of Rooms: {rooms_count}
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

Thank you.`
  }
};

export const DEFAULT_ROOM_CATEGORIES: RoomCategory[] = [
  {
    id: 'cat-superior-king',
    slug: 'superior-king-suite',
    name: 'Superior King Suite',
    base_price: 2490,
    max_adults: 2,
    max_children: 1,
    max_occupancy: 3,
    bed_type: '1 King Size Bed',
    room_size: '350 sq.ft (33 m²)',
    view_type: 'Garden Courtyard View',
    description: 'An exquisitely appointed suite featuring a hand-crafted teak king bed with 400-thread-count Egyptian cotton linens. Enjoy private courtyard views, warm wooden aesthetics, ambient evening lighting, and a serene en-suite marble bath with a relaxing rain shower.',
    amenities: [
      'Custom King Bed with 400TC Linens',
      'Garden Courtyard Facing Windows',
      'Italian Marble En-Suite Bathroom with Rain Shower',
      'Smart 43" 4K Television',
      'Artisanal Tea & French Press Coffee Setup',
      'Silent In-Room Mini Refrigerator',
      'High-Speed Fibre Wi-Fi',
      'Plush Bathrobes & Ayurvedic Toiletries',
      'Dedicated Teak Work Desk'
    ],
    primary_image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80'
    ],
    sort_order: 1,
    active_rooms_count: 2,
    assigned_rooms_count: 2
  },
  {
    id: 'cat-deluxe-double',
    slug: 'deluxe-double-room',
    name: 'Deluxe Double Room',
    base_price: 3850,
    max_adults: 2,
    max_children: 1,
    max_occupancy: 3,
    bed_type: '1 Queen / Twin Bed Option',
    room_size: '410 sq.ft (38 m²)',
    view_type: 'Heritage City & Balcony View',
    description: 'Designed for travellers seeking elevated comfort and ample living space. Features authentic heritage wall frescoes, high ceilings, a sunlit private balcony overlooking the city skyline, a separate sitting lounge, and curated antique brass accents.',
    amenities: [
      'Plush Queen Bed / Twin Bed Arrangement',
      'Private Sunlit Balcony with Seating',
      'Spacious Heritage Sitting Lounge',
      'Spacious Marble Bathroom with Bathtub & Rain Shower',
      'Smart 50" 4K TV with Streaming Services',
      'Gourmet In-Room Refreshment Bar',
      'Digital Safe for Laptop & Valuables',
      'Complimentary Daily Bottled Mineral Water',
      'Individual Climate Control'
    ],
    primary_image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80'
    ],
    sort_order: 2,
    active_rooms_count: 2,
    assigned_rooms_count: 2
  },
  {
    id: 'cat-luxury-quad',
    slug: 'luxury-quadruple-room',
    name: 'Luxury Quadruple Room',
    base_price: 4199,
    max_adults: 4,
    max_children: 2,
    max_occupancy: 5,
    bed_type: '2 Grand King Beds',
    room_size: '550 sq.ft (51 m²)',
    view_type: 'Inner Palace Courtyard View',
    description: 'Our most generous suite, perfectly crafted for families and small groups travelling together. Includes two opulent king-sized beds, a distinct family dining and lounge area, dressing room, double-vanity bathroom, and premium amenities tailored for shared indulgence.',
    amenities: [
      'Two Grand King Beds with Premium Pillow-Top Mattresses',
      'Expansive 550 sq.ft Family Suite Layout',
      'Double Vanity Marble Bathroom with Walk-In Shower',
      'Comfortable Family Dining & Living Area',
      'Walk-In Wardrobe & Luggage Storage',
      '55" 4K Ultra HD Smart Television',
      'Espresso Pod Machine & Artisanal Teas',
      'Ironing Set & Hairdryer',
      '24-Hour Dedicated Room Butler Service'
    ],
    primary_image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=80'
    ],
    sort_order: 3,
    active_rooms_count: 2,
    assigned_rooms_count: 2
  }
];

export const DEFAULT_GALLERY_IMAGES: GalleryImage[] = [
  { id: 'gal-1', title: 'The Royal Courtyard & Arches', category: 'courtyard', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', caption: 'Quiet evening courtyard with traditional sandstone architecture', sort_order: 1 },
  { id: 'gal-2', title: 'Superior King Suite Sanctuary', category: 'rooms', url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', caption: 'Handcrafted teak furnishings and 400-thread count linens', sort_order: 2 },
  { id: 'gal-3', title: 'Deluxe Double Balcony Suite', category: 'rooms', url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80', caption: 'Sunlit balcony and relaxing heritage lounge seating', sort_order: 3 },
  { id: 'gal-4', title: 'Luxury Quadruple Suite Bedroom', category: 'rooms', url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80', caption: 'Grand accommodations designed for discerning family getaways', sort_order: 4 },
  { id: 'gal-5', title: 'Heritage Morning Dining Veranda', category: 'dining', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80', caption: 'Freshly prepared breakfast in our sun-drenched veranda', sort_order: 5 },
  { id: 'gal-6', title: 'Private En-Suite Marble Bath', category: 'rooms', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80', caption: 'Italian marble bathrooms equipped with high-pressure rain showers', sort_order: 6 },
  { id: 'gal-7', title: 'Evening Lanterns & Lounge', category: 'lounge', url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80', caption: 'Warm ambient lighting under starlit evening skies', sort_order: 7 },
  { id: 'gal-8', title: 'Heritage Facade by Sunset', category: 'exterior', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', caption: 'Timeless architectural details bathed in golden hour light', sort_order: 8 }
];
