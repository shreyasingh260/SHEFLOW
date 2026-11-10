import React, { useState } from 'react';
import {
  Calendar, Droplets, Heart, ChevronRight, ChevronLeft,
  CheckCircle2, AlertCircle, ArrowRight, Sparkles
} from 'lucide-react';
import { userApi } from '../api/backendApi';
import { useAuth } from '../context/AuthContext';

/* ─── helpers ─────────────────────────────────────────────── */
const Input = ({ label, hint, error, ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm font-semibold text-[#2D1420]">{label}</label>}
    <input
      {...props}
      className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium text-[#2D1420]
        bg-white placeholder-[#B89DAA] outline-none transition-all
        focus:ring-2 focus:ring-[#E83D6F]/30 focus:border-[#E83D6F]
        ${error ? 'border-red-400' : 'border-[#FFD3DF]'}
        ${props.disabled ? 'bg-[#FFF5F7] text-[#B89DAA] cursor-not-allowed' : ''}`}
    />
    {hint && !error && <p className="text-xs text-[#9A7A85]">{hint}</p>}
    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm font-semibold text-[#2D1420]">{label}</label>}
    <select
      {...props}
      className="w-full px-4 py-3 rounded-2xl border border-[#FFD3DF] text-sm font-medium
        text-[#2D1420] bg-white outline-none transition-all
        focus:ring-2 focus:ring-[#E83D6F]/30 focus:border-[#E83D6F]"
    >
      {children}
    </select>
  </div>
);

const ToggleChip = ({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all
      ${selected
        ? 'bg-[#E83D6F] text-white border-[#E83D6F] shadow-sm'
        : 'bg-white text-[#685361] border-[#FFD3DF] hover:border-[#E83D6F] hover:text-[#E83D6F]'}`}
  >
    {label}
  </button>
);

const StepDot = ({ active, done, n }) => (
  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
    ${done ? 'bg-[#E83D6F] border-[#E83D6F] text-white'
      : active ? 'bg-white border-[#E83D6F] text-[#E83D6F]'
      : 'bg-white border-[#FFD3DF] text-[#B89DAA]'}`}>
    {done ? <CheckCircle2 className="w-4 h-4" /> : n}
  </div>
);

const STEPS = [
  { label: 'Cycle Info', icon: Calendar },
  { label: 'Body & Flow', icon: Heart },
  { label: 'Daily Goals', icon: Droplets },
];

const calculateProtein = (weight, activity = 'MODERATE') => {
  const w = parseFloat(weight) || 55;
  let multiplier = 1.1; // Moderate: 1.1g/kg
  if (activity === 'SEDENTARY') multiplier = 0.9;
  if (activity === 'ACTIVE') multiplier = 1.3;
  return Math.round(w * multiplier);
};

const calculateBmi = (weight, height) => {
  const w = parseFloat(weight) || 55;
  const hM = (parseFloat(height) || 162) / 100;
  if (hM <= 0) return '21.0';
  return (w / (hM * hM)).toFixed(1);
};

const SYMPTOMS_OPTIONS = [
  'Cramps', 'Bloating', 'Headache', 'Back pain',
  'Mood swings', 'Breast tenderness', 'Fatigue', 'Acne', 'Nausea',
];

/* ─── main component ──────────────────────────────────────── */
export default function OnboardingPage({ onComplete }) {
  const { user, completeOnboarding } = useAuth();
  const firstName = user?.fullName?.split(' ')[0] || 'there';

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  /* form state */
  const [form, setForm] = useState({
    lastPeriodStart: '',
    cycleLengthDays: 28,
    periodLengthDays: 5,
    flowIntensity: 'MEDIUM',
    regularity: 'REGULAR',
    onBirthControl: false,
    commonSymptoms: [],
    waterGoal: 8,
    weightKg: 55,
    heightCm: 162,
    activityLevel: 'MODERATE',
    dailyProteinGrams: 60,
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const toggleSymptom = (s) =>
    set('commonSymptoms', form.commonSymptoms.includes(s)
      ? form.commonSymptoms.filter(x => x !== s)
      : [...form.commonSymptoms, s]);

  /* ─── validation per step ─── */
  const validate = () => {
    if (step === 0) {
      if (!form.lastPeriodStart) return 'Please enter your last period start date.';
      const d = new Date(form.lastPeriodStart);
      if (isNaN(d.getTime())) return 'Enter a valid date.';
      if (d > new Date()) return 'Date cannot be in the future.';
    }
    return '';
  };

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
  };

  const prev = () => { setError(''); setStep(s => s - 1); };

  /* ─── submit ─── */
  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      await completeOnboarding({
        lastPeriodStart: form.lastPeriodStart,
        cycleLengthDays: Number(form.cycleLengthDays),
        periodLengthDays: Number(form.periodLengthDays),
        flowIntensity: form.flowIntensity,
        regularity: form.regularity,
        onBirthControl: form.onBirthControl,
        waterGoal: Number(form.waterGoal),
        weightKg: Number(form.weightKg),
        heightCm: Number(form.heightCm),
        dailyProteinGrams: Number(form.dailyProteinGrams),
      });
      onComplete();
    } catch (e) {
      setError(e.message || 'Could not save your info. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ─── step panels ─── */
  const panels = [
    /* STEP 0 — Cycle Info */
    <div key="s0" className="space-y-5">
      <div className="p-4 bg-[#FFF0F4] rounded-2xl border border-[#FFD3DF] text-sm text-[#685361] leading-relaxed">
        <span className="font-bold text-[#E83D6F]">Why we ask this:</span> Your last period date lets us calculate your current cycle day, predict your next period, and identify your fertile window accurately.
      </div>

      <Input
        label="When did your last period start?"
        type="date"
        value={form.lastPeriodStart}
        max={new Date().toISOString().split('T')[0]}
        onChange={e => set('lastPeriodStart', e.target.value)}
        error={error}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-[#2D1420]">
            Average cycle length <span className="text-[#9A7A85] font-normal">(days)</span>
          </label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => set('cycleLengthDays', Math.max(21, form.cycleLengthDays - 1))}
              className="w-9 h-9 rounded-full bg-[#FFE4EC] text-[#E83D6F] font-bold text-lg flex items-center justify-center hover:bg-[#FFD3DF] transition">−</button>
            <span className="text-2xl font-extrabold text-[#2D1420] min-w-[2.5rem] text-center">{form.cycleLengthDays}</span>
            <button type="button" onClick={() => set('cycleLengthDays', Math.min(45, form.cycleLengthDays + 1))}
              className="w-9 h-9 rounded-full bg-[#FFE4EC] text-[#E83D6F] font-bold text-lg flex items-center justify-center hover:bg-[#FFD3DF] transition">+</button>
          </div>
          <p className="text-xs text-[#9A7A85]">Typical: 21–35 days</p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-[#2D1420]">
            Period duration <span className="text-[#9A7A85] font-normal">(days)</span>
          </label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => set('periodLengthDays', Math.max(1, form.periodLengthDays - 1))}
              className="w-9 h-9 rounded-full bg-[#FFE4EC] text-[#E83D6F] font-bold text-lg flex items-center justify-center hover:bg-[#FFD3DF] transition">−</button>
            <span className="text-2xl font-extrabold text-[#2D1420] min-w-[2.5rem] text-center">{form.periodLengthDays}</span>
            <button type="button" onClick={() => set('periodLengthDays', Math.min(10, form.periodLengthDays + 1))}
              className="w-9 h-9 rounded-full bg-[#FFE4EC] text-[#E83D6F] font-bold text-lg flex items-center justify-center hover:bg-[#FFD3DF] transition">+</button>
          </div>
          <p className="text-xs text-[#9A7A85]">Typical: 3–7 days</p>
        </div>
      </div>

      <Select label="How regular is your cycle?" value={form.regularity} onChange={e => set('regularity', e.target.value)}>
        <option value="REGULAR">Regular (± 1–2 days)</option>
        <option value="MOSTLY_REGULAR">Mostly regular (± 3–5 days)</option>
        <option value="IRREGULAR">Irregular (varies a lot)</option>
      </Select>
    </div>,

    /* STEP 1 — Body & Flow Health */
    <div key="s1" className="space-y-5">
      {/* 🏋️ Body Metrics & Live Protein Recommendation */}
      <div className="p-4 bg-gradient-to-br from-[#FFF0F4] via-white to-[#FFF5F7] rounded-2xl border border-[#FFD3DF] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🥗</span>
            <h3 className="text-sm font-bold text-[#2D1420]">Body Metrics & Protein Target</h3>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFE1E8] text-[#E83D6F]">
            Personalized
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#685361]">Weight (kg)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="30"
                max="180"
                value={form.weightKg}
                onChange={e => {
                  const val = Number(e.target.value);
                  set('weightKg', val);
                  set('dailyProteinGrams', calculateProtein(val, form.activityLevel));
                }}
                className="w-full px-3 py-2 rounded-xl border border-[#FFD3DF] text-sm font-bold text-[#2D1420] outline-none focus:border-[#E83D6F]"
              />
              <span className="text-xs text-[#9A7A85] font-bold">kg</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#685361]">Height (cm)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="100"
                max="230"
                value={form.heightCm}
                onChange={e => set('heightCm', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#FFD3DF] text-sm font-bold text-[#2D1420] outline-none focus:border-[#E83D6F]"
              />
              <span className="text-xs text-[#9A7A85] font-bold">cm</span>
            </div>
          </div>
        </div>

        {/* Activity Level Selector */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-[#685361]">Daily Activity Level</label>
            <span className="text-[10px] text-[#9A7A85]">BMI: {calculateBmi(form.weightKg, form.heightCm)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'SEDENTARY', label: 'Light', mult: '0.9x' },
              { id: 'MODERATE', label: 'Moderate', mult: '1.1x' },
              { id: 'ACTIVE', label: 'Active', mult: '1.3x' }
            ].map(act => (
              <button
                key={act.id}
                type="button"
                onClick={() => {
                  set('activityLevel', act.id);
                  set('dailyProteinGrams', calculateProtein(form.weightKg, act.id));
                }}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                  form.activityLevel === act.id
                    ? 'bg-[#E83D6F] text-white border-[#E83D6F] shadow-xs'
                    : 'bg-white text-[#685361] border-[#FFD3DF] hover:border-[#E83D6F]/40'
                }`}
              >
                <div>{act.label}</div>
                <div className="text-[9px] opacity-80">{act.mult}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Live crisp recommendation card */}
        <div className="bg-[#FFF5F7] rounded-xl p-3 border border-[#FFE1E8] space-y-2 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#685361]">Recommended Daily Protein:</span>
            <span className="text-base font-black text-[#E83D6F]">
              {form.dailyProteinGrams}g / day
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] pt-1 border-t border-[#FFE8EE]">
            <div className="bg-white p-1.5 rounded-lg border border-[#FFE8EE]">
              <span className="font-bold text-[#2D1420] block">~{Math.round(form.dailyProteinGrams * 0.3)}g</span>
              <span className="text-[#8E7582]">Breakfast</span>
            </div>
            <div className="bg-white p-1.5 rounded-lg border border-[#FFE8EE]">
              <span className="font-bold text-[#2D1420] block">~{Math.round(form.dailyProteinGrams * 0.4)}g</span>
              <span className="text-[#8E7582]">Lunch</span>
            </div>
            <div className="bg-white p-1.5 rounded-lg border border-[#FFE8EE]">
              <span className="font-bold text-[#2D1420] block">~{Math.round(form.dailyProteinGrams * 0.3)}g</span>
              <span className="text-[#8E7582]">Dinner</span>
            </div>
          </div>
          <p className="text-[11px] text-[#685361] leading-snug">
            💡 <strong className="text-[#E83D6F]">Tip:</strong> Eat ~20g per meal (Besan, Moong, Paneer) to steady blood sugar and reduce PMS cravings.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#2D1420]">Typical flow intensity</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { val: 'LIGHT', emoji: '🩸', label: 'Light' },
            { val: 'MEDIUM', emoji: '🩸🩸', label: 'Medium' },
            { val: 'HEAVY', emoji: '🩸🩸🩸', label: 'Heavy' },
          ].map(({ val, emoji, label }) => (
            <button key={val} type="button" onClick={() => set('flowIntensity', val)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-xs font-bold
                ${form.flowIntensity === val
                  ? 'border-[#E83D6F] bg-[#FFF0F4] text-[#E83D6F]'
                  : 'border-[#FFD3DF] bg-white text-[#685361] hover:border-[#E83D6F]/50'}`}>
              <span className="text-lg">{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#2D1420]">Common symptoms <span className="font-normal text-[#9A7A85]">(select all that apply)</span></label>
        <div className="flex flex-wrap gap-1.5">
          {SYMPTOMS_OPTIONS.map(s => (
            <ToggleChip key={s} label={s} selected={form.commonSymptoms.includes(s)} onClick={() => toggleSymptom(s)} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#2D1420]">Are you on birth control?</label>
        <div className="grid grid-cols-2 gap-3">
          {[{ val: false, label: '🚫 No' }, { val: true, label: '💊 Yes' }].map(({ val, label }) => (
            <button key={String(val)} type="button" onClick={() => set('onBirthControl', val)}
              className={`py-2.5 rounded-2xl border-2 text-xs font-bold transition-all
                ${form.onBirthControl === val
                  ? 'border-[#E83D6F] bg-[#FFF0F4] text-[#E83D6F]'
                  : 'border-[#FFD3DF] bg-white text-[#685361] hover:border-[#E83D6F]/50'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>,

    /* STEP 2 — Goals */
    <div key="s2" className="space-y-5">
      {/* Water Goal */}
      <div className="space-y-2 p-4 bg-white rounded-2xl border border-[#FFD3DF]">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-xs font-bold text-[#2D1420] uppercase tracking-wider">Daily Water Goal</label>
            <p className="text-[11px] text-[#9A7A85]">Recommended: 8 glasses (2L/day)</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => set('waterGoal', Math.max(4, form.waterGoal - 1))}
              className="w-8 h-8 rounded-full bg-[#EBF8FF] text-[#3B9AC5] font-bold text-lg flex items-center justify-center hover:bg-[#D1EFFF] transition">−</button>
            <span className="text-xl font-black text-[#2D1420] min-w-[2rem] text-center">{form.waterGoal}</span>
            <button type="button" onClick={() => set('waterGoal', Math.min(16, form.waterGoal + 1))}
              className="w-8 h-8 rounded-full bg-[#EBF8FF] text-[#3B9AC5] font-bold text-lg flex items-center justify-center hover:bg-[#D1EFFF] transition">+</button>
          </div>
        </div>
      </div>

      {/* Daily Protein Target Adjuster */}
      <div className="space-y-2 p-4 bg-white rounded-2xl border border-[#FFD3DF]">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-xs font-bold text-[#2D1420] uppercase tracking-wider">Daily Protein Goal</label>
            <p className="text-[11px] text-[#9A7A85]">Based on {form.weightKg} kg weight ({form.activityLevel.toLowerCase()})</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => set('dailyProteinGrams', Math.max(35, form.dailyProteinGrams - 5))}
              className="w-8 h-8 rounded-full bg-[#FFE4EC] text-[#E83D6F] font-bold text-lg flex items-center justify-center hover:bg-[#FFD3DF] transition">−</button>
            <span className="text-xl font-black text-[#2D1420] min-w-[3rem] text-center">{form.dailyProteinGrams}g</span>
            <button type="button" onClick={() => set('dailyProteinGrams', Math.min(150, form.dailyProteinGrams + 5))}
              className="w-8 h-8 rounded-full bg-[#FFE4EC] text-[#E83D6F] font-bold text-lg flex items-center justify-center hover:bg-[#FFD3DF] transition">+</button>
          </div>
        </div>
      </div>

      {/* Summary card */}
      <div className="bg-gradient-to-br from-[#FFF0F4] to-[#FFF5F7] border border-[#FFD3DF] rounded-2xl p-4 space-y-2.5">
        <p className="text-[10px] font-black tracking-widest uppercase text-[#E83D6F]">Your Personalized Profile</p>
        {[
          { label: 'Last Period', val: form.lastPeriodStart || '—' },
          { label: 'Cycle & Period', val: `${form.cycleLengthDays}d cycle · ${form.periodLengthDays}d flow` },
          { label: 'Body Metrics', val: `${form.weightKg} kg · ${form.heightCm} cm (BMI: ${calculateBmi(form.weightKg, form.heightCm)})` },
          { label: 'Protein Target', val: `${form.dailyProteinGrams}g / day (~${Math.round(form.dailyProteinGrams / 3)}g per meal)` },
          { label: 'Water Goal', val: `${form.waterGoal} glasses (2L)` },
        ].map(({ label, val }) => (
          <div key={label} className="flex justify-between items-center text-xs">
            <span className="text-[#9A7A85]">{label}</span>
            <span className="font-bold text-[#2D1420]">{val}</span>
          </div>
        ))}
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F7] via-white to-[#FFF0F4] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FFE1E8] rounded-full text-xs font-bold text-[#E83D6F] mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to SheFlow</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D1420]">
            Hi {firstName}! Let's personalise your experience 🌸
          </h1>
          <p className="text-sm text-[#9A7A85] mt-2">
            Just 3 quick steps. Your data stays private and secure.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1">
                <StepDot active={step === i} done={step > i} n={i + 1} />
                <span className={`text-[10px] font-semibold ${step === i ? 'text-[#E83D6F]' : step > i ? 'text-[#E83D6F]/70' : 'text-[#C4A8B4]'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-20 mx-1 mb-5 rounded-full transition-all ${step > i ? 'bg-[#E83D6F]' : 'bg-[#FFD3DF]'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-[#FFE4EC] p-6 sm:p-8">
          {/* Step title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-[#FFE4EC] flex items-center justify-center">
              {React.createElement(STEPS[step].icon, { className: 'w-5 h-5 text-[#E83D6F]' })}
            </div>
            <div>
              <p className="text-xs font-bold text-[#E83D6F] uppercase tracking-wider">Step {step + 1} of {STEPS.length}</p>
              <h2 className="text-lg font-extrabold text-[#2D1420]">{STEPS[step].label}</h2>
            </div>
          </div>

          {/* Panel */}
          {panels[step]}

          {/* Global error */}
          {error && step > 0 && (
            <div className="mt-4 flex items-center gap-2 text-red-600 text-xs font-medium bg-red-50 px-3 py-2 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 gap-3">
            {step > 0 ? (
              <button onClick={prev}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl border border-[#FFD3DF] text-sm font-bold text-[#685361] hover:bg-[#FFF5F7] transition">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}

            {step < STEPS.length - 1 ? (
              <button onClick={next}
                className="flex items-center gap-1.5 px-7 py-2.5 rounded-2xl bg-[#E83D6F] hover:bg-[#D4265A] text-white text-sm font-bold shadow-md transition-all active:scale-95">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-7 py-2.5 rounded-2xl bg-[#E83D6F] hover:bg-[#D4265A] disabled:opacity-60 text-white text-sm font-bold shadow-md transition-all active:scale-95">
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Go to My Dashboard <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-[#B89DAA] mt-5">
          Your health data is encrypted and never shared. 🔒
        </p>
      </div>
    </div>
  );
}
