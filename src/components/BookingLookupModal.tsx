import React, { useState } from 'react';
import { Search, Loader2, AlertCircle, CheckCircle2, Calendar, User, Phone, BedDouble, Shield } from 'lucide-react';
import { getClientBookings } from '../services/clientStorage';

interface BookingLookupModalProps {
  onClose: () => void;
}

export const BookingLookupModal: React.FC<BookingLookupModalProps> = ({ onClose }) => {
  const [reference, setReference] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [booking, setBooking] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setBooking(null);

    try {
      let data: any = null;
      let ok = false;

      try {
        let url = `/api/bookings/lookup?reference=${encodeURIComponent(reference.trim())}`;
        if (phone.trim()) {
          url += `&phone=${encodeURIComponent(phone.trim())}`;
        }

        const res = await fetch(url);
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          data = await res.json();
          ok = res.ok && data.success;
        }
      } catch {
        // Network or static deployment without backend
      }

      if (!ok) {
        // Fallback to clientStorage
        const refQuery = reference.trim().toUpperCase();
        const phoneQuery = phone.replace(/\D/g, '');
        const list = getClientBookings('all', '');
        const match = list.find((b) => {
          const matchRef = b.reference.toUpperCase() === refQuery;
          if (!matchRef) return false;
          if (phoneQuery) {
            const bPhone = b.guest_phone.replace(/\D/g, '');
            return bPhone.includes(phoneQuery) || phoneQuery.includes(bPhone);
          }
          return true;
        });

        if (match) {
          data = { success: true, booking: match };
          ok = true;
        }
      }

      if (!ok || !data?.booking) {
        throw new Error(data?.error || 'No reservation found for this reference.');
      }

      setBooking(data.booking);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lookup failed. Please verify your reference.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded font-semibold">Confirmed</span>;
      case 'checked_in':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded font-semibold">Currently Checked-In</span>;
      case 'checked_out':
        return <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded font-semibold">Checked-Out</span>;
      case 'cancelled':
        return <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-1 rounded font-semibold">Cancelled</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded font-semibold">Pending Confirmation</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#FBF9F5] border border-[#E3DCcf] rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#687062] hover:text-[#232624] text-xl font-bold p-1"
          aria-label="Close"
        >
          &times;
        </button>

        <div className="mb-5">
          <span className="text-xs uppercase tracking-widest text-[#4A5340] font-semibold block">
            Guest Self-Service
          </span>
          <h3 className="font-serif text-2xl font-normal text-[#232624] mt-0.5">
            Lookup Your Reservation
          </h3>
          <p className="text-xs text-[#6E7567] mt-1">
            Enter your booking reference code (e.g. <code>RPI-2026-8812</code>) provided during enquiry.
          </p>
        </div>

        <form onSubmit={handleLookup} className="space-y-3 mb-6">
          <div>
            <label className="block text-xs font-semibold text-[#4A5340] mb-1">
              Booking Reference <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. RPI-2026-XXXX"
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              className="w-full bg-white border border-[#D5CDC0] rounded px-3 py-2 text-sm uppercase tracking-wider font-mono text-[#232624]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A5340] mb-1">
              Registered Phone Number (Optional)
            </label>
            <input
              type="tel"
              placeholder="Last 4 digits or full phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-white border border-[#D5CDC0] rounded px-3 py-2 text-sm text-[#232624]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#3D4534] hover:bg-[#2C3226] text-white py-2.5 rounded text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Check Reservation Status</span>
          </button>
        </form>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {booking && (
          <div className="p-4 bg-white border border-[#DDD6C8] rounded-md space-y-3 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-[#ECE7DC] pb-3">
              <div>
                <span className="text-[10px] text-[#71786A] block uppercase font-mono">Reference</span>
                <span className="font-mono font-bold text-sm text-[#232624]">{booking.reference}</span>
              </div>
              <div>{getStatusBadge(booking.status)}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-[#444C3E]">
              <div>
                <span className="text-[10px] text-[#788072] block uppercase">Guest Name</span>
                <span className="font-medium">{booking.guest_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#788072] block uppercase">Room Category</span>
                <span className="font-medium">{booking.category_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#788072] block uppercase">Check-In</span>
                <span className="font-medium">{booking.check_in_date}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#788072] block uppercase">Check-Out</span>
                <span className="font-medium">{booking.check_out_date} ({booking.nights}N)</span>
              </div>
              <div>
                <span className="text-[10px] text-[#788072] block uppercase">Assigned Physical Room</span>
                <span className="font-medium text-[#2D3328]">
                  {booking.assigned_room_number ? `Room ${booking.assigned_room_number}` : 'Assigned at check-in'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#788072] block uppercase">Total Amount</span>
                <span className="font-serif font-bold text-sm text-[#232624]">
                  ₹{booking.total_amount?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {booking.status === 'pending' && (
              <div className="p-2.5 bg-[#FFF9E6] border border-[#F3E5AB] rounded text-[11px] text-[#7A641B] mt-2">
                Your booking enquiry is currently pending confirmation from the front desk. If you haven&apos;t sent the WhatsApp message yet, please contact +91 7700 869 635.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
