import React, { useState, useEffect } from 'react';
import { X, Phone, AlertTriangle, ShieldCheck, HeartPulse, UserPlus, Copy, Check, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function EmergencyModal({ isOpen, onClose, onNavigateProfile }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [personalContacts, setPersonalContacts] = useState([]);

  // Load real emergency contacts entered by user (no pre-defined mock contacts)
  useEffect(() => {
    if (isOpen) {
      try {
        if (user?.emergencyContacts) {
          const parsed = typeof user.emergencyContacts === 'string'
            ? JSON.parse(user.emergencyContacts)
            : user.emergencyContacts;
          if (Array.isArray(parsed)) {
            setPersonalContacts(parsed);
            return;
          }
        }
        const local = localStorage.getItem('sheflow_emergency_contacts');
        setPersonalContacts(local ? JSON.parse(local) : []);
      } catch {
        setPersonalContacts([]);
      }
    }
  }, [isOpen, user?.emergencyContacts]);

  if (!isOpen) return null;

  const helplines = [
    { name: 'Women Helpline (All India)', number: '1091', desc: '24x7 Emergency assistance for women in distress', color: 'bg-[#FF5983]' },
    { name: 'National Emergency Number', number: '112', desc: 'Unified Police, Fire, and Medical dispatch', color: 'bg-[#E83D6F]' },
    { name: 'Medical Emergency / Ambulance', number: '102', desc: 'Immediate ambulance and maternal healthcare dispatch', color: 'bg-[#00B0FF]' },
    { name: 'Kiran Mental Health Support', number: '1800-599-0019', desc: 'Toll-free 24/7 psychological support', color: 'bg-[#7C4DFF]' }
  ];

  const handleCopy = (num) => {
    navigator.clipboard.writeText(num);
    setCopied(num);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#FFD3DF] overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#FF5983] to-[#E83D6F] p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <HeartPulse className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display">SheFlow Emergency Support</h3>
                <p className="text-xs text-white/90">Immediate emergency helplines & safety resources</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* SOS Quick Dial */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C6A75] mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#E83D6F]" />
              Official National Helplines (Hardcoded for Offline Safety)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {helplines.map((h) => (
                <div 
                  key={h.number}
                  className="bg-[#FFF5F7] border border-[#FFE1E8] rounded-2xl p-3.5 hover:border-[#FF5983] transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-[#E83D6F] uppercase tracking-wider">
                      {h.name}
                    </span>
                    <p className="text-xs text-[#7C6A75] mt-1 line-clamp-2 leading-relaxed">
                      {h.desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#FFE4EC]">
                    <a
                      href={`tel:${h.number}`}
                      className="inline-flex items-center gap-1.5 bg-[#E83D6F] hover:bg-[#D4265A] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call {h.number}
                    </a>
                    <button
                      onClick={() => handleCopy(h.number)}
                      className="p-1.5 text-[#8E7582] hover:text-[#2D1420] transition-colors"
                      title="Copy Number"
                    >
                      {copied === h.number ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Personal Contacts (Shows only when user has entered contacts) */}
          {personalContacts.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C6A75] flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-[#E83D6F]" />
                  Your Trusted Emergency Contacts ({personalContacts.length})
                </h4>
                {onNavigateProfile && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateProfile();
                    }}
                    className="text-[10px] font-bold text-[#E83D6F] hover:underline"
                  >
                    Manage in Profile
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {personalContacts.map((c) => (
                  <div 
                    key={c.id || c.phone} 
                    className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#FFE8EE] hover:bg-[#FFF7F9] transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-bold text-[#2D1420]">{c.name}</h5>
                        <span className="text-[10px] font-bold text-[#E83D6F] bg-[#FFE1E8] px-2 py-0.5 rounded-full">
                          {c.relation}
                        </span>
                      </div>
                      <p className="text-xs text-[#7C6A75] font-mono mt-0.5">{c.phone}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${c.phone}`}
                        className="inline-flex items-center gap-1.5 bg-[#E83D6F] hover:bg-[#D4265A] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                      <a
                        href={`sms:${c.phone}?body=SheFlow Emergency SOS: I need immediate medical support.`}
                        className="p-2 bg-[#FFF0F4] text-[#E83D6F] hover:bg-[#FFE1E8] rounded-xl transition-all"
                        title="Send SOS SMS"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#FFF9FA] border border-[#FFE1E8] rounded-2xl p-4 text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#FFE1E8] text-[#E83D6F] flex items-center justify-center mx-auto text-sm font-bold">
                🛡️
              </div>
              <div>
                <h5 className="text-xs font-bold text-[#2D1420]">No Personal Contacts Added</h5>
                <p className="text-[11px] text-[#7C6A75] mt-0.5 max-w-sm mx-auto">
                  Currently only official national helplines are active. You can add your family, partner, or doctor in your Profile for 1-tap SOS dialing.
                </p>
              </div>
              {onNavigateProfile && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateProfile();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#FFD3DF] text-[#E83D6F] hover:bg-[#FFE1E8] text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add Emergency Contact in Profile</span>
                </button>
              )}
            </div>
          )}

          <div className="bg-[#FFF8E7] border border-[#FFE7A3] rounded-2xl p-3 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
            <p className="text-xs text-[#92400E] leading-relaxed">
              If you are experiencing severe, unbearable pain, sudden fainting, or hemorrhaging, do not hesitate to contact an emergency service or visit your nearest emergency room immediately.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FFF5F7] border-t border-[#FFE4EC] text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-[#FFD3DF] text-[#685361] hover:text-[#2D1420] rounded-xl text-xs font-bold transition-colors"
          >
            Close Emergency Panel
          </button>
        </div>
      </div>
    </div>
  );
}
