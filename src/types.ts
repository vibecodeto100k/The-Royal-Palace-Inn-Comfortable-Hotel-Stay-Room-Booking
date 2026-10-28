export interface HotelSettings {
  hotel_name: string;
  tagline: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
  whatsapp_number: string;
  whatsapp_normalized: string;
  email: string;
  google_maps_url: string;
  google_maps_embed_url?: string;
  latitude?: string;
  longitude?: string;
  location_heading?: string;
  location_description?: string;
  check_in_time: string;
  check_out_time: string;
  tax_rate: string | number;
  currency: string;
  currency_symbol: string;
  hero_headline: string;
  hero_subheadline: string;
  hero_image: string;
  cancellation_policy: string;
  house_rules: string;
  facilities: string[];
  payment_methods: {
    pay_at_hotel: { enabled: boolean; title: string; instructions: string };
    upi: { enabled: boolean; title: string; vpa: string; instructions: string };
    online_gateway: { enabled: boolean; provider: string; key_id: string; instructions: string };
  };
  whatsapp_settings: {
    mode: 'mode_a' | 'mode_b';
    phone: string;
    template: string;
    meta_phone_number_id?: string;
    meta_api_token?: string;
  };
}

export interface RoomCategory {
  id: string;
  slug: string;
  name: string;
  base_price: number;
  max_adults: number;
  max_children: number;
  max_occupancy: number;
  bed_type: string;
  room_size: string;
  view_type: string;
  description: string;
  amenities: string[];
  primary_image: string;
  images: string[];
  sort_order: number;
  active_rooms_count?: number;
  assigned_rooms_count?: number;
}

export interface PhysicalRoom {
  id: string;
  room_number: string;
  name: string;
  floor: string;
  category_id: string;
  category_name?: string;
  category_price?: number;
  status: 'active' | 'maintenance' | 'inactive';
  maintenance_notes: string | null;
  current_occupant?: string | null;
  active_block_reason?: string | null;
}

export interface Booking {
  id: string;
  reference: string;
  guest_name: string;
  guest_phone: string;
  guest_email?: string | null;
  category_id: string;
  category_name?: string;
  physical_room_id?: string | null;
  assigned_room_number?: string | null;
  assigned_room_name?: string | null;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  adults: number;
  children: number;
  rooms_count: number;
  rate_per_night: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  special_requests?: string | null;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  payment_status: 'pending' | 'partially_paid' | 'paid' | 'refunded';
  payment_method: string;
  whatsapp_sent: number;
  internal_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GalleryImage {
  id: string;
  title: string;
  category: string;
  url: string;
  caption?: string | null;
  sort_order: number;
}

export interface RoomBlock {
  id: string;
  physical_room_id: string;
  room_number?: string;
  room_name?: string;
  start_date: string;
  end_date: string;
  reason: string;
  created_by?: string;
  created_at: string;
}

export interface DashboardStats {
  totalRooms: number;
  activeRooms: number;
  occupiedToday: number;
  availableToday: number;
  occupancyRate: number;
  checkInsToday: number;
  checkOutsToday: number;
  pendingEnquiries: number;
  totalRevenue: number;
  collectedRevenue: number;
}
