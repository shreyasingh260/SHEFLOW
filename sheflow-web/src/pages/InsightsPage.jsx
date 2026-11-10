import React, { useState } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Heart, 
  ArrowLeft, 
  Sparkles, 
  Zap, 
  Smile, 
  Brain, 
  Moon, 
  Utensils, 
  Dumbbell, 
  MessageCircle, 
  CheckCircle2, 
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { useHealth } from '../context/HealthContext';
import { cycleApi } from '../api/backendApi';

export default function InsightsPage({ onBack, onNavigateFlora }) {
  const { cycleData } = useHealth();
  const [selectedPhaseTab, setSelectedPhaseTab] = useState('CURRENT');

  // Dynamic forecast for the user's current cycle day
  const forecast = cycleApi.getPhaseForecast(cycleData.currentCycleDay, cycleData.predictedCycleLength);

  // 4-phase mood trajectory
  const phasesData = [
    {
      id: 'menstrual',
      name: 'Menstrual Phase',
      days: 'Days 1 - 5',
      energy: '62% Energy',
      mood: 'Reflective & Intuitive Renewal',
      icon: '🌙',
      color: 'border-[#FF94B1] bg-[#FFF0F4] text-[#E83D6F]',
      traits: ['Introspective', 'High Intuition', 'Craving Quiet Spaces'],
      floraNote: 'Your intuition is sharper now as both brain hemispheres communicate with balanced clarity. Give yourself permission to slow down.'
    },
    {
      id: 'follicular',
      name: 'Follicular Phase',
      days: 'Days 6 - 13',
      energy: '88% Energy',
      mood: 'Curious, Optimistic & Creative',
      icon: '💡',
      color: 'border-[#81D4FA] bg-[#E1F5FE] text-[#0288D1]',
      traits: ['High Ambition', 'Rapid Learning', 'Social Openness'],
      floraNote: 'Estrogen is steadily rising, boosting your neuroplasticity. Ideal window for learning new skills and initiating fresh projects.'
    },
    {
      id: 'ovulation',
      name: 'Ovulation Phase',
      days: 'Days 14 - 16',
      energy: '96% Energy',
      mood: 'High Confidence & Social Magnetism',
      icon: '🌸',
      color: 'border-[#CE93D8] bg-[#F3E5F5] text-[#8E24AA]',
      traits: ['Verbal Fluency', 'Peak Resilience', 'Charismatic'],
      floraNote: 'Peak estradiol and testosterone stimulate dopamine pathways. You will naturally speak persuasively and feel magnetic.'
    },
    {
      id: 'luteal',
      name: 'Luteal Phase',
      days: 'Days 17 - 28',
      energy: '78% → 54%',
      mood: 'Detail-Oriented → Sensitive Rest',
      icon: '🎯',
      color: 'border-[#FFE082] bg-[#FFF8E1] text-[#F57F17]',
      traits: ['Analytical Precision', 'Selective Socializing', 'Boundary Setting'],
      floraNote: 'Progesterone promotes nesting and analytical focus early on, shifting toward emotional receptivity before your period.'
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in select-text">
      {/* ── TOP NAV HEADER ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-white border border-[#FFE4EC] text-[#8E7582] hover:text-[#E83D6F] hover:bg-[#FFF5F7] transition-all shadow-xs cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#2D1420] tracking-tight">
              Flora AI Mood & Hormonal Insights
            </h1>
            <p className="text-xs sm:text-sm text-[#7C6A75] mt-0.5">
              Predictive emotional rhythm forecasting, energy trajectories & personalized phase recommendations
            </p>
          </div>
        </div>

        {onNavigateFlora && (
          <button
            onClick={onNavigateFlora}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 bg-[#FFF0F4] hover:bg-[#FFE1E8] text-[#E83D6F] border border-[#FFD3DF] rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#E83D6F]" />
            <span>Chat with Flora</span>
          </button>
        )}
      </div>

      {/* ── AI PREDICTED MOOD HERO CARD ── */}
      <div className="bg-gradient-to-br from-white via-[#FFF7F9] to-[#FFE8EE] rounded-3xl p-6 sm:p-8 border border-[#FFD3DF] shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-[#E83D6F] bg-[#FFE1E8] px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                <Brain className="w-3 h-3" />
                AI Emotional State Forecast
              </span>
              <span className="text-[11px] font-bold text-[#8E7582]">
                Day {cycleData.currentCycleDay} • {forecast.phase}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display text-[#2D1420] pt-1">
              Today's Predicted Mood: {forecast.predictedMood.primaryMood}
            </h2>
          </div>

          {/* Confidence Score Pill */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-[#FFD3DF] shadow-xs self-start sm:self-auto">
            <Sparkles className="w-4 h-4 text-[#E83D6F]" />
            <div>
              <span className="text-[10px] font-bold text-[#8E7582] uppercase block">AI Confidence</span>
              <span className="text-sm font-extrabold text-[#E83D6F]">
                {forecast.predictedMood.confidenceScore}% Accuracy
              </span>
            </div>
          </div>
        </div>

        {/* Biological Explanation Card */}
        <div className="p-4 bg-white/90 rounded-2xl border border-[#FFE1E8] space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8E7582] flex items-center gap-1">
            <Info className="w-3 h-3 text-[#E83D6F]" />
            Why Your Brain & Body Feel This Way Today:
          </span>
          <p className="text-xs sm:text-sm text-[#483742] leading-relaxed">
            "{forecast.predictedMood.emotionalDescription}"
          </p>
        </div>

        {/* 3 Metric Sliders: Confidence, Calmness, Stress Resistance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-[#FFE4EC]">
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-[#685361]">Confidence & Drive</span>
              <span className="text-[#E83D6F]">{forecast.predictedMood.confidenceScore}%</span>
            </div>
            <div className="w-full bg-[#FFE1E8] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#E83D6F] h-full rounded-full transition-all duration-700"
                style={{ width: `${forecast.predictedMood.confidenceScore}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#FFE4EC]">
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-[#685361]">Emotional Calm</span>
              <span className="text-[#0288D1]">{forecast.predictedMood.calmScore}%</span>
            </div>
            <div className="w-full bg-[#E1F5FE] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#0288D1] h-full rounded-full transition-all duration-700"
                style={{ width: `${forecast.predictedMood.calmScore}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#FFE4EC]">
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-[#685361]">Stress Sensitivity</span>
              <span className="text-[#2E7D32]">{forecast.predictedMood.stressSensitivity}</span>
            </div>
            <div className="w-full bg-[#E8F5E9] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#2E7D32] h-full rounded-full transition-all duration-700"
                style={{ width: '25%' }}
              />
            </div>
          </div>
        </div>

        {/* Flora AI Companion Advice Banner */}
        <div className="bg-[#FFF0F4] rounded-2xl p-4 border border-[#FFD3DF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-xl">🌸</span>
            <div>
              <span className="text-[10px] font-extrabold text-[#E83D6F] uppercase tracking-wider block">
                Flora AI Recommendation for Today
              </span>
              <p className="text-xs sm:text-sm text-[#2D1420] font-semibold mt-0.5">
                {forecast.predictedMood.floraTip}
              </p>
            </div>
          </div>

          {onNavigateFlora && (
            <button
              onClick={onNavigateFlora}
              className="px-4 py-2 bg-[#E83D6F] hover:bg-[#D4265A] active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
            >
              Discuss with Flora
            </button>
          )}
        </div>
      </div>

      {/* ── 4-PHASE EMOTIONAL RHYTHMS TRAJECTORY ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#FFE4EC] shadow-soft space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold font-display text-[#2D1420]">
              Your Monthly Emotional Rhythm Trajectory
            </h3>
            <p className="text-xs text-[#7C6A75]">
              How your mood, social energy, and mental focus naturally evolve across your 28-day cycle
            </p>
          </div>
          <span className="text-xs font-bold text-[#E83D6F] bg-[#FFF0F4] px-3 py-1 rounded-full border border-[#FFD3DF] self-start sm:self-auto">
            Hormonal Synchrony
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {phasesData.map((p) => {
            const isCurrent =
              (p.id === 'menstrual' && cycleData.currentCycleDay <= 5) ||
              (p.id === 'follicular' && cycleData.currentCycleDay > 5 && cycleData.currentCycleDay < 14) ||
              (p.id === 'ovulation' && cycleData.currentCycleDay >= 14 && cycleData.currentCycleDay <= 16) ||
              (p.id === 'luteal' && cycleData.currentCycleDay > 16);

            return (
              <div
                key={p.id}
                className={`rounded-2xl p-4 border-2 transition-all flex flex-col justify-between space-y-3 ${
                  isCurrent
                    ? `${p.color} shadow-md ring-2 ring-[#E83D6F]/30 scale-[1.02]`
                    : 'border-[#FFE8EE] bg-[#FFFBFD] text-[#2D1420]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{p.icon}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-current">
                      {p.days}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm mt-2">{p.name}</h4>
                  <p className="text-xs font-extrabold mt-0.5 opacity-90">{p.mood}</p>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {p.traits.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold bg-white/90 px-2 py-0.5 rounded-md border border-black/5"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed opacity-85 border-t border-black/5 pt-2">
                  {p.floraNote}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PHASE-SYNCED ACTION RECOMMENDATIONS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Workout Recommendation */}
        <div className="bg-white rounded-3xl p-6 border border-[#FFE4EC] shadow-soft space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFE4EC] text-[#E83D6F] flex items-center justify-center">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8E7582] block">
              Movement of the Day
            </span>
            <h4 className="font-bold text-base text-[#2D1420] mt-0.5">
              {forecast.workout.title}
            </h4>
          </div>
          <p className="text-xs text-[#7C6A75] leading-relaxed">
            {forecast.workout.description}
          </p>
          <div className="text-[11px] font-semibold text-[#E83D6F] pt-1">
            Intensity: <strong>{forecast.workout.intensity}</strong>
          </div>
        </div>

        {/* Nutrition Recommendation */}
        <div className="bg-white rounded-3xl p-6 border border-[#FFE4EC] shadow-soft space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8E7582] block">
              Mood Food Booster
            </span>
            <h4 className="font-bold text-base text-[#2D1420] mt-0.5">
              {forecast.nutrition.title}
            </h4>
          </div>
          <p className="text-xs text-[#7C6A75] leading-relaxed">
            {forecast.nutrition.focus}
          </p>
          <div className="flex flex-wrap gap-1 pt-1">
            {forecast.nutrition.eatMore.slice(0, 3).map((f, i) => (
              <span key={i} className="text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] px-2 py-0.5 rounded-full">
                + {f}
              </span>
            ))}
          </div>
        </div>

        {/* Mental Rest & Sleep */}
        <div className="bg-white rounded-3xl p-6 border border-[#FFE4EC] shadow-soft space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-[#EDE7F6] text-[#7E57C2] flex items-center justify-center">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8E7582] block">
              Night Sleep & Recovery
            </span>
            <h4 className="font-bold text-base text-[#2D1420] mt-0.5">
              7h 45m Restorative Sleep
            </h4>
          </div>
          <p className="text-xs text-[#7C6A75] leading-relaxed">
            Estrogen elevation supports rapid eye movement (REM) sleep. Aim to wind down by 10:30 PM with dim amber lighting.
          </p>
          <div className="text-[11px] font-semibold text-[#7E57C2] pt-1">
            Target Bedtime: <strong>10:30 PM</strong>
          </div>
        </div>
      </div>

      {/* ── GYNECOLOGICAL CONSISTENCY & REGULARITY ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#FFE4EC] shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#2D1420]">
            Clinical Cycle Health & Regularity Record
          </h3>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            High Regularity (98%)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
          <div className="p-4 bg-[#FFF9FA] rounded-2xl border border-[#FFE8EE]">
            <span className="text-[#8E7582] font-semibold block">Average Cycle Length</span>
            <span className="text-2xl font-black text-[#E83D6F] block mt-1">28.0 Days</span>
            <span className="text-[11px] text-[#7C6A75] mt-1 block">Optimal hormonal window</span>
          </div>

          <div className="p-4 bg-[#FFF9FA] rounded-2xl border border-[#FFE8EE]">
            <span className="text-[#8E7582] font-semibold block">Average Flow Duration</span>
            <span className="text-2xl font-black text-[#2D1420] block mt-1">4.8 Days</span>
            <span className="text-[11px] text-[#7C6A75] mt-1 block">Healthy clinical range (3-7 days)</span>
          </div>

          <div className="p-4 bg-[#FFF9FA] rounded-2xl border border-[#FFE8EE]">
            <span className="text-[#8E7582] font-semibold block">Next Ovulation Date</span>
            <span className="text-2xl font-black text-[#8E24AA] block mt-1">
              {cycleData.ovulationDate || 'July 01, 2026'}
            </span>
            <span className="text-[11px] text-[#7C6A75] mt-1 block">Fertile window: 5 days prior</span>
          </div>
        </div>
      </div>
    </div>
  );
}
