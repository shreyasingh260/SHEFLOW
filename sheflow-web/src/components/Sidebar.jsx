import React, { useState } from 'react';
import { 
  Home, 
  Sparkles, 
  TrendingUp, 
  User, 
  ShoppingBag, 
  MapPin, 
  PhoneCall, 
  Menu, 
  X,
  Zap,
  Utensils
} from 'lucide-react';

export default function Sidebar({ currentView, setView, onOpenEmergency }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'flora', label: 'Flora', icon: Sparkles, badge: 'AI' },
    { id: 'hormone-energy', label: 'Hormone & Energy', icon: Zap, badge: 'Daily' },
    { id: 'nutrition', label: 'Phase Nutrition', icon: Utensils },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const exploreItems = [
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'washrooms', label: 'Washroom locator', icon: MapPin },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#FFE4EC] p-5 w-64 select-none">
      {/* Brand Logo */}
      <div 
        onClick={() => setView('dashboard')} 
        className="flex items-center gap-2 mb-8 cursor-pointer group"
      >
        <span className="text-2xl font-bold font-display tracking-tight text-[#E83D6F] group-hover:scale-105 transition-transform">
          SheFlow
        </span>
      </div>

      {/* Main Navigation */}
      <div className="space-y-1 mb-6">
        <span className="px-3.5 text-[10px] font-extrabold uppercase tracking-wider text-[#B89DAA] block mb-2">
          Daily Wellness & Sync
        </span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isActive 
                  ? 'bg-[#FFF0F3] text-[#E83D6F] shadow-xs' 
                  : 'text-[#685361] hover:bg-[#FFF7F9] hover:text-[#2D1420]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#E83D6F]' : 'text-[#8E7582]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-[#FFE1E8] text-[#E83D6F] text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Essentials Navigation */}
      <div className="space-y-1 mb-auto">
        <span className="px-3.5 text-[10px] font-extrabold uppercase tracking-wider text-[#B89DAA] block mb-2">
          Essentials & Care
        </span>
        {exploreItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isActive 
                  ? 'bg-[#FFF0F3] text-[#E83D6F]' 
                  : 'text-[#685361] hover:bg-[#FFF7F9] hover:text-[#2D1420]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#E83D6F]' : 'text-[#8E7582]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Emergency Helpline Box */}
      <div className="mt-6 pt-4 border-t border-[#FFE8EE]">
        <div className="bg-[#FFF5F7] border border-[#FFE1E8] rounded-2xl p-4 text-center space-y-2">
          <div className="w-8 h-8 rounded-full bg-[#FFE1E8] text-[#E83D6F] flex items-center justify-center mx-auto">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#2D1420]">Need help now?</h4>
            <p className="text-[11px] text-[#7C6A75] leading-tight mt-0.5">
              Quick access to SOS & helpline support.
            </p>
          </div>
          <button
            onClick={onOpenEmergency}
            className="w-full py-2 bg-[#E83D6F] hover:bg-[#D4265A] active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            Emergency
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block shrink-0 sticky top-0 h-screen z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Hamburger Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2.5 rounded-2xl bg-white border border-[#FFE4EC] text-[#2D1420] shadow-md focus:outline-none cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5 text-[#E83D6F]" /> : <Menu className="w-5 h-5 text-[#E83D6F]" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
            onClick={() => setMobileOpen(false)} 
          />
          <div className="relative flex-1 max-w-xs w-full bg-white h-full shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
