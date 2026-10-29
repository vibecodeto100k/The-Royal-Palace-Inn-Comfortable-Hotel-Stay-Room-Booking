import React, { useState, useEffect } from 'react';
import {
  Shield, Key, LogOut, LayoutDashboard, CalendarDays, BedDouble,
  Settings, MessageSquare, Image as ImageIcon, FileText, CheckCircle2,
  AlertTriangle, Clock, Search, Download, Plus, Eye, EyeOff, RefreshCw,
  X, Check, DollarSign, Users, ChevronLeft, ChevronRight, Lock, Home,
  MapPin, Navigation, Compass, ExternalLink, Menu, Sliders, Sparkles,
  Smartphone, Monitor, Tablet, Upload, Trash2, ArrowUp, ArrowDown,
  Layers, Globe, Palette, CheckCircle, ChevronDown
} from 'lucide-react';
import { HotelSettings, RoomCategory, PhysicalRoom, Booking, RoomBlock, DashboardStats } from '../../types';
import { validateClientLogin, handleClientFallbackRoute } from '../../services/clientStorage';

interface AdminDashboardProps {
  onReturnToSite: () => void;
  onDataChanged?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onReturnToSite, onDataChanged }) => {
  // Auth state
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('rpi_admin_token'));
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Layout states: Collapsible sidebar on desktop and mobile drawer
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('rpi_sidebar_collapsed') === 'true';
  });
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'customizer' | 'bookings' | 'rooms' | 'categories' | 'calendar' | 'gallery' | 'settings' | 'whatsapp' | 'audit'>('overview');

  // Core Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<PhysicalRoom[]>([]);
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [settings, setSettings] = useState<any | null>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [calendarData, setCalendarData] = useState<any | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<string>(() => new Date().toISOString().substring(0, 7));

  // Filters & Modals
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>('all');
  const [bookingSearch, setBookingSearch] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editRoomModal, setEditRoomModal] = useState<PhysicalRoom | null>(null);
  const [editCategoryModal, setEditCategoryModal] = useState<RoomCategory | null>(null);
  const [newBookingModalOpen, setNewBookingModalOpen] = useState(false);
  const [newBlockModalOpen, setNewBlockModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [newPhotoModalOpen, setNewPhotoModalOpen] = useState(false);

  // Customizer state
  const [customizerSubTab, setCustomizerSubTab] = useState<'branding' | 'homepage' | 'sections' | 'layout' | 'preview'>('branding');
  const [customizerDevice, setCustomizerDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [customizerDraft, setCustomizerDraft] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Feedback notifications
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const notifyChange = () => {
    window.dispatchEvent(new Event('hotel-data-updated'));
    if (onDataChanged) {
      onDataChanged();
    }
  };

  // Helper fetch with Authorization and automatic client fallback for static hosting
  const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    try {
      const res = await fetch(url, { ...options, headers });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        if (res.status === 401) {
          setToken(null);
          localStorage.removeItem('rpi_admin_token');
          throw new Error('Session expired. Please log in again.');
        }
        return res;
      }
    } catch (err: any) {
      if (err.message === 'Session expired. Please log in again.') throw err;
    }

    // Server returned non-JSON, empty, or is unreachable (e.g. running on Vercel static deployment)
    return handleClientFallbackRoute(url, options);
  };

  // Verify auth on mount
  useEffect(() => {
    if (!token) return;
    authFetch('/api/admin/me')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success) {
          setCurrentUser(data.user);
        } else {
          setToken(null);
          localStorage.removeItem('rpi_admin_token');
        }
      })
      .catch(() => {
        if (token && token.startsWith('rpi-')) {
          setCurrentUser({
            id: 'admin-1',
            username: 'admin',
            name: 'Owner / General Manager',
            role: 'admin'
          });
        } else {
          setToken(null);
          localStorage.removeItem('rpi_admin_token');
        }
      });
  }, [token]);

  // Load active tab data
  const loadData = async () => {
    if (!token) return;
    try {
      if (activeTab === 'overview') {
        const res = await authFetch('/api/admin/dashboard-stats');
        const data = await res.json();
        if (data.success) setStats(data.stats);
      } else if (activeTab === 'bookings') {
        let url = `/api/admin/bookings?status=${bookingFilterStatus}`;
        if (bookingSearch) url += `&search=${encodeURIComponent(bookingSearch)}`;
        const res = await authFetch(url);
        const data = await res.json();
        if (data.success) setBookings(data.bookings);
      } else if (activeTab === 'rooms') {
        const res = await authFetch('/api/admin/rooms');
        const data = await res.json();
        if (data.success) setRooms(data.rooms);
      } else if (activeTab === 'categories') {
        const res = await authFetch('/api/admin/categories');
        const data = await res.json();
        if (data.success) setCategories(data.categories);
      } else if (activeTab === 'calendar') {
        const res = await authFetch(`/api/admin/calendar?month=${calendarMonth}`);
        const data = await res.json();
        if (data.success) setCalendarData(data);
      } else if (activeTab === 'settings' || activeTab === 'whatsapp' || activeTab === 'customizer') {
        const res = await authFetch('/api/admin/settings');
        const data = await res.json();
        if (data.success) {
          setSettings(data.settings);
        }
        if (activeTab === 'customizer') {
          const galRes = await authFetch('/api/admin/gallery');
          const galData = await galRes.json();
          if (galData && galData.success) setGallery(galData.images);
        }
      } else if (activeTab === 'gallery') {
        const res = await authFetch('/api/admin/gallery');
        const data = await res.json();
        if (data.success) setGallery(data.images);
      } else if (activeTab === 'audit') {
        const res = await authFetch('/api/admin/audit-logs');
        const data = await res.json();
        if (data.success) setAuditLogs(data.logs);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load data', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, token, bookingFilterStatus, bookingSearch, calendarMonth]);

  // Also load categories and rooms globally for modals
  useEffect(() => {
    if (!token) return;
    authFetch('/api/admin/categories').then((r) => r.json()).then((d) => d && d.success && setCategories(d.categories));
    authFetch('/api/admin/rooms').then((r) => r.json()).then((d) => d && d.success && setRooms(d.rooms));
  }, [token]);

  useEffect(() => {
    if (settings) {
      setCustomizerDraft((prev: any) => prev || JSON.parse(JSON.stringify(settings)));
    }
  }, [settings]);

  // Handle Login with safe server detection and resilient fallback
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      let loginSuccess = false;
      let userData: any = null;
      let authToken: string | null = null;

      // 1. Try server login if backend endpoint is live
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: loginUsername, password: loginPassword })
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.success) {
            loginSuccess = true;
            userData = data.user;
            authToken = data.token;
          } else if (data?.error) {
            throw new Error(data.error);
          }
        }
      } catch (err: any) {
        // If server actively returned an error message (like bad password or rate limit), rethrow it
        if (err.message && !err.message.includes('JSON') && !err.message.includes('fetch')) {
          throw err;
        }
      }

      // 2. Fallback to client authentication for static hosts (Vercel)
      if (!loginSuccess) {
        const clientAuth = validateClientLogin(loginUsername, loginPassword);
        if (clientAuth.success) {
          loginSuccess = true;
          userData = clientAuth.user;
          authToken = clientAuth.token!;
        } else {
          throw new Error(clientAuth.error || 'Invalid username or password');
        }
      }

      if (loginSuccess && authToken && userData) {
        setToken(authToken);
        localStorage.setItem('rpi_admin_token', authToken);
        setCurrentUser(userData);
        showToast('Welcome back, ' + (userData.name || 'Admin'));
      }
    } catch (err: any) {
      setLoginError(err.message || 'Invalid username or password');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('rpi_admin_token');
    showToast('Signed out successfully.');
  };

  // ==========================================
  // RENDER LOGIN SCREEN IF NOT AUTHENTICATED
  // ==========================================
  if (!token) {
    return (
      <div className="min-h-screen bg-[#232624] flex items-center justify-center p-4 text-[#FBF9F5]">
        <div className="bg-[#2D3328] border border-[#3E4738] rounded-lg max-w-md w-full p-8 shadow-2xl relative">
          <button
            onClick={onReturnToSite}
            className="absolute top-5 right-5 text-xs text-[#A8B29F] hover:text-white flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Customer Site</span>
          </button>

          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-sm bg-[#3D4534] text-[#E8E6DF] flex items-center justify-center font-serif text-2xl font-bold mx-auto border border-[#4F5944] mb-3">
              RP
            </div>
            <h2 className="font-serif text-2xl font-bold tracking-wide">
              Theroyalpalaceinn
            </h2>
            <p className="text-xs text-[#A8B29F] mt-1">
              Secure Owner &amp; Reservation Management Portal
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-700 text-red-200 text-xs rounded">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{loginError}</span>
              </div>
              <div className="mt-2.5 pt-2 border-t border-red-800/60 flex items-center justify-between text-[11px]">
                <span className="text-red-300">Need owner access?</span>
                <button
                  type="button"
                  onClick={() => {
                    setLoginUsername('admin');
                    setLoginPassword('RoyalPalace2026!');
                    setLoginError(null);
                  }}
                  className="text-[#D4AF37] hover:underline font-semibold cursor-pointer"
                >
                  Fill Default Credentials
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#C4CDBC] mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                placeholder="Enter username (e.g. admin)"
                autoComplete="username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full bg-[#1F231D] border border-[#3E4738] rounded px-3 py-2.5 text-sm text-white placeholder-[#687062] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#C4CDBC] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-[#1F231D] border border-[#3E4738] rounded px-3 py-2.5 pr-10 text-sm text-white placeholder-[#687062] focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7E8578] hover:text-[#E8E6DF] p-1 cursor-pointer transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-[#3D4534] hover:bg-[#4E5942] text-white py-3 rounded text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md mt-2 cursor-pointer disabled:opacity-60"
            >
              <Key className="w-4 h-4" />
              <span>{isLoggingIn ? 'Verifying...' : 'Sign In to Dashboard'}</span>
            </button>
          </form>

          <div className="mt-5 pt-3.5 border-t border-[#3E4738]/50 flex items-center justify-between text-[11px] text-[#8C9484]">
            <span>Authorized hotel staff only</span>
            <button
              type="button"
              onClick={() => {
                setLoginUsername('admin');
                setLoginPassword('RoyalPalace2026!');
                setLoginError(null);
              }}
              className="text-[#9EAF8C] hover:text-[#D4AF37] transition-colors cursor-pointer"
            >
              Quick Fill Credentials
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER AUTHENTICATED ADMIN DASHBOARD
  // ==========================================
  const navTabs = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard, badge: stats?.occupiedToday ? `${stats.occupiedToday}/6` : undefined },
    { id: 'customizer', label: 'Website Customizer', icon: Palette, badge: 'Live' },
    { id: 'bookings', label: 'Bookings & Enquiries', icon: FileText, badge: stats?.pendingEnquiries ? String(stats.pendingEnquiries) : undefined },
    { id: 'rooms', label: 'Physical Rooms (6)', icon: BedDouble },
    { id: 'categories', label: 'Suites & Rates', icon: DollarSign },
    { id: 'calendar', label: 'Occupancy Calendar', icon: CalendarDays },
    { id: 'gallery', label: 'Media & Photographs', icon: ImageIcon },
    { id: 'settings', label: 'Location & Profile', icon: MapPin },
    { id: 'whatsapp', label: 'WhatsApp & Payments', icon: MessageSquare },
    { id: 'audit', label: 'Security Audit Trail', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#232624] flex font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded shadow-xl text-xs font-medium flex items-center gap-2 border animate-in slide-in-from-bottom-2 ${
            toastMsg.type === 'success'
              ? 'bg-[#1E4620] text-white border-green-700'
              : 'bg-red-900 text-white border-red-700'
          }`}
        >
          {toastMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* MOBILE NAVIGATION DRAWER OVERLAY */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#272D23] text-white z-50 flex flex-col shadow-2xl p-4">
            <div className="flex items-center justify-between pb-4 border-b border-[#384232] mb-3">
              <div className="flex items-center gap-2.5">
                {settings?.logo_url ? (
                  <img
                    src={settings.logo_url}
                    alt="Logo"
                    className="w-9 h-9 object-contain rounded bg-[#3D4534] border border-[#4F5944] shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded bg-[#3D4534] text-white flex items-center justify-center font-serif font-bold text-lg border border-[#4F5944] shrink-0">
                    {settings?.monogram || 'RP'}
                  </div>
                )}
                <div>
                  <h2 className="font-serif text-base font-bold tracking-wide leading-tight text-white">
                    Theroyalpalaceinn
                  </h2>
                  <span className="text-[10px] text-[#A6AF9E]">Owner Portal</span>
                </div>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 text-[#A6AF9E] hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-3 px-2 py-1.5 rounded bg-[#1F241C] border border-[#343D2E] text-[11px] text-[#A6AF9E] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>6 Physical Rooms &bull; Live</span>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs transition-colors text-left ${
                      isActive
                        ? 'bg-[#3D4534] text-white font-semibold'
                        : 'text-[#B8C2AD] hover:bg-[#32392C] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0 text-[#D4AF37]" />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-[#1F241C] text-[#E8EFE0] font-mono">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-[#384232] space-y-2 text-xs">
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  onReturnToSite();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded bg-[#32392C] hover:bg-[#3D4534] text-[#E8EFE0]"
              >
                <Home className="w-4 h-4 text-[#D4AF37]" />
                <span>View Customer Website</span>
              </button>
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  setChangePasswordModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded bg-[#32392C] hover:bg-[#3D4534] text-[#E8EFE0]"
              >
                <Key className="w-4 h-4 text-[#D4AF37]" />
                <span>Change Password</span>
              </button>
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded bg-red-950/60 hover:bg-red-900 text-red-200"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP COLLAPSIBLE SIDEBAR */}
      <aside
        className={`hidden lg:flex flex-col bg-[#272D23] text-white border-r border-[#384232] transition-all duration-300 z-30 shrink-0 sticky top-0 h-screen ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-4 border-b border-[#384232] flex items-center justify-between gap-2 min-h-[68px]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt="Logo"
                className="w-9 h-9 object-contain rounded bg-[#3D4534] border border-[#4F5944] shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded bg-[#3D4534] text-white flex items-center justify-center font-serif font-bold text-lg border border-[#4F5944] shrink-0">
                {settings?.monogram || 'RP'}
              </div>
            )}
            {!isSidebarCollapsed && (
              <div className="truncate">
                <h1 className="font-serif text-sm font-bold tracking-wide leading-tight truncate text-white">
                  Theroyalpalaceinn
                </h1>
                <span className="text-[10px] text-[#A6AF9E] block truncate">
                  Owner Management
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              const next = !isSidebarCollapsed;
              setIsSidebarCollapsed(next);
              localStorage.setItem('rpi_sidebar_collapsed', String(next));
            }}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 text-[#A6AF9E] hover:text-white hover:bg-[#32392C] rounded transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Property Status Pill */}
        {!isSidebarCollapsed && (
          <div className="mx-3 my-2.5 px-2.5 py-1.5 rounded bg-[#1F241C] border border-[#343D2E] text-[11px] text-[#A6AF9E] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>6 Physical Rooms</span>
            </span>
            <span className="text-[10px] uppercase font-semibold text-emerald-400">Active</span>
          </div>
        )}

        {/* Navigation Tab Links */}
        <nav className="flex-1 px-2.5 py-2 space-y-1 overflow-y-auto scrollbar-thin">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                title={isSidebarCollapsed ? tab.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs transition-colors relative group ${
                  isActive
                    ? 'bg-[#3D4534] text-white font-semibold shadow-sm'
                    : 'text-[#B8C2AD] hover:bg-[#32392C] hover:text-white'
                } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D4AF37]' : 'text-[#8F9988] group-hover:text-white'}`} />
                  {!isSidebarCollapsed && <span className="truncate">{tab.label}</span>}
                </div>
                {!isSidebarCollapsed && tab.badge && (
                  <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-[#1F241C] text-[#E8EFE0] font-mono">
                    {tab.badge}
                  </span>
                )}
                {isSidebarCollapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-black/90 text-white text-[11px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-md">
                    {tab.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-[#384232] space-y-1.5 text-xs">
          <button
            onClick={onReturnToSite}
            title={isSidebarCollapsed ? 'Public Customer Website' : undefined}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded bg-[#32392C] hover:bg-[#3D4534] text-[#E8EFE0] transition-colors ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <Home className="w-4 h-4 text-[#D4AF37] shrink-0" />
            {!isSidebarCollapsed && <span>Public Website</span>}
          </button>

          <button
            onClick={() => setChangePasswordModalOpen(true)}
            title={isSidebarCollapsed ? 'Change Admin Password' : undefined}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-[#A6AF9E] hover:text-white hover:bg-[#32392C] transition-colors ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <Key className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Change Password</span>}
          </button>

          <button
            onClick={handleLogout}
            title={isSidebarCollapsed ? 'Logout' : undefined}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-red-300 hover:text-white hover:bg-red-950/60 transition-colors ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0 text-red-400" />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-[#2D3328] text-white border-b border-[#3D4534] px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-1.5 text-[#BCC5B4] hover:text-white hover:bg-[#3D4534] rounded"
              title="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-wide">
                Theroyalpalaceinn
              </span>
              <span className="hidden sm:inline-block text-[#8F9988]">&bull;</span>
              <span className="hidden sm:inline-block text-xs text-[#A6AF9E]">
                6 Physical Rooms &bull; Real-Time Inventory
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <button
              onClick={onReturnToSite}
              className="flex items-center gap-1.5 bg-[#3D4534] hover:bg-[#4E5942] text-[#E8EFE0] px-3 py-1.5 rounded transition-colors shadow-sm"
              title="Return to customer site"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Preview Website</span>
            </button>

            <button
              onClick={() => setChangePasswordModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 text-[#BCC5B4] hover:text-white px-2.5 py-1.5 rounded hover:bg-[#3D4534] transition-colors"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </button>

            <div className="h-4 w-px bg-[#3D4534] hidden sm:block" />

            <div className="hidden lg:flex items-center gap-2 text-xs text-[#C8CEBF]">
              <span className="w-6 h-6 rounded-full bg-[#3D4534] flex items-center justify-center font-bold text-[11px] text-[#D4AF37]">
                OP
              </span>
              <span>{currentUser?.name || 'Owner Portal'}</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-red-950/60 hover:bg-red-900 text-red-200 px-3 py-1.5 rounded transition-colors"
              title="Logout from admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* ==================================================== */}
        {/* TAB 1: OVERVIEW & ANALYTICS                          */}
        {/* ==================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-normal text-[#232624]">
                  Property Overview &amp; Today&apos;s Status
                </h2>
                <p className="text-xs text-[#687062]">
                  Live operational snapshot for {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => setNewBookingModalOpen(true)}
                  className="bg-[#3D4534] hover:bg-[#2C3226] text-white px-3.5 py-2 rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Manual Walk-In Booking</span>
                </button>
                <button
                  onClick={loadData}
                  className="border border-[#C8C0B2] bg-white hover:bg-[#EFECE4] text-[#3D4534] p-2 rounded transition-colors"
                  title="Refresh Data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-md border border-[#DDD6C8] shadow-sm">
                  <span className="text-[11px] text-[#788072] uppercase font-semibold block">Today&apos;s Occupancy</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-serif text-3xl font-bold text-[#232624]">
                      {stats.occupiedToday} / {stats.activeRooms}
                    </span>
                    <span className="text-xs font-semibold text-[#4A5340]">
                      ({stats.occupancyRate}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#EAE5D9] h-1.5 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-[#3D4534] h-full rounded-full transition-all"
                      style={{ width: `${stats.occupancyRate}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-md border border-[#DDD6C8] shadow-sm">
                  <span className="text-[11px] text-[#788072] uppercase font-semibold block">Pending WhatsApp Enquiries</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-serif text-3xl font-bold text-[#B7791F]">
                      {stats.pendingEnquiries}
                    </span>
                    <span className="text-xs text-[#788072]">awaiting review</span>
                  </div>
                  <button
                    onClick={() => {
                      setBookingFilterStatus('pending');
                      setActiveTab('bookings');
                    }}
                    className="text-[11px] text-[#3D4534] underline mt-2 block font-medium"
                  >
                    Review Pending Enquiries &rarr;
                  </button>
                </div>

                <div className="bg-white p-5 rounded-md border border-[#DDD6C8] shadow-sm">
                  <span className="text-[11px] text-[#788072] uppercase font-semibold block">Today&apos;s Movements</span>
                  <div className="flex justify-between items-center mt-2 text-xs">
                    <div>
                      <span className="text-[#687062] block">Check-ins:</span>
                      <span className="font-serif text-xl font-bold text-[#2E7D32]">{stats.checkInsToday}</span>
                    </div>
                    <div className="border-l border-[#DDD6C8] pl-4">
                      <span className="text-[#687062] block">Check-outs:</span>
                      <span className="font-serif text-xl font-bold text-[#444C3E]">{stats.checkOutsToday}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-md border border-[#DDD6C8] shadow-sm">
                  <span className="text-[11px] text-[#788072] uppercase font-semibold block">Total Revenue</span>
                  <div className="font-serif text-2xl font-bold text-[#232624] mt-1">
                    ₹{stats.totalRevenue.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-[#5B6354] mt-1 block">
                    Collected: ₹{stats.collectedRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            {/* Live Status Strip for the 6 Physical Rooms */}
            <div className="bg-white p-5 rounded-md border border-[#DDD6C8] shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif text-lg font-medium text-[#232624]">
                  Physical Rooms Live Status (6 Total)
                </h3>
                <span className="text-xs text-[#6A7264]">Click room to configure</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {rooms.map((r) => {
                  const isOccupied = !!r.current_occupant;
                  const isBlocked = r.status === 'maintenance' || !!r.active_block_reason;

                  return (
                    <div
                      key={r.id}
                      onClick={() => setEditRoomModal(r)}
                      className={`p-3 rounded border text-left cursor-pointer transition-all hover:shadow-md ${
                        isBlocked
                          ? 'border-amber-300 bg-amber-50'
                          : isOccupied
                          ? 'border-blue-200 bg-blue-50/60'
                          : 'border-emerald-200 bg-emerald-50/60'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono font-bold text-sm text-[#232624]">Room {r.room_number}</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isBlocked ? 'bg-amber-500' : isOccupied ? 'bg-blue-600' : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-[#444C3E] block truncate">
                        {r.category_name || 'Unassigned'}
                      </span>
                      <span className="text-[10px] text-[#788072] block mt-0.5">
                        {r.floor}
                      </span>
                      <div className="mt-2 text-[10px] font-medium">
                        {isBlocked ? (
                          <span className="text-amber-700">Maintenance</span>
                        ) : isOccupied ? (
                          <span className="text-blue-700 truncate block">{r.current_occupant}</span>
                        ) : (
                          <span className="text-emerald-700">Available</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Action Link to Bookings */}
            <div className="bg-[#EFECE4] p-4 rounded border border-[#DDD6C8] flex flex-wrap justify-between items-center gap-3 text-xs">
              <div>
                <strong className="text-[#232624] block">Need to confirm incoming WhatsApp reservations?</strong>
                <span className="text-[#6A7264]">Go to Bookings to assign physical rooms (101-203) and mark bookings as Confirmed.</span>
              </div>
              <button
                onClick={() => setActiveTab('bookings')}
                className="bg-[#3D4534] text-white px-3 py-1.5 rounded font-semibold uppercase tracking-wider text-[11px]"
              >
                Go to Bookings &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: VISUAL WEBSITE CUSTOMIZER                     */}
        {/* ==================================================== */}
        {activeTab === 'customizer' && customizerDraft && (
          <div className="space-y-6">
            {/* Customizer Top Header */}
            <div className="bg-white border border-[#DDD6C8] rounded-lg p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#3D4534] mb-1">
                  <Palette className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>No-Code Website Studio</span>
                </div>
                <h2 className="font-serif text-2xl font-normal text-[#232624]">
                  Visual Website Customizer
                </h2>
                <p className="text-xs text-[#687062] mt-0.5">
                  Update branding, hero presentation, homepage section order, and styles. Unsaved changes preview live below.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Discard all unsaved edits and revert to published settings?')) {
                      setCustomizerDraft(JSON.parse(JSON.stringify(settings)));
                      showToast('Unsaved edits discarded');
                    }
                  }}
                  className="px-3 py-2 border border-[#C8C0B2] text-[#444C3E] hover:bg-[#EFECE4] rounded text-xs font-semibold uppercase tracking-wider"
                >
                  Discard Edits
                </button>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('rpi_customizer_draft', JSON.stringify(customizerDraft));
                    showToast('Draft saved locally');
                  }}
                  className="px-3.5 py-2 border border-[#3D4534] text-[#3D4534] hover:bg-[#3D4534] hover:text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={async () => {
                    setIsPublishing(true);
                    try {
                      const res = await authFetch('/api/admin/settings', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(customizerDraft)
                      });
                      const d = await res.json();
                      if (!res.ok || !d.success) throw new Error(d.error || 'Failed to publish settings');

                      setSettings(JSON.parse(JSON.stringify(customizerDraft)));
                      showToast('Website published successfully! Changes are now live on public site.');
                      notifyChange();
                    } catch (err: any) {
                      showToast(err.message || 'Failed to publish website', 'error');
                    } finally {
                      setIsPublishing(false);
                    }
                  }}
                  className="px-4 py-2 bg-[#3D4534] hover:bg-[#2C3226] text-white rounded text-xs font-semibold uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{isPublishing ? 'Publishing...' : 'Publish to Live Site'}</span>
                </button>
              </div>
            </div>

            {/* Customizer Sub-Nav Tabs */}
            <div className="flex border-b border-[#D5CDC0] gap-1 overflow-x-auto text-xs font-medium">
              {[
                { id: 'branding', label: 'Branding & Identity', icon: Sliders },
                { id: 'homepage', label: 'Hero & Messaging', icon: Sparkles },
                { id: 'sections', label: 'Sections & Ordering', icon: Layers },
                { id: 'layout', label: 'Layout & Typography', icon: Globe },
                { id: 'preview', label: 'Live Device Preview', icon: Monitor }
              ].map((sub) => {
                const Icon = sub.icon;
                const isCur = customizerSubTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setCustomizerSubTab(sub.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      isCur
                        ? 'border-[#3D4534] text-[#3D4534] font-semibold bg-white'
                        : 'border-transparent text-[#687062] hover:text-[#232624] hover:bg-[#EFECE4]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>

            {/* SUB-TAB 1: BRANDING & IDENTITY */}
            {customizerSubTab === 'branding' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-lg border border-[#DDD6C8] shadow-sm text-xs">
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-[#444C3E] mb-1">
                      Hotel Brand Name
                    </label>
                    <input
                      type="text"
                      value={customizerDraft.hotel_name || ''}
                      onChange={(e) => setCustomizerDraft({ ...customizerDraft, hotel_name: e.target.value })}
                      placeholder="Theroyalpalaceinn"
                      className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs font-serif font-bold text-sm text-[#232624] focus:outline-none focus:border-[#3D4534]"
                    />
                    <span className="text-[10px] text-[#788072] mt-0.5 block">
                      Appears in top navigation, browser title, and guest booking confirmation.
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#444C3E] mb-1">
                      Brand Tagline
                    </label>
                    <input
                      type="text"
                      value={customizerDraft.tagline || ''}
                      onChange={(e) => setCustomizerDraft({ ...customizerDraft, tagline: e.target.value })}
                      placeholder="An Intimate Heritage Sanctuary of Understated Luxury"
                      className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs text-[#232624] focus:outline-none focus:border-[#3D4534]"
                    />
                  </div>

                  {/* Hotel Logo & Emblem Customization */}
                  <div className="p-3.5 bg-[#FAF9F6] border border-[#DDD6C8] rounded-md space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block font-semibold text-[#444C3E]">
                        Hotel Logo &amp; Crest Customization
                      </label>
                      <span className="text-[10px] text-[#788072]">
                        PNG, SVG, or JPG
                      </span>
                    </div>

                    {/* Current Logo Preview & Status */}
                    {customizerDraft.logo_url ? (
                      <div className="flex items-center gap-3 p-2.5 bg-white border border-[#DDD6C8] rounded">
                        <div className="w-14 h-14 bg-[#232624] rounded flex items-center justify-center p-1 border border-[#3E4738] shrink-0">
                          <img
                            src={customizerDraft.logo_url}
                            alt="Hotel Logo"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-semibold text-[#232624] block truncate">
                            Active Custom Logo Image
                          </span>
                          <span className="text-[10px] text-[#788072] block truncate font-mono">
                            {customizerDraft.logo_url}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCustomizerDraft({ ...customizerDraft, logo_url: '' })}
                            className="mt-1 text-red-600 hover:text-red-800 text-[10px] font-semibold underline cursor-pointer"
                          >
                            Remove Logo &amp; Use Monogram
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 p-2 bg-[#EFECE4] rounded text-[11px] text-[#636C5D]">
                        <div className="w-8 h-8 rounded bg-[#3D4534] text-white flex items-center justify-center font-serif font-bold text-xs border border-[#4F5944] shrink-0">
                          {customizerDraft.monogram || 'RP'}
                        </div>
                        <span>Currently using text monogram initials <strong>{customizerDraft.monogram || 'RP'}</strong>. Upload a logo image below to replace it.</span>
                      </div>
                    )}

                    {/* Direct File Upload */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#444C3E] mb-1">
                        Upload Logo File from Device
                      </label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            showToast('Logo file size exceeds 5MB limit', 'error');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = async () => {
                            const dataUrl = reader.result as string;
                            try {
                              const res = await authFetch('/api/admin/upload', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  filename: `logo_${file.name}`,
                                  dataUrl,
                                  title: 'Hotel Brand Logo',
                                  category: 'branding',
                                  addToGallery: false
                                })
                              });
                              const d = await res.json();
                              if (!res.ok || !d.success) throw new Error(d.error || 'Failed to upload logo');

                              setCustomizerDraft({ ...customizerDraft, logo_url: d.url });
                              showToast('Logo uploaded and applied to draft!');
                            } catch (err: any) {
                              showToast(err.message || 'Upload failed', 'error');
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="w-full bg-white border border-[#DDD6C8] rounded px-2.5 py-1.5 text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:bg-[#3D4534] file:text-white file:cursor-pointer"
                      />
                    </div>

                    {/* Image URL Input */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#444C3E] mb-1">
                        Or Enter Logo Image URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://.../hotel-logo.png"
                        value={customizerDraft.logo_url || ''}
                        onChange={(e) => setCustomizerDraft({ ...customizerDraft, logo_url: e.target.value })}
                        className="w-full bg-white border border-[#DDD6C8] rounded px-2.5 py-1.5 text-xs font-mono text-[#232624]"
                      />
                    </div>

                    {/* Fallback Monogram */}
                    <div className="pt-2 border-t border-[#DDD6C8] flex items-center justify-between gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#444C3E]">
                          Fallback Monogram (1-3 letters)
                        </label>
                        <span className="text-[10px] text-[#788072]">
                          Used whenever image logo is absent
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={3}
                        value={customizerDraft.monogram || 'RP'}
                        onChange={(e) => setCustomizerDraft({ ...customizerDraft, monogram: e.target.value.toUpperCase() })}
                        className="w-16 bg-white border border-[#DDD6C8] rounded px-2 py-1 text-xs font-serif font-bold text-center text-[#232624]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#444C3E] mb-1">
                      Property Description &amp; Heritage Story
                    </label>
                    <textarea
                      rows={4}
                      value={customizerDraft.description || ''}
                      onChange={(e) => setCustomizerDraft({ ...customizerDraft, description: e.target.value })}
                      className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs text-[#232624] focus:outline-none focus:border-[#3D4534]"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-[#444C3E] mb-2">
                      Primary Theme Accent Color
                    </label>
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {[
                        { name: 'Royal Olive', hex: '#3D4534' },
                        { name: 'Imperial Gold', hex: '#D4AF37' },
                        { name: 'Heritage Charcoal', hex: '#232624' },
                        { name: 'Terracotta Earth', hex: '#8C5238' },
                        { name: 'Deep Forest', hex: '#1C3322' }
                      ].map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setCustomizerDraft({ ...customizerDraft, theme_primary_color: c.hex })}
                          className={`p-2 rounded border text-center transition-all ${
                            (customizerDraft.theme_primary_color || '#3D4534') === c.hex
                              ? 'border-black ring-2 ring-[#3D4534]/50 font-bold'
                              : 'border-[#DDD6C8] hover:border-[#888]'
                          }`}
                        >
                          <div className="w-full h-7 rounded mb-1 shadow-inner" style={{ backgroundColor: c.hex }} />
                          <span className="text-[9px] block text-[#444C3E] truncate">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-[#FAF9F6] border border-[#E6E0D5] rounded-md space-y-3">
                    <span className="font-semibold text-xs text-[#3D4534] block">Live Brand Preview Badge</span>
                    <div className="flex items-center gap-3 p-3 bg-[#272D23] text-white rounded">
                      {customizerDraft.logo_url ? (
                        <img
                          src={customizerDraft.logo_url}
                          alt="Logo Preview"
                          className="h-10 w-auto max-w-[120px] object-contain rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-[#3D4534] text-white flex items-center justify-center font-serif font-bold text-lg border border-[#4F5944]">
                          {customizerDraft.monogram || 'RP'}
                        </div>
                      )}
                      <div>
                        <div className="font-serif text-base font-bold tracking-wide">
                          {customizerDraft.hotel_name || 'Theroyalpalaceinn'}
                        </div>
                        <div className="text-[10px] text-[#A6AF9E] truncate">
                          {customizerDraft.tagline || 'Boutique Hotel'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: HERO & HOMEPAGE MESSAGING */}
            {customizerSubTab === 'homepage' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-lg border border-[#DDD6C8] shadow-sm text-xs">
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-[#444C3E] mb-1">
                      Hero Main Headline
                    </label>
                    <input
                      type="text"
                      value={customizerDraft.hero_headline || ''}
                      onChange={(e) => setCustomizerDraft({ ...customizerDraft, hero_headline: e.target.value })}
                      placeholder="Where Timeless Heritage Meets Quiet Luxury"
                      className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs font-serif text-sm text-[#232624] focus:outline-none focus:border-[#3D4534]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#444C3E] mb-1">
                      Hero Subheadline &amp; Intro Paragraph
                    </label>
                    <textarea
                      rows={3}
                      value={customizerDraft.hero_subheadline || ''}
                      onChange={(e) => setCustomizerDraft({ ...customizerDraft, hero_subheadline: e.target.value })}
                      className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs text-[#232624] focus:outline-none focus:border-[#3D4534]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#444C3E] mb-1">
                        Primary CTA Button Text
                      </label>
                      <input
                        type="text"
                        value={customizerDraft.hero_primary_cta || 'Book Your Stay'}
                        onChange={(e) => setCustomizerDraft({ ...customizerDraft, hero_primary_cta: e.target.value })}
                        className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#444C3E] mb-1">
                        Secondary CTA Button Text
                      </label>
                      <input
                        type="text"
                        value={customizerDraft.hero_secondary_cta || 'WhatsApp Reservations'}
                        onChange={(e) => setCustomizerDraft({ ...customizerDraft, hero_secondary_cta: e.target.value })}
                        className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#444C3E] mb-1">
                      Hero Background Image URL
                    </label>
                    <input
                      type="text"
                      value={customizerDraft.hero_image || ''}
                      onChange={(e) => setCustomizerDraft({ ...customizerDraft, hero_image: e.target.value })}
                      className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block font-semibold text-[#444C3E] mb-1">
                    Or Choose Hero Image from Uploaded Hotel Photos
                  </label>
                  <div className="grid grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-2 border border-[#E5DFD3] rounded bg-[#FAF9F6]">
                    {gallery.map((img) => (
                      <div
                        key={img.id}
                        onClick={() => setCustomizerDraft({ ...customizerDraft, hero_image: img.url })}
                        className={`aspect-[4/3] rounded overflow-hidden cursor-pointer border-2 transition-all relative ${
                          customizerDraft.hero_image === img.url
                            ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]'
                            : 'border-transparent hover:border-[#888]'
                        }`}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        {customizerDraft.hero_image === img.url && (
                          <div className="absolute inset-0 bg-[#3D4534]/40 flex items-center justify-center text-white">
                            <Check className="w-5 h-5 text-[#D4AF37]" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {customizerDraft.hero_image && (
                    <div className="aspect-video w-full rounded-md overflow-hidden relative border border-[#DDD6C8] shadow-sm">
                      <img src={customizerDraft.hero_image} alt="Hero Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 p-4 flex flex-col justify-end text-white">
                        <span className="font-serif text-lg font-bold leading-tight">{customizerDraft.hero_headline}</span>
                        <span className="text-[11px] text-white/80 line-clamp-1">{customizerDraft.hero_subheadline}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-TAB 3: SECTIONS & ORDERING */}
            {customizerSubTab === 'sections' && (
              <div className="bg-white p-6 rounded-lg border border-[#DDD6C8] shadow-sm text-xs space-y-4">
                <div>
                  <h3 className="font-serif text-base font-bold text-[#232624]">
                    Homepage Section Visibility &amp; Flow
                  </h3>
                  <p className="text-xs text-[#687062]">
                    Toggle individual sections on or off to tailor the customer journey.
                  </p>
                </div>

                <div className="space-y-2.5 max-w-2xl">
                  {[
                    { key: 'show_dates_search', title: 'Arrival & Departure Date Availability Bar', desc: 'Instant date selector widget on hero section' },
                    { key: 'show_suites_section', title: 'Suites & Room Categories (3 Categories)', desc: 'Displays Superior King Suite, Deluxe Double, and Luxury Quadruple' },
                    { key: 'show_amenities_section', title: 'Heritage Comforts & Facilities Grid', desc: 'Courtyard, Breakfast, Marble Baths, Fibre Wi-Fi' },
                    { key: 'show_gallery_section', title: 'Visual Hotel Photograph Gallery', desc: 'Curated photo showcase of guest rooms and architecture' },
                    { key: 'show_location_section', title: 'Our Location, Google Maps & Directions', desc: 'Interactive Google Map, directions link, and Civil Lines enclave details' },
                    { key: 'show_whatsapp_float', title: 'Floating Direct WhatsApp Action Button', desc: 'Sticky quick reservation button (+91 7700 869 635)' }
                  ].map((sec) => {
                    const isVisible = customizerDraft[sec.key] !== false;
                    return (
                      <div
                        key={sec.key}
                        className="flex items-center justify-between p-3.5 bg-[#FAF9F6] border border-[#E5DFD3] rounded-md"
                      >
                        <div>
                          <strong className="block text-xs text-[#232624]">{sec.title}</strong>
                          <span className="text-[11px] text-[#71786A]">{sec.desc}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCustomizerDraft({ ...customizerDraft, [sec.key]: !isVisible })}
                          className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
                            isVisible
                              ? 'bg-[#3D4534] text-white'
                              : 'bg-[#DDD6C8] text-[#666D5F]'
                          }`}
                        >
                          {isVisible ? 'Visible' : 'Hidden'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUB-TAB 4: LAYOUT & TYPOGRAPHY */}
            {customizerSubTab === 'layout' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-lg border border-[#DDD6C8] shadow-sm text-xs">
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-[#444C3E] mb-1">
                      Typography Preset
                    </label>
                    <select
                      value={customizerDraft.font_preset || 'playfair'}
                      onChange={(e) => setCustomizerDraft({ ...customizerDraft, font_preset: e.target.value })}
                      className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                    >
                      <option value="playfair">Playfair Display &amp; Sans (Classic Heritage)</option>
                      <option value="cormorant">Cormorant Garamond &amp; Inter (Quiet Royal)</option>
                      <option value="cinzel">Cinzel &amp; Montserrat (Palatial Majestic)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#444C3E] mb-1">
                      Button Corners Style
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'square', label: 'Classic Sharp (0px)' },
                        { id: 'subtle', label: 'Refined (4px)' },
                        { id: 'pill', label: 'Soft Pill (9999px)' }
                      ].map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setCustomizerDraft({ ...customizerDraft, button_radius: b.id })}
                          className={`p-2.5 border rounded text-center transition-all ${
                            (customizerDraft.button_radius || 'subtle') === b.id
                              ? 'border-[#3D4534] bg-[#3D4534]/10 font-bold text-[#3D4534]'
                              : 'border-[#DDD6C8] text-[#555E50]'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-[#444C3E] mb-1">
                      Website Announcement Header Bar
                    </label>
                    <input
                      type="text"
                      value={customizerDraft.announcement_bar || 'Intimate 6-Room Boutique Sanctuary'}
                      onChange={(e) => setCustomizerDraft({ ...customizerDraft, announcement_bar: e.target.value })}
                      className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#444C3E] mb-1">
                      Footer Copyright Text
                    </label>
                    <input
                      type="text"
                      value={customizerDraft.footer_text || 'Understated luxury, heritage tranquility, and bespoke Indian hospitality.'}
                      onChange={(e) => setCustomizerDraft({ ...customizerDraft, footer_text: e.target.value })}
                      className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 5: LIVE VIEWPORT PREVIEW */}
            {customizerSubTab === 'preview' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-[#DDD6C8]">
                  <span className="text-xs font-semibold text-[#3D4534]">
                    Interactive Device Viewport
                  </span>
                  <div className="flex items-center gap-1 bg-[#FAF9F6] p-1 rounded border border-[#DDD6C8]">
                    <button
                      type="button"
                      onClick={() => setCustomizerDevice('desktop')}
                      className={`px-3 py-1.5 rounded text-xs flex items-center gap-1.5 ${
                        customizerDevice === 'desktop' ? 'bg-[#3D4534] text-white font-semibold' : 'text-[#687062]'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Desktop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomizerDevice('tablet')}
                      className={`px-3 py-1.5 rounded text-xs flex items-center gap-1.5 ${
                        customizerDevice === 'tablet' ? 'bg-[#3D4534] text-white font-semibold' : 'text-[#687062]'
                      }`}
                    >
                      <Tablet className="w-3.5 h-3.5" />
                      <span>Tablet (768px)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomizerDevice('mobile')}
                      className={`px-3 py-1.5 rounded text-xs flex items-center gap-1.5 ${
                        customizerDevice === 'mobile' ? 'bg-[#3D4534] text-white font-semibold' : 'text-[#687062]'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Mobile (375px)</span>
                    </button>
                  </div>
                </div>

                {/* Scaled Preview Frame */}
                <div className="flex justify-center bg-[#232624]/20 p-4 rounded-lg overflow-x-auto">
                  <div
                    className={`bg-[#FBF9F5] border border-[#DDD6C8] rounded shadow-2xl transition-all duration-300 overflow-hidden ${
                      customizerDevice === 'desktop'
                        ? 'w-full max-w-5xl'
                        : customizerDevice === 'tablet'
                        ? 'w-[768px]'
                        : 'w-[375px]'
                    }`}
                  >
                    {/* Simulated Header */}
                    <div className="bg-[#2D3328] text-white p-2.5 px-4 text-xs flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {customizerDraft.logo_url ? (
                          <img
                            src={customizerDraft.logo_url}
                            alt=""
                            className="h-6 w-auto max-w-[80px] object-contain rounded"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded bg-[#3D4534] flex items-center justify-center font-serif font-bold text-[11px] border border-[#4F5944]">
                            {customizerDraft.monogram || 'RP'}
                          </div>
                        )}
                        <span className="font-serif font-bold">{customizerDraft.hotel_name || 'Theroyalpalaceinn'}</span>
                      </div>
                      <span className="text-[10px] text-[#A6AF9E]">Direct WhatsApp: +91 7700 869 635</span>
                    </div>

                    {/* Simulated Hero */}
                    <div className="relative min-h-[260px] bg-black flex items-center justify-center text-center p-6 text-white overflow-hidden">
                      {customizerDraft.hero_image && (
                        <img
                          src={customizerDraft.hero_image}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover opacity-60"
                        />
                      )}
                      <div className="relative z-10 max-w-lg space-y-2">
                        <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                          {customizerDraft.announcement_bar || 'Intimate 6-Room Boutique Sanctuary'}
                        </span>
                        <h2 className="font-serif text-2xl font-bold leading-tight">
                          {customizerDraft.hero_headline || 'Where Timeless Heritage Meets Quiet Luxury'}
                        </h2>
                        <p className="text-xs text-white/80 line-clamp-2">
                          {customizerDraft.hero_subheadline || 'An intimate 6-room sanctuary in Rajasthan.'}
                        </p>
                        <div className="pt-2 flex justify-center gap-2">
                          <span className="bg-[#3D4534] text-white text-[11px] px-3.5 py-1.5 rounded font-semibold uppercase">
                            {customizerDraft.hero_primary_cta || 'Book Your Stay'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Simulated Room Cards Grid */}
                    <div className="p-4 sm:p-6 bg-[#FAF9F6]">
                      <div className="text-center mb-4">
                        <span className="text-[10px] uppercase font-bold text-[#3D4534] tracking-widest">Accommodations</span>
                        <h3 className="font-serif text-lg font-bold text-[#232624]">3 Curated Suite Categories</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {categories.map((c) => (
                          <div key={c.id} className="bg-white rounded border border-[#DDD6C8] overflow-hidden p-2.5">
                            <div className="aspect-[4/3] bg-black rounded overflow-hidden mb-2">
                              <img src={c.primary_image} alt="" className="w-full h-full object-cover" />
                            </div>
                            <h4 className="font-serif font-bold text-xs text-[#232624]">{c.name}</h4>
                            <span className="text-xs font-bold text-[#3D4534] block mt-0.5">₹{c.base_price?.toLocaleString('en-IN')} / night</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: BOOKINGS & ENQUIRIES                          */}
        {/* ==================================================== */}
        {activeTab === 'bookings' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-normal text-[#232624]">
                  Reservations &amp; Booking Enquiries
                </h2>
                <p className="text-xs text-[#687062]">
                  Review, assign physical rooms, confirm enquiries, and manage check-ins.
                </p>
              </div>

              <div className="flex gap-2">
                <a
                  href="/api/admin/export/bookings.csv"
                  download
                  className="border border-[#C8C0B2] bg-white hover:bg-[#EFECE4] text-[#3D4534] px-3 py-2 rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </a>

                <button
                  onClick={() => setNewBookingModalOpen(true)}
                  className="bg-[#3D4534] hover:bg-[#2C3226] text-white px-3 py-2 rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Booking</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-3.5 rounded border border-[#DDD6C8] flex flex-wrap items-center gap-3 text-xs">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-3.5 h-3.5 text-[#788072] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by Guest Name, Phone, Reference..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded pl-8 pr-3 py-1.5 text-xs text-[#232624]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#687062]">Status:</span>
                <select
                  value={bookingFilterStatus}
                  onChange={(e) => setBookingFilterStatus(e.target.value)}
                  className="bg-[#FAF9F6] border border-[#DDD6C8] rounded px-2.5 py-1.5 text-xs text-[#232624]"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Enquiry</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checked_in">Checked In</option>
                  <option value="checked_out">Checked Out</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded border border-[#DDD6C8] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#3D4238]">
                  <thead className="bg-[#EFECE4] text-[#444C3E] uppercase text-[10px] tracking-wider font-semibold border-b border-[#DDD6C8]">
                    <tr>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Guest Details</th>
                      <th className="py-3 px-4">Suite Category</th>
                      <th className="py-3 px-4">Assigned Room</th>
                      <th className="py-3 px-4">Dates</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECE7DC]">
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-[#788072]">
                          No booking records match the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-[#FAF9F6] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#232624]">
                            {b.reference}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-[#232624] block">{b.guest_name}</span>
                            <span className="text-[11px] text-[#6A7264]">{b.guest_phone}</span>
                          </td>
                          <td className="py-3 px-4">
                            {b.category_name}
                          </td>
                          <td className="py-3 px-4">
                            {b.assigned_room_number ? (
                              <span className="font-mono bg-[#EAE5D9] px-2 py-0.5 rounded font-semibold text-[#2D3328]">
                                Room {b.assigned_room_number}
                              </span>
                            ) : (
                              <span className="text-amber-700 text-[11px] italic">Not Assigned</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="block">{b.check_in_date} &rarr; {b.check_out_date}</span>
                            <span className="text-[10px] text-[#788072]">{b.nights} {b.nights === 1 ? 'night' : 'nights'} &bull; {b.adults}A {b.children > 0 ? `${b.children}C` : ''}</span>
                          </td>
                          <td className="py-3 px-4 font-serif font-bold text-sm text-[#232624]">
                            ₹{b.total_amount?.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                b.status === 'confirmed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.status === 'checked_in'
                                  ? 'bg-blue-100 text-blue-800'
                                  : b.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[11px] font-medium capitalize ${
                                b.payment_status === 'paid' ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {b.payment_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedBooking(b)}
                              className="text-[#3D4534] hover:text-black font-semibold text-xs underline"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: PHYSICAL ROOMS (STRICTLY 6 ROOMS)             */}
        {/* ==================================================== */}
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-normal text-[#232624]">
                  Physical Rooms Inventory (6 Rooms)
                </h2>
                <p className="text-xs text-[#687062]">
                  The Royal Palace Inn has precisely 6 physical rooms. You can reassign categories, set maintenance statuses, and inspect live assignments.
                </p>
              </div>

              <button
                onClick={() => setNewBlockModalOpen(true)}
                className="bg-[#3D4534] hover:bg-[#2C3226] text-white px-3.5 py-2 rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule Maintenance Block</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white border border-[#DDD6C8] rounded-md p-5 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-mono text-xs text-[#788072] uppercase font-semibold">
                          Room #{room.room_number} &bull; {room.floor}
                        </span>
                        <h3 className="font-serif text-xl font-bold text-[#232624] mt-0.5">
                          {room.name}
                        </h3>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded font-semibold capitalize ${
                          room.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {room.status}
                      </span>
                    </div>

                    <div className="my-3 py-3 border-t border-b border-[#ECE7DC] text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-[#6A7264]">Assigned Category:</span>
                        <span className="font-semibold text-[#232624]">{room.category_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6A7264]">Nightly Base Rate:</span>
                        <span className="font-medium text-[#232624]">₹{room.category_price?.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6A7264]">Current Occupant:</span>
                        <span className="font-medium text-blue-700">
                          {room.current_occupant || 'None (Vacant)'}
                        </span>
                      </div>
                    </div>

                    {room.maintenance_notes && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded mb-3">
                        Note: {room.maintenance_notes}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setEditRoomModal(room)}
                    className="w-full mt-2 border border-[#C8C0B2] hover:bg-[#EFECE4] text-[#3D4534] py-2 rounded text-xs font-semibold uppercase tracking-wider transition-colors"
                  >
                    Edit Room Configuration
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: ROOM CATEGORIES & RATES                       */}
        {/* ==================================================== */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-normal text-[#232624]">
                Room Categories &amp; Pricing Management
              </h2>
              <p className="text-xs text-[#687062]">
                Configure rates, guest capacity, descriptions, amenities, and photographs for the 3 categories.
              </p>
            </div>

            <div className="space-y-5">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white border border-[#DDD6C8] rounded-md p-6 shadow-sm flex flex-col lg:flex-row gap-6 items-start"
                >
                  <div className="w-full lg:w-48 aspect-[4/3] rounded overflow-hidden bg-black shrink-0">
                    <img src={cat.primary_image} alt="" className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <h3 className="font-serif text-2xl font-bold text-[#232624]">
                          {cat.name}
                        </h3>
                        <span className="text-xs text-[#6E7567]">
                          {cat.bed_type} &bull; {cat.room_size} &bull; Max {cat.max_occupancy} Guests
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-[#788072] block uppercase font-semibold">Nightly Rate</span>
                        <span className="font-serif text-2xl font-bold text-[#3D4534]">
                          ₹{cat.base_price.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#555C4E] leading-relaxed">
                      {cat.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {cat.amenities.map((a, i) => (
                        <span key={i} className="text-[10px] bg-[#EFECE4] text-[#444C3E] px-2 py-0.5 rounded">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="w-full lg:w-auto shrink-0 self-end lg:self-center">
                    <button
                      onClick={() => setEditCategoryModal(cat)}
                      className="w-full lg:w-auto bg-[#3D4534] hover:bg-[#2C3226] text-white px-4 py-2.5 rounded text-xs font-semibold uppercase tracking-wider"
                    >
                      Edit Rate &amp; Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: OCCUPANCY CALENDAR MATRIX                     */}
        {/* ==================================================== */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-normal text-[#232624]">
                  Room Occupancy Matrix
                </h2>
                <p className="text-xs text-[#687062]">
                  Visual day-by-day availability across all 6 physical rooms.
                </p>
              </div>

              {/* Month Navigator */}
              <div className="flex items-center gap-2 bg-white border border-[#DDD6C8] rounded px-3 py-1.5 text-xs">
                <button
                  onClick={() => {
                    const [y, m] = calendarMonth.split('-').map(Number);
                    const prev = new Date(y, m - 2, 1);
                    setCalendarMonth(prev.toISOString().substring(0, 7));
                  }}
                  className="p-1 hover:text-[#3D4534]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-serif text-sm font-semibold min-w-[120px] text-center">
                  {new Date(calendarMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => {
                    const [y, m] = calendarMonth.split('-').map(Number);
                    const next = new Date(y, m, 1);
                    setCalendarMonth(next.toISOString().substring(0, 7));
                  }}
                  className="p-1 hover:text-[#3D4534]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid Container */}
            {calendarData && (
              <div className="bg-white border border-[#DDD6C8] rounded-md p-4 overflow-x-auto shadow-sm">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 border border-[#E3DCcf] text-xs font-semibold bg-[#EFECE4] text-left w-36">
                        Room
                      </th>
                      {Array.from({ length: calendarData.daysInMonth }).map((_, i) => (
                        <th
                          key={i}
                          className="p-1 border border-[#E3DCcf] text-[10px] font-mono bg-[#FAF9F6] min-w-[28px]"
                        >
                          {i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calendarData.rooms.map((room: any) => (
                      <tr key={room.id}>
                        <td className="p-2 border border-[#E3DCcf] text-left text-xs font-medium bg-[#FBF9F5]">
                          <span className="font-bold font-mono">Room {room.room_number}</span>
                          <span className="block text-[10px] text-[#71786A] truncate">{room.name}</span>
                        </td>
                        {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
                          const dayStr = `${calendarMonth}-${String(i + 1).padStart(2, '0')}`;

                          // Find booking for this room on this date
                          const booking = calendarData.bookings.find(
                            (b: any) =>
                              b.physical_room_id === room.id &&
                              b.check_in_date <= dayStr &&
                              b.check_out_date > dayStr
                          );

                          // Find block
                          const block = calendarData.blocks.find(
                            (bl: any) =>
                              bl.physical_room_id === room.id &&
                              bl.start_date <= dayStr &&
                              bl.end_date >= dayStr
                          );

                          if (block) {
                            return (
                              <td
                                key={i}
                                className="p-1 border border-[#E3DCcf] bg-amber-200 text-amber-900 text-[9px] font-medium"
                                title={`Blocked: ${block.reason}`}
                              >
                                M
                              </td>
                            );
                          }

                          if (booking) {
                            return (
                              <td
                                key={i}
                                className="p-1 border border-[#E3DCcf] bg-[#3D4534] text-white text-[9px] font-medium cursor-pointer"
                                title={`${booking.guest_name} (${booking.reference})`}
                              >
                                &bull;
                              </td>
                            );
                          }

                          return (
                            <td key={i} className="p-1 border border-[#E3DCcf] bg-white hover:bg-emerald-50">
                              <span className="text-emerald-500 text-[9px]">&middot;</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Legend */}
                <div className="mt-4 flex items-center gap-6 text-xs text-[#6A7264]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-white border border-[#DDD6C8] inline-block" />
                    Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-[#3D4534] inline-block" />
                    Booked Guest
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-amber-200 inline-block" />
                    Maintenance Block
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 6: SETTINGS & HOTEL PROFILE                      */}
        {/* ==================================================== */}
        {activeTab === 'settings' && settings && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-normal text-[#232624]">
                Hotel Profile &amp; Website Customization
              </h2>
              <p className="text-xs text-[#687062]">
                Changes saved here update immediately across the public website and reservation emails.
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await authFetch('/api/admin/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(settings)
                  });
                  const d = await res.json();
                  if (d.success) {
                    showToast('Hotel settings saved successfully!');
                    notifyChange();
                  }
                } catch (err: any) {
                  showToast(err.message, 'error');
                }
              }}
              className="bg-white border border-[#DDD6C8] rounded-md p-6 shadow-sm space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#444C3E] mb-1">Hotel Name</label>
                  <input
                    type="text"
                    value={settings.hotel_name || ''}
                    onChange={(e) => setSettings({ ...settings, hotel_name: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#444C3E] mb-1">Tagline</label>
                  <input
                    type="text"
                    value={settings.tagline || ''}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#444C3E] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={settings.phone || ''}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#444C3E] mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={settings.email || ''}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#444C3E] mb-1">Check-in Time</label>
                  <input
                    type="text"
                    value={settings.check_in_time || ''}
                    onChange={(e) => setSettings({ ...settings, check_in_time: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#444C3E] mb-1">Check-out Time</label>
                  <input
                    type="text"
                    value={settings.check_out_time || ''}
                    onChange={(e) => setSettings({ ...settings, check_out_time: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#444C3E] mb-1">GST Tax Rate (%)</label>
                  <input
                    type="number"
                    value={settings.tax_rate || 12}
                    onChange={(e) => setSettings({ ...settings, tax_rate: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Dedicated Google Maps & Location Management Card */}
              <div className="bg-[#FAF8F3] border border-[#DDD6C8] rounded-md p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#ECE7DC]">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#3D4534]" />
                    <div>
                      <h3 className="font-serif text-base font-semibold text-[#232624]">
                        Google Maps &amp; Hotel Location Management
                      </h3>
                      <p className="text-[11px] text-[#71786A]">
                        Control the public &ldquo;Find Us&rdquo; section, interactive Google Map marker, and dynamic directions.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-[#EFECE4] text-[#4A5340] px-2.5 py-1 rounded font-medium">
                    Auto-synced with Public Website
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Location Section Heading */}
                  <div>
                    <label className="block text-xs font-semibold text-[#444C3E] mb-1">
                      Location Section Heading
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Our Location & Directions"
                      value={settings.location_heading || ''}
                      onChange={(e) => setSettings({ ...settings, location_heading: e.target.value })}
                      className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                    />
                  </div>

                  {/* Complete Hotel Address */}
                  <div>
                    <label className="block text-xs font-semibold text-[#444C3E] mb-1">
                      Complete Street Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 14, Heritage Palace Enclave, Civil Lines"
                      value={settings.address || ''}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                {/* Section Description */}
                <div>
                  <label className="block text-xs font-semibold text-[#444C3E] mb-1">
                    Location Section Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of the hotel's neighborhood, surroundings, and accessibility."
                    value={settings.location_description || ''}
                    onChange={(e) => setSettings({ ...settings, location_description: e.target.value })}
                    className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                  />
                </div>

                {/* City, State, Postal Code, Country */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#444C3E] mb-1">City</label>
                    <input
                      type="text"
                      value={settings.city || ''}
                      onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                      className="w-full bg-white border border-[#DDD6C8] rounded px-2.5 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#444C3E] mb-1">State</label>
                    <input
                      type="text"
                      value={settings.state || ''}
                      onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                      className="w-full bg-white border border-[#DDD6C8] rounded px-2.5 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#444C3E] mb-1">Postal Code (Pincode)</label>
                    <input
                      type="text"
                      value={settings.pincode || ''}
                      onChange={(e) => setSettings({ ...settings, pincode: e.target.value })}
                      className="w-full bg-white border border-[#DDD6C8] rounded px-2.5 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#444C3E] mb-1">Country</label>
                    <input
                      type="text"
                      value={settings.country || 'India'}
                      onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                      className="w-full bg-white border border-[#DDD6C8] rounded px-2.5 py-2 text-xs"
                    />
                  </div>
                </div>

                {/* GPS Coordinates: Latitude and Longitude */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-[#444C3E] mb-1">
                      Latitude (e.g. 26.905953)
                    </label>
                    <input
                      type="text"
                      placeholder="26.905953"
                      value={settings.latitude || ''}
                      onChange={(e) => setSettings({ ...settings, latitude: e.target.value })}
                      className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs font-mono"
                    />
                    <span className="text-[10px] text-[#788072] mt-0.5 block">
                      Right-click on your hotel on Google Maps and select coordinates to copy.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#444C3E] mb-1">
                      Longitude (e.g. 75.776652)
                    </label>
                    <input
                      type="text"
                      placeholder="75.776652"
                      value={settings.longitude || ''}
                      onChange={(e) => setSettings({ ...settings, longitude: e.target.value })}
                      className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs font-mono"
                    />
                    <span className="text-[10px] text-[#788072] mt-0.5 block">
                      Coordinates position the interactive marker pin on the map.
                    </span>
                  </div>
                </div>

                {/* Google Maps URL & Embed URL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-[#444C3E] mb-1">
                      Google Maps URL (&ldquo;Open in Google Maps&rdquo; link)
                    </label>
                    <input
                      type="text"
                      placeholder="https://maps.google.com/?q=..."
                      value={settings.google_maps_url || ''}
                      onChange={(e) => setSettings({ ...settings, google_maps_url: e.target.value })}
                      className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#444C3E] mb-1">
                      Google Maps Embed URL (Fallback iframe)
                    </label>
                    <input
                      type="text"
                      placeholder="https://www.google.com/maps/embed?pb=..."
                      value={settings.google_maps_embed_url || ''}
                      onChange={(e) => setSettings({ ...settings, google_maps_embed_url: e.target.value })}
                      className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Dynamic Links Test Strip */}
                <div className="p-3 bg-[#EFECE4] rounded border border-[#E5DFD1] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-[#3D4534]" />
                    <span className="text-[#3D4534] font-medium">Dynamic Directions Preview:</span>
                    <span className="text-[#687062] font-mono text-[11px]">
                      {settings.latitude && settings.longitude
                        ? `${settings.latitude}, ${settings.longitude}`
                        : `${settings.address || ''}, ${settings.city || ''}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        settings.latitude && settings.longitude
                          ? `${settings.latitude},${settings.longitude}`
                          : [settings.address, settings.city, settings.state, settings.pincode].filter(Boolean).join(', ')
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3D4534] hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Test Directions Link
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444C3E] mb-1">Homepage Hero Headline</label>
                <input
                  type="text"
                  value={settings.hero_headline || ''}
                  onChange={(e) => setSettings({ ...settings, hero_headline: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444C3E] mb-1">Hero Subheadline</label>
                <textarea
                  rows={2}
                  value={settings.hero_subheadline || ''}
                  onChange={(e) => setSettings({ ...settings, hero_subheadline: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444C3E] mb-1">Hero Banner Image URL</label>
                <input
                  type="text"
                  value={settings.hero_image || ''}
                  onChange={(e) => setSettings({ ...settings, hero_image: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444C3E] mb-1">Cancellation Policy</label>
                <textarea
                  rows={3}
                  value={settings.cancellation_policy || ''}
                  onChange={(e) => setSettings({ ...settings, cancellation_policy: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444C3E] mb-1">House Rules &amp; Photo ID Policy</label>
                <textarea
                  rows={3}
                  value={settings.house_rules || ''}
                  onChange={(e) => setSettings({ ...settings, house_rules: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-4 border-t border-[#ECE7DC]">
                <button
                  type="submit"
                  className="bg-[#3D4534] hover:bg-[#2C3226] text-white px-6 py-2.5 rounded text-xs font-semibold uppercase tracking-wider shadow-sm"
                >
                  Save Hotel Settings
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 7: WHATSAPP & PAYMENTS CONFIGURATION             */}
        {/* ==================================================== */}
        {activeTab === 'whatsapp' && settings && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-normal text-[#232624]">
                WhatsApp &amp; Payment Gateway Settings
              </h2>
              <p className="text-xs text-[#687062]">
                Configure WhatsApp booking enquiry template and supported payment channels.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* WhatsApp Config Card */}
              <div className="bg-white border border-[#DDD6C8] rounded-md p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 font-serif text-lg font-bold text-[#232624]">
                  <MessageSquare className="w-5 h-5 text-[#25D366]" />
                  <span>WhatsApp Integration Settings</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#444C3E] mb-1">
                    Destination WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={settings.whatsapp_settings?.phone || '917700869635'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        whatsapp_settings: { ...settings.whatsapp_settings, phone: e.target.value }
                      })
                    }
                    className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs font-mono"
                  />
                  <span className="text-[10px] text-[#788072] mt-0.5 block">
                    (Standard international format without plus symbol, e.g. <code>917700869635</code>)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#444C3E] mb-1">
                    Integration Mode
                  </label>
                  <select
                    value={settings.whatsapp_settings?.mode || 'mode_a'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        whatsapp_settings: { ...settings.whatsapp_settings, mode: e.target.value }
                      })
                    }
                    className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                  >
                    <option value="mode_a">Mode A: WhatsApp Click-to-Chat (wa.me link - No API credentials needed)</option>
                    <option value="mode_b">Mode B: Official Meta WhatsApp Business Cloud API</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#444C3E] mb-1">
                    Message Template (Variables: {`{guest_name}, {guest_phone}, {room_category}, {num_rooms}, {check_in}, {check_out}, {nights}, {adults}, {rate_per_night}, {estimated_total}, {booking_reference}`})
                  </label>
                  <textarea
                    rows={8}
                    value={settings.whatsapp_settings?.template || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        whatsapp_settings: { ...settings.whatsapp_settings, template: e.target.value }
                      })
                    }
                    className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded p-3 text-xs font-mono text-[#2B3026] leading-relaxed"
                  />
                </div>

                <button
                  onClick={async () => {
                    const res = await authFetch('/api/admin/settings', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(settings)
                    });
                    const d = await res.json();
                    if (d.success) {
                      showToast('WhatsApp settings saved!');
                      notifyChange();
                    }
                  }}
                  className="bg-[#25D366] hover:bg-[#1EBE5D] text-white px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider"
                >
                  Save WhatsApp Settings
                </button>
              </div>

              {/* Payments Config Card */}
              <div className="bg-white border border-[#DDD6C8] rounded-md p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 font-serif text-lg font-bold text-[#232624]">
                  <DollarSign className="w-5 h-5 text-[#3D4534]" />
                  <span>Payment Channels &amp; Instructions</span>
                </div>

                {/* Pay at hotel */}
                <div className="p-3 bg-[#FAF9F6] rounded border border-[#ECE7DC]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-[#232624]">1. Pay Upon Arrival</span>
                    <input
                      type="checkbox"
                      checked={settings.payment_methods?.pay_at_hotel?.enabled ?? true}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          payment_methods: {
                            ...settings.payment_methods,
                            pay_at_hotel: { ...settings.payment_methods?.pay_at_hotel, enabled: e.target.checked }
                          }
                        })
                      }
                      className="rounded text-[#3D4534]"
                    />
                  </div>
                  <input
                    type="text"
                    value={settings.payment_methods?.pay_at_hotel?.instructions || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment_methods: {
                          ...settings.payment_methods,
                          pay_at_hotel: { ...settings.payment_methods?.pay_at_hotel, instructions: e.target.value }
                        }
                      })
                    }
                    className="w-full bg-white border border-[#DDD6C8] rounded px-2.5 py-1.5 text-xs"
                  />
                </div>

                {/* UPI QR instructions */}
                <div className="p-3 bg-[#FAF9F6] rounded border border-[#ECE7DC] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#232624]">2. Instant UPI Transfer</span>
                    <input
                      type="checkbox"
                      checked={settings.payment_methods?.upi?.enabled ?? true}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          payment_methods: {
                            ...settings.payment_methods,
                            upi: { ...settings.payment_methods?.upi, enabled: e.target.checked }
                          }
                        })
                      }
                      className="rounded text-[#3D4534]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#71786A] block uppercase font-medium">Hotel UPI VPA / ID</label>
                    <input
                      type="text"
                      value={settings.payment_methods?.upi?.vpa || 'royalpalaceinn@okhdfcbank'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          payment_methods: {
                            ...settings.payment_methods,
                            upi: { ...settings.payment_methods?.upi, vpa: e.target.value }
                          }
                        })
                      }
                      className="w-full bg-white border border-[#DDD6C8] rounded px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#71786A] block uppercase font-medium">Guest Instructions</label>
                    <input
                      type="text"
                      value={settings.payment_methods?.upi?.instructions || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          payment_methods: {
                            ...settings.payment_methods,
                            upi: { ...settings.payment_methods?.upi, instructions: e.target.value }
                          }
                        })
                      }
                      className="w-full bg-white border border-[#DDD6C8] rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>

                {/* Online Payment Gateway */}
                <div className="p-3 bg-[#FAF9F6] rounded border border-[#ECE7DC] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#232624]">3. Online Payment Gateway (Razorpay/Stripe)</span>
                    <input
                      type="checkbox"
                      checked={settings.payment_methods?.online_gateway?.enabled ?? false}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          payment_methods: {
                            ...settings.payment_methods,
                            online_gateway: { ...settings.payment_methods?.online_gateway, enabled: e.target.checked }
                          }
                        })
                      }
                      className="rounded text-[#3D4534]"
                    />
                  </div>
                  <p className="text-[11px] text-[#788072]">
                    Online payment collection requires verified merchant API keys. Keep disabled until configured.
                  </p>
                </div>

                <button
                  onClick={async () => {
                    const res = await authFetch('/api/admin/settings', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(settings)
                    });
                    const d = await res.json();
                    if (d.success) {
                      showToast('Payment settings saved!');
                      notifyChange();
                    }
                  }}
                  className="bg-[#3D4534] hover:bg-[#2C3226] text-white px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider"
                >
                  Save Payment Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 8: GALLERY MANAGEMENT                            */}
        {/* ==================================================== */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-normal text-[#232624]">
                  Media &amp; Photograph Library
                </h2>
                <p className="text-xs text-[#687062]">
                  Upload hotel photographs, set hero presentation banners, and assign gallery photos to room categories.
                </p>
              </div>

              <button
                onClick={() => setNewPhotoModalOpen(true)}
                className="bg-[#3D4534] hover:bg-[#2C3226] text-white px-3.5 py-2 rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Photograph</span>
              </button>
            </div>

            {/* Quick Upload Box */}
            <div className="bg-white border border-[#DDD6C8] rounded-lg p-5 shadow-sm">
              <span className="font-serif text-sm font-bold text-[#232624] block mb-1">
                Direct File Upload to Hotel Server
              </span>
              <p className="text-xs text-[#687062] mb-3">
                Upload room photographs directly from your computer. Stored persistently on server disk.
              </p>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const fileInput = form.elements.namedItem('fileUpload') as HTMLInputElement;
                  const titleInput = form.elements.namedItem('uploadTitle') as HTMLInputElement;
                  const categorySelect = form.elements.namedItem('uploadCategory') as HTMLSelectElement;
                  const captionInput = form.elements.namedItem('uploadCaption') as HTMLInputElement;

                  if (!fileInput.files || fileInput.files.length === 0) {
                    showToast('Please select an image file to upload', 'error');
                    return;
                  }

                  const file = fileInput.files[0];
                  if (file.size > 10 * 1024 * 1024) {
                    showToast('File exceeds 10MB limit', 'error');
                    return;
                  }

                  const reader = new FileReader();
                  reader.onload = async () => {
                    const dataUrl = reader.result as string;
                    try {
                      const res = await authFetch('/api/admin/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          filename: file.name,
                          dataUrl,
                          title: titleInput.value || file.name.replace(/\.[^/.]+$/, ''),
                          category: categorySelect.value || 'rooms',
                          caption: captionInput.value || '',
                          addToGallery: true
                        })
                      });
                      const d = await res.json();
                      if (!res.ok || !d.success) throw new Error(d.error || 'Failed to upload photo');

                      showToast('Photo uploaded and added to gallery!');
                      notifyChange();
                      form.reset();
                      loadData();
                    } catch (err: any) {
                      showToast(err.message || 'Upload failed', 'error');
                    }
                  };
                  reader.readAsDataURL(file);
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end text-xs"
              >
                <div>
                  <label className="block font-semibold text-[#444C3E] mb-1">Select File</label>
                  <input
                    type="file"
                    name="fileUpload"
                    accept="image/*"
                    required
                    className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-2.5 py-1.5 text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:bg-[#3D4534] file:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#444C3E] mb-1">Title</label>
                  <input
                    type="text"
                    name="uploadTitle"
                    placeholder="e.g. Superior King Bedroom"
                    className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#444C3E] mb-1">Category</label>
                  <select name="uploadCategory" className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs">
                    <option value="rooms">Suites &amp; Rooms</option>
                    <option value="courtyard">Courtyard &amp; Gardens</option>
                    <option value="dining">Dining Veranda</option>
                    <option value="exterior">Architecture &amp; Facade</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#444C3E] mb-1">Alt Text / Caption</label>
                  <input
                    type="text"
                    name="uploadCaption"
                    placeholder="e.g. Handcrafted wooden bed with linen"
                    className="w-full bg-[#FAF9F6] border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full bg-[#3D4534] hover:bg-[#2C3226] text-white py-2 rounded text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload to Server</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {gallery.map((img) => (
                <div key={img.id} className="bg-white border border-[#DDD6C8] rounded-lg overflow-hidden shadow-sm flex flex-col">
                  <div className="aspect-[4/3] bg-black overflow-hidden relative">
                    <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded uppercase font-medium">
                      {img.category}
                    </span>
                    {settings?.hero_image === img.url && (
                      <span className="absolute top-2 right-2 bg-[#D4AF37] text-[#232624] text-[10px] px-2 py-0.5 rounded font-bold uppercase shadow">
                        Current Hero
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between text-xs space-y-3">
                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#232624]">{img.title}</h4>
                      {img.caption && <p className="text-[11px] text-[#71786A] mt-0.5 line-clamp-1">{img.caption}</p>}
                      <div className="mt-1 text-[10px] text-[#889082] font-mono truncate">{img.url}</div>
                    </div>

                    <div className="pt-2 border-t border-[#ECE7DC] space-y-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const updatedSettings = { ...settings, hero_image: img.url };
                              const res = await authFetch('/api/admin/settings', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(updatedSettings)
                              });
                              const d = await res.json();
                              if (d.success) {
                                setSettings(updatedSettings);
                                showToast('Set as website hero image!');
                                notifyChange();
                              }
                            } catch (e: any) {
                              showToast(e.message, 'error');
                            }
                          }}
                          className="flex-1 px-2.5 py-1.5 rounded bg-[#FAF9F6] border border-[#DDD6C8] hover:bg-[#3D4534] hover:text-white text-[#444C3E] text-[11px] font-semibold transition-colors text-center"
                        >
                          Set as Hero Image
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(img.url);
                            showToast('Photo URL copied to clipboard');
                          }}
                          className="px-2 py-1.5 rounded bg-[#FAF9F6] border border-[#DDD6C8] hover:bg-[#EFECE4] text-[#444C3E] text-[11px]"
                          title="Copy Image URL"
                        >
                          Copy URL
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#788072]">Assign to Suite:</span>
                        <select
                          onChange={async (e) => {
                            const catId = e.target.value;
                            if (!catId) return;
                            const targetCat = categories.find((c) => c.id === catId);
                            if (!targetCat) return;
                            try {
                              const updatedCat = { ...targetCat, primary_image: img.url };
                              await authFetch(`/api/admin/categories/${catId}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(updatedCat)
                              });
                              showToast(`Assigned as primary photo for ${targetCat.name}!`);
                              notifyChange();
                            } catch (e: any) {
                              showToast(e.message, 'error');
                            }
                          }}
                          defaultValue=""
                          className="bg-[#FAF9F6] border border-[#DDD6C8] rounded px-2 py-1 text-[11px]"
                        >
                          <option value="" disabled>Choose Room...</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={async () => {
                          if (!confirm(`Are you sure you want to delete "${img.title}"? This cannot be undone.`)) return;
                          const res = await authFetch(`/api/admin/gallery/${img.id}`, { method: 'DELETE' });
                          if (res.ok) {
                            showToast('Photo removed from gallery');
                            notifyChange();
                            loadData();
                          }
                        }}
                        className="w-full text-red-600 hover:text-red-800 text-[11px] font-semibold text-center pt-1 block"
                      >
                        Delete Photo
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 9: AUDIT LOGS                                    */}
        {/* ==================================================== */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-normal text-[#232624]">
                Security Audit Log
              </h2>
              <p className="text-xs text-[#687062]">
                Detailed chronological log of administrative operations, logins, and status updates.
              </p>
            </div>

            <div className="bg-white border border-[#DDD6C8] rounded-md overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#3D4238]">
                  <thead className="bg-[#EFECE4] text-[#444C3E] uppercase text-[10px] tracking-wider font-semibold border-b border-[#DDD6C8]">
                    <tr>
                      <th className="py-2.5 px-4">Timestamp</th>
                      <th className="py-2.5 px-4">Action</th>
                      <th className="py-2.5 px-4">Details</th>
                      <th className="py-2.5 px-4">Performed By</th>
                      <th className="py-2.5 px-4">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECE7DC] font-mono text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#FAF9F6]">
                        <td className="py-2 px-4 text-[#788072] whitespace-nowrap">{log.created_at}</td>
                        <td className="py-2 px-4 font-bold text-[#232624]">{log.action}</td>
                        <td className="py-2 px-4 font-sans text-xs text-[#444C3E]">{log.details}</td>
                        <td className="py-2 px-4 text-[#3D4534] font-semibold">{log.performed_by}</td>
                        <td className="py-2 px-4 text-[#788072]">{log.ip_address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>

      {/* ==================================================== */}
      {/* MODAL: MANAGE & ASSIGN BOOKING                       */}
      {/* ==================================================== */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-[#FBF9F5] border border-[#DDD6C8] rounded-lg max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 relative shadow-2xl">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-5 right-5 text-xl font-bold text-[#687062] hover:text-[#232624]"
            >
              &times;
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#71786A] block">
                Manage Reservation
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#232624]">
                {selectedBooking.reference} &bull; {selectedBooking.guest_name}
              </h3>
            </div>

            <div className="bg-white p-4 rounded border border-[#DDD6C8] text-xs space-y-2 mb-5">
              <div className="grid grid-cols-2 gap-2 text-[#444C3E]">
                <div>
                  <span className="text-[10px] text-[#788072] block uppercase">Phone:</span>
                  <span className="font-medium">{selectedBooking.guest_phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#788072] block uppercase">Email:</span>
                  <span className="font-medium">{selectedBooking.guest_email || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#788072] block uppercase">Category:</span>
                  <span className="font-medium">{selectedBooking.category_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#788072] block uppercase">Dates:</span>
                  <span className="font-medium">{selectedBooking.check_in_date} to {selectedBooking.check_out_date} ({selectedBooking.nights}N)</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#788072] block uppercase">Guests:</span>
                  <span className="font-medium">{selectedBooking.adults} Adults, {selectedBooking.children} Children</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#788072] block uppercase">Total Payable:</span>
                  <span className="font-serif font-bold text-sm text-[#232624]">₹{selectedBooking.total_amount?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {selectedBooking.special_requests && (
                <div className="pt-2 border-t border-[#ECE7DC] text-[#6A7264]">
                  <strong className="block text-[10px] uppercase text-[#444C3E]">Special Requests:</strong>
                  {selectedBooking.special_requests}
                </div>
              )}
            </div>

            {/* Edit / Update Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await authFetch(`/api/admin/bookings/${selectedBooking.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      status: selectedBooking.status,
                      physical_room_id: selectedBooking.physical_room_id || null,
                      payment_status: selectedBooking.payment_status,
                      payment_method: selectedBooking.payment_method,
                      internal_notes: selectedBooking.internal_notes
                    })
                  });
                  const d = await res.json();
                  if (!res.ok || !d.success) throw new Error(d.error || 'Failed to update booking');

                  showToast(`Booking ${selectedBooking.reference} updated successfully!`);
                  setSelectedBooking(null);
                  loadData();
                } catch (err: any) {
                  showToast(err.message, 'error');
                }
              }}
              className="space-y-4"
            >
              {/* Room Assignment */}
              <div>
                <label className="block text-xs font-semibold text-[#444C3E] mb-1">
                  Assign Physical Room (1 of the 6 rooms)
                </label>
                <select
                  value={selectedBooking.physical_room_id || ''}
                  onChange={(e) => setSelectedBooking({ ...selectedBooking, physical_room_id: e.target.value || null })}
                  className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs text-[#232624]"
                >
                  <option value="">-- No Room Assigned (Pending) --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.room_number} - {r.name} ({r.category_name}) [{r.status}]
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-[#788072] block mt-0.5">
                  Confirming a reservation locks this physical room and prevents double-booking.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#444C3E] mb-1">
                    Booking Status
                  </label>
                  <select
                    value={selectedBooking.status}
                    onChange={(e) => setSelectedBooking({ ...selectedBooking, status: e.target.value as any })}
                    className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs text-[#232624]"
                  >
                    <option value="pending">Pending Enquiry</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked_in">Checked In</option>
                    <option value="checked_out">Checked Out</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#444C3E] mb-1">
                    Payment Status
                  </label>
                  <select
                    value={selectedBooking.payment_status}
                    onChange={(e) => setSelectedBooking({ ...selectedBooking, payment_status: e.target.value as any })}
                    className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs text-[#232624]"
                  >
                    <option value="pending">Pending</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="paid">Paid in Full</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444C3E] mb-1">
                  Internal Staff Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. VIP guest, requested late check-out, anniversary setup"
                  value={selectedBooking.internal_notes || ''}
                  onChange={(e) => setSelectedBooking({ ...selectedBooking, internal_notes: e.target.value })}
                  className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#ECE7DC] flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#3D4534] hover:bg-[#2C3226] text-white py-2.5 rounded text-xs font-semibold uppercase tracking-wider"
                >
                  Save Booking Updates
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="border border-[#C8C0B2] text-[#4A5340] px-4 py-2.5 rounded text-xs uppercase"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: EDIT PHYSICAL ROOM                           */}
      {/* ==================================================== */}
      {editRoomModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FBF9F5] border border-[#DDD6C8] rounded-lg max-w-md w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setEditRoomModal(null)}
              className="absolute top-4 right-4 text-xl font-bold text-[#687062] hover:text-[#232624]"
            >
              &times;
            </button>

            <h3 className="font-serif text-xl font-bold text-[#232624] mb-4">
              Configure Room {editRoomModal.room_number}
            </h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await authFetch(`/api/admin/rooms/${editRoomModal.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: editRoomModal.name,
                      category_id: editRoomModal.category_id,
                      floor: editRoomModal.floor,
                      status: editRoomModal.status,
                      maintenance_notes: editRoomModal.maintenance_notes
                    })
                  });
                  const d = await res.json();
                  if (!res.ok || !d.success) throw new Error(d.error || 'Failed to update room');

                  showToast(`Room ${editRoomModal.room_number} updated.`);
                  notifyChange();
                  setEditRoomModal(null);
                  loadData();
                } catch (err: any) {
                  showToast(err.message, 'error');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-[#444C3E] mb-1">Room Display Name</label>
                <input
                  type="text"
                  value={editRoomModal.name}
                  onChange={(e) => setEditRoomModal({ ...editRoomModal, name: e.target.value })}
                  className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#444C3E] mb-1">Assigned Suite Category</label>
                <select
                  value={editRoomModal.category_id}
                  onChange={(e) => setEditRoomModal({ ...editRoomModal, category_id: e.target.value })}
                  className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} (₹{c.base_price})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#444C3E] mb-1">Floor</label>
                  <input
                    type="text"
                    value={editRoomModal.floor}
                    onChange={(e) => setEditRoomModal({ ...editRoomModal, floor: e.target.value })}
                    className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#444C3E] mb-1">Operational Status</label>
                  <select
                    value={editRoomModal.status}
                    onChange={(e) => setEditRoomModal({ ...editRoomModal, status: e.target.value as any })}
                    className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Under Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#444C3E] mb-1">Maintenance / Block Notes</label>
                <textarea
                  rows={2}
                  value={editRoomModal.maintenance_notes || ''}
                  onChange={(e) => setEditRoomModal({ ...editRoomModal, maintenance_notes: e.target.value })}
                  className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#3D4534] hover:bg-[#2C3226] text-white py-2.5 rounded text-xs font-semibold uppercase tracking-wider mt-2"
              >
                Save Room Configuration
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: EDIT CATEGORY & RATES                         */}
      {/* ==================================================== */}
      {editCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FBF9F5] border border-[#DDD6C8] rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative shadow-2xl">
            <button
              onClick={() => setEditCategoryModal(null)}
              className="absolute top-4 right-4 text-xl font-bold text-[#687062] hover:text-[#232624]"
            >
              &times;
            </button>

            <h3 className="font-serif text-2xl font-bold text-[#232624] mb-4">
              Edit {editCategoryModal.name}
            </h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await authFetch(`/api/admin/categories/${editCategoryModal.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editCategoryModal)
                  });
                  const d = await res.json();
                  if (!res.ok || !d.success) throw new Error(d.error || 'Failed to update category');

                  showToast('Category updated!');
                  notifyChange();
                  setEditCategoryModal(null);
                  loadData();
                } catch (err: any) {
                  showToast(err.message, 'error');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-[#444C3E] mb-1">Category Name</label>
                <input
                  type="text"
                  value={editCategoryModal.name}
                  onChange={(e) => setEditCategoryModal({ ...editCategoryModal, name: e.target.value })}
                  className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#444C3E] mb-1">Base Price / Night (INR ₹)</label>
                  <input
                    type="number"
                    value={editCategoryModal.base_price}
                    onChange={(e) => setEditCategoryModal({ ...editCategoryModal, base_price: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs font-bold text-[#3D4534]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#444C3E] mb-1">Max Occupancy</label>
                  <input
                    type="number"
                    value={editCategoryModal.max_occupancy}
                    onChange={(e) => setEditCategoryModal({ ...editCategoryModal, max_occupancy: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#444C3E] mb-1">Bed Configuration</label>
                  <input
                    type="text"
                    value={editCategoryModal.bed_type}
                    onChange={(e) => setEditCategoryModal({ ...editCategoryModal, bed_type: e.target.value })}
                    className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#444C3E] mb-1">Room Dimensions</label>
                  <input
                    type="text"
                    value={editCategoryModal.room_size}
                    onChange={(e) => setEditCategoryModal({ ...editCategoryModal, room_size: e.target.value })}
                    className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#444C3E] mb-1">Primary Image URL</label>
                <input
                  type="text"
                  value={editCategoryModal.primary_image}
                  onChange={(e) => setEditCategoryModal({ ...editCategoryModal, primary_image: e.target.value })}
                  className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#444C3E] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editCategoryModal.description}
                  onChange={(e) => setEditCategoryModal({ ...editCategoryModal, description: e.target.value })}
                  className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#3D4534] hover:bg-[#2C3226] text-white py-2.5 rounded text-xs font-semibold uppercase tracking-wider"
              >
                Save Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CREATE MANUAL WALK-IN BOOKING                 */}
      {/* ==================================================== */}
      {newBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FBF9F5] border border-[#DDD6C8] rounded-lg max-w-lg w-full p-6 sm:p-8 relative shadow-2xl">
            <button
              onClick={() => setNewBookingModalOpen(false)}
              className="absolute top-4 right-4 text-xl font-bold text-[#687062] hover:text-[#232624]"
            >
              &times;
            </button>

            <h3 className="font-serif text-2xl font-bold text-[#232624] mb-4">
              Create Direct Reservation (Walk-in / Phone)
            </h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);

                try {
                  const res = await authFetch('/api/admin/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      guest_name: formData.get('guest_name'),
                      guest_phone: formData.get('guest_phone'),
                      guest_email: formData.get('guest_email') || null,
                      category_id: formData.get('category_id'),
                      physical_room_id: formData.get('physical_room_id') || null,
                      check_in_date: formData.get('check_in_date'),
                      check_out_date: formData.get('check_out_date'),
                      adults: parseInt(String(formData.get('adults')), 10),
                      status: formData.get('status') || 'confirmed',
                      payment_status: formData.get('payment_status') || 'paid',
                      payment_method: formData.get('payment_method') || 'pay_at_hotel',
                      internal_notes: formData.get('internal_notes') || ''
                    })
                  });

                  const d = await res.json();
                  if (!res.ok || !d.success) throw new Error(d.error || 'Failed to create booking');

                  showToast(`Reservation ${d.reference} created!`);
                  setNewBookingModalOpen(false);
                  loadData();
                } catch (err: any) {
                  showToast(err.message, 'error');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#444C3E] mb-1">Guest Full Name *</label>
                  <input type="text" name="guest_name" required className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[#444C3E] mb-1">Phone Number *</label>
                  <input type="tel" name="guest_phone" required className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#444C3E] mb-1">Check-in Date *</label>
                  <input type="date" name="check_in_date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[#444C3E] mb-1">Check-out Date *</label>
                  <input type="date" name="check_out_date" required defaultValue={new Date(Date.now() + 86400000).toISOString().split('T')[0]} className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#444C3E] mb-1">Category *</label>
                  <select name="category_id" required className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs">
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} (₹{c.base_price})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#444C3E] mb-1">Assign Physical Room</label>
                  <select name="physical_room_id" className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs">
                    <option value="">-- Assign Later --</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>Room {r.room_number} ({r.name})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-[#444C3E] mb-1">Adults</label>
                  <input type="number" name="adults" defaultValue={2} className="w-full bg-white border border-[#DDD6C8] rounded px-2 py-1.5 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[#444C3E] mb-1">Status</label>
                  <select name="status" className="w-full bg-white border border-[#DDD6C8] rounded px-2 py-1.5 text-xs">
                    <option value="confirmed">Confirmed</option>
                    <option value="checked_in">Checked In</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#444C3E] mb-1">Payment</label>
                  <select name="payment_status" className="w-full bg-white border border-[#DDD6C8] rounded px-2 py-1.5 text-xs">
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#444C3E] mb-1">Internal Notes</label>
                <input type="text" name="internal_notes" placeholder="Walk-in guest, luggage deposited, etc." className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs" />
              </div>

              <button
                type="submit"
                className="w-full bg-[#3D4534] hover:bg-[#2C3226] text-white py-2.5 rounded text-xs font-semibold uppercase tracking-wider mt-2"
              >
                Create Reservation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CHANGE ADMIN PASSWORD                         */}
      {/* ==================================================== */}
      {changePasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#FBF9F5] border border-[#DDD6C8] rounded-lg max-w-md w-full p-6 sm:p-7 relative shadow-2xl">
            <button
              onClick={() => setChangePasswordModalOpen(false)}
              className="absolute top-4 right-4 text-xl font-bold text-[#687062] hover:text-[#232624]"
            >
              &times;
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#3D4534] text-[#E8E6DF] flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#232624]">
                Change Admin Password
              </h3>
            </div>
            <p className="text-xs text-[#687062] mb-4">
              Update credentials for Theroyalpalaceinn owner &amp; management dashboard.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const cur = (form.elements.namedItem('currentPassword') as HTMLInputElement).value;
                const next = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
                const confirm = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value;

                if (next !== confirm) {
                  showToast('New passwords do not match. Please re-check.', 'error');
                  return;
                }

                if (next.length < 8) {
                  showToast('New password must be at least 8 characters.', 'error');
                  return;
                }

                const hasLetters = /[a-zA-Z]/.test(next);
                const hasNumbersOrSpecial = /[\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(next);
                if (!hasLetters || !hasNumbersOrSpecial) {
                  showToast('Password must contain letters and at least one number or symbol.', 'error');
                  return;
                }

                try {
                  const res = await authFetch('/api/admin/change-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentPassword: cur, newPassword: next, confirmPassword: confirm })
                  });
                  const d = await res.json();
                  if (!res.ok || !d.success) throw new Error(d.error || 'Failed to update password');

                  showToast('Password changed successfully! Keep it recorded safely.');
                  setChangePasswordModalOpen(false);
                } catch (err: any) {
                  showToast(err.message || 'Failed to change password', 'error');
                }
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-[#444C3E] mb-1">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  required
                  placeholder="Enter current password"
                  className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#3D4534]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#444C3E] mb-1">
                  New Password <span className="text-[#889082] font-normal">(Min 8 chars, letters &amp; numbers/symbols)</span>
                </label>
                <input
                  type="password"
                  name="newPassword"
                  minLength={8}
                  required
                  placeholder="Enter strong new password"
                  className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#3D4534]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#444C3E] mb-1">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  minLength={8}
                  required
                  placeholder="Re-enter new password"
                  className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#3D4534]"
                />
              </div>

              <div className="p-2.5 bg-[#FAF8F5] border border-[#E5DFD3] rounded text-[11px] text-[#636C5D] space-y-1">
                <div className="font-semibold text-[#3D4534]">Security requirements:</div>
                <div className="flex items-center gap-1.5 text-emerald-800">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Minimum 8 characters length</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Mix of letters and numbers/symbols</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setChangePasswordModalOpen(false)}
                  className="flex-1 border border-[#DDD6C8] hover:bg-[#EFECE4] text-[#444C3E] py-2.5 rounded text-xs font-semibold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#3D4534] hover:bg-[#2C3226] text-white py-2.5 rounded text-xs font-semibold uppercase tracking-wider"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: ADD GALLERY PHOTO                             */}
      {/* ==================================================== */}
      {newPhotoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FBF9F5] border border-[#DDD6C8] rounded-lg max-w-sm w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setNewPhotoModalOpen(false)}
              className="absolute top-4 right-4 text-xl font-bold text-[#687062] hover:text-[#232624]"
            >
              &times;
            </button>

            <h3 className="font-serif text-xl font-bold text-[#232624] mb-3">
              Add New Hotel Photograph
            </h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const fileInput = form.elements.namedItem('photoFile') as HTMLInputElement;
                const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                const url = (form.elements.namedItem('url') as HTMLInputElement).value;
                const category = (form.elements.namedItem('category') as HTMLSelectElement).value;
                const caption = (form.elements.namedItem('caption') as HTMLInputElement).value;

                try {
                  if (fileInput.files && fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const reader = new FileReader();
                    reader.onload = async () => {
                      const dataUrl = reader.result as string;
                      const res = await authFetch('/api/admin/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          filename: file.name,
                          dataUrl,
                          title: title || file.name.replace(/\.[^/.]+$/, ''),
                          category: category || 'rooms',
                          caption: caption || '',
                          addToGallery: true
                        })
                      });
                      const d = await res.json();
                      if (!res.ok || !d.success) throw new Error(d.error || 'Failed to upload photo');

                      showToast('Photo uploaded to server and added to gallery!');
                      notifyChange();
                      setNewPhotoModalOpen(false);
                      loadData();
                    };
                    reader.readAsDataURL(file);
                  } else if (url && url.trim().length > 0) {
                    const res = await authFetch('/api/admin/gallery', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title, url, category, caption })
                    });
                    const d = await res.json();
                    if (!res.ok || !d.success) throw new Error(d.error || 'Failed to add photo');

                    showToast('Photo added to gallery!');
                    notifyChange();
                    setNewPhotoModalOpen(false);
                    loadData();
                  } else {
                    showToast('Please either select an image file or enter an image URL', 'error');
                  }
                } catch (err: any) {
                  showToast(err.message, 'error');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-[#444C3E] mb-1">
                  Option 1: Upload File from Computer
                </label>
                <input
                  type="file"
                  name="photoFile"
                  accept="image/*"
                  className="w-full bg-white border border-[#DDD6C8] rounded px-2.5 py-1.5 text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:bg-[#3D4534] file:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#444C3E] mb-1">
                  Option 2: Or Paste Image URL
                </label>
                <input
                  type="url"
                  name="url"
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#444C3E] mb-1">Photo Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Deluxe Suite Bedroom"
                  className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#444C3E] mb-1">Category</label>
                <select name="category" className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs">
                  <option value="rooms">Suites &amp; Rooms</option>
                  <option value="courtyard">Courtyard &amp; Gardens</option>
                  <option value="dining">Dining Veranda</option>
                  <option value="exterior">Architecture &amp; Facade</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#444C3E] mb-1">Caption / Alt Description</label>
                <input
                  type="text"
                  name="caption"
                  placeholder="Short description for guests"
                  className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#3D4534] hover:bg-[#2C3226] text-white py-2.5 rounded text-xs font-semibold uppercase tracking-wider mt-2 shadow-sm"
              >
                Save Photograph
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: SCHEDULE ROOM BLOCK                           */}
      {/* ==================================================== */}
      {newBlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FBF9F5] border border-[#DDD6C8] rounded-lg max-w-sm w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setNewBlockModalOpen(false)}
              className="absolute top-4 right-4 text-xl font-bold text-[#687062] hover:text-[#232624]"
            >
              &times;
            </button>

            <h3 className="font-serif text-xl font-bold text-[#232624] mb-3">
              Schedule Room Maintenance Block
            </h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const physical_room_id = (form.elements.namedItem('physical_room_id') as HTMLSelectElement).value;
                const start_date = (form.elements.namedItem('start_date') as HTMLInputElement).value;
                const end_date = (form.elements.namedItem('end_date') as HTMLInputElement).value;
                const reason = (form.elements.namedItem('reason') as HTMLInputElement).value;

                try {
                  const res = await authFetch('/api/admin/blocks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ physical_room_id, start_date, end_date, reason })
                  });
                  const d = await res.json();
                  if (!res.ok || !d.success) throw new Error(d.error || 'Failed to create block');

                  showToast('Room block scheduled!');
                  notifyChange();
                  setNewBlockModalOpen(false);
                  loadData();
                } catch (err: any) {
                  showToast(err.message, 'error');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-[#444C3E] mb-1">Select Physical Room</label>
                <select name="physical_room_id" required className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs">
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>Room {r.room_number} ({r.name})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#444C3E] mb-1">Start Date</label>
                  <input type="date" name="start_date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-white border border-[#DDD6C8] rounded px-2.5 py-1.5 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[#444C3E] mb-1">End Date</label>
                  <input type="date" name="end_date" required defaultValue={new Date(Date.now() + 86400000).toISOString().split('T')[0]} className="w-full bg-white border border-[#DDD6C8] rounded px-2.5 py-1.5 text-xs" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#444C3E] mb-1">Reason for Block</label>
                <input type="text" name="reason" required placeholder="e.g. Scheduled AC servicing, paint touch-up" className="w-full bg-white border border-[#DDD6C8] rounded px-3 py-2 text-xs" />
              </div>

              <button
                type="submit"
                className="w-full bg-[#3D4534] hover:bg-[#2C3226] text-white py-2.5 rounded text-xs font-semibold uppercase tracking-wider mt-2"
              >
                Schedule Block
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
