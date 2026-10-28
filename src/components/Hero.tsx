import React, { useState } from 'react';
import { HotelSettings, RoomCategory } from '../types';
import { DEFAULT_ROOM_CATEGORIES } from '../constants/initialData';
import { Calendar, Users, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface HeroProps {
  hotel: HotelSettings;
  categories: RoomCategory[];
  onCheckAvailability: (params: { checkIn: string; checkOut: string; categoryId: string; adults: number }) => void;
}

export const Hero: React.FC<HeroProps> = ({ hotel, categories, onCheckAvailability }) => {
  const today = new Date();
  const formatYMD = (d: Date) => d.toISOString().split('T')[0];

  const defaultCheckIn = formatYMD(today);
  const defaultCheckOut = formatYMD(new Date(today.getTime() + 2 * 86400000));

  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [adults, setAdults] = useState(2);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onCheckAvailability({
      checkIn,
      checkOut,
      categoryId: selectedCategory,
      adults
    });
  };

  return (
    <section className="relative min-h-[640px] lg:min-h-[720px] flex items-center justify-center bg-[#232624] text-white overflow-hidden">
      {/* Background Photography with Warm Tint Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={hotel.hero_image || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2000&q=85'}
          alt="The Royal Palace Inn Architecture"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2000&q=85') {
              target.src = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2000&q=85';
            }
          }}
          className="w-full h-full object-cover object-center filter brightness-[0.62] contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D1B] via-black/40 to-black/60" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center">
        {/* Intimate Boutique Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#E2DACB] text-xs uppercase tracking-widest font-sans font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Intimate Sanctuary &bull; Only 6 Curated Rooms</span>
        </div>

        {/* Heading */}
        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#FBF9F5] max-w-4xl leading-[1.15] mb-5">
          {hotel.hero_headline || 'Where Timeless Heritage Meets Quiet Luxury'}
        </h1>

        {/* Subheading */}
        <p className="text-sm sm:text-base lg:text-lg text-[#DCD8CF] max-w-2xl font-light leading-relaxed mb-10">
          {hotel.hero_subheadline || 'An intimate 6-room boutique retreat in Rajasthan, designed for couples, families, and discerning travellers seeking serene comfort and authentic hospitality.'}
        </p>

        {/* Highlight Stats Row */}
        <div className="grid grid-cols-3 gap-6 sm:gap-12 max-w-lg mx-auto mb-12 text-center border-t border-b border-white/15 py-4 w-full">
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-medium text-[#EBE5D8]">6</div>
            <div className="text-[11px] sm:text-xs text-[#A8B0A2] uppercase tracking-wider mt-0.5">Physical Rooms</div>
          </div>
          <div className="border-x border-white/10">
            <div className="font-serif text-2xl sm:text-3xl font-medium text-[#EBE5D8]">₹2,490</div>
            <div className="text-[11px] sm:text-xs text-[#A8B0A2] uppercase tracking-wider mt-0.5">From / Night</div>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-medium text-[#EBE5D8]">100%</div>
            <div className="text-[11px] sm:text-xs text-[#A8B0A2] uppercase tracking-wider mt-0.5">Direct WhatsApp</div>
          </div>
        </div>

        {/* Availability Search Bar Widget */}
        <div className="w-full max-w-4xl bg-[#FBF9F5] text-[#232624] rounded-lg p-4 sm:p-5 shadow-2xl border border-[#E0D9CC]">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end text-left">
            {/* Check-In Date */}
            <div>
              <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#666D5F] mb-1.5">
                Check-in Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={formatYMD(today)}
                  value={checkIn}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    if (e.target.value >= checkOut) {
                      const next = new Date(new Date(e.target.value).getTime() + 86400000);
                      setCheckOut(formatYMD(next));
                    }
                  }}
                  required
                  className="w-full bg-white border border-[#D5CDC0] rounded px-3 py-2.5 text-xs sm:text-sm text-[#232624] focus:outline-none focus:ring-1 focus:ring-[#3D4534] focus:border-[#3D4534]"
                />
              </div>
            </div>

            {/* Check-Out Date */}
            <div>
              <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#666D5F] mb-1.5">
                Check-out Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={checkIn ? formatYMD(new Date(new Date(checkIn).getTime() + 86400000)) : formatYMD(today)}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  className="w-full bg-white border border-[#D5CDC0] rounded px-3 py-2.5 text-xs sm:text-sm text-[#232624] focus:outline-none focus:ring-1 focus:ring-[#3D4534] focus:border-[#3D4534]"
                />
              </div>
            </div>

            {/* Room Category */}
            <div>
              <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#666D5F] mb-1.5">
                Suite Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white border border-[#D5CDC0] rounded px-3 py-2.5 text-xs sm:text-sm text-[#232624] focus:outline-none focus:ring-1 focus:ring-[#3D4534] focus:border-[#3D4534]"
              >
                <option value="">All 3 Categories</option>
                {((categories && categories.length > 0) ? categories : DEFAULT_ROOM_CATEGORIES).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (from ₹{c.base_price.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <div>
              <button
                type="submit"
                className="w-full bg-[#3D4534] hover:bg-[#2C3226] text-white py-2.5 sm:py-3 px-4 rounded text-xs sm:text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
              >
                <span>Check Live Rates</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Guarantee Highlights */}
          <div className="mt-3.5 pt-3 border-t border-[#E8E2D6] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#71786A]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4E7D48]" />
              Direct hotel WhatsApp enquiry
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4E7D48]" />
              Zero hidden booking fees
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4E7D48]" />
              Real physical room availability check
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
