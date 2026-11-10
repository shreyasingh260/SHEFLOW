import React, { createContext, useContext, useState, useEffect } from 'react';
import { cycleApi, waterApi, trackingApi } from '../api/backendApi';
import confetti from 'canvas-confetti';

const HealthContext = createContext(null);

export const HealthProvider = ({ children }) => {
  const getIndiaIsoDate = (offsetDays = 0) => {
    const d = new Date(Date.now() + offsetDays * 86400000);
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });
    return formatter.format(d);
  };

  const [cycleData, setCycleData] = useState({
    currentCycleDay: 14,
    cyclePhase: 'Ovulation Phase',
    daysUntilNextPeriod: 14,
    predictedCycleLength: 28,
    isIrregular: false,
    nextPeriodDate: getIndiaIsoDate(14)
  });

  const [waterData, setWaterData] = useState({
    glassesConsumed: 0,
    glassesGoal: 8
  });

  const [todaySummary, setTodaySummary] = useState({
    mood: 'Good',
    sleep: '7h 30m',
    steps: 0,
    medicine: 'Pending',
    water: '0 / 8'
  });

  const [recentActivities, setRecentActivities] = useState([
    { id: 1, text: 'Logged water', time: '9:15 AM', color: 'bg-[#29B6F6]' },
    { id: 2, text: 'Mood updated', time: '11:20 AM', color: 'bg-[#AB47BC]' },
    { id: 3, text: 'Symptoms added', time: '2:45 PM', color: 'bg-[#FF5983]' },
    { id: 4, text: 'Medicine marked complete', time: '7:30 PM', color: 'bg-[#FFA726]' }
  ]);

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Hydration Goal', message: 'You are 3 glasses away from your daily 8-glass goal!', time: '10m ago', unread: true },
    { id: 2, title: 'Ovulation Window', message: 'Peak fertility window active today.', time: '2h ago', unread: true },
    { id: 3, title: 'Flora Tip', message: 'Remember to stretch and stay hydrated.', time: '5h ago', unread: false }
  ]);

  // Load initial data
  useEffect(() => {
    async function init() {
      const c = await cycleApi.getPrediction();
      if (c) setCycleData(c);
      const w = await waterApi.getToday();
      if (w) {
        setWaterData(w);
        setTodaySummary(prev => ({ ...prev, water: `${w.glassesConsumed} / ${w.glassesGoal}` }));
      }
    }
    init();
  }, []);

  const addWater = async () => {
    const updated = await waterApi.addWater(250);
    setWaterData(updated);
    setTodaySummary(prev => ({ ...prev, water: `${updated.glassesConsumed} / ${updated.glassesGoal}` }));
    
    // Add activity
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setRecentActivities(prev => [{ id: Date.now(), text: 'Logged 1 glass of water', time, color: 'bg-[#29B6F6]' }, ...prev.slice(0, 5)]);

    if (updated.glassesConsumed >= updated.glassesGoal) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
  };

  const removeWater = async () => {
    const updated = await waterApi.removeWater(250);
    setWaterData(updated);
    setTodaySummary(prev => ({ ...prev, water: `${updated.glassesConsumed} / ${updated.glassesGoal}` }));
  };

  const logSymptoms = async ({ symptoms, severity, notes }) => {
    const date = new Date().toISOString().split('T')[0];
    await trackingApi.logSymptoms({ date, symptoms, severity, notes });
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setRecentActivities(prev => [{ id: Date.now(), text: `Logged symptoms: ${symptoms.slice(0, 2).join(', ')}`, time, color: 'bg-[#FF5983]' }, ...prev.slice(0, 5)]);
  };

  const logMood = async ({ moods, intensity, notes }) => {
    const date = new Date().toISOString().split('T')[0];
    await trackingApi.logMood({ date, moods, intensity, notes });
    setTodaySummary(prev => ({ ...prev, mood: moods[0] || 'Good' }));
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setRecentActivities(prev => [{ id: Date.now(), text: `Mood updated: ${moods.join(', ')}`, time, color: 'bg-[#AB47BC]' }, ...prev.slice(0, 5)]);
  };

  const startPeriod = async () => {
    await cycleApi.startPeriod();
    setCycleData(prev => ({
      ...prev,
      currentCycleDay: 1,
      cyclePhase: 'Menstrual Phase (Period)',
      daysUntilNextPeriod: prev.predictedCycleLength
    }));
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setRecentActivities(prev => [{ id: Date.now(), text: 'Period started (Day 1 logged)', time, color: 'bg-[#E83D6F]' }, ...prev.slice(0, 5)]);
  };

  return (
    <HealthContext.Provider value={{
      cycleData,
      waterData,
      todaySummary,
      recentActivities,
      notifications,
      addWater,
      removeWater,
      logSymptoms,
      logMood,
      startPeriod
    }}>
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (!context) throw new Error('useHealth must be used within HealthProvider');
  return context;
};
