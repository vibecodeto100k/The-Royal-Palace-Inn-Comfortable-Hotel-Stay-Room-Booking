// Source: Google Maps Platform Code Assist
import React, { useState } from 'react';
import { HotelSettings } from '../types';
import {
  MapPin, Phone, MessageSquare, Mail, Clock, ExternalLink,
  Navigation, Compass, AlertCircle, Sparkles, CheckCircle2
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';

interface LocationContactProps {
  hotel: HotelSettings;
  onOpenBooking: () => void;
}

export const LocationContactSection: React.FC<LocationContactProps> = ({ hotel }) => {
  const [showInfoWindow, setShowInfoWindow] = useState(true);
  const [apiError, setApiError] = useState(false);

  // Read API key from environment
  const mapsApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();

  // Basic contact and formatting
  const hotelName = hotel.hotel_name || 'Theroyalpalaceinn';
  const cleanPhone = (hotel.phone || '+91 7700 869 635').replace(/\s+/g, '');
  const cleanWa = hotel.whatsapp_normalized || '917700869635';
  const formattedWaDisplay = `+${cleanWa.slice(0, 2)} ${cleanWa.slice(2, 6)} ${cleanWa.slice(6, 9)} ${cleanWa.slice(9)}`;

  // Location fields
  const address = hotel.address || '14, Heritage Palace Enclave, Civil Lines';
  const city = hotel.city || 'Jaipur';
  const state = hotel.state || 'Rajasthan';
  const pincode = hotel.pincode || '302006';
  const country = hotel.country || 'India';
  const heading = hotel.location_heading || 'Our Location & Directions';
  const description = hotel.location_description || 'Conveniently situated in Jaipur\'s quiet residential Civil Lines enclave, minutes from historical monuments, transit hubs, and authentic bazaars.';

  const fullAddress = [address, city, `${state} ${pincode}`.trim(), country].filter(Boolean).join(', ');

  // Coordinates
  const parsedLat = parseFloat(hotel.latitude || '26.905953');
  const parsedLng = parseFloat(hotel.longitude || '75.776652');
  const hasValidCoords = !isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat !== 0 && parsedLng !== 0;
  const coordinates = hasValidCoords ? { lat: parsedLat, lng: parsedLng } : { lat: 26.905953, lng: 75.776652 };

  // Dynamic directions URL: built dynamically from saved coordinates or full address
  const directionsDestination = hasValidCoords
    ? `${coordinates.lat},${coordinates.lng}`
    : fullAddress;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(directionsDestination)}`;

  // Dynamic Google Maps URL: opens the location directly on Google Maps in a new tab
  const mapsUrl = hotel.google_maps_url && hotel.google_maps_url.trim().length > 0
    ? hotel.google_maps_url
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsDestination)}`;

  // Custom embed URL fallback if configured
  const embedUrl = hotel.google_maps_embed_url ||
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14232.894318357777!2d75.77665241774903!3d26.905953334588965!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396db415a77f9839%3A0x6b6df5ea8283a30!2sCivil%20Lines%2C%20Jaipur%2C%20Rajasthan!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin';

  return (
    <section id="location" className="py-20 sm:py-24 bg-[#F5F2EB] border-b border-[#E8E2D6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#4A5340] mb-3">
            <Compass className="w-3.5 h-3.5" />
            <span>Find Us &bull; Arrive in Comfort</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#232624] tracking-tight mb-4">
            {heading}
          </h2>
          <p className="text-sm sm:text-base text-[#687062] leading-relaxed">
            {description}
          </p>
        </div>

        {/* Location & Map Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Hotel Location & Contact Card (Left Column) */}
          <div className="lg:col-span-5 bg-[#FBF9F5] p-6 sm:p-8 rounded-md border border-[#DDD6C8] shadow-sm space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#4A5340]">
                  Sanctuary Coordinates
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Address
                </span>
              </div>
              <h3 className="font-serif text-2xl font-normal text-[#232624] mb-3">
                {hotelName}
              </h3>
              <p className="text-xs text-[#687062] mb-5">
                Civil Lines &bull; Jaipur, Rajasthan, India
              </p>

              {/* Complete Address & Location Details */}
              <div className="space-y-4 text-xs sm:text-sm text-[#444C3E]">
                <div className="flex items-start gap-3 bg-[#EFECE4] p-3.5 rounded border border-[#E5DFD1]">
                  <MapPin className="w-4 h-4 text-[#3D4534] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#232624] block text-xs uppercase tracking-wider mb-1">
                      Complete Hotel Address
                    </span>
                    <p className="text-xs sm:text-sm text-[#232624] leading-relaxed">
                      {address}
                    </p>
                    <p className="text-xs text-[#52594B] mt-0.5">
                      {city}, {state} &ndash; {pincode}, {country}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-1">
                  <Phone className="w-4 h-4 text-[#3D4534] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-[#232624] block">Front Desk Telephone</span>
                    <a
                      href={`tel:${cleanPhone}`}
                      className="hover:underline text-[#2D3328] font-medium"
                    >
                      {hotel.phone || '+91 7700 869 635'}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-[#232624] block">WhatsApp Concierge</span>
                    <a
                      href={`https://wa.me/${cleanWa}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2E7D32] hover:underline font-semibold"
                    >
                      {formattedWaDisplay}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#3D4534] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-[#232624] block">Reservations &amp; Enquiries</span>
                    <a href={`mailto:${hotel.email}`} className="hover:underline text-[#2D3328]">
                      {hotel.email || 'reservations@theroyalpalaceinn.com'}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Check-In / Check-Out Times Strip */}
            <div className="pt-4 border-t border-[#ECE7DC] grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#EFECE4] rounded border border-[#E5DFD1]">
                <span className="text-[10px] text-[#71786A] uppercase font-semibold block">Check-in Time</span>
                <span className="font-serif text-base font-semibold text-[#232624]">{hotel.check_in_time || '14:00 (2:00 PM)'}</span>
              </div>
              <div className="p-3 bg-[#EFECE4] rounded border border-[#E5DFD1]">
                <span className="text-[10px] text-[#71786A] uppercase font-semibold block">Check-out Time</span>
                <span className="font-serif text-base font-semibold text-[#232624]">{hotel.check_out_time || '11:00 (11:00 AM)'}</span>
              </div>
            </div>

            {/* Primary Action Buttons: Get Directions & WhatsApp */}
            <div className="pt-2 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Get Directions Button */}
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#3D4534] hover:bg-[#2C3226] text-white py-3 px-4 rounded text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow"
                >
                  <Navigation className="w-4 h-4 text-[#D8CFBC]" />
                  <span>Get Directions</span>
                </a>

                {/* Contact on WhatsApp Button */}
                <a
                  href={`https://wa.me/${cleanWa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#1EBE5D] text-white py-3 px-4 rounded text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Contact on WhatsApp</span>
                </a>
              </div>

              {/* Open in Google Maps Link */}
              <div className="pt-1 text-center">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#3D4534] hover:text-[#1E2319] hover:underline font-semibold py-1"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Interactive Google Map Section (Right Column) */}
          <div className="lg:col-span-7 bg-[#FBF9F5] rounded-md border border-[#DDD6C8] overflow-hidden shadow-sm flex flex-col">
            {/* Map Top Bar */}
            <div className="p-4 sm:p-5 border-b border-[#DDD6C8] flex flex-wrap items-center justify-between gap-3 bg-[#FAF8F3]">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-serif text-lg font-medium text-[#232624]">
                    Interactive Location Map
                  </h4>
                  <span className="text-[10px] bg-[#EFECE4] text-[#4A5340] px-2 py-0.5 rounded font-mono font-medium">
                    {coordinates.lat.toFixed(4)}&deg; N, {coordinates.lng.toFixed(4)}&deg; E
                  </span>
                </div>
                <p className="text-xs text-[#6A7264] mt-0.5">
                  Civil Lines, Jaipur &bull; Easily accessible by cab, metro, auto, or private chauffeur
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-white bg-[#3D4534] hover:bg-[#2C3226] font-semibold px-3 py-1.5 rounded transition-colors shadow-xs"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Directions</span>
                </a>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#3D4534] hover:underline font-semibold bg-[#EFECE4] hover:bg-[#E5DFD1] px-3 py-1.5 rounded transition-colors"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Interactive Map Container */}
            <div className="w-full h-[420px] bg-[#EAE5D9] relative">
              {mapsApiKey && !apiError ? (
                <APIProvider
                  apiKey={mapsApiKey}
                  onError={() => setApiError(true)}
                >
                  <Map
                    mapId="DEMO_MAP_ID"
                    defaultCenter={coordinates}
                    center={coordinates}
                    defaultZoom={15}
                    gestureHandling="cooperative"
                    disableDefaultUI={false}
                    zoomControl={true}
                    fullscreenControl={true}
                    streetViewControl={false}
                    mapTypeControl={false}
                    className="w-full h-full"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  >
                    <AdvancedMarker
                      position={coordinates}
                      title={hotelName}
                      onClick={() => setShowInfoWindow(true)}
                    >
                      <Pin
                        background="#3D4534"
                        glyphColor="#FFFFFF"
                        borderColor="#262D20"
                        scale={1.2}
                      />
                    </AdvancedMarker>

                    {showInfoWindow && (
                      <InfoWindow
                        position={coordinates}
                        onCloseClick={() => setShowInfoWindow(false)}
                      >
                        <div className="p-2 max-w-[240px] text-left">
                          <h5 className="font-serif font-bold text-sm text-[#232624] mb-1">
                            {hotelName}
                          </h5>
                          <p className="text-[11px] text-[#555D4E] leading-relaxed mb-2">
                            {fullAddress}
                          </p>
                          <div className="flex items-center gap-2 pt-1 border-t border-[#ECE7DC]">
                            <a
                              href={directionsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-[#3D4534] font-bold hover:underline inline-flex items-center gap-1"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>Get Directions</span>
                            </a>
                            <span className="text-[#DDD6C8]">&bull;</span>
                            <a
                              href={`https://wa.me/${cleanWa}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-[#25D366] font-bold hover:underline"
                            >
                              WhatsApp
                            </a>
                          </div>
                        </div>
                      </InfoWindow>
                    )}
                  </Map>
                </APIProvider>
              ) : (
                /* Fallback Responsive Embed if API key is not ready or failed */
                <iframe
                  title="The Royal Palace Inn Map Location"
                  src={embedUrl}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}
            </div>

            {/* Proximity Transit & Sightseeing Landmarks Strip */}
            <div className="p-4 bg-[#EFECE4] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs text-[#444C3E] border-t border-[#DDD6C8]">
              <div>
                <span className="block font-serif text-sm font-semibold text-[#232624]">15 Mins</span>
                <span className="text-[10px] text-[#788072]">Jaipur Junction (4.2 km)</span>
              </div>
              <div className="border-l border-[#DDD6C8]">
                <span className="block font-serif text-sm font-semibold text-[#232624]">25 Mins</span>
                <span className="text-[10px] text-[#788072]">Jaipur Airport (12 km)</span>
              </div>
              <div className="border-l border-[#DDD6C8]">
                <span className="block font-serif text-sm font-semibold text-[#232624]">18 Mins</span>
                <span className="text-[10px] text-[#788072]">City Palace &amp; Hawa Mahal</span>
              </div>
              <div className="border-l border-[#DDD6C8]">
                <span className="block font-serif text-sm font-semibold text-[#232624]">30 Mins</span>
                <span className="text-[10px] text-[#788072]">Amer Fort &amp; Palace</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
