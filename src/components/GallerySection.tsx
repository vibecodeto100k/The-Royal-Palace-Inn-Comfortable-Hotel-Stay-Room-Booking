import React, { useState, useEffect } from 'react';
import { GalleryImage } from '../types';
import { Sparkles, Maximize2, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface GallerySectionProps {
  images: GalleryImage[];
}

export const GallerySection: React.FC<GallerySectionProps> = ({ images }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredImages = selectedFilter === 'all'
    ? images
    : images.filter((img) => img.category === selectedFilter);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null && prev < filteredImages.length - 1 ? prev + 1 : 0));
      }
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredImages.length - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, filteredImages.length]);

  return (
    <section id="gallery" className="py-20 sm:py-24 bg-[#FBF9F5] border-b border-[#E8E2D6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#4A5340] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Visual Tour</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#232624] tracking-tight mb-4">
            Glimpses of The Royal Palace Inn
          </h2>
          <p className="text-sm sm:text-base text-[#687062] leading-relaxed">
            Explore our curated sanctuary, from our intimate suites and shaded courtyards to our morning dining veranda.
          </p>
        </div>

        {/* Filter Categories */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10 text-xs font-semibold uppercase tracking-wider">
          {[
            { id: 'all', label: 'All Photos' },
            { id: 'rooms', label: 'Suites & Rooms' },
            { id: 'courtyard', label: 'Courtyard & Gardens' },
            { id: 'dining', label: 'Dining Veranda' },
            { id: 'exterior', label: 'Architecture' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-4 py-2 rounded-full border transition-all ${
                selectedFilter === tab.id
                  ? 'bg-[#3D4534] text-white border-[#3D4534] shadow-sm'
                  : 'bg-white text-[#586050] border-[#DDD6C8] hover:border-[#3D4534]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredImages.map((image, idx) => (
            <div
              key={image.id}
              onClick={() => setLightboxIndex(idx)}
              className="group relative aspect-[4/3] rounded-md overflow-hidden bg-[#2D3328] border border-[#DDD6C8] cursor-pointer shadow-sm hover:shadow-md transition-all"
            >
              <img
                src={image.url}
                alt={image.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
                <span className="font-serif text-base font-medium">{image.title}</span>
                {image.caption && <span className="text-[11px] text-[#E0DBCF] line-clamp-1">{image.caption}</span>}
                <div className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                  <Maximize2 className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {lightboxIndex !== null && filteredImages[lightboxIndex] && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-6 right-6 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Close Lightbox"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Prev Button */}
            <button
              onClick={() => setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredImages.length - 1))}
              className="absolute left-4 sm:left-8 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Previous Photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Main Lightbox Image & Caption */}
            <div className="max-w-4xl max-h-[85vh] flex flex-col items-center">
              <img
                src={filteredImages[lightboxIndex].url}
                alt={filteredImages[lightboxIndex].title}
                className="max-w-full max-h-[70vh] object-contain rounded shadow-2xl"
              />
              <div className="text-center mt-4 text-white">
                <h4 className="font-serif text-xl sm:text-2xl font-medium">
                  {filteredImages[lightboxIndex].title}
                </h4>
                {filteredImages[lightboxIndex].caption && (
                  <p className="text-xs sm:text-sm text-[#D8D2C4] mt-1 max-w-xl mx-auto">
                    {filteredImages[lightboxIndex].caption}
                  </p>
                )}
                <div className="text-[11px] text-[#9A9F94] mt-2 font-mono">
                  {lightboxIndex + 1} of {filteredImages.length}
                </div>
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={() => setLightboxIndex((prev) => (prev !== null && prev < filteredImages.length - 1 ? prev + 1 : 0))}
              className="absolute right-4 sm:right-8 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Next Photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
