import React from 'react';
import { HotelSettings } from '../types';
import { Shield, MessageSquare, Phone, MapPin, Heart } from 'lucide-react';

interface FooterProps {
  hotel: HotelSettings;
  onOpenBooking: () => void;
  onOpenLookup: () => void;
  onNavigateToAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  hotel,
  onOpenBooking,
  onOpenLookup,
  onNavigateToAdmin
}) => {
  const cleanPhone = (hotel.phone || '+91 7700 869 635').replace(/\s+/g, '');
  const cleanWa = hotel.whatsapp_normalized || '917700869635';

  return (
    <footer className="bg-[#1C201A] text-[#B0B8A9] pt-16 pb-12 border-t border-[#2D3328]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#2D3328]">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              {hotel.logo_url ? (
                <img
                  src={hotel.logo_url}
                  alt={hotel.hotel_name || 'Theroyalpalaceinn'}
                  className="h-8 w-auto max-w-[120px] object-contain rounded-sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-sm bg-[#3D4534] text-[#E8E6DF] flex items-center justify-center font-serif text-lg font-bold border border-[#4F5944]">
                  {hotel.monogram || 'RP'}
                </div>
              )}
              <span className="font-serif text-xl font-bold tracking-wide text-[#FBF9F5]">
                {hotel.hotel_name || 'Theroyalpalaceinn'}
              </span>
            </div>
            <p className="text-xs text-[#8A9482] leading-relaxed">
              An intimate six-room boutique retreat in Jaipur, Rajasthan. Understated luxury, heritage tranquility, and bespoke Indian hospitality.
            </p>
            <div className="text-xs text-[#D4AF37] font-medium">
              Direct WhatsApp Reservations: +91 7700 869 635
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#E8E6DF] mb-4">
              Explore The Inn
            </h4>
            <ul className="space-y-2 text-xs text-[#8A9482]">
              <li>
                <a href="#rooms" className="hover:text-white transition-colors">Suites &amp; Room Categories</a>
              </li>
              <li>
                <a href="#facilities" className="hover:text-white transition-colors">Hotel Facilities &amp; Comforts</a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-white transition-colors">Visual Gallery</a>
              </li>
              <li>
                <a href="#location" className="hover:text-white transition-colors">Location, Map &amp; Policies</a>
              </li>
            </ul>
          </div>

          {/* Policies & Help */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#E8E6DF] mb-4">
              Guest Assistance
            </h4>
            <ul className="space-y-2 text-xs text-[#8A9482]">
              <li>
                <button onClick={onOpenLookup} className="hover:text-white transition-colors text-left">
                  Lookup Existing Reservation
                </button>
              </li>
              <li>
                <button onClick={onOpenBooking} className="hover:text-white transition-colors text-left">
                  Check Live Availability
                </button>
              </li>
              <li>
                <span className="text-[#8A9482]">Check-in: {hotel.check_in_time}</span>
              </li>
              <li>
                <span className="text-[#8A9482]">Check-out: {hotel.check_out_time}</span>
              </li>
              <li>
                <a href={`https://wa.me/${cleanWa}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366] transition-colors">
                  WhatsApp Concierge
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#E8E6DF] mb-4">
              Hotel Enclave
            </h4>
            <div className="space-y-2.5 text-xs text-[#8A9482]">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>{hotel.address}, {hotel.city}, {hotel.state} {hotel.pincode}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <a href={`tel:${cleanPhone}`} className="hover:text-white">{hotel.phone}</a>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                <a href={`https://wa.me/${cleanWa}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366]">
                  WhatsApp Reservations
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7563]">
          <div>
            &copy; {new Date().getFullYear()} {hotel.hotel_name || 'Theroyalpalaceinn'}. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateToAdmin}
              className="inline-flex items-center gap-1.5 text-[#8A9482] hover:text-white transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Owner &amp; Staff Portal</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
