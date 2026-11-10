import React, { useState } from 'react';
import { Bell, User, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHealth } from '../context/HealthContext';

export default function Header({ onNavigateProfile, onNavigateLanding }) {
  const { user, logout } = useAuth();
  const { notifications } = useHealth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const firstName = user?.fullName?.split(' ')[0] || 'Shreya';

  const getIndiaDateFormatted = () => {
    const now = new Date();
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(now);
  };

  const getIndiaGreeting = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false
    });
    const hour = parseInt(formatter.format(now), 10);
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleLogout = async () => {
    await logout();
    if (onNavigateLanding) {
      onNavigateLanding();
    }
  };

  return (
    <header className="flex items-center justify-between py-6 px-4 md:px-8 border-b border-[#FFE8EE]/60 bg-white/50 backdrop-blur-xs sticky top-0 z-30">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#2D1420] tracking-tight font-display">
          {getIndiaGreeting()}, {firstName}
        </h1>
        <p className="text-xs md:text-sm text-[#7C6A75] font-medium mt-0.5">
          {getIndiaDateFormatted()}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="w-10 h-10 rounded-full border border-[#FFE4EC] bg-white flex items-center justify-center text-[#685361] hover:text-[#E83D6F] hover:border-[#FFC2D1] transition-all relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#E83D6F] rounded-full ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#FFE4EC] p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#FFE4EC] px-2">
                <span className="font-bold text-xs uppercase tracking-wider text-[#2D1420]">Notifications</span>
                <span className="text-[10px] text-[#E83D6F] font-semibold cursor-pointer">Mark all read</span>
              </div>
              <div className="divide-y divide-[#FFF0F3] max-h-64 overflow-y-auto mt-1">
                {notifications.map(n => (
                  <div key={n.id} className="p-2.5 hover:bg-[#FFF7F9] rounded-xl transition-colors">
                    <div className="flex items-start justify-between">
                      <h5 className="text-xs font-bold text-[#2D1420]">{n.title}</h5>
                      <span className="text-[10px] text-[#8E7582]">{n.time}</span>
                    </div>
                    <p className="text-xs text-[#7C6A75] mt-0.5 leading-snug">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="w-10 h-10 rounded-full bg-[#FFE1E8] border-2 border-white flex items-center justify-center text-[#E83D6F] shadow-xs hover:scale-105 transition-transform"
            title="User Account"
          >
            <User className="w-5 h-5" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#FFE4EC] p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-[#FFE4EC]">
                <p className="text-sm font-bold text-[#2D1420]">{user?.fullName || 'Shreya'}</p>
                <p className="text-xs text-[#7C6A75] truncate">{user?.email || 'shreya@example.com'}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigateProfile();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#685361] hover:bg-[#FFF0F3] hover:text-[#E83D6F] rounded-xl transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>My Profile & Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#D4265A] hover:bg-[#FFF0F3] rounded-xl transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
