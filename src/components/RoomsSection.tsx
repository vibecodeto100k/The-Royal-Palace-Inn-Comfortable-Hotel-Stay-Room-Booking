import React, { useState } from 'react';
import { RoomCategory } from '../types';
import { Users, BedDouble, Maximize2, Sparkles, Check, ArrowRight, Eye, ShieldCheck } from 'lucide-react';

interface RoomsSectionProps {
  categories: RoomCategory[];
  onBookRoom: (categoryId: string) => void;
  onOpenGallery: (category?: string) => void;
}

export const RoomsSection: React.FC<RoomsSectionProps> = ({ categories, onBookRoom, onOpenGallery }) => {
  const [selectedModalCategory, setSelectedModalCategory] = useState<RoomCategory | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<Record<string, number>>({});

  const handleSelectThumbnail = (catId: string, idx: number) => {
    setActivePhotoIndex((prev) => ({ ...prev, [catId]: idx }));
  };

  return (
    <section id="rooms" className="py-20 sm:py-24 bg-[#F5F2EB] border-b border-[#E8E2D6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#4A5340] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Accommodations</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#232624] tracking-tight mb-4">
            Three Distinctive Suite Categories
          </h2>
          <p className="text-sm sm:text-base text-[#687062] leading-relaxed">
            With only six physical rooms across the entire property, every suite enjoys privacy, dedicated room concierge, handcrafted furnishings, and tranquil courtyard vistas.
          </p>
        </div>

        {/* Room Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {categories.map((category) => {
            const currentPhotoIdx = activePhotoIndex[category.id] || 0;
            const images = category.images && category.images.length > 0 ? category.images : [category.primary_image];
            const displayImage = images[currentPhotoIdx] || category.primary_image;

            return (
              <div
                key={category.id}
                className="bg-[#FBF9F5] border border-[#E3DCcf] rounded-md overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 group"
              >
                {/* Image & Thumbnails */}
                <div className="relative aspect-[4/3] overflow-hidden bg-[#2D3328]">
                  <img
                    src={displayImage}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Price Tag Overlay */}
                  <div className="absolute top-3.5 right-3.5 bg-[#232624]/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-sm border border-white/15 text-right">
                    <span className="text-[10px] uppercase tracking-wider block text-[#C4CBBF] font-sans">Starting at</span>
                    <span className="font-serif text-lg font-bold text-[#EBE5D8]">
                      ₹{category.base_price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-[#A8B0A2] font-sans"> / night</span>
                  </div>

                  {/* Room Allocation Info */}
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-[#232624] px-2.5 py-1 rounded-sm text-[11px] font-medium tracking-wide flex items-center gap-1.5 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#3D4534]" />
                    <span>{category.active_rooms_count || 2} Physical Rooms</span>
                  </div>
                </div>

                {/* Thumbnail strip if multiple photos */}
                {images.length > 1 && (
                  <div className="flex gap-1.5 p-2 bg-[#EFECE4] border-b border-[#E3DCcf]">
                    {images.slice(0, 3).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectThumbnail(category.id, idx)}
                        className={`w-14 h-9 rounded-sm overflow-hidden border transition-all ${
                          currentPhotoIdx === idx ? 'border-[#3D4534] ring-1 ring-[#3D4534]' : 'opacity-70 hover:opacity-100 border-transparent'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Content */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col">
                  {/* Category Title */}
                  <h3 className="font-serif text-2xl font-normal text-[#232624] mb-2">
                    {category.name}
                  </h3>

                  {/* Key Specifications */}
                  <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs text-[#62695B] py-2.5 border-t border-b border-[#ECE7DC] mb-4">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#3D4534]" />
                      <span>Up to {category.max_occupancy} Guests</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-[#3D4534]" />
                      <span>{category.bed_type}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-[#3D4534]" />
                      <span>{category.room_size}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-[#5B6355] leading-relaxed mb-5 line-clamp-3">
                    {category.description}
                  </p>

                  {/* Amenity Highlights */}
                  <div className="space-y-1.5 mb-6 text-xs text-[#4A5144]">
                    {category.amenities.slice(0, 4).map((amenity, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#4E7D48] shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{amenity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-auto pt-4 border-t border-[#ECE7DC] grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setSelectedModalCategory(category)}
                      className="border border-[#C8C0B2] hover:bg-[#EFECE4] text-[#3D4534] py-2.5 px-3 rounded text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    <button
                      onClick={() => onBookRoom(category.id)}
                      className="bg-[#3D4534] hover:bg-[#2C3226] text-white py-2.5 px-3 rounded text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-95"
                    >
                      <span>Reserve</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Category Details Modal */}
        {selectedModalCategory && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-[#FBF9F5] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E3DCcf] shadow-2xl p-6 sm:p-8 relative">
              <button
                onClick={() => setSelectedModalCategory(null)}
                className="absolute top-5 right-5 text-[#687062] hover:text-[#232624] text-xl font-bold p-1"
                aria-label="Close"
              >
                &times;
              </button>

              <div className="mb-4">
                <span className="text-xs uppercase tracking-widest text-[#4A5340] font-semibold">
                  Suite Overview
                </span>
                <h3 className="font-serif text-3xl font-normal text-[#232624] mt-1">
                  {selectedModalCategory.name}
                </h3>
                <div className="text-sm font-medium text-[#3D4534] mt-1">
                  Starting at ₹{selectedModalCategory.base_price.toLocaleString('en-IN')} / night (+ 12% GST)
                </div>
              </div>

              {/* Photo carousel in modal */}
              <div className="aspect-[16/9] rounded-md overflow-hidden bg-black mb-4">
                <img
                  src={selectedModalCategory.primary_image}
                  alt={selectedModalCategory.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Key Specs */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-[#EFECE4] rounded text-center text-xs text-[#4A5144] mb-5">
                <div>
                  <span className="block text-[10px] text-[#788072] uppercase">Max Guests</span>
                  <span className="font-semibold text-sm">{selectedModalCategory.max_occupancy} Persons</span>
                </div>
                <div className="border-x border-[#DDD6C8]">
                  <span className="block text-[10px] text-[#788072] uppercase">Bed Type</span>
                  <span className="font-semibold text-sm">{selectedModalCategory.bed_type}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#788072] uppercase">Dimensions</span>
                  <span className="font-semibold text-sm">{selectedModalCategory.room_size}</span>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-[#444C3E] leading-relaxed mb-6">
                <p>{selectedModalCategory.description}</p>
              </div>

              {/* Full Amenities */}
              <div className="mb-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#2D3328] mb-3">
                  Included Amenities & Facilities
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#4A5340]">
                  {selectedModalCategory.amenities.map((amenity, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#4E7D48] shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal CTA */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#ECE7DC]">
                <button
                  onClick={() => {
                    const catId = selectedModalCategory.id;
                    setSelectedModalCategory(null);
                    onBookRoom(catId);
                  }}
                  className="flex-1 bg-[#3D4534] hover:bg-[#2C3226] text-white py-3 rounded text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Book {selectedModalCategory.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedModalCategory(null)}
                  className="sm:w-32 border border-[#C8C0B2] text-[#4A5340] py-3 rounded text-xs font-semibold tracking-wider uppercase hover:bg-[#EFECE4]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
