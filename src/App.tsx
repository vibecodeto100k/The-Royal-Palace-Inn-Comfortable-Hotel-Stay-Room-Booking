/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { HotelSettings, RoomCategory, GalleryImage } from './types';
import { DEFAULT_HOTEL_SETTINGS, DEFAULT_ROOM_CATEGORIES, DEFAULT_GALLERY_IMAGES } from './constants/initialData';
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

  // Hotel data state (initialized with verified defaults so content & images always render on Vercel)
  const [hotel, setHotel] = useState<HotelSettings>(DEFAULT_HOTEL_SETTINGS);
  const [categories, setCategories] = useState<RoomCategory[]>(DEFAULT_ROOM_CATEGORIES);
  const [gallery, setGallery] = useState<GalleryImage[]>(DEFAULT_GALLERY_IMAGES);
  const [isLoading, setIsLoading] = useState(false);

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
        fetch(`/api/hotel/info?_t=${ts}`, { cache: 'no-store' }).catch(() => null),
        fetch(`/api/rooms/categories?_t=${ts}`, { cache: 'no-store' }).catch(() => null),
        fetch(`/api/gallery?_t=${ts}`, { cache: 'no-store' }).catch(() => null)
      ]);

      if (hotelRes && hotelRes.ok) {
        const hotelJson = await hotelRes.json().catch(() => null);
        if (hotelJson?.success && hotelJson.hotel) {
          setHotel(hotelJson.hotel);
        }
      }

      if (catsRes && catsRes.ok) {
        const catsJson = await catsRes.json().catch(() => null);
        if (catsJson?.success && Array.isArray(catsJson.categories) && catsJson.categories.length > 0) {
          setCategories(catsJson.categories);
        }
      }

      if (galleryRes && galleryRes.ok) {
        const galleryJson = await galleryRes.json().catch(() => null);
        if (galleryJson?.success && Array.isArray(galleryJson.images) && galleryJson.images.length > 0) {
          setGallery(galleryJson.images);
        }
      }
    } catch (err) {
      console.warn('Backend API unavailable; running on verified local presets:', err);
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

  // Hotel settings with verified fallback
  const defaultHotel: HotelSettings = hotel || DEFAULT_HOTEL_SETTINGS;
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
