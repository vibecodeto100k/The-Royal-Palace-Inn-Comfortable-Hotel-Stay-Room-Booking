import React from 'react';
import { Wifi, Coffee, Clock, Wind, Bath, Zap, Car, Compass, Sparkles, ShieldCheck } from 'lucide-react';

interface FacilitiesSectionProps {
  facilities?: string[];
}

export const FacilitiesSection: React.FC<FacilitiesSectionProps> = ({ facilities }) => {
  const defaultList = [
    { title: 'High-Speed Fibre Wi-Fi', desc: 'Seamless unlimited connectivity across all suites and garden courtyards.', icon: Wifi },
    { title: 'Artisanal Breakfast & Dining', desc: 'Fresh local culinary specialties and continental selections served in our veranda.', icon: Coffee },
    { title: '24-Hour Front Desk & Concierge', desc: 'Around-the-clock assistance, luggage care, and local recommendations.', icon: Clock },
    { title: 'Individual Climate Control', desc: 'High-efficiency whisper-quiet AC and heating in every individual suite.', icon: Wind },
    { title: 'Italian Marble Bathrooms', desc: 'Private en-suite baths equipped with thermostatic rain showers and Ayurvedic toiletries.', icon: Bath },
    { title: '24x7 Uninterrupted Power Backup', desc: 'Heavy-duty silent generator ensuring seamless power and air-conditioning.', icon: Zap },
    { title: 'Secure On-Site Valet Parking', desc: 'Complimentary gated parking with 24-hour security personnel.', icon: Car },
    { title: 'Heritage Excursion Desk', desc: 'Private chauffeur bookings and personalized city heritage tours on request.', icon: Compass }
  ];

  return (
    <section id="facilities" className="py-20 sm:py-24 bg-[#EFECE4] border-b border-[#E0D9CD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#4A5340] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Refined Comforts</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#232624] tracking-tight mb-4">
            Curated Hotel Amenities
          </h2>
          <p className="text-sm sm:text-base text-[#687062] leading-relaxed">
            Every convenience has been carefully considered to ensure effortless relaxation during your stay at The Royal Palace Inn.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {defaultList.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div
                key={idx}
                className="bg-[#FBF9F5] p-6 rounded-md border border-[#DDD6C8] hover:border-[#3D4534] transition-all hover:shadow-md flex flex-col"
              >
                <div className="w-10 h-10 rounded-sm bg-[#EAE5D9] text-[#3D4534] flex items-center justify-center mb-4 shrink-0">
                  <IconComponent className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-medium text-[#232624] mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs text-[#626A5C] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
