import React, { useState, useEffect } from 'react';
import { RoomCategory, HotelSettings } from '../types';
import { Calendar, Users, Phone, Mail, User, AlertTriangle, CheckCircle, Shield, ArrowRight, Loader2, CreditCard } from 'lucide-react';

interface BookingModalProps {
  initialCategoryId?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  categories: RoomCategory[];
  hotel: HotelSettings;
  onClose: () => void;
  onBookingCreated: (data: any) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  initialCategoryId,
  initialCheckIn,
  initialCheckOut,
  categories,
  hotel,
  onClose,
  onBookingCreated
}) => {
  const today = new Date();
  const formatYMD = (d: Date) => d.toISOString().split('T')[0];

  const defaultIn = initialCheckIn || formatYMD(today);
  const defaultOut = initialCheckOut || formatYMD(new Date(today.getTime() + 86400000));

  const [categoryId, setCategoryId] = useState<string>(initialCategoryId || (categories[0]?.id || ''));
  const [checkIn, setCheckIn] = useState<string>(defaultIn);
  const [checkOut, setCheckOut] = useState<string>(defaultOut);
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [roomsCount, setRoomsCount] = useState<number>(1);
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('pay_at_hotel');

  // Availability & Price State
  const [isCheckingAvail, setIsCheckingAvail] = useState<boolean>(false);
  const [availInfo, setAvailInfo] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Selected Category Object
  const selectedCat = categories.find((c) => c.id === categoryId) || categories[0];

  // Fetch live availability whenever dates or category change
  useEffect(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) return;

    let isMounted = true;
    setIsCheckingAvail(true);
    setErrorMsg(null);

    fetch(`/api/rooms/availability?checkIn=${checkIn}&checkOut=${checkOut}&categoryId=${categoryId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setIsCheckingAvail(false);
        if (data.success && data.availability && data.availability[categoryId]) {
          setAvailInfo(data.availability[categoryId]);
        } else if (data.error) {
          setErrorMsg(data.error);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setIsCheckingAvail(false);
        setErrorMsg('Could not verify room availability. Please check dates.');
      });

    return () => {
      isMounted = false;
    };
  }, [checkIn, checkOut, categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate phone number
    const cleanPhone = guestPhone.replace(/[\s\-\(\)]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number for WhatsApp reservation.');
      return;
    }

    if (!availInfo || !availInfo.isAvailable) {
      setErrorMsg('This room category is fully booked for the selected dates. Please select different dates.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/bookings/enquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: guestName,
          guest_phone: guestPhone,
          guest_email: guestEmail || undefined,
          category_id: categoryId,
          check_in_date: checkIn,
          check_out_date: checkOut,
          adults,
          children,
          rooms_count: roomsCount,
          special_requests: specialRequests,
          payment_method: paymentMethod
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit booking enquiry.');
      }

      onBookingCreated(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while creating booking enquiry.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#FBF9F5] border border-[#E3DCcf] rounded-lg max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#687062] hover:text-[#232624] text-xl font-bold p-1"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <span className="text-xs uppercase tracking-widest text-[#4A5340] font-semibold block">
            Direct Reservation Request
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#232624] mt-0.5">
            Book Your Stay at The Royal Palace Inn
          </h3>
          <p className="text-xs sm:text-sm text-[#6A7264] mt-1">
            Real-time availability for our 6 exclusive physical rooms. Complete details to generate your confirmed WhatsApp enquiry.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-md text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Suite Category Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A5340] mb-2">
              1. Select Suite Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {categories.map((cat) => {
                const isSelected = cat.id === categoryId;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={`p-3 rounded text-left border transition-all ${
                      isSelected
                        ? 'border-[#3D4534] bg-[#EFECE4] ring-1 ring-[#3D4534]'
                        : 'border-[#DDD6C8] bg-white hover:border-[#B5AC9E]'
                    }`}
                  >
                    <span className="font-serif font-medium text-sm text-[#232624] block leading-tight">
                      {cat.name}
                    </span>
                    <span className="text-xs font-bold text-[#3D4534] block mt-1">
                      ₹{cat.base_price.toLocaleString('en-IN')} <span className="font-normal text-[10px] text-[#788072]">/ night</span>
                    </span>
                    <span className="text-[10px] text-[#6E7567] block mt-0.5">
                      Max {cat.max_occupancy} guests &bull; {cat.bed_type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Dates & Guests Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3.5 border border-[#E0D9CD] rounded-md">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#666D5F] mb-1">
                Check-in Date
              </label>
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
                className="w-full bg-[#FAF9F6] border border-[#D5CDC0] rounded px-2.5 py-2 text-xs text-[#232624]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#666D5F] mb-1">
                Check-out Date
              </label>
              <input
                type="date"
                min={checkIn ? formatYMD(new Date(new Date(checkIn).getTime() + 86400000)) : formatYMD(today)}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                required
                className="w-full bg-[#FAF9F6] border border-[#D5CDC0] rounded px-2.5 py-2 text-xs text-[#232624]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#666D5F] mb-1">
                Adults (Age 12+)
              </label>
              <select
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value, 10))}
                className="w-full bg-[#FAF9F6] border border-[#D5CDC0] rounded px-2.5 py-2 text-xs text-[#232624]"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Adult' : 'Adults'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#666D5F] mb-1">
                Children (0-11)
              </label>
              <select
                value={children}
                onChange={(e) => setChildren(parseInt(e.target.value, 10))}
                className="w-full bg-[#FAF9F6] border border-[#D5CDC0] rounded px-2.5 py-2 text-xs text-[#232624]"
              >
                {[0, 1, 2, 3].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Child' : 'Children'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Availability Status Strip */}
          <div className="p-3 rounded-md border flex items-center justify-between text-xs transition-colors bg-[#FAF8F5] border-[#E3DCcf]">
            {isCheckingAvail ? (
              <div className="flex items-center gap-2 text-[#687062]">
                <Loader2 className="w-4 h-4 animate-spin text-[#3D4534]" />
                <span>Checking real inventory across the 6 physical rooms...</span>
              </div>
            ) : availInfo ? (
              availInfo.isAvailable ? (
                <div className="flex items-center gap-2 text-[#2E7D32]">
                  <CheckCircle className="w-4 h-4 text-[#2E7D32]" />
                  <span>
                    <strong>Available!</strong> {availInfo.availableCount} of {availInfo.totalConfiguredRooms} physical rooms open for {availInfo.nights} night(s).
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Fully booked for these dates. Please try other dates.</span>
                </div>
              )
            ) : (
              <span className="text-[#788072]">Select your dates to verify live room availability</span>
            )}

            {availInfo && availInfo.isAvailable && (
              <span className="font-semibold text-[#2D3328] font-serif text-sm">
                Est. Total: ₹{availInfo.totalEstimated.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* 3. Guest Information */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A5340] mb-2">
              2. Guest Details
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#555C4E] mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikramaditya Singh"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-white border border-[#D5CDC0] rounded px-3 py-2 text-xs sm:text-sm text-[#232624] focus:outline-none focus:ring-1 focus:ring-[#3D4534]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#555C4E] mb-1">
                  Mobile Number (WhatsApp) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="+91 98200 XXXXX"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full bg-white border border-[#D5CDC0] rounded px-3 py-2 text-xs sm:text-sm text-[#232624] focus:outline-none focus:ring-1 focus:ring-[#3D4534]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#555C4E] mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="vikram@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full bg-white border border-[#D5CDC0] rounded px-3 py-2 text-xs sm:text-sm text-[#232624] focus:outline-none focus:ring-1 focus:ring-[#3D4534]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#555C4E] mb-1">
                  Special Requests / Arrival Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arriving around 1 PM, extra pillows"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full bg-white border border-[#D5CDC0] rounded px-3 py-2 text-xs sm:text-sm text-[#232624] focus:outline-none focus:ring-1 focus:ring-[#3D4534]"
                />
              </div>
            </div>
          </div>

          {/* 4. Payment Preference */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A5340] mb-2">
              3. Payment Preference
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label
                className={`p-3 rounded border flex items-center gap-2.5 cursor-pointer transition-colors ${
                  paymentMethod === 'pay_at_hotel'
                    ? 'border-[#3D4534] bg-[#EFECE4] text-[#232624] font-medium'
                    : 'border-[#DDD6C8] bg-white text-[#555C4E]'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="pay_at_hotel"
                  checked={paymentMethod === 'pay_at_hotel'}
                  onChange={() => setPaymentMethod('pay_at_hotel')}
                  className="text-[#3D4534] focus:ring-[#3D4534]"
                />
                <div>
                  <span className="block font-medium">Pay upon Arrival at Hotel</span>
                  <span className="text-[10px] text-[#71786A]">Cash, UPI, or Card at check-in desk</span>
                </div>
              </label>

              <label
                className={`p-3 rounded border flex items-center gap-2.5 cursor-pointer transition-colors ${
                  paymentMethod === 'upi'
                    ? 'border-[#3D4534] bg-[#EFECE4] text-[#232624] font-medium'
                    : 'border-[#DDD6C8] bg-white text-[#555C4E]'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                  className="text-[#3D4534] focus:ring-[#3D4534]"
                />
                <div>
                  <span className="block font-medium">Instant UPI Transfer (VPA / QR)</span>
                  <span className="text-[10px] text-[#71786A]">Google Pay, PhonePe, Paytm, BHIM</span>
                </div>
              </label>
            </div>
          </div>

          {/* Transparent Price Breakdown */}
          {availInfo && (
            <div className="bg-[#EFECE4] border border-[#DDD6C8] rounded-md p-4 text-xs space-y-1.5">
              <div className="flex justify-between text-[#555C4E]">
                <span>
                  Room Rate (₹{availInfo.ratePerNight.toLocaleString('en-IN')} &times; {availInfo.nights} {availInfo.nights === 1 ? 'night' : 'nights'}):
                </span>
                <span>₹{availInfo.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#555C4E]">
                <span>Applicable Hospitality GST ({availInfo.taxPercent}%):</span>
                <span>₹{availInfo.taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#DDD6C8] font-serif font-bold text-base text-[#232624]">
                <span>Total Estimated Payable:</span>
                <span>₹{availInfo.totalEstimated.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isCheckingAvail || (availInfo && !availInfo.isAvailable)}
              className="w-full bg-[#3D4534] hover:bg-[#2C3226] disabled:bg-[#A3AAA0] text-white py-3.5 px-4 rounded-md text-xs sm:text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging Enquiry in Reservation Engine...</span>
                </>
              ) : (
                <>
                  <span>Submit &amp; Open WhatsApp Confirmation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-[#788072] mt-2">
              Our front desk will review room allocation and confirm immediately via WhatsApp (+91 7700 869 635).
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
