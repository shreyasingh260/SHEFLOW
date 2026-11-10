import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  ArrowLeft, 
  Check, 
  Calendar, 
  Droplets, 
  Heart,
  ShieldAlert,
  UserPlus,
  Phone,
  Trash2,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/backendApi';

export default function ProfilePage({ onBack }) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || 'Shreya Singh');
  const [cycleLength, setCycleLength] = useState(user?.cycleLengthDays || 28);
  const [periodLength, setPeriodLength] = useState(user?.periodLengthDays || 5);
  const [regularity, setRegularity] = useState(user?.regularity || 'REGULAR');
  const [weightKg, setWeightKg] = useState(user?.weightKg || 55);
  const [heightCm, setHeightCm] = useState(user?.heightCm || 162);
  const [saved, setSaved] = useState(false);

  // Emergency Contacts State (addition & deletion)
  const [emergencyContacts, setEmergencyContacts] = useState(() => {
    try {
      if (user?.emergencyContacts) {
        const parsed = typeof user.emergencyContacts === 'string'
          ? JSON.parse(user.emergencyContacts)
          : user.emergencyContacts;
        if (Array.isArray(parsed)) return parsed;
      }
      const local = localStorage.getItem('sheflow_emergency_contacts');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: 'Family' });
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [contactError, setContactError] = useState('');

  const recommendedProtein = Math.round((Number(weightKg) || 55) * 1.1);

  const handleAddContact = async () => {
    if (!newContact.name.trim()) {
      setContactError('Please enter contact name.');
      return;
    }
    if (!newContact.phone.trim()) {
      setContactError('Please enter a valid phone number.');
      return;
    }

    const entry = {
      id: 'ec_' + Date.now(),
      name: newContact.name.trim(),
      phone: newContact.phone.trim(),
      relation: newContact.relation
    };

    const updated = [...emergencyContacts, entry];
    setEmergencyContacts(updated);
    setNewContact({ name: '', phone: '', relation: 'Family' });
    setShowAddContactForm(false);
    setContactError('');

    try {
      localStorage.setItem('sheflow_emergency_contacts', JSON.stringify(updated));
      await userApi.updateProfile({ emergencyContacts: JSON.stringify(updated) });
    } catch (e) {
      console.warn('Failed to persist contact update', e);
    }
  };

  const handleDeleteContact = async (id) => {
    const updated = emergencyContacts.filter(c => (c.id || c.phone) !== id);
    setEmergencyContacts(updated);
    try {
      localStorage.setItem('sheflow_emergency_contacts', JSON.stringify(updated));
      await userApi.updateProfile({ emergencyContacts: JSON.stringify(updated) });
    } catch (e) {
      console.warn('Failed to persist contact delete', e);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await userApi.updateProfile({
      fullName,
      cycleLengthDays: Number(cycleLength),
      periodLengthDays: Number(periodLength),
      regularity,
      weightKg: Number(weightKg),
      heightCm: Number(heightCm),
      dailyProteinGrams: recommendedProtein,
      emergencyContacts: JSON.stringify(emergencyContacts)
    });
    localStorage.setItem('sheflow_emergency_contacts', JSON.stringify(emergencyContacts));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white border border-[#FFE4EC] text-[#8E7582] hover:text-[#E83D6F] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-display text-[#2D1420]">
            Profile & Health Settings
          </h1>
          <p className="text-xs text-[#7C6A75]">
            Manage personal health metrics and cycle calculation preferences
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#FFE4EC] shadow-soft">
        <div className="flex items-center gap-4 pb-6 border-b border-[#FFE8EE] mb-6">
          <div className="w-16 h-16 rounded-full bg-[#FFE1E8] border-2 border-[#FFCCD8] text-[#E83D6F] flex items-center justify-center font-bold text-2xl shadow-xs">
            🌸
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#2D1420]">{fullName}</h3>
            <p className="text-xs text-[#7C6A75]">{user?.email || 'shreya@example.com'}</p>
            <span className="inline-block mt-1 bg-[#E8F5E9] text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              SheFlow Health Account Active
            </span>
          </div>
        </div>

        {saved && (
          <div className="mb-6 p-3 rounded-2xl bg-[#E8F5E9] text-green-700 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Profile and cycle preferences updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF7F9] border border-[#FFE1E8] text-xs text-[#2D1420] focus:outline-hidden focus:border-[#E83D6F]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-1">
                Account Email
              </label>
              <input
                type="email"
                disabled
                value={user?.email || 'shreya@example.com'}
                className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-1">
                Typical Cycle Length (Days)
              </label>
              <input
                type="number"
                min="20"
                max="45"
                value={cycleLength}
                onChange={e => setCycleLength(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF7F9] border border-[#FFE1E8] text-xs text-[#2D1420] focus:outline-hidden focus:border-[#E83D6F]"
              />
              <span className="text-[10px] text-[#8E7582] mt-0.5 block">Standard cycle is 28 days</span>
            </div>

            <div>
              <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-1">
                Typical Flow Duration (Days)
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={periodLength}
                onChange={e => setPeriodLength(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF7F9] border border-[#FFE1E8] text-xs text-[#2D1420] focus:outline-hidden focus:border-[#E83D6F]"
              />
              <span className="text-[10px] text-[#8E7582] mt-0.5 block">Average period lasts 3-7 days</span>
            </div>

            <div>
              <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-1">
                Body Weight (kg)
              </label>
              <input
                type="number"
                min="30"
                max="180"
                value={weightKg}
                onChange={e => setWeightKg(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF7F9] border border-[#FFE1E8] text-xs text-[#2D1420] focus:outline-hidden focus:border-[#E83D6F]"
              />
              <span className="text-[10px] text-[#8E7582] mt-0.5 block">Used for daily protein target</span>
            </div>

            <div>
              <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-1">
                Body Height (cm)
              </label>
              <input
                type="number"
                min="100"
                max="230"
                value={heightCm}
                onChange={e => setHeightCm(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#FFF7F9] border border-[#FFE1E8] text-xs text-[#2D1420] focus:outline-hidden focus:border-[#E83D6F]"
              />
              <span className="text-[10px] text-[#8E7582] mt-0.5 block">Used for BMI & caloric split</span>
            </div>
          </div>

          {/* Protein Recommendation Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FFF0F4] to-[#FFF7F9] border border-[#FFD3DF] flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#E83D6F] block">
                Target Protein Recommendation
              </span>
              <p className="text-xs font-bold text-[#2D1420] mt-0.5">
                {recommendedProtein}g / day <span className="font-normal text-[#8E7582]">(~{Math.round(recommendedProtein / 3)}g per meal)</span>
              </p>
              <p className="text-[11px] text-[#8E7582] mt-0.5">
                Calculated at 1.1g protein / kg body weight for optimal cycle hormonal balance.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-1 rounded-full">
                Active Goal
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-1.5">
              Cycle Regularity
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['REGULAR', 'IRREGULAR'].map((reg) => (
                <button
                  type="button"
                  key={reg}
                  onClick={() => setRegularity(reg)}
                  className={`py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    regularity === reg
                      ? 'bg-[#E83D6F] text-white shadow-xs'
                      : 'bg-[#FFF7F9] text-[#685361] border border-[#FFE1E8]'
                  }`}
                >
                  {reg === 'REGULAR' ? 'Regular Cycles (±2-3 days)' : 'Irregular Variations'}
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================
              EMERGENCY CONTACTS (ADDITION & DELETION)
          ======================================================== */}
          <div className="pt-6 border-t border-[#FFE8EE] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#E83D6F]" />
                  <h3 className="text-sm font-bold text-[#2D1420] uppercase tracking-wider">
                    Emergency Contacts (आपातकालीन संपर्क)
                  </h3>
                </div>
                <p className="text-xs text-[#7C6A75] mt-0.5">
                  Trusted personal contacts displayed in the 1-Tap SOS Emergency Panel during critical distress.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddContactForm(!showAddContactForm)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF0F4] hover:bg-[#FFE1E8] text-[#E83D6F] border border-[#FFD3DF] rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-auto shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showAddContactForm ? 'Close Form' : '+ Add Emergency Contact'}</span>
              </button>
            </div>

            {/* Contact Add Form */}
            {showAddContactForm && (
              <div className="p-4 bg-[#FFF9FA] rounded-2xl border border-[#FFD3DF] space-y-3 animate-in fade-in">
                <h4 className="text-xs font-bold text-[#2D1420] flex items-center gap-1.5">
                  <span>➕ Add New Trusted Emergency Contact</span>
                </h4>

                {contactError && (
                  <div className="p-2 text-[11px] text-[#D32F2F] bg-[#FFEBEE] rounded-lg">
                    {contactError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#685361] uppercase tracking-wider block mb-1">
                      Full Name / Label *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mom, Dr. Sharma, Rahul"
                      value={newContact.name}
                      onChange={(e) => { setNewContact({ ...newContact, name: e.target.value }); setContactError(''); }}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-[#FFE1E8] text-xs text-[#2D1420] focus:outline-hidden focus:border-[#E83D6F]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#685361] uppercase tracking-wider block mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={newContact.phone}
                      onChange={(e) => { setNewContact({ ...newContact, phone: e.target.value }); setContactError(''); }}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-[#FFE1E8] text-xs text-[#2D1420] focus:outline-hidden focus:border-[#E83D6F]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#685361] uppercase tracking-wider block mb-1">
                      Relationship
                    </label>
                    <select
                      value={newContact.relation}
                      onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-[#FFE1E8] text-xs text-[#2D1420] focus:outline-hidden focus:border-[#E83D6F]"
                    >
                      <option value="Family">Family / Parent</option>
                      <option value="Partner">Partner / Spouse</option>
                      <option value="Doctor">Doctor / Gynecologist</option>
                      <option value="Friend">Trusted Friend</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowAddContactForm(false); setContactError(''); }}
                    className="px-3 py-1.5 bg-white border border-[#FFE1E8] text-[#7C6A75] text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddContact}
                    className="px-4 py-1.5 bg-[#E83D6F] hover:bg-[#D4265A] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Contact</span>
                  </button>
                </div>
              </div>
            )}

            {/* Contact List */}
            {emergencyContacts.length === 0 ? (
              <div className="p-4 bg-[#FFFDF5] rounded-2xl border border-[#FBEEC9] text-center space-y-1">
                <span className="text-base">🛡️</span>
                <p className="text-xs font-bold text-[#8D6E63]">No personal emergency contacts added yet.</p>
                <p className="text-[11px] text-[#A1887F]">
                  During emergencies, only verified national helplines (112, 1091, 102) will appear until you add trusted contacts here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {emergencyContacts.map((c) => (
                  <div
                    key={c.id || c.phone}
                    className="p-3 bg-white rounded-2xl border border-[#FFE8EE] hover:border-[#FFD3DF] flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#FFE1E8] text-[#E83D6F] flex items-center justify-center font-bold text-sm shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-[#2D1420]">{c.name}</span>
                          <span className="text-[10px] font-bold text-[#E83D6F] bg-[#FFE1E8] px-2 py-0.5 rounded-full">
                            {c.relation}
                          </span>
                        </div>
                        <span className="text-xs text-[#7C6A75] font-mono mt-0.5 block">{c.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${c.phone}`}
                        className="p-2 text-[#2E7D32] hover:bg-[#E8F5E9] rounded-xl transition-colors"
                        title="Call Number"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteContact(c.id || c.phone)}
                        className="p-2 text-[#8E7582] hover:text-[#D32F2F] hover:bg-[#FFEBEE] rounded-xl transition-colors cursor-pointer"
                        title="Delete contact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#FFE8EE] flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#E83D6F] hover:bg-[#D4265A] active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
