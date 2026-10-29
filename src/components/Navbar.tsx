import React, { useState } from 'react';
import { HotelSettings } from '../types';
import { Phone, MessageSquare, Menu, X, Shield, Calendar, MapPin } from 'lucide-react';

interface NavbarProps {
  hotel: HotelSettings;
  onOpenBooking: () => void;
  onOpenLookup: () => void;
  onNavigateToAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  hotel,
  onOpenBooking,
  onOpenLookup,
  onNavigateToAdmin
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cleanPhone = (hotel.phone || '+91 7700 869 635').replace(/\s+/g, '');
  const cleanWa = hotel.whatsapp_normalized || '917700869635';

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#E8E2D8] transition-all">
      {/* Top Utility Announcement Bar */}
      <div className="bg-[#2D3328] text-[#E8E6DF] text-xs py-2 px-4 sm:px-8 border-b border-[#3D4536]">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4 text-xs font-light tracking-wider">
            <span className="flex items-center gap-1.5 text-[#D4AF37]">
              <MapPin className="w-3.5 h-3.5" />
              <span>{hotel.city}, {hotel.state}</span>
            </span>
            <span className="hidden md:inline-block text-[#8F9988]">•</span>
            <span className="hidden md:inline-block text-[#C8CEBF]">Intimate 6-Room Boutique Sanctuary</span>
          </div>

          <div className="flex items-center gap-4 text-xs ml-auto">
            <a
              href={`tel:${cleanPhone}`}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">{hotel.phone}</span>
              <span className="sm:hidden">Call</span>
            </a>

            <a
              href={`https://wa.me/${cleanWa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#3D4834] hover:bg-[#4E5B42] text-[#E8EFE0] px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors"
            >
              <MessageSquare className="w-3 h-3 text-[#58D68D]" />
              <span>WhatsApp</span>
            </a>

            <button
              onClick={onOpenLookup}
              className="text-[#B2BCA8] hover:text-white underline underline-offset-4 transition-colors"
            >
              Lookup Booking
            </button>

            <button
              onClick={onNavigateToAdmin}
              className="flex items-center gap-1 text-[#D4AF37] hover:text-white font-medium transition-colors"
            >
              <Shield className="w-3 h-3" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <a href="#" className="flex items-center gap-3 group text-left">
          {hotel.logo_url ? (
            <img
              src={hotel.logo_url}
              alt={hotel.hotel_name || 'Theroyalpalaceinn'}
              className="h-10 w-auto max-w-[140px] object-contain rounded-sm shadow-sm group-hover:opacity-90 transition-opacity"
            />
          ) : (
            <div className="w-10 h-10 rounded-sm bg-[#3D4534] text-[#E8E6DF] flex items-center justify-center font-serif text-xl font-bold tracking-wider shadow-sm group-hover:bg-[#2D3328] transition-colors border border-[#4F5944]">
              {hotel.monogram || 'RP'}
            </div>
          )}
          <div>
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-[#232624] block leading-none">
              {hotel.hotel_name || 'Theroyalpalaceinn'}
            </span>
            <span className="text-[10px] sm:text-xs text-[#6B7265] uppercase tracking-widest font-sans font-medium block mt-1">
              Boutique Hotel &bull; 6 Exclusive Rooms
            </span>
          </div>
        </a>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8 text-[13px] tracking-wide text-[#3D423B] font-medium">
          <button onClick={() => scrollTo('rooms')} className="hover:text-[#4A5340] transition-colors cursor-pointer">
            Suites & Rooms
          </button>
          <button onClick={() => scrollTo('facilities')} className="hover:text-[#4A5340] transition-colors cursor-pointer">
            Amenities
          </button>
          <button onClick={() => scrollTo('gallery')} className="hover:text-[#4A5340] transition-colors cursor-pointer">
            Gallery
          </button>
          <button onClick={() => scrollTo('location')} className="hover:text-[#4A5340] transition-colors cursor-pointer">
            Location & Contact
          </button>
        </div>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={onNavigateToAdmin}
            className="flex items-center gap-1.5 border border-[#3D4534] text-[#3D4534] hover:bg-[#3D4534] hover:text-white px-3 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Portal</span>
          </button>

          <button
            onClick={onOpenBooking}
            className="flex items-center gap-2 bg-[#3D4534] hover:bg-[#2C3226] text-white px-5 py-2.5 rounded-sm text-xs font-semibold tracking-wider uppercase transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Your Stay</span>
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={onOpenBooking}
            className="bg-[#3D4534] text-white px-3 py-1.5 rounded-sm text-xs font-semibold tracking-wider uppercase"
          >
            Book
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#3D423B] hover:bg-[#EDE9DF] rounded"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FBF9F5] border-t border-[#E8E2D8] px-6 py-6 shadow-xl animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-4 text-sm font-medium text-[#2C3228]">
            <button
              onClick={() => scrollTo('rooms')}
              className="text-left py-2 border-b border-[#ECE7DC] hover:text-[#4A5340]"
            >
              Suites & Rooms (3 Categories)
            </button>
            <button
              onClick={() => scrollTo('facilities')}
              className="text-left py-2 border-b border-[#ECE7DC] hover:text-[#4A5340]"
            >
              Hotel Facilities
            </button>
            <button
              onClick={() => scrollTo('gallery')}
              className="text-left py-2 border-b border-[#ECE7DC] hover:text-[#4A5340]"
            >
              Curated Gallery
            </button>
            <button
              onClick={() => scrollTo('location')}
              className="text-left py-2 border-b border-[#ECE7DC] hover:text-[#4A5340]"
            >
              Location, Address & Policies
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLookup();
              }}
              className="text-left py-2 border-b border-[#ECE7DC] text-[#4A5340] font-semibold"
            >
              Lookup Existing Reservation
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateToAdmin();
              }}
              className="text-left py-2 text-xs text-[#7B8274] flex items-center gap-2"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Owner & Admin Portal</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="mt-2 w-full bg-[#3D4534] text-white py-3 rounded text-center text-xs font-semibold tracking-wider uppercase"
            >
              Check Live Availability & Reserve
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
