import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Zap, 
  TrendingUp, 
  Dumbbell, 
  Moon, 
  Sparkles, 
  Heart, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  Flame,
  Info,
  ChevronRight
} from 'lucide-react';
import { useHealth } from '../context/HealthContext';
import { cycleApi } from '../api/backendApi';

export default function HormoneEnergyPage({ onBack, onNavigateFlora, onNavigateNutrition }) {
  const { cycleData } = useHealth();
  const [activePhaseTab, setActivePhaseTab] = useState('CURRENT');
  const [completedExercises, setCompletedExercises] = useState({});

  const toggleExercise = (name) => {
    setCompletedExercises(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Dynamic forecast for user's current cycle day
  const currentForecast = cycleApi.getPhaseForecast(cycleData.currentCycleDay, cycleData.predictedCycleLength);

  // Phase details with authentic, targeted phase-synced workouts
  const allPhases = [
    {
      id: 'menstrual',
      name: 'Menstrual Phase',
      days: 'Days 1 - 5',
      energyScore: 62,
      energyDesc: 'Gentle & Inward Focus',
      estrogen: 'Low Baseline',
      progesterone: 'Low Baseline',
      lh: 'Low',
      testosterone: 'Low Baseline',
      workoutType: 'Restorative Yin Yoga & Gentle Pelvic Circulation',
      workoutIntensity: 'Low Intensity (RPE 2-3/10)',
      bestTime: 'Late afternoon or early evening',
      avoidExercises: 'Heavy squats, inverted poses, high-impact jumping, and exhaustive HIIT.',
      workoutExercises: [
        { 
          name: 'Supported Child\'s Pose (Balasana)', 
          duration: '5 – 7 mins', 
          type: 'Pelvic Decompression', 
          benefit: 'Gently decompresses sacrum and soothes lower uterine cramping.' 
        },
        { 
          name: 'Cat-Cow Spinal Waves (Marjaryasana)', 
          duration: '10 slow reps', 
          type: 'Spinal Mobility', 
          benefit: 'Increases pelvic blood perfusion and releases lower back stiffness.' 
        },
        { 
          name: 'Reclined Butterfly (Supta Baddha Konasana)', 
          duration: '8 mins', 
          type: 'Restorative', 
          benefit: 'Relaxes pelvic floor smooth muscles and lowers resting heart rate.' 
        },
        { 
          name: 'Outdoor Gentle Sunshine Walk', 
          duration: '15 – 20 mins', 
          type: 'Low Cardio', 
          benefit: 'Releases natural endorphins without spiking cortisol or taxing adrenals.' 
        }
      ],
      cognitiveStyle: 'Deep Introspection, Intuitive Decision Making & Big-Picture Evaluation',
      sleepAdvisory: 'Extra sleep required. Aim for 8.5 hours with warm blankets and chamomile tea.'
    },
    {
      id: 'follicular',
      name: 'Follicular Phase',
      days: 'Days 6 - 13',
      energyScore: 88,
      energyDesc: 'Rising Stamina & Mental Drive',
      estrogen: 'Rising Sharply',
      progesterone: 'Low',
      lh: 'Gradual Rise',
      testosterone: 'Low-Medium',
      workoutType: 'Cardio Tempo Runs, Boxing & Hypertrophy Resistance',
      workoutIntensity: 'Moderate to High (RPE 6-8/10)',
      bestTime: 'Morning (7:00 AM – 10:00 AM)',
      avoidExercises: 'Skipping mobility warmups (estrogen increases ligament laxity slightly).',
      workoutExercises: [
        { 
          name: 'Interval Tempo Running or Cycling', 
          duration: '25 mins', 
          type: 'Cardio Stamina', 
          benefit: 'Capitalizes on increased glycogen storage and rapid recovery.' 
        },
        { 
          name: 'Dumbbell Full-Body Complex (Squat to Press)', 
          duration: '3 sets × 12 reps', 
          type: 'Compound Strength', 
          benefit: 'Accelerated muscle protein synthesis driven by rising estradiol.' 
        },
        { 
          name: 'Pilates Core Flow & Plank Series', 
          duration: '15 – 20 mins', 
          type: 'Core Alignment', 
          benefit: 'Strengthens deep transverse abdominal wall and stabilizes pelvis.' 
        },
        { 
          name: 'Kettlebell Swings & Deadlifts', 
          duration: '3 sets × 15 reps', 
          type: 'Posterior Chain', 
          benefit: 'Develops glute-hamstring power with quick 24-hour muscular recovery.' 
        }
      ],
      cognitiveStyle: 'Fast Learning, Brainstorming, High Curiosity & Strategic Planning',
      sleepAdvisory: 'Natural alertness is high. Bedtime around 10:45 PM; waking up feeling refreshed.'
    },
    {
      id: 'ovulation',
      name: 'Ovulation Phase',
      days: 'Days 14 - 16',
      energyScore: 96,
      energyDesc: 'Peak Vitality & Maximum Power',
      estrogen: 'Monthly Peak',
      progesterone: 'Beginning to Rise',
      lh: 'Surge Peak',
      testosterone: 'Mini-Peak',
      workoutType: 'HIIT Tabata, Heavy Lifting & Personal Records (PRs)',
      workoutIntensity: 'Peak Intensity (RPE 9-10/10)',
      bestTime: 'Mid-day to early afternoon (12 PM – 4 PM)',
      avoidExercises: 'Exercising without electrolytes (body core temperature runs +0.5°C warmer).',
      workoutExercises: [
        { 
          name: 'Heavy Barbell Squats or Deadlifts', 
          duration: '4 sets × 6–8 reps', 
          type: 'Heavy Strength', 
          benefit: 'Testosterone peak grants monthly highest pain tolerance and raw power.' 
        },
        { 
          name: 'Tabata HIIT Sprints (20s on / 10s off)', 
          duration: '15 mins', 
          type: 'VO2 Max Cardio', 
          benefit: 'Maximum cardiovascular output with high post-exercise calorie burn.' 
        },
        { 
          name: 'Plyometric Box Jumps & Kettlebell Snatch', 
          duration: '3 sets × 10 reps', 
          type: 'Explosive Power', 
          benefit: 'Fast-twitch muscle fibers recruit at maximum neural firing speed.' 
        },
        { 
          name: 'Dynamic Active Mobility & Hip Opening', 
          duration: '10 mins', 
          type: 'Mobility Stretch', 
          benefit: 'Preserves joint alignment and tendon health during high-impact sets.' 
        }
      ],
      cognitiveStyle: 'Persuasive Communication, Social Magnetism, High Verbal Fluency & Bold Negotiations',
      sleepAdvisory: 'Body temperature runs ~0.5°C warmer. Keep your bedroom cool (19°C) for uninterrupted REM sleep.'
    },
    {
      id: 'luteal',
      name: 'Luteal Phase',
      days: 'Days 17 - 28',
      energyScore: 74,
      energyDesc: 'Analytical Focus → Restorative Mode',
      estrogen: 'Moderate Second Wave → Drop',
      progesterone: 'Peak Progesterone → Sharp Drop',
      lh: 'Low',
      testosterone: 'Low',
      workoutType: 'Mat Pilates, Barre, Steady Swimming & Cortisol Control',
      workoutIntensity: 'Moderate to Low (RPE 4-6/10)',
      bestTime: 'Morning or early afternoon',
      avoidExercises: 'Exhausting HIIT sprints right before flow (spikes cortisol and triggers PMS weepiness).',
      workoutExercises: [
        { 
          name: 'Mat Pilates & Resistance Band Glute Bridges', 
          duration: '30 mins', 
          type: 'Isometric Sculpting', 
          benefit: 'Maintains muscle tone and burns fat without spiking stress hormone cortisol.' 
        },
        { 
          name: 'Steady-State Lap Swimming or Incline Walk', 
          duration: '25 mins', 
          type: 'Anti-Bloat Cardio', 
          benefit: 'Hydrostatic water pressure relieves water retention and breast soreness.' 
        },
        { 
          name: 'Bodyweight Barre & Core Balance', 
          duration: '20 mins', 
          type: 'Joint-Friendly Tone', 
          benefit: 'Tones stabilizing muscle groups with zero pounding on delicate joints.' 
        },
        { 
          name: 'Legs-Up-The-Wall (Viparita Karani) & Box Breath', 
          duration: '10 mins', 
          type: 'Lymphatic Drainage', 
          benefit: 'Drains venous pooling from legs and prepares nervous system for deep sleep.' 
        }
      ],
      cognitiveStyle: 'Detail-Oriented Organization, Task Completion, Editing & Setting Boundaries',
      sleepAdvisory: 'Progesterone promotes sleepiness early on, but drops can cause nighttime restlessness before flow. Avoid caffeine after 1 PM.'
    }
  ];

  // Helper to determine real phase ID for current day
  const getCurrentPhaseId = () => {
    const day = cycleData.currentCycleDay || 14;
    if (day <= 5) return 'menstrual';
    if (day < 14) return 'follicular';
    if (day <= 16) return 'ovulation';
    return 'luteal';
  };

  const activeBase = allPhases.find((p) => p.id === (activePhaseTab === 'CURRENT' ? getCurrentPhaseId() : activePhaseTab)) || allPhases[0];

  // Active displayed phase with live dynamic mappings
  const displayedPhase =
    activePhaseTab === 'CURRENT'
      ? {
          ...activeBase,
          name: `Today's ${activeBase.name}`,
          days: `Cycle Day ${cycleData.currentCycleDay} of ${cycleData.predictedCycleLength}`,
          energyScore: currentForecast.energyScore || activeBase.energyScore,
          energyDesc: currentForecast.energyLevel || activeBase.energyDesc,
          estrogen: currentForecast.estrogen || activeBase.estrogen,
          progesterone: currentForecast.progesterone || activeBase.progesterone,
          cognitiveStyle: currentForecast.predictedMood.primaryMood || activeBase.cognitiveStyle
        }
      : activeBase;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in select-text">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              Hormone & Energy Forecaster
            </h1>
            <p className="text-xs sm:text-sm text-[#7C6A75] mt-0.5">
              Live hormonal fluctuation curves, stamina forecasting & phase-synced workouts
            </p>
          </div>
        </div>

        {onNavigateFlora && (
          <button
            onClick={onNavigateFlora}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFF0F4] hover:bg-[#FFE1E8] text-[#E83D6F] border border-[#FFD3DF] rounded-2xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#E83D6F]" />
            <span>Ask Flora about Hormones</span>
          </button>
        )}
      </div>

      {/* ── INTERACTIVE PHASE TABS ── */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActivePhaseTab('CURRENT')}
          className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
            activePhaseTab === 'CURRENT'
              ? 'bg-[#E83D6F] text-white shadow-xs'
              : 'bg-white text-[#685361] border border-[#FFE4EC] hover:bg-[#FFF7F9]'
          }`}
        >
          📍 Today (Day {cycleData.currentCycleDay})
        </button>
        {allPhases.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePhaseTab(p.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activePhaseTab === p.id
                ? 'bg-[#E83D6F] text-white shadow-xs'
                : 'bg-white text-[#685361] border border-[#FFE4EC] hover:bg-[#FFF7F9]'
            }`}
          >
            {p.name.split(' ')[0]} ({p.days})
          </button>
        ))}
      </div>

      {/* ── HERO ENERGY & STAMINA GAUGE CARD ── */}
      <div className="bg-gradient-to-br from-white via-[#FFF7F9] to-[#FFE8EE] rounded-3xl p-6 sm:p-8 border border-[#FFD3DF] shadow-md space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-[#E83D6F] bg-[#FFE1E8] px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-[#E83D6F]" />
              Biological Energy Radar
            </span>
            <div className="pt-1">
              <h2 className="text-xl sm:text-2xl font-black font-display text-[#2D1420]">
                {displayedPhase.name} • {displayedPhase.energyDesc}
              </h2>
              <p className="text-xs text-[#7C6A75] mt-0.5">
                Calculated for {displayedPhase.days} based on your cycle inputs
              </p>
            </div>
          </div>

          {/* Energy Score Pill */}
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-[#FFD3DF] shadow-xs self-start md:self-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#FFE1E8] text-[#E83D6F] flex items-center justify-center font-black text-xl">
              ⚡
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-[#8E7582] uppercase tracking-wider block">
                Stamina Score
              </span>
              <span className="text-2xl font-black text-[#E83D6F]">
                {displayedPhase.energyScore}%
              </span>
            </div>
          </div>
        </div>

        {/* ── 4 HORMONAL FLUIDITY GAUGES ── */}
        <div className="space-y-2">
          <span className="text-[11px] font-extrabold text-[#8E7582] uppercase tracking-wider block">
            Circulating Hormonal Balance
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Estrogen */}
            <div className="bg-white p-4 rounded-2xl border border-[#FFE4EC] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#2D1420]">Estrogen (E2)</span>
                <span className="text-[10px] font-extrabold text-[#E83D6F] bg-[#FFE1E8] px-1.5 py-0.2 rounded-md">
                  {displayedPhase.estrogen}
                </span>
              </div>
              <p className="text-[10px] text-[#7C6A75]">Drives serotonin, verbal fluency & skin glow</p>
              <div className="w-full bg-[#FFE1E8] h-2 rounded-full overflow-hidden mt-1">
                <div 
                  className="bg-[#E83D6F] h-full rounded-full transition-all duration-500" 
                  style={{ width: displayedPhase.estrogen.includes('Peak') ? '95%' : displayedPhase.estrogen.includes('Rising') ? '75%' : '30%' }}
                />
              </div>
            </div>

            {/* Progesterone */}
            <div className="bg-white p-4 rounded-2xl border border-[#FFE4EC] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#2D1420]">Progesterone</span>
                <span className="text-[10px] font-extrabold text-[#7E57C2] bg-[#EDE7F6] px-1.5 py-0.2 rounded-md">
                  {displayedPhase.progesterone}
                </span>
              </div>
              <p className="text-[10px] text-[#7C6A75]">Calms GABA receptors, supports sleep & lining</p>
              <div className="w-full bg-[#EDE7F6] h-2 rounded-full overflow-hidden mt-1">
                <div 
                  className="bg-[#7E57C2] h-full rounded-full transition-all duration-500" 
                  style={{ width: displayedPhase.progesterone.includes('Peak') ? '90%' : displayedPhase.progesterone.includes('Rising') ? '40%' : '15%' }}
                />
              </div>
            </div>

            {/* LH */}
            <div className="bg-white p-4 rounded-2xl border border-[#FFE4EC] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#2D1420]">LH Surge</span>
                <span className="text-[10px] font-extrabold text-[#0288D1] bg-[#E1F5FE] px-1.5 py-0.2 rounded-md">
                  {displayedPhase.lh}
                </span>
              </div>
              <p className="text-[10px] text-[#7C6A75]">Triggers follicle egg release & metabolic spike</p>
              <div className="w-full bg-[#E1F5FE] h-2 rounded-full overflow-hidden mt-1">
                <div 
                  className="bg-[#0288D1] h-full rounded-full transition-all duration-500" 
                  style={{ width: displayedPhase.lh.includes('Surge') ? '98%' : '20%' }}
                />
              </div>
            </div>

            {/* Testosterone */}
            <div className="bg-white p-4 rounded-2xl border border-[#FFE4EC] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#2D1420]">Testosterone</span>
                <span className="text-[10px] font-extrabold text-[#F57F17] bg-[#FFF8E1] px-1.5 py-0.2 rounded-md">
                  {displayedPhase.testosterone}
                </span>
              </div>
              <p className="text-[10px] text-[#7C6A75]">Fuels muscle power, confidence & libido</p>
              <div className="w-full bg-[#FFF8E1] h-2 rounded-full overflow-hidden mt-1">
                <div 
                  className="bg-[#F57F17] h-full rounded-full transition-all duration-500" 
                  style={{ width: displayedPhase.testosterone.includes('Peak') ? '85%' : '30%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PHASE-SYNCED WORKOUT & MOVEMENT PLAN (ACCORDING TO PHASE) ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#FFE4EC] shadow-soft space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFE4EC] text-[#E83D6F] flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8E7582] block">
                  Phase-Synced Movement
                </span>
                <span className="text-[10px] font-bold text-[#E83D6F] bg-[#FFE1E8] px-2 py-0.5 rounded-full">
                  {displayedPhase.name}
                </span>
              </div>
              <h3 className="text-lg font-bold font-display text-[#2D1420] mt-0.5">
                {displayedPhase.workoutType}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-[#2D1420] bg-[#FFF5F7] border border-[#FFE4EC] px-3 py-1 rounded-full">
              ⏰ {displayedPhase.bestTime}
            </span>
            <span className="text-xs font-bold text-[#E83D6F] bg-[#FFF0F4] border border-[#FFD3DF] px-3 py-1 rounded-full">
              {displayedPhase.workoutIntensity}
            </span>
          </div>
        </div>

        {/* Exercises list - 4 phase-specific targeted routines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayedPhase.workoutExercises.map((ex, idx) => {
            const isDone = completedExercises[ex.name];
            return (
              <div 
                key={idx} 
                onClick={() => toggleExercise(ex.name)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                  isDone 
                    ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs' 
                    : 'bg-[#FFF9FA] border-[#FFE8EE] hover:border-[#FFCCD8] hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-bold text-[#E83D6F] bg-[#FFE4EC] px-2 py-0.5 rounded-md">
                      #{idx + 1} {ex.type}
                    </span>
                    <span className="text-[10px] font-bold text-[#685361] bg-white px-2 py-0.5 rounded-md border border-[#FFE4EC]">
                      {ex.duration}
                    </span>
                  </div>
                  <h4 className={`font-bold text-sm text-[#2D1420] leading-snug ${isDone ? 'line-through text-emerald-900' : ''}`}>
                    {ex.name}
                  </h4>
                  <p className="text-[11px] text-[#7C6A75] leading-snug mt-1">
                    {ex.benefit}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#FFE8EE]/80 flex items-center justify-between">
                  <span className={`text-[11px] font-bold flex items-center gap-1.5 ${isDone ? 'text-emerald-700' : 'text-[#8E7582]'}`}>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                      isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-[#FFCCD8] bg-white'
                    }`}>
                      {isDone && '✓'}
                    </span>
                    <span>{isDone ? 'Completed' : 'Tap to mark done'}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Phase Movement Guidance: Avoid & Hormonal Rule */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-start gap-2.5">
            <span className="text-rose-600 font-bold text-sm shrink-0 mt-0.5">🚫</span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">
                Movement to Avoid in this Phase
              </span>
              <p className="text-xs text-[#685361] mt-0.5">
                {displayedPhase.avoidExercises}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FFF0F4] border border-[#FFD3DF] flex items-start gap-2.5">
            <span className="text-[#E83D6F] font-bold text-sm shrink-0 mt-0.5">⚡</span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#E83D6F] block">
                Hormonal Movement Rule
              </span>
              <p className="text-xs text-[#685361] mt-0.5">
                {displayedPhase.energyDesc} · Synchronize intensity with natural cellular glycogen capacity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── COGNITIVE FOCUS & SLEEP ADVISORY ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cognitive & Productivity Style */}
        <div className="bg-white rounded-3xl p-6 border border-[#FFE4EC] shadow-soft space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E1F5FE] text-[#0288D1] flex items-center justify-center font-bold">
              💡
            </div>
            <h3 className="text-sm font-bold text-[#2D1420]">Cognitive & Work Superpower</h3>
          </div>
          <p className="text-xs sm:text-sm text-[#483742] leading-relaxed bg-[#FFF9FA] p-3.5 rounded-2xl border border-[#FFE8EE]">
            "{displayedPhase.cognitiveStyle}"
          </p>
          <div className="text-[11px] text-[#7C6A75]">
            Align your major meetings and projects with your monthly cognitive peak for effortless flow.
          </div>
        </div>

        {/* Circadian Sleep Architecture */}
        <div className="bg-white rounded-3xl p-6 border border-[#FFE4EC] shadow-soft space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EDE7F6] text-[#7E57C2] flex items-center justify-center font-bold">
              <Moon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#2D1420]">Circadian Rhythm & Sleep Advisory</h3>
          </div>
          <p className="text-xs sm:text-sm text-[#483742] leading-relaxed bg-[#FFF9FA] p-3.5 rounded-2xl border border-[#FFE8EE]">
            "{displayedPhase.sleepAdvisory}"
          </p>
          {onNavigateNutrition && (
            <button
              onClick={onNavigateNutrition}
              className="text-xs font-bold text-[#E83D6F] hover:underline inline-flex items-center gap-1 pt-1"
            >
              <span>View phase nutrition & bedtime foods</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
