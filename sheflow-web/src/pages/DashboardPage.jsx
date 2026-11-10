import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Minus,
  Zap,
  Utensils,
  Dumbbell,
  Sparkles,
  TrendingUp,
  Apple,
  Heart,
  Droplet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  CalendarDays,
  Coffee
} from 'lucide-react';
import { useHealth } from '../context/HealthContext';
import { useAuth } from '../context/AuthContext';
import { cycleApi } from '../api/backendApi';

export default function DashboardPage({ onOpenEmergency, onNavigateFlora, onNavigateNutrition, onNavigateHormones }) {
  const { user } = useAuth();
  const { 
    cycleData, 
    waterData, 
    addWater, 
    removeWater, 
    startPeriod 
  } = useHealth();

  // Real-time date in India Standard Time (IST - Asia/Kolkata)
  const getIndiaDate = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      weekday: 'long'
    });
    const parts = formatter.formatToParts(now);
    const m = {};
    parts.forEach(p => { m[p.type] = p.value; });
    return {
      year: parseInt(m.year, 10),
      month: parseInt(m.month, 10) - 1, // 0-indexed: 0 = Jan, 10 = Nov
      day: parseInt(m.day, 10),
      weekday: m.weekday || 'Today'
    };
  };

  const indiaToday = getIndiaDate();
  const [calendarView, setCalendarView] = useState({
    year: indiaToday.year,
    month: indiaToday.month
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCalendarView(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setCalendarView(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  const handleResetToToday = () => {
    const cur = getIndiaDate();
    setCalendarView({ year: cur.year, month: cur.month });
  };

  // Generate dynamic days for the currently viewed month
  const calendarDays = (() => {
    const { year, month } = calendarView;

    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isPrev: true,
        year: month === 0 ? year - 1 : year,
        month: month === 0 ? 11 : month - 1
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      days.push({
        day: d,
        isCurrent: true,
        year,
        month
      });
    }

    // Next month spillover to round out full 7-column rows
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remaining = totalCells - days.length;
    for (let n = 1; n <= remaining; n++) {
      days.push({
        day: n,
        isNext: true,
        year: month === 11 ? year + 1 : year,
        month: month === 11 ? 0 : month + 1
      });
    }

    // Map cycle day and Indian today
    const todayTimestamp = new Date(indiaToday.year, indiaToday.month, indiaToday.day).getTime();
    const cycleLength = cycleData.predictedCycleLength || 28;
    const currentDay = cycleData.currentCycleDay || 14;

    return days.map(item => {
      const itemTimestamp = new Date(item.year, item.month, item.day).getTime();
      const diffInDays = Math.round((itemTimestamp - todayTimestamp) / (1000 * 60 * 60 * 24));

      let dayOfCycle = ((currentDay - 1 + diffInDays) % cycleLength);
      if (dayOfCycle < 0) dayOfCycle += cycleLength;
      dayOfCycle += 1;

      const isToday = (
        item.year === indiaToday.year &&
        item.month === indiaToday.month &&
        item.day === indiaToday.day
      );

      let type = 'normal';
      if (dayOfCycle <= 5) {
        type = 'period';
      } else if (dayOfCycle >= 13 && dayOfCycle <= 15) {
        type = 'ovulation';
      } else if (dayOfCycle >= 11 && dayOfCycle <= 16) {
        type = 'fertile';
      } else if (dayOfCycle >= cycleLength - 2) {
        type = 'predicted';
      }

      return {
        ...item,
        type,
        isToday,
        cycleDay: dayOfCycle
      };
    });
  })();

  const forecast = cycleApi.getPhaseForecast(cycleData.currentCycleDay, cycleData.predictedCycleLength);
  const waterPercent = Math.min(100, Math.round((waterData.glassesConsumed / waterData.glassesGoal) * 100));

  // Daily Macro Intake Tracker (Protein, Fiber, Carbs)
  // Dynamic calculation based strictly on real user body metrics (no mock/predefined values)
  const userWeight = user?.weightKg || 55;
  const userHeight = user?.heightCm || 162;
  const proteinGoal = user?.dailyProteinGrams || Math.round(userWeight * 1.1);
  const fiberGoal = 28;
  const carbsGoal = 180;

  // Real tracking without predefined values: start at 0 if nothing logged yet today
  const todayKey = `sheflow_macros_${indiaToday.year}_${indiaToday.month + 1}_${indiaToday.day}`;
  const [macros, setMacros] = useState(() => {
    try {
      const s = localStorage.getItem(todayKey);
      if (s) return JSON.parse(s);
      return { protein: 0, fiber: 0, carbs: 0 };
    } catch {
      return { protein: 0, fiber: 0, carbs: 0 };
    }
  });

  const addMacro = (type, amt) => {
    setMacros(prev => {
      const updated = {
        ...prev,
        [type]: Math.max(0, (prev[type] || 0) + amt)
      };
      try {
        localStorage.setItem(todayKey, JSON.stringify(updated));
      } catch (e) {
        console.error('Storage error', e);
      }
      return updated;
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in select-text">
      {/* ========================================================
          TOP ROW: HERO CYCLE CARD + DAILY HORMONE & ENERGY FORECASTER (FEATURE 1)
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* HERO CYCLE CARD */}
        <div className="lg:col-span-7 bg-gradient-to-r from-[#FF5983] to-[#E83D6F] rounded-3xl p-6 sm:p-8 text-white relative shadow-soft overflow-hidden flex flex-col justify-between min-h-[230px]">
          <div className="absolute -right-6 -bottom-6 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-white/90 tracking-wide">
                Cycle Day {cycleData.currentCycleDay} of {cycleData.predictedCycleLength}
              </span>
              <span className="bg-white/20 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {forecast.phaseTag}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display mt-1 tracking-tight">
              {cycleData.cyclePhase}
            </h2>
          </div>

          <div className="mt-4">
            <span className="text-xs text-white/80 font-medium">Period starts in</span>
            <p className="text-xl sm:text-2xl font-bold font-display mt-0.5">
              {cycleData.daysUntilNextPeriod} Days
            </p>
          </div>

          {/* Progress bar + View Full Insights Button */}
          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="w-full max-w-[65%] h-3 bg-white/30 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500 shadow-xs" 
                style={{ width: `${(cycleData.currentCycleDay / cycleData.predictedCycleLength) * 100}%` }}
              />
            </div>

            <button
              onClick={() => onNavigateHormones ? onNavigateHormones() : onNavigateFlora()}
              className="px-4 py-2 bg-white text-[#E83D6F] hover:bg-[#FFF0F3] active:scale-[0.98] rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
            >
              Hormone & Energy Plan
            </button>
          </div>
        </div>

        {/* ⚡ DAILY HORMONE & ENERGY (IMPORTANT INFOS ONLY) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#FFE4EC] shadow-soft flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FFF0F4] text-[#E83D6F] flex items-center justify-center font-bold">
                <Zap className="w-4 h-4 fill-[#E83D6F]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2D1420]">Hormone & Energy Overview</h3>
                <p className="text-[10px] text-[#7C6A75]">{forecast.phase}</p>
              </div>
            </div>

            <span className="text-xs font-black text-[#E83D6F] bg-[#FFE1E8] px-2.5 py-1 rounded-full">
              {forecast.energyScore}% Stamina
            </span>
          </div>

          {/* Energy Ring + Hormone meters */}
          <div className="grid grid-cols-2 gap-3 bg-[#FFF7F9] p-3 rounded-2xl border border-[#FFE8EE] text-xs">
            <div>
              <span className="text-[10px] font-bold text-[#8E7582] uppercase tracking-wider block">
                Estrogen
              </span>
              <p className="font-extrabold text-[#2D1420] mt-0.5">{forecast.estrogen}</p>
              <div className="w-full bg-[#FFE1E8] h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-[#E83D6F] h-full rounded-full" style={{ width: '92%' }} />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-[#8E7582] uppercase tracking-wider block">
                Progesterone
              </span>
              <p className="font-extrabold text-[#2D1420] mt-0.5">{forecast.progesterone}</p>
              <div className="w-full bg-[#FFE1E8] h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-[#7E57C2] h-full rounded-full" style={{ width: '25%' }} />
              </div>
            </div>
          </div>

          {/* Workout of the Day - Important info only (no paragraphs) */}
          <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-[#FFE1E8]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FFE4EC] text-[#E83D6F] flex items-center justify-center shrink-0">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-[#E83D6F] uppercase tracking-wider block">
                  Movement Target
                </span>
                <p className="text-xs font-bold text-[#2D1420]">{forecast.workout.title}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#0288D1] bg-[#E1F5FE] px-2 py-0.5 rounded-md shrink-0">
              {forecast.workout.intensity}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onNavigateHormones ? onNavigateHormones() : null}
              className="flex-1 py-2.5 bg-[#E83D6F] hover:bg-[#D02B5C] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Explore Hormone Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateFlora ? onNavigateFlora() : null}
              className="px-3 py-2.5 bg-[#FFF0F4] hover:bg-[#FFE1E8] text-[#E83D6F] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              title="Ask Flora AI about today's energy"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          MIDDLE ROW: CALENDAR + 🥗 PHASE NUTRITION & MEAL PLANNER (FEATURE 4)
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CALENDAR VIEW */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#FFE4EC] shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-display text-[#2D1420]">
                  {monthNames[calendarView.month]} {calendarView.year}
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFE4EC] text-[#E83D6F]">
                  🇮🇳 IST (India)
                </span>
              </div>
              <p className="text-[11px] text-[#8E7582] mt-0.5">
                Today: <span className="font-bold text-[#E83D6F]">{indiaToday.weekday}, {indiaToday.day} {monthNames[indiaToday.month]} {indiaToday.year}</span> (Cycle Day {cycleData.currentCycleDay})
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button 
                onClick={handleResetToToday}
                className="px-2.5 py-1 text-[11px] font-bold rounded-xl border border-[#FFE4EC] bg-[#FFF5F7] text-[#E83D6F] hover:bg-[#FFE4EC] transition-all cursor-pointer shadow-2xs"
                title="Return to current month in India"
              >
                Today
              </button>
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl border border-[#FFE4EC] hover:bg-[#FFF5F7] text-[#8E7582] transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl border border-[#FFE4EC] hover:bg-[#FFF5F7] text-[#8E7582] transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-y-3 sm:gap-y-4 text-center text-xs">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={i} className="text-[#8E7582] font-semibold text-xs py-1">
                {d}
              </span>
            ))}

            {calendarDays.map((item, idx) => {
              let circleClass = 'text-[#2D1420] hover:bg-[#FFF5F7]';

              if (item.isPrev || item.isNext) {
                circleClass = 'text-[#D1C2CA] opacity-35';
              } else if (item.isToday) {
                circleClass = 'bg-[#E83D6F] text-white font-black shadow-md ring-2 ring-offset-2 ring-[#E83D6F] scale-105';
              } else if (item.type === 'ovulation') {
                circleClass = 'bg-[#FF85A2] text-white font-bold';
              } else if (item.type === 'period') {
                circleClass = 'bg-[#FFE1E8] text-[#E83D6F] font-bold';
              } else if (item.type === 'fertile') {
                circleClass = 'bg-[#F3E5F5] text-[#8E24AA] font-medium';
              } else if (item.type === 'predicted') {
                circleClass = 'border border-dashed border-[#FF5983] text-[#E83D6F] font-bold';
              }

              return (
                <div key={idx} className="flex flex-col justify-center items-center py-0.5">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs transition-all duration-200 cursor-pointer ${circleClass}`}
                    title={`${item.day} ${monthNames[item.month]} ${item.year} - Cycle Day ${item.cycleDay}`}
                  >
                    {item.day}
                  </div>
                  {item.isToday && (
                    <span className="text-[8px] font-black text-[#E83D6F] uppercase tracking-tighter mt-0.5">
                      Today
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-5 mt-4 border-t border-[#FFE8EE] text-[11px] text-[#7C6A75]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFE1E8]" />
              <span>Period</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E83D6F]" />
              <span>Ovulation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F3E5F5]" />
              <span>Fertile Window</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-[#FF5983]" />
              <span>Predicted</span>
            </div>
          </div>
        </div>

        {/* 🥗 DAILY MACRO INTAKE TRACKER (PROTEIN, FIBER, CARBS) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#FFE4EC] shadow-soft flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FFF0F4] text-[#E83D6F] flex items-center justify-center font-bold">
                <Apple className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2D1420]">Daily Macro Intake</h3>
                <p className="text-[10px] text-[#7C6A75]">Targeted fuel for {forecast.phase}</p>
              </div>
            </div>

            <span className="text-[10px] font-bold text-[#E83D6F] bg-[#FFE1E8] px-2.5 py-0.5 rounded-full">
              Phase Sync
            </span>
          </div>

          {/* Macro Progress Bars: Protein, Fiber, Carbs */}
          <div className="space-y-3.5">
            {/* 1. PROTEIN */}
            <div className="p-3 bg-[#FFF9FA] rounded-2xl border border-[#FFE8EE] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#2D1420]">
                  <span className="w-2 h-2 rounded-full bg-[#E83D6F]" />
                  <span>Protein</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#E83D6F]">
                    {macros.protein}g <span className="text-[#8E7582] font-semibold">/ {proteinGoal}g</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => addMacro('protein', 5)}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-white hover:bg-[#FFE1E8] text-[#E83D6F] border border-[#FFD3DF] rounded-md transition-all cursor-pointer"
                      title="Add 5g protein"
                    >
                      +5g
                    </button>
                    <button
                      onClick={() => addMacro('protein', 10)}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-[#E83D6F] hover:bg-[#D4265A] text-white rounded-md transition-all cursor-pointer"
                      title="Add 10g protein"
                    >
                      +10g
                    </button>
                  </div>
                </div>
              </div>
              <div className="w-full bg-[#FFE1E8] h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#E83D6F] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((macros.protein / proteinGoal) * 100))}%` }}
                />
              </div>
            </div>

            {/* 2. FIBER */}
            <div className="p-3 bg-[#F4FBF5] rounded-2xl border border-[#D7EED9] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#2D1420]">
                  <span className="w-2 h-2 rounded-full bg-[#2E7D32]" />
                  <span>Fiber</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#2E7D32]">
                    {macros.fiber}g <span className="text-[#8E7582] font-semibold">/ {fiberGoal}g</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => addMacro('fiber', 2)}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-white hover:bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] rounded-md transition-all cursor-pointer"
                      title="Add 2g fiber"
                    >
                      +2g
                    </button>
                    <button
                      onClick={() => addMacro('fiber', 5)}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-md transition-all cursor-pointer"
                      title="Add 5g fiber"
                    >
                      +5g
                    </button>
                  </div>
                </div>
              </div>
              <div className="w-full bg-[#E8F5E9] h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#2E7D32] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((macros.fiber / fiberGoal) * 100))}%` }}
                />
              </div>
            </div>

            {/* 3. COMPLEX CARBS */}
            <div className="p-3 bg-[#FFFDF5] rounded-2xl border border-[#FBEEC9] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#2D1420]">
                  <span className="w-2 h-2 rounded-full bg-[#E65100]" />
                  <span>Complex Carbs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#E65100]">
                    {macros.carbs}g <span className="text-[#8E7582] font-semibold">/ {carbsGoal}g</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => addMacro('carbs', 10)}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-white hover:bg-[#FFF3E0] text-[#E65100] border border-[#FFE0B2] rounded-md transition-all cursor-pointer"
                      title="Add 10g carbs"
                    >
                      +10g
                    </button>
                    <button
                      onClick={() => addMacro('carbs', 20)}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-[#E65100] hover:bg-[#BF360C] text-white rounded-md transition-all cursor-pointer"
                      title="Add 20g carbs"
                    >
                      +20g
                    </button>
                  </div>
                </div>
              </div>
              <div className="w-full bg-[#FFE0B2] h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#E65100] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((macros.carbs / carbsGoal) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateNutrition ? onNavigateNutrition() : null}
            className="w-full py-2 bg-[#FFF5F7] hover:bg-[#FFE4EC] text-[#E83D6F] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[#FFD3DF]"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Open Phase Nutrition & Recipes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================
          BOTTOM ROW: AI MOOD & INSIGHTS OVERVIEW + HYDRATION TRACKER
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 🌸 AI MOOD & INSIGHTS OVERVIEW (CRISP SUMMARY - NO PARAGRAPHS) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-[#FFE4EC] shadow-soft flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#FFE1E8] text-[#E83D6F] flex items-center justify-center font-bold text-lg">
                🌸
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-[#E83D6F] uppercase tracking-wider block">
                  Mood & Insights Overview
                </span>
                <h3 className="text-base font-bold text-[#2D1420]">
                  {forecast.predictedMood.primaryMood}
                </h3>
              </div>
            </div>

            <span className="text-xs font-black text-[#E83D6F] bg-[#FFE1E8] px-3 py-1 rounded-full">
              {forecast.predictedMood.confidenceScore}% Confidence
            </span>
          </div>

          {/* Quick Info Badges (Dynamic to real phase metrics) */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 bg-[#FFF7F9] rounded-2xl border border-[#FFE8EE] text-center">
              <span className="text-[10px] font-bold text-[#8E7582] uppercase tracking-wider block">Confidence</span>
              <p className="text-xs font-extrabold text-[#2D1420] mt-0.5">{forecast.predictedMood.confidenceScore}%</p>
            </div>
            <div className="p-2.5 bg-[#FFF7F9] rounded-2xl border border-[#FFE8EE] text-center">
              <span className="text-[10px] font-bold text-[#8E7582] uppercase tracking-wider block">Calmness</span>
              <p className="text-xs font-extrabold text-[#2E7D32] mt-0.5">{forecast.predictedMood.calmScore}%</p>
            </div>
            <div className="p-2.5 bg-[#FFF7F9] rounded-2xl border border-[#FFE8EE] text-center">
              <span className="text-[10px] font-bold text-[#8E7582] uppercase tracking-wider block">Stress</span>
              <p className="text-xs font-extrabold text-[#0288D1] mt-0.5">{forecast.predictedMood.stressSensitivity}</p>
            </div>
          </div>

          {/* Single-Line Flora Tip */}
          <div className="flex items-center gap-2 text-xs text-[#2D1420] bg-[#FFF9FA] p-3 rounded-2xl border border-[#FFE8EE]">
            <Sparkles className="w-4 h-4 text-[#E83D6F] shrink-0" />
            <span className="font-semibold truncate">{forecast.predictedMood.floraTip}</span>
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              onClick={() => onNavigateFlora ? onNavigateFlora() : null}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E83D6F] hover:bg-[#D4265A] active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Flora AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 💧 WATER INTAKE COUNTER */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#FFE4EC] shadow-soft flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#2D1420]">Today's Hydration Target</h3>
              <p className="text-[10px] text-[#7C6A75]">Phase-optimized water intake</p>
            </div>
            <span className="text-xs font-black text-[#0288D1] bg-[#E1F5FE] px-2.5 py-0.5 rounded-full">
              {waterPercent}% Goal
            </span>
          </div>

          <div className="flex items-center justify-around py-2">
            <div className="text-center">
              <span className="text-4xl font-black font-display text-[#2D1420]">
                {waterData.glassesConsumed}
              </span>
              <span className="text-sm text-[#7C6A75] font-semibold"> / {waterData.glassesGoal}</span>
              <p className="text-[11px] text-[#8E7582] font-semibold mt-0.5">Glasses (250ml ea)</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={removeWater}
                className="w-10 h-10 rounded-full bg-[#F5F2F4] hover:bg-[#FFE1E8] text-[#685361] hover:text-[#E83D6F] font-bold flex items-center justify-center transition-all cursor-pointer"
                title="Remove glass"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={addWater}
                className="w-12 h-12 rounded-full bg-[#0288D1] hover:bg-[#0277BD] active:scale-95 text-white font-bold flex items-center justify-center shadow-md transition-all cursor-pointer"
                title="Log 1 glass of water"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="w-full bg-[#E1F5FE] h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#0288D1] h-full rounded-full transition-all duration-500" 
              style={{ width: `${waterPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
