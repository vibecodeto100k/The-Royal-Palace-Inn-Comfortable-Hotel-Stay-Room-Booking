/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { HotelSettings, RoomCategory, GalleryImage } from './types';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { RoomsSection } from './components/RoomsSection';
import { FacilitiesSection } from './components/FacilitiesSection';
import { GallerySection } from './components/GallerySection';
import { LocationContactSection } from './components/LocationContactSection';
import { Footer } from './components/Footer';
import { BookingModal } from './components/BookingModal';
import { WhatsAppSuccessModal } from './components/WhatsAppSuccessModal';
import { BookingLookupModal } from './components/BookingLookupModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MessageSquare, Phone, ArrowUp } from 'lucide-react';

export default function App() {
  // Navigation / View State
  const [currentView, setCurrentView] = useState<'public' | 'admin'>(() => {
    return window.location.pathname.startsWith('/admin') || window.location.hash === '#admin'
      ? 'admin'
      : 'public';
  });

  // Hotel data state
  const [hotel, setHotel] = useState<HotelSettings | null>(null);
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState<{
    categoryId?: string;
    checkIn?: string;
    checkOut?: string;
  }>({});
  const [whatsAppData, setWhatsAppData] = useState<any | null>(null);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Fetch or re-fetch public data from the API
  const fetchPublicData = useCallback(async () => {
    try {
      const ts = Date.now();
      const [hotelRes, catsRes, galleryRes] = await Promise.all([
        fetch(`/api/hotel/info?_t=${ts}`, { cache: 'no-store' }),
        fetch(`/api/rooms/categories?_t=${ts}`, { cache: 'no-store' }),
        fetch(`/api/gallery?_t=${ts}`, { cache: 'no-store' })
      ]);

      const [hotelJson, catsJson, galleryJson] = await Promise.all([
        hotelRes.json(),
        catsRes.json(),
        galleryRes.json()
      ]);

      if (hotelJson.success) setHotel(hotelJson.hotel);
      if (catsJson.success) setCategories(catsJson.categories);
      if (galleryJson.success) setGallery(galleryJson.images);
    } catch (err) {
      console.error('Failed to load hotel data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch when switching to public view and dynamically update document tab title
  useEffect(() => {
    if (currentView === 'public') {
      fetchPublicData();
      document.title = (hotel?.hotel_name || 'The Royal Palace Inn') + ' | Boutique Heritage Hotel';
    } else {
      document.title = 'Owner Portal | ' + (hotel?.hotel_name || 'The Royal Palace Inn');
    }
  }, [currentView, hotel?.hotel_name, fetchPublicData]);

  // Listen to browser popstate for /admin route
  useEffect(() => {
    const handlePopState = () => {
      const isAdm = window.location.pathname.startsWith('/admin') || window.location.hash === '#admin';
      setCurrentView(isAdm ? 'admin' : 'public');
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Also auto-refresh when tab gains focus or when an admin update event fires
  useEffect(() => {
    const handleRefresh = () => {
      fetchPublicData();
    };

    window.addEventListener('focus', handleRefresh);
    window.addEventListener('hotel-data-updated', handleRefresh);

    return () => {
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('hotel-data-updated', handleRefresh);
    };
  }, [fetchPublicData]);

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setCurrentView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPublic = () => {
    window.history.pushState({}, '', '/');
    setCurrentView('public');
    fetchPublicData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBooking = (categoryId?: string, checkIn?: string, checkOut?: string) => {
    setBookingPrefill({ categoryId, checkIn, checkOut });
    setIsBookingOpen(true);
  };

  // If in admin view, render AdminDashboard directly
  if (currentView === 'admin') {
    return (
      <AdminDashboard
        onReturnToSite={navigateToPublic}
        onDataChanged={fetchPublicData}
      />
    );
  }

  // Fallback defaults if loading
  const defaultHotel: HotelSettings = hotel || {
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
      template: ''
    }
  };

  const cleanWa = defaultHotel.whatsapp_normalized || '917700869635';

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#232624] flex flex-col font-sans selection:bg-[#3D4534] selection:text-white">
      {/* Navigation Header */}
      <Navbar
        hotel={defaultHotel}
        onOpenBooking={() => handleOpenBooking()}
        onOpenLookup={() => setIsLookupOpen(true)}
        onNavigateToAdmin={navigateToAdmin}
      />

      {/* Main Public Content */}
      <main className="flex-1">
        {/* Hero Section with Live Availability Bar */}
        <Hero
          hotel={defaultHotel}
          categories={categories}
          onCheckAvailability={(params) => {
            handleOpenBooking(params.categoryId, params.checkIn, params.checkOut);
          }}
        />

        {/* 3 Configured Room Categories Section */}
        <RoomsSection
          categories={categories}
          onBookRoom={(catId) => handleOpenBooking(catId)}
          onOpenGallery={() => {
            const galElem = document.getElementById('gallery');
            if (galElem) galElem.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Verified Facilities & Amenities */}
        <FacilitiesSection facilities={defaultHotel.facilities} />

        {/* Visual Gallery with Lightbox */}
        <GallerySection images={gallery} />

        {/* Location, Google Maps, Contact & Policies */}
        <LocationContactSection
          hotel={defaultHotel}
          onOpenBooking={() => handleOpenBooking()}
        />
      </main>

      {/* Footer */}
      <Footer
        hotel={defaultHotel}
        onOpenBooking={() => handleOpenBooking()}
        onOpenLookup={() => setIsLookupOpen(true)}
        onNavigateToAdmin={navigateToAdmin}
      />

      {/* Floating Direct WhatsApp Button */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5">
        <a
          href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(
            'Hello The Royal Palace Inn, I would like to inquire about room availability and reservations.'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Direct WhatsApp Reservation (+91 7700 869 635)"
          className="group flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white px-4 py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/20"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider">
            WhatsApp Concierge
          </span>
        </a>

        {/* Back to top button */}
        {showScrollTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-9 h-9 rounded-full bg-[#232624]/80 backdrop-blur-sm text-white/90 hover:text-white flex items-center justify-center hover:bg-[#232624] transition-all shadow-md"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Booking Form Modal */}
      {isBookingOpen && (
        <BookingModal
          initialCategoryId={bookingPrefill.categoryId}
          initialCheckIn={bookingPrefill.checkIn}
          initialCheckOut={bookingPrefill.checkOut}
          categories={categories}
          hotel={defaultHotel}
          onClose={() => setIsBookingOpen(false)}
          onBookingCreated={(data) => {
            setIsBookingOpen(false);
            setWhatsAppData(data);
          }}
        />
      )}

      {/* WhatsApp Message Handover Modal */}
      {whatsAppData && (
        <WhatsAppSuccessModal
          data={whatsAppData}
          onClose={() => setWhatsAppData(null)}
        />
      )}

      {/* Guest Booking Lookup Modal */}
      {isLookupOpen && (
        <BookingLookupModal onClose={() => setIsLookupOpen(false)} />
      )}
    </div>
  );
}
