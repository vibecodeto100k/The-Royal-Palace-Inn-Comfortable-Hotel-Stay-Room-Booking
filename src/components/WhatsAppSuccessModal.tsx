import React, { useState } from 'react';
import { MessageSquare, Check, Copy, AlertCircle, ArrowUpRight, Calendar, User, Phone, Tag } from 'lucide-react';

interface WhatsAppSuccessModalProps {
  data: {
    reference: string;
    booking: any;
    whatsapp: {
      number: string;
      formatted_phone: string;
      message: string;
      url: string;
    };
  };
  onClose: () => void;
}

export const WhatsAppSuccessModal: React.FC<WhatsAppSuccessModalProps> = ({ data, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [openedWhatsApp, setOpenedWhatsApp] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.whatsapp.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    setOpenedWhatsApp(true);
    window.open(data.whatsapp.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#FBF9F5] border border-[#E3DCcf] rounded-lg max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#687062] hover:text-[#232624] text-xl font-bold p-1"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Header with WhatsApp Accent */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-[#E8F8F0] text-[#1E7E34] border border-[#A3E4D7] flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#2E7D32]">
              Booking Enquiry Registered
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#232624]">
              Almost Done! Send via WhatsApp
            </h3>
          </div>
        </div>

        {/* Reference Banner */}
        <div className="bg-[#EFECE4] border border-[#DDD6C8] rounded-md p-3.5 mb-5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-[#788072] uppercase tracking-wider block font-semibold">
              Reservation Reference
            </span>
            <span className="font-mono text-base sm:text-lg font-bold text-[#2D3328]">
              {data.reference}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#788072] uppercase tracking-wider block font-semibold">
              Status
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#B7791F] bg-[#FEFCBF] px-2 py-0.5 rounded">
              Pending Confirmation
            </span>
          </div>
        </div>

        {/* Booking Summary Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-[#444C3E] p-3.5 bg-white border border-[#E3DCcf] rounded-md mb-5">
          <div>
            <span className="text-[10px] text-[#788072] block uppercase">Guest</span>
            <span className="font-medium truncate block">{data.booking.guest_name}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#788072] block uppercase">Suite</span>
            <span className="font-medium truncate block">{data.booking.category_name}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#788072] block uppercase">Dates</span>
            <span className="font-medium block">{data.booking.check_in_date} ({data.booking.nights}N)</span>
          </div>
          <div>
            <span className="text-[10px] text-[#788072] block uppercase">Total</span>
            <span className="font-serif font-bold text-sm text-[#232624]">
              ₹{Number(data.booking.total_amount || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Critical Instructions Card */}
        <div className="bg-[#FFF9E6] border border-[#F3E5AB] rounded-md p-4 mb-5 text-xs text-[#7A641B] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#C49A45] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold block mb-1 text-[#5E4A0F]">
              Next Step: Tap &quot;Send&quot; in WhatsApp
            </strong>
            Your request has been logged in our reservation engine. Clicking below will open WhatsApp with your pre-formatted enquiry to our front desk (+91 7700 869 635). <strong>You must press the Send button in WhatsApp</strong> to initiate confirmation.
          </div>
        </div>

        {/* Pre-filled Message Preview Box */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#636B5C]">
              Pre-filled WhatsApp Message
            </label>
            <button
              onClick={handleCopy}
              className="text-[11px] text-[#3D4534] hover:text-black flex items-center gap-1 font-medium underline"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#2E7D32]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy text</span>
                </>
              )}
            </button>
          </div>
          <div className="bg-[#F0EFEB] border border-[#DDD6C8] rounded-md p-3.5 text-xs font-mono text-[#2B3026] whitespace-pre-line max-h-48 overflow-y-auto leading-relaxed selection:bg-[#4A5340] selection:text-white">
            {data.whatsapp.message}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleOpenWhatsApp}
            className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white py-3.5 px-4 rounded-md text-sm font-semibold tracking-wide uppercase flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99]"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Open WhatsApp to Send Request</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>

          {openedWhatsApp && (
            <p className="text-center text-xs text-[#2E7D32] font-medium animate-in fade-in">
              &check; WhatsApp opened. Please press Send in your chat!
            </p>
          )}

          <button
            onClick={onClose}
            className="w-full border border-[#C8C0B2] text-[#4A5340] hover:bg-[#EFECE4] py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Close & Return to Website
          </button>
        </div>
      </div>
    </div>
  );
};
