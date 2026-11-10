import React, { useState } from 'react';
import { X, Stethoscope, Smile, Droplets, Pill, Check, Plus } from 'lucide-react';
import { useHealth } from '../context/HealthContext';

export default function LogModal({ isOpen, onClose, initialTab = 'symptoms' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const { logSymptoms, logMood, addWater } = useHealth();

  // Symptoms state
  const [selectedSymptoms, setSelectedSymptoms] = useState(['Mild Cramps']);
  const [severity, setSeverity] = useState('MILD');
  const [symptomNotes, setSymptomNotes] = useState('');

  // Mood state
  const [selectedMoods, setSelectedMoods] = useState(['Happy']);
  const [moodIntensity, setMoodIntensity] = useState(4);
  const [moodNotes, setMoodNotes] = useState('');

  // Medication state
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const symptomList = [
    'Cramps', 'Headache', 'Bloating', 'Fatigue', 
    'Acne', 'Lower Back Pain', 'Tender Breasts', 'Nausea', 'Cravings'
  ];

  const moodList = [
    'Happy', 'Calm', 'Energetic', 'Anxious', 
    'Irritable', 'Sad', 'Moody', 'Sensitive'
  ];

  const toggleSymptom = (item) => {
    if (selectedSymptoms.includes(item)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== item));
    } else {
      setSelectedSymptoms([...selectedSymptoms, item]);
    }
  };

  const toggleMood = (m) => {
    if (selectedMoods.includes(m)) {
      setSelectedMoods(selectedMoods.filter(x => x !== m));
    } else {
      setSelectedMoods([...selectedMoods, m]);
    }
  };

  const handleSaveSymptoms = async () => {
    if (selectedSymptoms.length === 0) return;
    await logSymptoms({ symptoms: selectedSymptoms, severity, notes: symptomNotes });
    triggerSuccess();
  };

  const handleSaveMood = async () => {
    if (selectedMoods.length === 0) return;
    await logMood({ moods: selectedMoods, intensity: moodIntensity, notes: moodNotes });
    triggerSuccess();
  };

  const handleAddGlass = async () => {
    await addWater();
    triggerSuccess();
  };

  const triggerSuccess = () => {
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#FFE4EC] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#FFE8EE]">
          <h3 className="text-lg font-bold text-[#2D1420] font-display">Daily Health Logging</h3>
          <button 
            onClick={onClose}
            className="p-1.5 text-[#8E7582] hover:text-[#2D1420] rounded-full hover:bg-[#FFF0F3] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 p-2 bg-[#FFF7F9] border-b border-[#FFE8EE] text-xs font-semibold text-[#7C6A75]">
          <button
            onClick={() => setActiveTab('symptoms')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'symptoms' ? 'bg-white text-[#E83D6F] shadow-xs' : 'hover:text-[#2D1420]'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Symptoms</span>
          </button>
          <button
            onClick={() => setActiveTab('mood')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'mood' ? 'bg-white text-[#E83D6F] shadow-xs' : 'hover:text-[#2D1420]'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Mood</span>
          </button>
          <button
            onClick={() => setActiveTab('water')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'water' ? 'bg-white text-[#E83D6F] shadow-xs' : 'hover:text-[#2D1420]'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Water</span>
          </button>
          <button
            onClick={() => setActiveTab('medication')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'medication' ? 'bg-white text-[#E83D6F] shadow-xs' : 'hover:text-[#2D1420]'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Meds</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {savedSuccess ? (
            <div className="py-10 text-center animate-in zoom-in-95">
              <div className="w-14 h-14 bg-[#E8F5E9] text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Check className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-[#2D1420]">Logged Successfully!</h4>
              <p className="text-xs text-[#7C6A75] mt-1">Your health dashboard has been refreshed.</p>
            </div>
          ) : (
            <>
              {/* SYMPTOMS TAB */}
              {activeTab === 'symptoms' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-2">
                      Select Symptoms
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {symptomList.map(item => {
                        const isSelected = selectedSymptoms.includes(item);
                        return (
                          <button
                            key={item}
                            onClick={() => toggleSymptom(item)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                              isSelected 
                                ? 'bg-[#E83D6F] text-white shadow-xs' 
                                : 'bg-[#FFF0F3] text-[#685361] hover:bg-[#FFE1E8]'
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-2">
                      Severity Level
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['MILD', 'MODERATE', 'SEVERE'].map(lvl => (
                        <button
                          key={lvl}
                          onClick={() => setSeverity(lvl)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all ${
                            severity === lvl
                              ? 'bg-[#2D1420] text-white shadow-xs'
                              : 'bg-[#FFF5F7] text-[#685361] hover:bg-[#FFE8EE]'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-1">
                      Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={symptomNotes}
                      onChange={e => setSymptomNotes(e.target.value)}
                      placeholder="e.g. Mild cramping felt in lower abdomen"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF7F9] border border-[#FFE1E8] text-xs text-[#2D1420] focus:outline-hidden focus:border-[#E83D6F]"
                    />
                  </div>

                  <button
                    onClick={handleSaveSymptoms}
                    className="w-full py-2.5 bg-[#E83D6F] hover:bg-[#D4265A] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Save Symptoms Log
                  </button>
                </div>
              )}

              {/* MOOD TAB */}
              {activeTab === 'mood' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-2">
                      How are you feeling?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {moodList.map(m => {
                        const isSelected = selectedMoods.includes(m);
                        return (
                          <button
                            key={m}
                            onClick={() => toggleMood(m)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                              isSelected 
                                ? 'bg-[#AB47BC] text-white shadow-xs' 
                                : 'bg-[#FFF0F3] text-[#685361] hover:bg-[#FFE1E8]'
                            }`}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider">
                        Intensity Level: {moodIntensity} / 5
                      </label>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={moodIntensity}
                      onChange={e => setMoodIntensity(Number(e.target.value))}
                      className="w-full accent-[#AB47BC]"
                    />
                    <div className="flex justify-between text-[10px] text-[#8E7582] mt-1">
                      <span>1 - Mild</span>
                      <span>3 - Moderate</span>
                      <span>5 - Strong</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveMood}
                    className="w-full py-2.5 bg-[#AB47BC] hover:bg-[#8E24AA] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Save Mood Log
                  </button>
                </div>
              )}

              {/* WATER TAB */}
              {activeTab === 'water' && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 bg-[#E1F5FE] text-[#0288D1] rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <Droplets className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#2D1420]">Quick Hydration Tracker</h4>
                    <p className="text-xs text-[#7C6A75] mt-1">Standard glass volume is 250 ml</p>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handleAddGlass}
                      className="px-6 py-2.5 bg-[#0288D1] hover:bg-[#0277BD] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add 1 Glass (+250ml)
                    </button>
                  </div>
                </div>
              )}

              {/* MEDICATION TAB */}
              {activeTab === 'medication' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-1">
                      Medication / Supplement Name
                    </label>
                    <input
                      type="text"
                      value={medName}
                      onChange={e => setMedName(e.target.value)}
                      placeholder="e.g. Iron Supplement, Meftal Spas"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FFF7F9] border border-[#FFE1E8] text-xs text-[#2D1420] focus:outline-hidden focus:border-[#E83D6F]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-1">
                      Dosage & Frequency
                    </label>
                    <input
                      type="text"
                      value={medDosage}
                      onChange={e => setMedDosage(e.target.value)}
                      placeholder="e.g. 1 Tablet once daily with dinner"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FFF7F9] border border-[#FFE1E8] text-xs text-[#2D1420] focus:outline-hidden focus:border-[#E83D6F]"
                    />
                  </div>

                  <button
                    onClick={() => triggerSuccess()}
                    className="w-full py-2.5 bg-[#E83D6F] hover:bg-[#D4265A] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Record Medication
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
