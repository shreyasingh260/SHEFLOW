import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Utensils, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Coffee, 
  Apple, 
  Leaf, 
  Flame, 
  Heart, 
  Clock, 
  Zap, 
  ChevronRight,
  Info,
  Droplets,
  Target,
  RefreshCw,
  Plus,
  RotateCcw,
  Send,
  MessageSquare,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useHealth } from '../context/HealthContext';
import { useAuth } from '../context/AuthContext';
import { cycleApi } from '../api/backendApi';

export default function PhaseNutritionPage({ onBack, onNavigateFlora, onNavigateHormones }) {
  const { cycleData } = useHealth();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('CURRENT');
  const [copied, setCopied] = useState(false);
  const [checkedGrocery, setCheckedGrocery] = useState({});

  const userWeight = user?.weightKg || 55;
  const userHeight = user?.heightCm || 162;
  const userProtein = user?.dailyProteinGrams || Math.round(userWeight * 1.1);

  // Dynamic forecast for user's current cycle day
  const currentForecast = cycleApi.getPhaseForecast(cycleData.currentCycleDay, cycleData.predictedCycleLength);

  // Indian Real-time Date and Hour Helper (IST)
  const getIndiaInfo = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const m = {};
    parts.forEach(p => { m[p.type] = p.value; });
    return {
      year: parseInt(m.year, 10),
      month: parseInt(m.month, 10),
      day: parseInt(m.day, 10),
      hour: parseInt(m.hour, 10)
    };
  };

  const indiaInfo = getIndiaInfo();
  const todayKey = `sheflow_macros_${indiaInfo.year}_${indiaInfo.month}_${indiaInfo.day}`;

  // Daily Nutrient Tracker State (Calories & Protein)
  const [macros, setMacros] = useState(() => {
    try {
      const s = localStorage.getItem(todayKey);
      if (s) return JSON.parse(s);
      return { protein: 0, calories: 0, fiber: 0, carbs: 0 };
    } catch {
      return { protein: 0, calories: 0, fiber: 0, carbs: 0 };
    }
  });

  // Dynamic Calorie Goal based on Mifflin-St Jeor formula + Phase Thermogenesis
  const baseCalories = Math.round((10 * userWeight + 6.25 * userHeight - 281) * 1.35);
  const isLuteal = (currentForecast.phase || '').toLowerCase().includes('luteal');
  const calorieGoal = isLuteal ? baseCalories + 200 : baseCalories;
  const proteinGoal = userProtein;

  // Determine current meal slot in India
  const getCurrentMealSlot = () => {
    const h = indiaInfo.hour;
    if (h >= 5 && h < 11) {
      return { slot: 'breakfast', label: 'Breakfast (नाश्ता)', time: '7:30 AM – 10:30 AM', icon: '🍳' };
    } else if (h >= 11 && h < 15) {
      return { slot: 'lunch', label: 'Lunch (दोपहर का भोजन)', time: '12:30 PM – 2:30 PM', icon: '🥗' };
    } else if (h >= 15 && h < 19) {
      return { slot: 'snack', label: 'Evening Snack (शाम का नाश्ता)', time: '4:00 PM – 6:00 PM', icon: '☕' };
    } else if (h >= 19 && h < 22) {
      return { slot: 'dinner', label: 'Dinner (रात का खाना)', time: '7:30 PM – 9:30 PM', icon: '🍲' };
    } else {
      return { slot: 'tonic', label: 'Bedtime Tonic (रात्रि पेय)', time: '10:00 PM – 11:00 PM', icon: '🥛' };
    }
  };

  const currentSlot = getCurrentMealSlot();

  // Helper to get active phase key
  const getCurrentPhaseKey = () => {
    const day = cycleData.currentCycleDay || 14;
    if (day <= 5) return 'menstrual';
    if (day < 14) return 'follicular';
    if (day <= 16) return 'ovulatory';
    return 'luteal';
  };

  // Authentic Indian Phase Next-Meal Catalog
  const nextMealCatalog = {
    menstrual: {
      breakfast: [
        { name: 'Warm Spiced Ragi (Nachni) Malt with Gur & Almonds', calories: 290, protein: 9, benefit: 'Ragi calcium & jaggery iron rebuild hemoglobin and soothe pelvic spasms.' },
        { name: 'Moong Dal & Palak Chilla with Fresh Mint Chutney', calories: 310, protein: 14, benefit: 'Gentle complete protein with plant iron for morning recovery.' }
      ],
      lunch: [
        { name: 'Moong Dal Khichdi with 1 tsp A2 Desi Ghee & Palak Saag', calories: 420, protein: 18, benefit: 'A2 Ghee lubricates pelvic tissues; moong dal is gentle on menstrual digestion.' },
        { name: 'Masoor Dal with Lauki, Soft Phulkas & Beetroot Salad', calories: 390, protein: 16, benefit: 'Beetroot nitrates and lemon Vitamin C triple plant iron absorption.' }
      ],
      snack: [
        { name: 'Roasted Phool Makhana in Desi Ghee & Haldi + Gur Chikki', calories: 170, protein: 5, benefit: 'High magnesium relaxes uterine smooth muscles and eliminates cramps.' },
        { name: 'Warm Ajwain-Ginger Kadha with 4 Soaked Badam', calories: 95, protein: 3, benefit: 'Carminative ajwain expels gas, flatulence and uterine discomfort.' }
      ],
      dinner: [
        { name: 'Tender Lauki & Yellow Dal with Soft Phulkas & Steamed Rice', calories: 360, protein: 15, benefit: 'Light and laghu (easy to digest) to ensure deep, undisturbed sleep.' },
        { name: 'Warm Tomato Saar & Moong Khichdi with Roasted Papad', calories: 340, protein: 13, benefit: 'Warming spices pacify Vata and calm pre-sleep menstrual heaviness.' }
      ],
      tonic: [
        { name: 'Ayurvedic Haldi Doodh with Nutmeg & Crushed Almonds', calories: 140, protein: 6, benefit: 'Curcumin lowers inflammatory prostaglandins for pain-free sleep.' }
      ]
    },
    follicular: {
      breakfast: [
        { name: 'Sprouted Moong & Kala Chana Chaat with Lemon & Anaar', calories: 310, protein: 18, benefit: 'Living sprouted enzymes nourish growing ovarian follicles.' },
        { name: 'Methi-Besan Thepla with Fresh Curd & Pomegranate', calories: 330, protein: 15, benefit: 'Phytoestrogens assist natural estradiol elevation smoothly.' }
      ],
      lunch: [
        { name: 'Palak Paneer with Multigrain Methi Roti & Cucumber Raita', calories: 460, protein: 24, benefit: 'High bioavailable protein and zinc fuel follicle maturation.' },
        { name: 'Foxtail Millet (Kangni) Pulao with Dal Tadka & Sprouted Salad', calories: 420, protein: 17, benefit: 'Low glycemic millets sustain rising follicular stamina without insulin spikes.' }
      ],
      snack: [
        { name: 'Tender Nariyal Paani with Malai + 6 Soaked Mamra Badam', calories: 180, protein: 6, benefit: 'Replenishes natural cellular electrolytes (K+, Mg) for glowing skin.' },
        { name: 'Roasted Sprouted Chana with Jeera & Lemon Water', calories: 150, protein: 9, benefit: 'Crunchy plant protein that fuels high mental alertness.' }
      ],
      dinner: [
        { name: 'Yellow Dal Tadka with Capsicum Paneer Bhurji & Phulkas', calories: 430, protein: 23, benefit: 'Vitamin C in capsicum stimulates collagen and ovulatory blood vessels.' },
        { name: 'Moong-Methi Khichdi with Dahi & Roasted Jeera', calories: 370, protein: 16, benefit: 'Probiotic curd optimizes gut flora to synthesize neurotransmitters.' }
      ],
      tonic: [
        { name: 'Saunf & Elaichi Warm Infusion with Kesar', calories: 45, protein: 1, benefit: 'Balances digestion and prepares the nervous system for restorative rest.' }
      ]
    },
    ovulatory: {
      breakfast: [
        { name: 'High-Fiber Besan-Methi Chilla with Mint Chutney & Sabja Water', calories: 330, protein: 17, benefit: 'Sabja soluble fiber binds to excess circulating estrogen in the intestine.' },
        { name: 'Ragi Idli with Sambhar & Coconut Coriander Chutney', calories: 320, protein: 13, benefit: 'Complex millets fuel peak metabolic expenditure and physical vigor.' }
      ],
      lunch: [
        { name: 'Spiced Rajma Masala with Jeera Brown Rice & Cabbage Salad', calories: 450, protein: 22, benefit: 'Zinc supports the developing corpus luteum; sulfur clears peak estradiol.' },
        { name: 'Kabuli Chole with Methi Multigrain Phulkas & Kachumber Salad', calories: 460, protein: 20, benefit: 'High prebiotic fiber sweeps hepatic estrogen metabolites out smoothly.' }
      ],
      snack: [
        { name: 'Chilled Spiced Chaas (Buttermilk) with Roasted Jeera & Pudina', calories: 110, protein: 4, benefit: 'Cools mid-cycle Pitta body heat while flooding the gut with probiotics.' },
        { name: 'Roasted Sesame (Til) & Sunflower Seeds with Green Apple Slices', calories: 170, protein: 6, benefit: 'Seed cycling selenium and zinc optimize healthy egg release.' }
      ],
      dinner: [
        { name: 'Tandoori Paneer or Soya Tikka with Drumstick (Moringa) Soup', calories: 390, protein: 26, benefit: 'Moringa pod sulfur compounds accelerate Phase II hepatic liver detox.' },
        { name: 'Charred Bell Pepper & Mushroom Paneer Wrap with Multigrain Roti', calories: 410, protein: 24, benefit: 'Lean amino acids repair muscles after high-intensity ovulation workouts.' }
      ],
      tonic: [
        { name: 'Cooling Saunf & Gulab (Rose Petal) Herbal Tea', calories: 35, protein: 0, benefit: 'Deeply cooling to pacify the natural mid-cycle basal temperature rise.' }
      ]
    },
    luteal: {
      breakfast: [
        { name: 'Warm Shakarkandi (Sweet Potato) Chaat with Roasted Peanuts & Lemon', calories: 340, protein: 11, benefit: 'Slow-burning root starches elevate brain serotonin, curbing PMS mood swings.' },
        { name: 'Warm Oats & Spiced Ragi Porridge with Medjool Dates & Walnuts', calories: 330, protein: 12, benefit: 'Vitamin B6 aids progesterone synthesis and halts pre-period weeping.' }
      ],
      lunch: [
        { name: 'Comforting Punjabi Kadhi Pakora with Bajra Roti & Bhindi Masala', calories: 470, protein: 19, benefit: 'Bajra magnesium relieves muscle tightness; kadhi probiotics aid digestion.' },
        { name: 'Rajma Sundal with Jowar Roti, Fresh Curd & Cucumber Salad', calories: 440, protein: 21, benefit: 'Complex millet carbs satisfy elevated luteal caloric burn (~+200 kcal).' }
      ],
      snack: [
        { name: 'Roasted Phool Makhana in A2 Ghee + 2 Soft Medjool Dates or Til Laddu', calories: 190, protein: 5, benefit: 'Curbs sugar cravings gracefully while replenishing cellular magnesium.' },
        { name: 'Spiced Buttermilk with Crushed Ajwain & Kala Namak', calories: 95, protein: 3, benefit: 'Counteracts luteal fluid retention and eases abdominal bloating.' }
      ],
      dinner: [
        { name: 'Kaddu (Pumpkin) & Green Pea Khichdi with A2 Ghee & Warm Tomato Saar', calories: 410, protein: 17, benefit: 'Tryptophan in peas and pumpkin fosters deep GABA relaxation before sleep.' },
        { name: 'Masoor Dal with Stir-Fried Gobi & Soft Phulkas', calories: 380, protein: 18, benefit: 'Grounding dinner that prevents middle-of-the-night blood sugar dips.' }
      ],
      tonic: [
        { name: 'Warm Chamomile & Saunf Infusion with 1 pinch Cinnamon', calories: 30, protein: 0, benefit: 'Lowers bedtime cortisol and supports smooth progesterone decline.' }
      ]
    }
  };

  // Initialize Next Meal based on user's current phase and Indian time slot
  const currentPhaseKey = getCurrentPhaseKey();
  const initialMealList = nextMealCatalog[currentPhaseKey]?.[currentSlot.slot] || nextMealCatalog[currentPhaseKey]?.lunch || [];
  const [suggestedMeal, setSuggestedMeal] = useState(initialMealList[0] || {
    name: 'Spiced Moong Dal Khichdi with A2 Ghee',
    calories: 410,
    protein: 18,
    benefit: 'Gentle, complete nutrition for phase equilibrium.'
  });

  const [mealCatalogIndex, setMealCatalogIndex] = useState(0);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loggedSuccess, setLoggedSuccess] = useState(false);

  // Quick Nutrient Adders
  const addCalories = (amt) => {
    setMacros(prev => {
      const updated = { ...prev, calories: Math.max(0, (prev.calories || 0) + amt) };
      try { localStorage.setItem(todayKey, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const addProtein = (amt) => {
    setMacros(prev => {
      const updated = { ...prev, protein: Math.max(0, (prev.protein || 0) + amt) };
      try { localStorage.setItem(todayKey, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const resetTodayLog = () => {
    const reset = { protein: 0, calories: 0, fiber: 0, carbs: 0 };
    setMacros(reset);
    setTodayMealLogs([]);
    try { 
      localStorage.setItem(todayKey, JSON.stringify(reset)); 
      localStorage.removeItem(mealsHistoryKey);
    } catch {}
  };

  // Food Chat State & Log History
  const [foodChatInput, setFoodChatInput] = useState('');
  const [isAnalyzingFood, setIsAnalyzingFood] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'FLORA',
      text: `Namaste ${user?.fullName?.split(' ')[0] || 'Shreya'}! 🌸 Tell me what you ate today (e.g. "2 paneer parathas with curd and chai" or "1 bowl moong dal khichdi"). I will calculate the exact calories, protein, and nutrients, then log it into your daily targets!`,
      timestamp: 'Just now'
    }
  ]);

  const mealsHistoryKey = `sheflow_meals_history_${todayKey}`;
  const [todayMealLogs, setTodayMealLogs] = useState(() => {
    try {
      const s = localStorage.getItem(mealsHistoryKey);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  // Local Indian Food Nutrition Analyzer (Offline Fallback Engine)
  const estimateIndianMealNutrition = (text, phase) => {
    const lower = text.toLowerCase();
    let cal = 0;
    let prot = 0;
    let carbs = 0;
    let fiber = 0;
    let keyNutrients = [];

    let qty = 1;
    const qtyMatch = lower.match(/\b([1-9])\b/);
    if (qtyMatch) {
      qty = parseInt(qtyMatch[1], 10);
    }

    if (lower.includes('paratha')) {
      if (lower.includes('paneer')) {
        cal += 260 * qty; prot += 10 * qty; carbs += 28 * qty; fiber += 3 * qty;
        keyNutrients.push('Calcium', 'Quality Protein');
      } else if (lower.includes('aloo')) {
        cal += 220 * qty; prot += 4 * qty; carbs += 34 * qty; fiber += 2.5 * qty;
        keyNutrients.push('Complex Carbs');
      } else {
        cal += 210 * qty; prot += 5 * qty; carbs += 30 * qty; fiber += 3 * qty;
        keyNutrients.push('Dietary Fiber');
      }
    }

    if (lower.includes('khichdi')) {
      cal += 320; prot += 12; carbs += 52; fiber += 6;
      keyNutrients.push('A2 Ghee Lubrication', 'Gentle Digestion');
    }

    if (lower.includes('rajma') || lower.includes('chole') || lower.includes('chana')) {
      cal += 280; prot += 14; carbs += 42; fiber += 8;
      keyNutrients.push('Bioavailable Zinc', 'Soluble Prebiotic Fiber');
    }

    if (lower.includes('dal') && !lower.includes('khichdi') && !lower.includes('chilla')) {
      cal += 180; prot += 11; carbs += 24; fiber += 5;
      keyNutrients.push('Plant Protein', 'Folate');
    }

    if (lower.includes('paneer') && !lower.includes('paratha')) {
      cal += 240; prot += 18; carbs += 6; fiber += 1;
      keyNutrients.push('Bioavailable Calcium', 'Leucine');
    }

    if (lower.includes('chilla') || lower.includes('cheela')) {
      cal += 160 * qty; prot += 8 * qty; carbs += 20 * qty; fiber += 4 * qty;
      keyNutrients.push('Zinc', 'Low Glycemic Protein');
    }

    if (lower.includes('egg') || lower.includes('ande') || lower.includes('omlet') || lower.includes('omelet')) {
      cal += 75 * qty; prot += 6.5 * qty; carbs += 1; fiber += 0;
      keyNutrients.push('Choline', 'Complete Protein');
    }

    if (lower.includes('rice') || lower.includes('chawal')) {
      cal += 180; prot += 3.5; carbs += 40; fiber += 1.5;
      keyNutrients.push('Clean Energy');
    }

    if (lower.includes('roti') || lower.includes('phulka') || lower.includes('chapati')) {
      cal += 90 * qty; prot += 3 * qty; carbs += 18 * qty; fiber += 2 * qty;
      keyNutrients.push('Complex Carbs', 'B-Vitamins');
    }

    if (lower.includes('dahi') || lower.includes('curd') || lower.includes('raita')) {
      cal += 90; prot += 5; carbs += 6; fiber += 0;
      keyNutrients.push('Live Probiotics', 'Gut Support');
    }

    if (lower.includes('chai') || lower.includes('tea')) {
      cal += 60; prot += 1.5; carbs += 9; fiber += 0;
      keyNutrients.push('Herbal Antioxidants');
    }

    if (lower.includes('makhana')) {
      cal += 140; prot += 4; carbs += 24; fiber += 3;
      keyNutrients.push('Magnesium (Cramp Reliever)');
    }

    if (lower.includes('apple') || lower.includes('seb') || lower.includes('banana') || lower.includes('kela') || lower.includes('fruit')) {
      cal += 90; prot += 1; carbs += 22; fiber += 3.5;
      keyNutrients.push('Natural Pectin Fiber', 'Electrolytes');
    }

    if (lower.includes('dosa') || lower.includes('idli')) {
      cal += 150 * qty; prot += 5 * qty; carbs += 28 * qty; fiber += 2.5 * qty;
      keyNutrients.push('Fermented Probiotics');
    }

    if (lower.includes('chicken') || lower.includes('murgh')) {
      cal += 260; prot += 28; carbs += 2; fiber += 0;
      keyNutrients.push('Heme Iron', 'High Bioavailable Protein');
    }

    if (lower.includes('salad') || lower.includes('sabzi') || lower.includes('sabji')) {
      cal += 80; prot += 3; carbs += 12; fiber += 4;
      keyNutrients.push('Potassium', 'Antioxidants');
    }

    if (cal === 0) {
      cal = 330; prot = 12; carbs = 44; fiber = 5;
      keyNutrients.push('Wholesome Nutrients');
    }

    let feedback = `Nourishing fuel for your ${phase || 'current cycle phase'}!`;
    const pLower = (phase || '').toLowerCase();
    if (pLower.includes('menstrual')) {
      feedback = 'Warm, iron-supportive fuel to ease cramps and replenish blood volume.';
    } else if (pLower.includes('follicular')) {
      feedback = 'Energizing enzymes and clean protein to support follicular maturation and rising stamina.';
    } else if (pLower.includes('ovulat')) {
      feedback = 'Fiber and high-density protein to fuel peak energy and support liver estrogen detox.';
    } else if (pLower.includes('luteal')) {
      feedback = 'Grounding complex carbs and protein to steady progesterone and prevent PMS cravings.';
    }

    return {
      mealName: text.trim(),
      calories: cal,
      protein: prot,
      carbs,
      fiber,
      nutrients: keyNutrients.length ? keyNutrients : ['Balanced Micronutrients'],
      floraFeedback: feedback
    };
  };

  const handleSendFoodChat = async (foodTextToSend) => {
    const text = (foodTextToSend || foodChatInput).trim();
    if (!text || isAnalyzingFood) return;

    setFoodChatInput('');
    const userMsgId = 'user-' + Date.now();
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    setChatMessages(prev => [
      ...prev,
      { id: userMsgId, sender: 'USER', text, timestamp: nowTime }
    ]);

    setIsAnalyzingFood(true);

    let analyzedData = null;

    try {
      const prompt = `You are Flora, a clinical nutritionist for women. Analyze this meal: "${text}".
Calculate estimated total Calories (kcal), Protein (g), Carbs (g), and Fiber (g).
Provide a 1-line empathetic hormonal benefit note for a woman in her ${currentForecast.phase} phase (Cycle Day ${cycleData.currentCycleDay}).
Respond in this strict JSON format only, without markdown or extra prose:
{"mealName": "${text}", "calories": 420, "protein": 18, "carbs": 45, "fiber": 6, "nutrients": ["Key Nutrient 1", "Key Nutrient 2"], "floraFeedback": "1-line hormonal benefit note"}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2600);
      const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?json=true&model=openai`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const raw = await res.text();
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (parsed.calories && parsed.protein) {
            analyzedData = {
              mealName: parsed.mealName || text,
              calories: parseInt(parsed.calories, 10),
              protein: parseInt(parsed.protein, 10),
              carbs: parseInt(parsed.carbs || 30, 10),
              fiber: parseInt(parsed.fiber || 5, 10),
              nutrients: Array.isArray(parsed.nutrients) ? parsed.nutrients : ['High Nutrient Density'],
              floraFeedback: parsed.floraFeedback || 'Balanced nourishment for your phase.'
            };
          }
        }
      }
    } catch {
      // Offline fallback
    }

    if (!analyzedData) {
      analyzedData = estimateIndianMealNutrition(text, currentForecast.phase);
    }

    const floraMsgId = 'flora-' + Date.now();
    setChatMessages(prev => [
      ...prev,
      {
        id: floraMsgId,
        sender: 'FLORA',
        analyzedMeal: analyzedData,
        logged: false,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setIsAnalyzingFood(false);
  };

  const logAnalyzedMealFromChat = (analyzedMeal, messageId) => {
    if (!analyzedMeal) return;

    setMacros(prev => {
      const updated = {
        ...prev,
        calories: (prev.calories || 0) + (analyzedMeal.calories || 0),
        protein: (prev.protein || 0) + (analyzedMeal.protein || 0),
        carbs: (prev.carbs || 0) + (analyzedMeal.carbs || 0),
        fiber: (prev.fiber || 0) + (analyzedMeal.fiber || 0)
      };
      try {
        localStorage.setItem(todayKey, JSON.stringify(updated));
      } catch (e) {
        console.error('Storage error', e);
      }
      return updated;
    });

    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const newEntry = {
      id: Date.now(),
      name: analyzedMeal.mealName,
      calories: analyzedMeal.calories,
      protein: analyzedMeal.protein,
      carbs: analyzedMeal.carbs,
      fiber: analyzedMeal.fiber,
      time: nowTime
    };

    setTodayMealLogs(prev => {
      const updated = [newEntry, ...prev];
      try {
        localStorage.setItem(mealsHistoryKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setChatMessages(prev =>
      prev.map(msg => msg.id === messageId ? { ...msg, logged: true } : msg)
    );
  };

  const removeLoggedMeal = (mealId) => {
    const meal = todayMealLogs.find(m => m.id === mealId);
    if (!meal) return;

    setMacros(prev => {
      const updated = {
        ...prev,
        calories: Math.max(0, (prev.calories || 0) - (meal.calories || 0)),
        protein: Math.max(0, (prev.protein || 0) - (meal.protein || 0)),
        carbs: Math.max(0, (prev.carbs || 0) - (meal.carbs || 0)),
        fiber: Math.max(0, (prev.fiber || 0) - (meal.fiber || 0))
      };
      try { localStorage.setItem(todayKey, JSON.stringify(updated)); } catch {}
      return updated;
    });

    setTodayMealLogs(prev => {
      const updated = prev.filter(m => m.id !== mealId);
      try { localStorage.setItem(mealsHistoryKey, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const handleLogSuggestedMeal = () => {
    if (!suggestedMeal) return;
    setMacros(prev => {
      const updated = {
        ...prev,
        calories: (prev.calories || 0) + (suggestedMeal.calories || 0),
        protein: (prev.protein || 0) + (suggestedMeal.protein || 0)
      };
      try {
        localStorage.setItem(todayKey, JSON.stringify(updated));
      } catch (e) {
        console.error('Storage error', e);
      }
      return updated;
    });
    setLoggedSuccess(true);
    setTimeout(() => setLoggedSuccess(false), 2500);
  };

  // AI Next Meal Prediction (Pollinations.ai Free LLM with Clinical Fallback)
  const fetchFloraNextMeal = async () => {
    setLoadingAi(true);
    const calNeeded = Math.max(0, calorieGoal - (macros.calories || 0));
    const protNeeded = Math.max(0, proteinGoal - (macros.protein || 0));

    try {
      const prompt = `You are Flora, an empathetic Indian women's health clinical nutrition AI. 
Suggest exactly ONE delicious, authentic Indian ${currentSlot.label} dish for a woman in her ${currentForecast.phase} phase (Cycle Day ${cycleData.currentCycleDay}).
Her remaining targets are ~${calNeeded} kcal and ~${protNeeded}g protein.
Respond in this strict JSON format only, with no other markdown:
{"name": "Dish Name in Hindi/English", "calories": 380, "protein": 18, "benefit": "Short 1-line clinical hormonal reason why this helps in this phase."}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?json=true&model=openai`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.name && parsed.calories) {
            setSuggestedMeal({
              name: parsed.name,
              calories: parseInt(parsed.calories, 10) || 350,
              protein: parseInt(parsed.protein, 10) || 15,
              benefit: parsed.benefit || 'Optimized for your hormonal phase balance.'
            });
            setLoadingAi(false);
            return;
          }
        }
      }
    } catch {
      // Offline fallback
    }

    // Fallback: Cycle through clinical catalog
    const slotList = nextMealCatalog[currentPhaseKey]?.[currentSlot.slot] || nextMealCatalog[currentPhaseKey]?.lunch || [];
    setMealCatalogIndex(prev => {
      const nextIdx = (prev + 1) % slotList.length;
      setSuggestedMeal(slotList[nextIdx]);
      return nextIdx;
    });
    setLoadingAi(false);
  };

  const phaseDietData = {
    menstrual: {
      id: 'menstrual',
      name: 'Menstrual Phase',
      days: 'Days 1 - 5',
      tagline: 'Deep Warming & Iron Restoration (वात शमन & लौह पुष्टि)',
      phaseGoal: 'Restore iron stores, soothe uterine cramps, and ease digestion with warm A2 Ghee and jaggery.',
      macroFocus: {
        protein: '25%',
        healthyFats: '30%',
        complexCarbs: '45%',
        caloriesNote: 'Warm comfort foods (Laghu Aahar) to prevent digestive sluggishness.'
      },
      seedCycling: {
        seeds: '1 tbsp Alsi (Flax) + 1 tbsp Kaddu Seeds (Pumpkin)',
        purpose: 'Zinc and lignans to balance baseline estrogen and reduce cramping.'
      },
      meals: {
        breakfast: {
          title: 'Warm Spiced Ragi (Nachni) Malt with Gur & Almonds',
          time: '8:30 AM',
          prepTime: '10 mins',
          ingredients: ['Ragi flour', 'Warm milk', 'Organic Gur', 'Mamra almonds', 'Cardamom pinch', 'Pumpkin seeds'],
          hormoneBenefit: 'Ragi calcium & jaggery iron rebuild hemoglobin without glucose crashes.',
          tags: ['Iron Booster', 'Ayurvedic Warming']
        },
        lunch: {
          title: 'Comforting Moong Dal Khichdi with A2 Ghee & Palak Saag',
          time: '1:00 PM',
          prepTime: '25 mins',
          ingredients: ['Yellow moong dal', 'Aged rice / daliya', '1 tsp A2 Ghee', 'Fresh spinach', 'Roasted jeera & hing', 'Papad'],
          hormoneBenefit: 'A2 Ghee lubricates pelvic tissues; moong dal provides gentle complete protein.',
          tags: ['Laghu (Light)', 'Pelvic Comfort']
        },
        snack: {
          title: 'Roasted Phool Makhana in Ghee & Haldi + Gur Chikki',
          time: '4:30 PM',
          prepTime: '5 mins',
          ingredients: ['Phool makhana', 'Desi ghee', 'Haldi', 'Sendha namak', 'Gur chikki piece'],
          hormoneBenefit: 'Makhana magnesium relaxes cramped uterine smooth muscle fibers.',
          tags: ['Cramp Fighter', 'Magnesium Rich']
        },
        dinner: {
          title: 'Lauki & Moong Dal with Soft Phulkas & Beetroot Salad',
          time: '7:30 PM',
          prepTime: '20 mins',
          ingredients: ['Tender lauki', 'Yellow lentils', 'Warm phulkas', 'Grated beetroot-carrot with fresh nimbu'],
          hormoneBenefit: 'Fresh lemon Vitamin C boosts plant iron absorption by 300%.',
          tags: ['Iron Absorption', 'Light Digestion']
        }
      },
      eatFoods: [
        { name: 'Desi A2 Cow Ghee (1-2 tsp)', reason: 'Calms Vata and lubricates pelvic tissues' },
        { name: 'Palak, Methi & Sarson Saag', reason: 'High plant iron to restore blood volume' },
        { name: 'Organic Gur & Roasted Chana', reason: 'Fast hemoglobin and copper replenishment' },
        { name: 'Ajwain, Saunf & Ginger Water', reason: 'Carminative spices that ease bloating and cramps' }
      ],
      limitFoods: [
        { name: 'Chilled Curd & Cold Lassi', reason: 'Causes pelvic vasoconstriction and worsens cramps' },
        { name: 'Fried Pakoras & Samosas', reason: 'Reheated fats strain digestion and promote bloat' },
        { name: 'Cutting Chai on Empty Stomach', reason: 'Tannins block iron absorption and spike acid' },
        { name: 'Excess Salty Pickles (Achaar)', reason: 'High sodium promotes fluid retention and breast pain' }
      ],
      groceries: [
        'A2 Desi Cow Ghee',
        'Organic Gur (Jaggery)',
        'Yellow Moong Dal & Daliya',
        'Fresh Palak & Methi Leaves',
        'Ragi (Finger Millet) Flour',
        'Phool Makhana (Foxnuts)',
        'Fresh Ginger & Haldi Root',
        'Ajwain, Saunf & Hing'
      ],
      teaGuide: {
        name: 'Dadi Maa’s Ginger-Ajwain-Tulsi Kadha with Gur',
        timing: 'Morning & Evening (Warm Sip)',
        temp: 'Steaming warm',
        effect: 'Ajwain and ginger clinically reduce prostaglandin enzymes that cause cramping.'
      }
    },
    follicular: {
      id: 'follicular',
      name: 'Follicular Phase',
      days: 'Days 6 - 13',
      tagline: 'Ojas & Sprouted Proteins (ओजस निर्माण)',
      phaseGoal: 'Nourish developing ovarian follicles and build physical stamina with sprouted legumes and cooling grains.',
      macroFocus: {
        protein: '30%',
        healthyFats: '25%',
        complexCarbs: '45%',
        caloriesNote: 'Peak insulin sensitivity. Prime time for wholesome millets and pulses.'
      },
      seedCycling: {
        seeds: '1 tbsp Alsi (Flax) + 1 tbsp Kaddu Seeds (Pumpkin)',
        purpose: 'Lignans bind excess estrogen; zinc supports ovarian follicle growth.'
      },
      meals: {
        breakfast: {
          title: 'Sprouted Moong & Kala Chana Chaat with Lemon & Dhaniya',
          time: '8:00 AM',
          prepTime: '10 mins',
          ingredients: ['Sprouted green moong', 'Boiled kala chana', 'Diced cucumber & tomatoes', 'Nimbu juice', 'Roasted jeera', 'Pomegranate'],
          hormoneBenefit: 'Sprouted enzymes and B-vitamins nourish maturing ovarian follicles.',
          tags: ['High Protein', 'Enzyme Rich']
        },
        lunch: {
          title: 'Palak Paneer with Methi Multigrain Roti & Cucumber Raita',
          time: '12:45 PM',
          prepTime: '20 mins',
          ingredients: ['Fresh paneer / tofu', 'Spinach gravy', 'Wheat-Bajra-Jowar roti', 'Homemade curd raita with mint'],
          hormoneBenefit: 'Curd probiotics support the estrobolome for balanced estrogen levels.',
          tags: ['Estrobolome Care', 'Muscle Fuel']
        },
        snack: {
          title: 'Fresh Tender Nariyal Paani with Malai + Soaked Badam',
          time: '4:00 PM',
          prepTime: '2 mins',
          ingredients: ['Fresh green coconut', 'Tender malai', '6 soaked Mamra almonds', '2 walnuts'],
          hormoneBenefit: 'Potassium and healthy lipids supply precursors for ovarian hormone synthesis.',
          tags: ['Natural Electrolytes', 'Glow Fuel']
        },
        dinner: {
          title: 'Foxtail Millet (Kangni) with Yellow Dal & Paneer Bhurji',
          time: '7:15 PM',
          prepTime: '25 mins',
          ingredients: ['Foxtail millet / brown rice', 'Arhar dal with tomato tadka', 'Crumbled paneer with capsicum', 'Kachumber'],
          hormoneBenefit: 'Slow-burning millets sustain energy without afternoon glucose dips.',
          tags: ['Millet Energy', 'Complete Protein']
        }
      },
      eatFoods: [
        { name: 'Sprouted Moong & Kala Chana', reason: 'High enzymatic vitality supports egg and mitochondrial health' },
        { name: 'Fresh Tender Nariyal Paani', reason: 'Hydrates deep tissues with bioavailable potassium' },
        { name: 'Fresh Dahi (Curd) & Chaas', reason: 'Strengthens estrobolome gut bacteria for estrogen clearance' },
        { name: 'Pomegranate (Anaar) & Amla', reason: 'Antioxidants protect follicular microvasculature' }
      ],
      limitFoods: [
        { name: 'Deep-Fried Puris & Bhaturas', reason: 'Sluggish on liver pathways needed for estrogen processing' },
        { name: 'Refined Sugar Mithai', reason: 'Spikes insulin and disrupts regular follicular maturation' },
        { name: 'Packaged Salty Snacks', reason: 'Contains preservatives that mimic artificial estrogen' },
        { name: 'Skipping Morning Water', reason: 'Rising estradiol requires clean cellular hydration' }
      ],
      groceries: [
        'Sprouted Green Moong & Kala Chana',
        'Fresh Tender Coconut (Nariyal)',
        'Fresh Malai Paneer or Soya',
        'Bajra & Jowar Millet Atta',
        'Fresh Homemade Dahi',
        'Anaar & Amla',
        'Mamra Badam & Walnuts',
        'Fresh Mint & Coriander'
      ],
      teaGuide: {
        name: 'Fresh Pudina (Mint) & Saunf Infusion',
        timing: 'Mid-Morning (10:30 AM)',
        temp: 'Lukewarm',
        effect: 'Fennel stimulates digestive fire while fresh mint refreshes cognitive stamina.'
      }
    },
    ovulatory: {
      id: 'ovulatory',
      name: 'Ovulation Phase',
      days: 'Days 14 - 16',
      tagline: 'Pitta Cooling & Estrogen Detox (पित्त शमन & शोधन)',
      phaseGoal: 'Clear peak estrogen safely through the liver, cool internal Pitta heat, and fuel ovum release.',
      macroFocus: {
        protein: '30%',
        healthyFats: '30%',
        complexCarbs: '40%',
        caloriesNote: 'Peak body temp and metabolism. Fiber and cooling foods are essential.'
      },
      seedCycling: {
        seeds: '1 tbsp Til (Sesame) + 1 tbsp Surajmukhi Seeds (Sunflower)',
        purpose: 'Sesamin and selenium prevent estrogen dominance as progesterone begins.'
      },
      meals: {
        breakfast: {
          title: 'High-Fiber Besan-Methi Chilla with Mint Chutney & Sabja Pudding',
          time: '8:00 AM',
          prepTime: '12 mins',
          ingredients: ['Besan (Gram flour)', 'Fresh methi', 'Capsicum & onions', 'Mint chutney', 'Sabja pudding in coconut milk'],
          hormoneBenefit: 'Sabja mucilage & besan fiber bind circulating estrogen for bowel clearance.',
          tags: ['Pitta Cooling', 'Fiber Hero']
        },
        lunch: {
          title: 'Spiced Rajma Masala / Chole with Jeera Brown Rice & Cabbage Salad',
          time: '1:00 PM',
          prepTime: '25 mins',
          ingredients: ['Rajma / Chole', 'Tomato-ginger gravy', 'Steamed jeera brown rice / Jowar bhakri', 'Crisp shredded cabbage'],
          hormoneBenefit: 'Cruciferous cabbage indole-3-carbinol guides estrogen down safe liver pathways.',
          tags: ['Liver Clearance', 'Zinc Rich']
        },
        snack: {
          title: 'Chilled Spiced Chaas with Roasted Jeera & Mint + Roasted Til',
          time: '4:00 PM',
          prepTime: '3 mins',
          ingredients: ['Fresh churned curd', 'Roasted jeera', 'Kala namak', 'Pudina leaves', '1 tbsp roasted sesame'],
          hormoneBenefit: 'Probiotic buttermilk cools mid-cycle heat while sesame zinc supports the corpus luteum.',
          tags: ['Pitta Pacifier', 'Probiotic Tonic']
        },
        dinner: {
          title: 'Tandoori Paneer / Soya Tikka with Drumstick (Moringa) Soup',
          time: '7:30 PM',
          prepTime: '25 mins',
          ingredients: ['Spiced paneer cubes / soya', 'Charred capsicum & onions', 'Warm moringa soup', 'Soft multi-grain roti'],
          hormoneBenefit: 'Moringa drumsticks are a revered liver tonic that accelerates Phase II detox.',
          tags: ['Liver Support', 'High Vitality']
        }
      },
      eatFoods: [
        { name: 'Sabja Seeds (Sweet Basil Seeds)', reason: 'Binds and clears excess circulating estrogen in the gut' },
        { name: 'Spiced Cooling Chaas (Buttermilk)', reason: 'Pacifies Pitta heat and aids hepatic bile flow' },
        { name: 'Rajma, Chole & Kala Chana', reason: 'High zinc fuels the developing corpus luteum' },
        { name: 'Bandgobhi (Cabbage) & Phoolgobhi', reason: 'Rich in sulfur and DIM for liver estrogen clearance' }
      ],
      limitFoods: [
        { name: 'Excess Red Chili & Garam Masala', reason: 'Aggravates internal heat when body temperature is naturally higher' },
        { name: 'Oily Butter Restaurant Gravies', reason: 'Strains hepatic pathways responsible for breaking down estradiol' },
        { name: 'Heavy Salty Namkeen', reason: 'Excess sodium triggers mid-cycle water retention and breast tenderness' },
        { name: 'Sugary Energy Drinks', reason: 'Causes rapid nervous jitters and sleep disruption' }
      ],
      groceries: [
        'Besan (Gram Flour)',
        'Sabja Seeds (Basil Seeds)',
        'Rajma & Kabuli Chana',
        'Fresh Curd / Chaas',
        'White Sesame & Sunflower Seeds',
        'Bandgobhi & Capsicum',
        'Moringa (Drumstick) Pods',
        'Jeera & Kala Namak'
      ],
      teaGuide: {
        name: 'Cooling Saunf, Dhaniya & Rose Petal Infusion',
        timing: 'Afternoon (2:00 PM)',
        temp: 'Cool or Room Temp',
        effect: 'Coriander and fennel seeds cool internal heat and reduce water retention.'
      }
    },
    luteal: {
      id: 'luteal',
      name: 'Luteal Phase',
      days: 'Days 17 - 28',
      tagline: 'Serotonin Balance & Anti-PMS (प्रशांत आहार)',
      phaseGoal: 'Prevent PMS mood dips, sustain progesterone, and beat sugar cravings with Shakarkandi and millets.',
      macroFocus: {
        protein: '25%',
        healthyFats: '35%',
        complexCarbs: '40%',
        caloriesNote: 'Metabolic rate burns +150-300 kcal/day. Eat dense slow-burning complex carbs.'
      },
      seedCycling: {
        seeds: '1 tbsp Til (Sesame) + 1 tbsp Surajmukhi Seeds (Sunflower) or Til Laddu',
        purpose: 'Selenium and Vitamin E sustain progesterone and buffer against sharp drops.'
      },
      meals: {
        breakfast: {
          title: 'Warm Shakarkandi (Sweet Potato) Chaat with Roasted Peanuts',
          time: '8:30 AM',
          prepTime: '10 mins',
          ingredients: ['Steamed sweet potato', 'Roasted peanuts', 'Sendha namak & chaat masala', 'Fresh nimbu', 'Roasted jeera'],
          hormoneBenefit: 'Sweet potato complex starch triggers smooth serotonin release to stop mood dips.',
          tags: ['Serotonin Boost', 'Craving Crusher']
        },
        lunch: {
          title: 'Comforting Punjabi Kadhi Pakora with Bajra Roti & Bhindi Masala',
          time: '1:15 PM',
          prepTime: '25 mins',
          ingredients: ['Besan curd kadhi with methi', 'Bajra roti / brown rice', 'Stir-fried bhindi', 'Roasted sesame'],
          hormoneBenefit: 'Bajra magnesium relieves muscle tension; curd lactic acid eases digestion.',
          tags: ['GABA Support', 'PMS Shield']
        },
        snack: {
          title: 'Roasted Makhana in Ghee + 2 Medjool Dates or Til-Gur Laddu',
          time: '4:30 PM',
          prepTime: '3 mins',
          ingredients: ['Phool makhana', 'Desi ghee', 'Black pepper', '2 soft Khajoor (Dates) / Til laddu'],
          hormoneBenefit: 'Dates & makhana satisfy sweet cravings while flooding the brain with magnesium.',
          tags: ['Sweet Cure', 'Magnesium Rich']
        },
        dinner: {
          title: 'Kaddu (Pumpkin) & Green Pea Khichdi with A2 Ghee & Tomato Saar',
          time: '7:45 PM',
          prepTime: '25 mins',
          ingredients: ['Yellow kaddu cubes', 'Moong dal and rice', 'Green peas', 'Clove & cinnamon', '1 tsp A2 Ghee', 'Tomato saar'],
          hormoneBenefit: 'Green pea tryptophan converts into melatonin for deep, uninterrupted sleep.',
          tags: ['Sleep Aid', 'Warm Comfort']
        }
      },
      eatFoods: [
        { name: 'Shakarkandi & Yellow Kaddu', reason: 'Complex starches stabilize glucose and fuel serotonin synthesis' },
        { name: 'Roasted Makhana & Til-Gur Laddus', reason: 'Magnesium and zinc calm the nervous system and relieve PMS cramps' },
        { name: 'Bajra & Jowar Rotis', reason: 'B-complex vitamins assist natural progesterone production' },
        { name: 'Hing, Ajwain & Jeera Spices', reason: 'Prevents progesterone-induced sluggishness and bloating' }
      ],
      limitFoods: [
        { name: 'Refined Bakery Maida Pastries', reason: 'Triggers glucose spikes and sharp crashes, causing weepiness' },
        { name: 'Pickles (Achaar) & Papad Overdose', reason: 'Excess sodium exacerbates premenstrual fluid retention' },
        { name: 'Cutting Chai after 2 PM', reason: 'Late caffeine spikes cortisol and provokes nighttime insomnia' },
        { name: 'Strict Calorie Restriction', reason: 'Metabolism is elevated; restricting triggers intense binge episodes' }
      ],
      groceries: [
        'Shakarkandi (Sweet Potatoes)',
        'Yellow Kaddu & Green Peas',
        'Phool Makhana (Foxnuts)',
        'Soft Khajoor & Til-Gur Laddus',
        'Kadhi Besan & Fresh Curd',
        'Bhindi & Bajra Atta',
        'A2 Desi Cow Ghee',
        'Ajwain, Hing & Sendha Namak'
      ],
      teaGuide: {
        name: 'Ayurvedic Saunf-Elaichi-Chamomile Night Brew',
        timing: '8:45 PM (before bed)',
        temp: 'Warm and soothing',
        effect: 'Binds to GABA-A receptors, lowers body temp, and prevents PMS sleep disruption.'
      }
    }
  };

  // Determine current active phase data
  let displayPhaseKey = 'menstrual';
  if (activeTab === 'CURRENT') {
    const p = (currentForecast.phase || '').toLowerCase();
    if (p.includes('follic')) displayPhaseKey = 'follicular';
    else if (p.includes('ovulat')) displayPhaseKey = 'ovulatory';
    else if (p.includes('luteal')) displayPhaseKey = 'luteal';
    else displayPhaseKey = 'menstrual';
  } else {
    displayPhaseKey = activeTab;
  }

  const selectedData = phaseDietData[displayPhaseKey] || phaseDietData.menstrual;

  const toggleGroceryItem = (item) => {
    setCheckedGrocery(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const handleCopyGrocery = () => {
    const groceryText = `🛒 SheFlow ${selectedData.name} Grocery List:\n\n` + 
      selectedData.groceries.map(item => `• ${item}`).join('\n') +
      `\n\nPhase Goal: ${selectedData.phaseGoal}`;
    navigator.clipboard.writeText(groceryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-fadeIn font-sans">
      
      {/* ── Top Navigation & Title Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-white border border-[#FFE4EC] text-[#8A5A6A] hover:text-[#E83D6F] hover:bg-[#FFF0F5] hover:border-[#FFC2D1] transition-all shadow-sm flex items-center justify-center group"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#FFE4EC] text-[#E83D6F]">
                🇮🇳 India-Centric Nutrition
              </span>
              <span className="text-xs font-semibold text-[#8A5A6A]">
                Cycle Day {cycleData.currentCycleDay} of {cycleData.predictedCycleLength}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#2D1420] tracking-tight flex items-center gap-2 mt-0.5">
              Phase-Synced Indian Nutrition
              <Utensils className="w-6 h-6 text-[#E83D6F]" />
            </h1>
            <p className="text-xs text-[#8A5A6A] mt-0.5">
              Synchronized with Indian pulses, millets, A2 ghee, Ayurvedic spices & seasonal produce
            </p>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateHormones}
            className="px-4 py-2.5 rounded-xl border border-[#FFE4EC] bg-white text-[#2D1420] text-xs font-bold hover:bg-[#FFF0F5] hover:border-[#FFC2D1] transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Zap className="w-4 h-4 text-[#E83D6F]" />
            <span>Hormones & Energy</span>
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('flora-ai-food-chat');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const inp = document.getElementById('flora-food-input');
                if (inp) inp.focus();
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E83D6F] to-[#FF6B8B] text-white text-xs font-bold hover:shadow-md hover:shadow-[#E83D6F]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <span className="text-sm">🌸</span>
            <span>AI Food Logger & Nutrition Chat</span>
          </button>
        </div>
      </div>

      {/* 🌸 FLORA SMART NUTRIENT TRACKER & NEXT MEAL PREDICTOR (CALORIES + PROTEIN + AAGE KA MEAL) */}
      <div 
        id="flora-nutrient-tracker"
        className="bg-white rounded-3xl p-5 md:p-6 border-2 border-[#FFD3DF] shadow-soft space-y-5 relative overflow-hidden transition-all"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#FFE8EE] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFE1E8] text-[#E83D6F] flex items-center justify-center text-xl font-bold shadow-xs">
              🌸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-base font-bold text-[#2D1420]">
                  Flora Nutrient Tracker & Next Meal Predictor
                </h3>
                <span className="text-[9px] font-black uppercase tracking-wider bg-[#E8F5E9] text-[#2E7D32] px-2 py-0.5 rounded-full">
                  Live AI Sync
                </span>
              </div>
              <p className="text-xs text-[#7C6A75] mt-0.5">
                Dynamic calorie & protein balancing for <span className="font-semibold text-[#E83D6F]">{currentForecast.phase}</span> (Day {cycleData.currentCycleDay})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#E83D6F] bg-[#FFF0F4] border border-[#FFD3DF] px-3 py-1 rounded-xl flex items-center gap-1.5">
              <span>{currentSlot.icon}</span>
              <span>{currentSlot.label}</span>
            </span>
            <button
              onClick={resetTodayLog}
              className="p-1.5 text-[#8E7582] hover:text-[#E83D6F] hover:bg-[#FFF5F7] rounded-lg transition-colors cursor-pointer"
              title="Reset Today's Log"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── TRACKER GAUGES: CALORIES & PROTEIN ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. CALORIES TRACKER */}
          <div className="p-4 bg-[#FFFDF5] rounded-2xl border border-[#FBEEC9] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#FFF3E0] text-[#E65100] flex items-center justify-center font-bold">
                  <Flame className="w-4 h-4 fill-[#E65100]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#2D1420]">Daily Calories</span>
                  <span className="text-[10px] text-[#8E7582] block">
                    {Math.max(0, calorieGoal - (macros.calories || 0))} kcal remaining
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-[#E65100]">
                  {macros.calories || 0}
                </span>
                <span className="text-xs text-[#8E7582] font-semibold"> / {calorieGoal} kcal</span>
              </div>
            </div>

            <div className="w-full bg-[#FFE0B2] h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#FFB74D] to-[#E65100] h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round(((macros.calories || 0) / calorieGoal) * 100))}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-bold text-[#8E7582]">
                {Math.round(((macros.calories || 0) / calorieGoal) * 100)}% Target
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => addCalories(100)}
                  className="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-[#FFF3E0] text-[#E65100] border border-[#FFE0B2] rounded-md transition-all cursor-pointer shadow-2xs"
                  title="Add 100 kcal"
                >
                  +100
                </button>
                <button
                  onClick={() => addCalories(250)}
                  className="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-[#FFF3E0] text-[#E65100] border border-[#FFE0B2] rounded-md transition-all cursor-pointer shadow-2xs"
                  title="Add 250 kcal"
                >
                  +250
                </button>
                <button
                  onClick={() => addCalories(400)}
                  className="px-2 py-0.5 text-[10px] font-bold bg-[#E65100] hover:bg-[#BF360C] text-white rounded-md transition-all cursor-pointer shadow-2xs"
                  title="Add 400 kcal"
                >
                  +400
                </button>
              </div>
            </div>
          </div>

          {/* 2. PROTEIN TRACKER */}
          <div className="p-4 bg-[#FFF9FA] rounded-2xl border border-[#FFE8EE] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#FFE1E8] text-[#E83D6F] flex items-center justify-center font-bold">
                  <Apple className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#2D1420]">Daily Protein</span>
                  <span className="text-[10px] text-[#8E7582] block">
                    {Math.max(0, proteinGoal - (macros.protein || 0))}g needed
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-[#E83D6F]">
                  {macros.protein || 0}g
                </span>
                <span className="text-xs text-[#8E7582] font-semibold"> / {proteinGoal}g</span>
              </div>
            </div>

            <div className="w-full bg-[#FFE1E8] h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#E83D6F] h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round(((macros.protein || 0) / proteinGoal) * 100))}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-bold text-[#8E7582]">
                {Math.round(((macros.protein || 0) / proteinGoal) * 100)}% Target
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => addProtein(5)}
                  className="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-[#FFE1E8] text-[#E83D6F] border border-[#FFD3DF] rounded-md transition-all cursor-pointer shadow-2xs"
                  title="Add 5g protein"
                >
                  +5g
                </button>
                <button
                  onClick={() => addProtein(10)}
                  className="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-[#FFE1E8] text-[#E83D6F] border border-[#FFD3DF] rounded-md transition-all cursor-pointer shadow-2xs"
                  title="Add 10g protein"
                >
                  +10g
                </button>
                <button
                  onClick={() => addProtein(20)}
                  className="px-2 py-0.5 text-[10px] font-bold bg-[#E83D6F] hover:bg-[#D4265A] text-white rounded-md transition-all cursor-pointer shadow-2xs"
                  title="Add 20g protein"
                >
                  +20g
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── 💬 FLORA AI FOOD LOGGER & NUTRITION CHATBOX (ANALYZE ANY FOOD & LOG CALORIES/PROTEIN) ── */}
        <div 
          id="flora-ai-food-chat"
          className="bg-gradient-to-br from-[#FFF9FA] via-white to-[#FFF0F4] rounded-2xl md:rounded-3xl p-4 md:p-5 border border-[#FFD3DF] shadow-sm space-y-4"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#FFE8EE] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FFE1E8] text-[#E83D6F] flex items-center justify-center text-lg font-bold">
                🌸
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#2D1420] flex items-center gap-2">
                  <span>Flora AI Food Analyzer & Meal Logger</span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-[#FFE1E8] text-[#E83D6F] px-2 py-0.5 rounded-full">
                    Interactive AI
                  </span>
                </h4>
                <p className="text-[11px] text-[#7C6A75]">
                  Type what you ate in simple words — Flora calculates calories, protein & nutrients to log into your targets.
                </p>
              </div>
            </div>

            {/* Quick Inspiration Button */}
            <button
              onClick={() => handleSendFoodChat(suggestedMeal.name)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-[#FFE1E8] text-[#E83D6F] border border-[#FFD3DF] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs self-start sm:self-auto shrink-0"
              title="Quickly test with today's phase recommendation"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Try Phase Meal: {suggestedMeal.name.slice(0, 22)}...</span>
            </button>
          </div>

          {/* Quick Preset Pills for 1-click test / entry */}
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#B89DAA] block">
              Quick Suggestions (Tap to analyze & log):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                '2 Paneer Parathas + Dahi',
                'Moong Dal Khichdi + Ghee',
                '1 Besan Chilla + Mint Chutney',
                '1 Bowl Rajma Chawal + Salad',
                'Roasted Makhana + 1 Cup Chai',
                '2 Boiled Eggs + 2 Toast'
              ].map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendFoodChat(pill)}
                  className="px-2.5 py-1 bg-white hover:bg-[#FFE4EC] text-[#685361] hover:text-[#E83D6F] border border-[#FFE1E8] rounded-xl text-xs font-medium transition-all cursor-pointer shadow-2xs"
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div className="max-h-80 overflow-y-auto space-y-3 p-1 pr-2 scrollbar-thin">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'FLORA' && (
                  <div className="w-7 h-7 rounded-full bg-[#FFE1E8] text-[#E83D6F] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    🌸
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 text-xs ${
                    msg.sender === 'USER'
                      ? 'bg-gradient-to-r from-[#E83D6F] to-[#FF6B8B] text-white shadow-xs rounded-br-xs'
                      : 'bg-white border border-[#FFE4EC] text-[#2D1420] shadow-soft rounded-bl-xs'
                  }`}
                >
                  {msg.text && (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  )}

                  {/* If Analyzed Meal exists in Flora response */}
                  {msg.analyzedMeal && (
                    <div className="mt-2 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-[#FFE8EE] pb-1.5">
                        <span className="font-extrabold text-sm text-[#2D1420] flex items-center gap-1.5">
                          <span>🥗</span>
                          <span>{msg.analyzedMeal.mealName}</span>
                        </span>
                        <span className="text-[10px] font-semibold text-[#8E7582]">{msg.timestamp}</span>
                      </div>

                      {/* 4 Macro Counters */}
                      <div className="grid grid-cols-4 gap-1.5 text-center">
                        <div className="bg-[#FFFDF5] p-1.5 rounded-xl border border-[#FBEEC9]">
                          <span className="text-[9px] font-bold text-[#E65100] uppercase block">Calories</span>
                          <span className="text-xs font-black text-[#E65100]">{msg.analyzedMeal.calories} kcal</span>
                        </div>
                        <div className="bg-[#FFF9FA] p-1.5 rounded-xl border border-[#FFE8EE]">
                          <span className="text-[9px] font-bold text-[#E83D6F] uppercase block">Protein</span>
                          <span className="text-xs font-black text-[#E83D6F]">{msg.analyzedMeal.protein}g</span>
                        </div>
                        <div className="bg-[#FFF9FA] p-1.5 rounded-xl border border-[#FFE8EE]">
                          <span className="text-[9px] font-bold text-[#8E7582] uppercase block">Carbs</span>
                          <span className="text-xs font-black text-[#2D1420]">{msg.analyzedMeal.carbs}g</span>
                        </div>
                        <div className="bg-[#F4FBF5] p-1.5 rounded-xl border border-[#D7EED9]">
                          <span className="text-[9px] font-bold text-[#2E7D32] uppercase block">Fiber</span>
                          <span className="text-xs font-black text-[#2E7D32]">{msg.analyzedMeal.fiber}g</span>
                        </div>
                      </div>

                      {/* Key Nutrients Badges */}
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#8E7582] mr-1">Nutrients:</span>
                        {(msg.analyzedMeal.nutrients || []).map((nut, nIdx) => (
                          <span
                            key={nIdx}
                            className="text-[9px] font-bold bg-[#FFF5F7] text-[#E83D6F] border border-[#FFE1E8] px-2 py-0.5 rounded-full"
                          >
                            ✓ {nut}
                          </span>
                        ))}
                      </div>

                      {/* Flora Empathy & Hormonal Benefit */}
                      <p className="text-[11px] text-[#685361] bg-[#FFF5F7] p-2 rounded-xl border border-[#FFE1E8] italic">
                        "{msg.analyzedMeal.floraFeedback}"
                      </p>

                      {/* Action Button: Log to Tracker */}
                      <div className="pt-1 flex items-center justify-end">
                        <button
                          onClick={() => logAnalyzedMealFromChat(msg.analyzedMeal, msg.id)}
                          disabled={msg.logged}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                            msg.logged
                              ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]'
                              : 'bg-[#E83D6F] hover:bg-[#D4265A] active:scale-95 text-white'
                          }`}
                        >
                          {msg.logged ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>✓ Added to Today's Tracker!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Log into Today's Targets (+{msg.analyzedMeal.calories} kcal, +{msg.analyzedMeal.protein}g protein)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isAnalyzingFood && (
              <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-[#FFE8EE] text-xs text-[#E83D6F] font-semibold animate-pulse max-w-[70%]">
                <span className="text-base animate-spin">🌸</span>
                <span>Flora AI is analyzing calories, protein & nutrients...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendFoodChat();
            }}
            className="flex items-center gap-2 pt-1"
          >
            <input
              id="flora-food-input"
              type="text"
              value={foodChatInput}
              onChange={(e) => setFoodChatInput(e.target.value)}
              placeholder="What did you eat? e.g. 2 paneer parathas with curd and 1 cup chai..."
              disabled={isAnalyzingFood}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-[#FFE1E8] bg-white text-xs sm:text-sm text-[#2D1420] placeholder-[#B89DAA] focus:outline-none focus:border-[#E83D6F] focus:ring-2 focus:ring-[#FFE1E8] transition-all shadow-2xs"
            />
            <button
              type="submit"
              disabled={!foodChatInput.trim() || isAnalyzingFood}
              className="px-4 py-2.5 bg-gradient-to-r from-[#E83D6F] to-[#FF6B8B] hover:shadow-md hover:shadow-[#E83D6F]/20 active:scale-95 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs shrink-0"
            >
              <span>Analyze</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Today's Logged Meals Summary */}
          {todayMealLogs.length > 0 && (
            <div className="pt-3 border-t border-[#FFE8EE]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#2D1420] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                  <span>Today's Logged Meals ({todayMealLogs.length})</span>
                </span>
                <span className="text-[11px] font-semibold text-[#8E7582]">
                  Total: {macros.calories || 0} kcal · {macros.protein || 0}g protein
                </span>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {todayMealLogs.map((meal) => (
                  <div
                    key={meal.id}
                    className="p-2.5 bg-white rounded-xl border border-[#FFE8EE] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#2D1420]">{meal.name}</span>
                      <span className="text-[10px] text-[#8E7582] ml-2 font-medium">({meal.time})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-[#E65100]">{meal.calories} kcal</span>
                      <span className="font-black text-[#E83D6F]">{meal.protein}g protein</span>
                      <button
                        onClick={() => removeLoggedMeal(meal.id)}
                        className="p-1 text-[#8E7582] hover:text-[#D32F2F] hover:bg-[#FFEBEE] rounded-lg transition-colors cursor-pointer"
                        title="Delete meal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🎯 Daily Protein Recommendation (Calculated by Weight & Height) */}
      <div className="bg-gradient-to-r from-[#FFF0F4] via-white to-[#FFF5F7] rounded-3xl p-5 border border-[#FFD3DF] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-base">🥗</span>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#E83D6F]">Personalized Protein Recommendation</span>
            <span className="text-[10px] font-bold text-[#8A5A6A] bg-white border border-[#FFD3DF] px-2 py-0.5 rounded-full">
              {userWeight} kg · {userHeight} cm
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-black text-[#2D1420]">{userProtein}g <span className="text-xs font-normal text-[#8A5A6A]">/ day</span></h2>
            <span className="text-xs font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-md">~1.1g per kg body weight</span>
          </div>
          <p className="text-xs text-[#685361] max-w-xl">
            Aim for ~{Math.round(userProtein / 3)}g per meal. Supports follicle growth, tissue recovery & stops luteal sugar dips.
          </p>
        </div>

        {/* 3 Meal Split Chips */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
          <div className="bg-white p-2.5 rounded-2xl border border-[#FFE1E8] text-center shadow-2xs">
            <span className="text-[10px] font-bold text-[#8A5A6A] block">Breakfast</span>
            <span className="text-sm font-black text-[#E83D6F]">~{Math.round(userProtein * 0.3)}g</span>
            <span className="text-[9px] text-[#685361] block truncate">Moong / Besan</span>
          </div>
          <div className="bg-white p-2.5 rounded-2xl border border-[#FFE1E8] text-center shadow-2xs">
            <span className="text-[10px] font-bold text-[#8A5A6A] block">Lunch</span>
            <span className="text-sm font-black text-[#E83D6F]">~{Math.round(userProtein * 0.4)}g</span>
            <span className="text-[9px] text-[#685361] block truncate">Rajma / Paneer</span>
          </div>
          <div className="bg-white p-2.5 rounded-2xl border border-[#FFE1E8] text-center shadow-2xs">
            <span className="text-[10px] font-bold text-[#8A5A6A] block">Dinner</span>
            <span className="text-sm font-black text-[#E83D6F]">~{Math.round(userProtein * 0.3)}g</span>
            <span className="text-[9px] text-[#685361] block truncate">Khichdi / Soya</span>
          </div>
        </div>
      </div>

      {/* ── Interactive 4-Phase Switcher ── */}
      <div className="bg-white rounded-2xl md:rounded-3xl p-3 border border-[#FFE4EC] shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            onClick={() => setActiveTab('CURRENT')}
            className={`p-3 rounded-xl md:rounded-2xl text-left transition-all relative ${
              activeTab === 'CURRENT'
                ? 'bg-gradient-to-br from-[#E83D6F] to-[#FF6B8B] text-white shadow-md shadow-[#E83D6F]/20'
                : 'bg-[#FFF5F7] text-[#8A5A6A] hover:bg-[#FFE4EC]/50 hover:text-[#2D1420]'
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-wider opacity-80">Today's Real Phase</div>
            <div className="text-xs md:text-sm font-extrabold truncate mt-0.5">{currentForecast.phase}</div>
            <div className="text-[10px] font-semibold opacity-90 mt-1">Day {cycleData.currentCycleDay}</div>
          </button>

          <button
            onClick={() => setActiveTab('menstrual')}
            className={`p-3 rounded-xl md:rounded-2xl text-left transition-all ${
              activeTab === 'menstrual'
                ? 'bg-gradient-to-br from-[#E83D6F] to-[#FF6B8B] text-white shadow-md shadow-[#E83D6F]/20'
                : 'bg-[#FFF5F7] text-[#8A5A6A] hover:bg-[#FFE4EC]/50 hover:text-[#2D1420]'
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-wider opacity-80">Days 1 - 5</div>
            <div className="text-xs md:text-sm font-extrabold truncate mt-0.5">Menstrual</div>
            <div className="text-[10px] font-semibold opacity-90 mt-1">Warm & Replenish</div>
          </button>

          <button
            onClick={() => setActiveTab('follicular')}
            className={`p-3 rounded-xl md:rounded-2xl text-left transition-all ${
              activeTab === 'follicular'
                ? 'bg-gradient-to-br from-[#E83D6F] to-[#FF6B8B] text-white shadow-md shadow-[#E83D6F]/20'
                : 'bg-[#FFF5F7] text-[#8A5A6A] hover:bg-[#FFE4EC]/50 hover:text-[#2D1420]'
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-wider opacity-80">Days 6 - 13</div>
            <div className="text-xs md:text-sm font-extrabold truncate mt-0.5">Follicular</div>
            <div className="text-[10px] font-semibold opacity-90 mt-1">Fresh & Energizing</div>
          </button>

          <button
            onClick={() => setActiveTab('ovulatory')}
            className={`p-3 rounded-xl md:rounded-2xl text-left transition-all ${
              activeTab === 'ovulatory'
                ? 'bg-gradient-to-br from-[#E83D6F] to-[#FF6B8B] text-white shadow-md shadow-[#E83D6F]/20'
                : 'bg-[#FFF5F7] text-[#8A5A6A] hover:bg-[#FFE4EC]/50 hover:text-[#2D1420]'
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-wider opacity-80">Days 14 - 16</div>
            <div className="text-xs md:text-sm font-extrabold truncate mt-0.5">Ovulatory</div>
            <div className="text-[10px] font-semibold opacity-90 mt-1">Fiber & Detox</div>
          </button>

          <button
            onClick={() => setActiveTab('luteal')}
            className={`p-3 rounded-xl md:rounded-2xl text-left transition-all col-span-2 sm:col-span-1 ${
              activeTab === 'luteal'
                ? 'bg-gradient-to-br from-[#E83D6F] to-[#FF6B8B] text-white shadow-md shadow-[#E83D6F]/20'
                : 'bg-[#FFF5F7] text-[#8A5A6A] hover:bg-[#FFE4EC]/50 hover:text-[#2D1420]'
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-wider opacity-80">Days 17 - 28</div>
            <div className="text-xs md:text-sm font-extrabold truncate mt-0.5">Luteal</div>
            <div className="text-[10px] font-semibold opacity-90 mt-1">Calm & Serotonin</div>
          </button>
        </div>
      </div>

      {/* ── Phase Hero Banner & Objective ── */}
      <div className="bg-gradient-to-br from-[#FFF0F5] via-white to-[#FFE4EC]/40 rounded-3xl p-6 md:p-8 border border-[#FFC2D1] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#E83D6F]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E83D6F] text-white">
                {selectedData.name} ({selectedData.days})
              </span>
              <span className="text-xs font-bold text-[#8A5A6A]">
                {selectedData.tagline}
              </span>
            </div>

            {/* Seed cycling pill */}
            <div className="px-3 py-1.5 rounded-xl bg-white border border-[#FFC2D1] text-[11px] font-bold text-[#2D1420] flex items-center gap-1.5 shadow-xs">
              <Leaf className="w-3.5 h-3.5 text-[#E83D6F]" />
              <span className="text-[#8A5A6A]">Seed Cycle:</span>
              <span>{selectedData.seedCycling.seeds}</span>
            </div>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#2D1420]">
              Biological Nutrition Objective
            </h2>
            <p className="text-sm text-[#8A5A6A] leading-relaxed mt-1 max-w-3xl">
              {selectedData.phaseGoal}
            </p>
          </div>

          {/* Macro Split & Caloric Guidance */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white/90 backdrop-blur rounded-2xl p-3.5 border border-[#FFE4EC]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A5A6A]">Protein</span>
              <div className="text-lg font-black text-[#E83D6F] mt-0.5">{selectedData.macroFocus.protein}</div>
              <p className="text-[10px] text-[#8A5A6A] mt-0.5">Cellular repair & hormone building</p>
            </div>
            <div className="bg-white/90 backdrop-blur rounded-2xl p-3.5 border border-[#FFE4EC]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A5A6A]">Healthy Fats</span>
              <div className="text-lg font-black text-[#E83D6F] mt-0.5">{selectedData.macroFocus.healthyFats}</div>
              <p className="text-[10px] text-[#8A5A6A] mt-0.5">Steroid hormone precursors</p>
            </div>
            <div className="bg-white/90 backdrop-blur rounded-2xl p-3.5 border border-[#FFE4EC]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A5A6A]">Complex Carbs</span>
              <div className="text-lg font-black text-[#E83D6F] mt-0.5">{selectedData.macroFocus.complexCarbs}</div>
              <p className="text-[10px] text-[#8A5A6A] mt-0.5">Fiber & neurotransmitter fuel</p>
            </div>
            <div className="bg-white/90 backdrop-blur rounded-2xl p-3.5 border border-[#FFE4EC] flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A5A6A]">Caloric Advisory</span>
              <p className="text-[11px] font-semibold text-[#2D1420] mt-0.5 leading-tight">
                {selectedData.macroFocus.caloriesNote}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Daily Meal Plan (Breakfast, Lunch, Snack, Dinner) ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[#2D1420] flex items-center gap-2">
              <Utensils className="w-5 h-5 text-[#E83D6F]" />
              Synchronized 4-Meal Menu
            </h2>
            <p className="text-xs text-[#8A5A6A]">Designed around digestive fire, cortisol curves, and liver clearance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Breakfast */}
          <div className="bg-white rounded-3xl p-6 border border-[#FFE4EC] shadow-sm hover:border-[#FFC2D1] transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#FFF0F5] text-[#E83D6F] flex items-center justify-center font-bold text-sm">
                    🍳
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#8A5A6A]">Breakfast</span>
                    <div className="text-xs font-bold text-[#2D1420] flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[#E83D6F]" />
                      <span>{selectedData.meals.breakfast.time}</span>
                      <span className="text-[#8A5A6A]">({selectedData.meals.breakfast.prepTime})</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {selectedData.meals.breakfast.tags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF5F7] text-[#E83D6F] border border-[#FFE4EC]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <h3 className="text-base font-extrabold text-[#2D1420] mt-3">
                {selectedData.meals.breakfast.title}
              </h3>

              <div className="mt-3 bg-[#FFF5F7] rounded-xl p-3 border border-[#FFE4EC]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A5A6A] block mb-1">Key Ingredients:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedData.meals.breakfast.ingredients.map((ing, i) => (
                    <span key={i} className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-white text-[#2D1420] border border-[#FFE4EC]">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FFF0F5]/80 border border-[#FFC2D1]/60 text-xs text-[#8A5A6A] leading-relaxed">
              <strong className="text-[#E83D6F] font-bold block mb-0.5">Hormonal Benefit:</strong>
              {selectedData.meals.breakfast.hormoneBenefit}
            </div>
          </div>

          {/* Lunch */}
          <div className="bg-white rounded-3xl p-6 border border-[#FFE4EC] shadow-sm hover:border-[#FFC2D1] transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#FFF0F5] text-[#E83D6F] flex items-center justify-center font-bold text-sm">
                    🥗
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#8A5A6A]">Lunch</span>
                    <div className="text-xs font-bold text-[#2D1420] flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[#E83D6F]" />
                      <span>{selectedData.meals.lunch.time}</span>
                      <span className="text-[#8A5A6A]">({selectedData.meals.lunch.prepTime})</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {selectedData.meals.lunch.tags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF5F7] text-[#E83D6F] border border-[#FFE4EC]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <h3 className="text-base font-extrabold text-[#2D1420] mt-3">
                {selectedData.meals.lunch.title}
              </h3>

              <div className="mt-3 bg-[#FFF5F7] rounded-xl p-3 border border-[#FFE4EC]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A5A6A] block mb-1">Key Ingredients:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedData.meals.lunch.ingredients.map((ing, i) => (
                    <span key={i} className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-white text-[#2D1420] border border-[#FFE4EC]">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FFF0F5]/80 border border-[#FFC2D1]/60 text-xs text-[#8A5A6A] leading-relaxed">
              <strong className="text-[#E83D6F] font-bold block mb-0.5">Hormonal Benefit:</strong>
              {selectedData.meals.lunch.hormoneBenefit}
            </div>
          </div>

          {/* Afternoon Snack / Tonic */}
          <div className="bg-white rounded-3xl p-6 border border-[#FFE4EC] shadow-sm hover:border-[#FFC2D1] transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#FFF0F5] text-[#E83D6F] flex items-center justify-center font-bold text-sm">
                    🍵
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#8A5A6A]">Afternoon Tonic / Snack</span>
                    <div className="text-xs font-bold text-[#2D1420] flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[#E83D6F]" />
                      <span>{selectedData.meals.snack.time}</span>
                      <span className="text-[#8A5A6A]">({selectedData.meals.snack.prepTime})</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {selectedData.meals.snack.tags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF5F7] text-[#E83D6F] border border-[#FFE4EC]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <h3 className="text-base font-extrabold text-[#2D1420] mt-3">
                {selectedData.meals.snack.title}
              </h3>

              <div className="mt-3 bg-[#FFF5F7] rounded-xl p-3 border border-[#FFE4EC]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A5A6A] block mb-1">Key Ingredients:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedData.meals.snack.ingredients.map((ing, i) => (
                    <span key={i} className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-white text-[#2D1420] border border-[#FFE4EC]">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FFF0F5]/80 border border-[#FFC2D1]/60 text-xs text-[#8A5A6A] leading-relaxed">
              <strong className="text-[#E83D6F] font-bold block mb-0.5">Hormonal Benefit:</strong>
              {selectedData.meals.snack.hormoneBenefit}
            </div>
          </div>

          {/* Dinner */}
          <div className="bg-white rounded-3xl p-6 border border-[#FFE4EC] shadow-sm hover:border-[#FFC2D1] transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#FFF0F5] text-[#E83D6F] flex items-center justify-center font-bold text-sm">
                    🍲
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#8A5A6A]">Dinner</span>
                    <div className="text-xs font-bold text-[#2D1420] flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[#E83D6F]" />
                      <span>{selectedData.meals.dinner.time}</span>
                      <span className="text-[#8A5A6A]">({selectedData.meals.dinner.prepTime})</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {selectedData.meals.dinner.tags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF5F7] text-[#E83D6F] border border-[#FFE4EC]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <h3 className="text-base font-extrabold text-[#2D1420] mt-3">
                {selectedData.meals.dinner.title}
              </h3>

              <div className="mt-3 bg-[#FFF5F7] rounded-xl p-3 border border-[#FFE4EC]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A5A6A] block mb-1">Key Ingredients:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedData.meals.dinner.ingredients.map((ing, i) => (
                    <span key={i} className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-white text-[#2D1420] border border-[#FFE4EC]">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FFF0F5]/80 border border-[#FFC2D1]/60 text-xs text-[#8A5A6A] leading-relaxed">
              <strong className="text-[#E83D6F] font-bold block mb-0.5">Hormonal Benefit:</strong>
              {selectedData.meals.dinner.hormoneBenefit}
            </div>
          </div>

        </div>
      </div>

      {/* ── Eat Today vs Limit Today ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Eat Today */}
        <div className="bg-white rounded-3xl p-6 border border-[#A7F3D0]/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2D1420]">Prioritize in this Phase</h3>
              <p className="text-xs text-[#8A5A6A]">Essential superfoods for hormonal alignment</p>
            </div>
          </div>

          <div className="space-y-3">
            {selectedData.eatFoods.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold mt-0.5 shrink-0">
                  ✓
                </span>
                <div>
                  <h4 className="text-xs font-bold text-[#2D1420]">{item.name}</h4>
                  <p className="text-[11px] text-[#8A5A6A] leading-relaxed mt-0.5">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Limit Today */}
        <div className="bg-white rounded-3xl p-6 border border-[#FECDD3]/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2D1420]">Limit / Avoid in this Phase</h3>
              <p className="text-xs text-[#8A5A6A]">Triggers that disrupt estrogen clearance or provoke cramps</p>
            </div>
          </div>

          <div className="space-y-3">
            {selectedData.limitFoods.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold mt-0.5 shrink-0">
                  ✕
                </span>
                <div>
                  <h4 className="text-xs font-bold text-[#2D1420]">{item.name}</h4>
                  <p className="text-[11px] text-[#8A5A6A] leading-relaxed mt-0.5">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Interactive Phase Grocery Checklist & Herbal Tonic Guide ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Grocery List (2 columns wide) */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-[#FFE4EC] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-[#2D1420] flex items-center gap-2">
                🛒 {selectedData.name} Grocery Basket
              </h3>
              <p className="text-xs text-[#8A5A6A]">Check off what you have or copy your complete shopping list</p>
            </div>
            <button
              onClick={handleCopyGrocery}
              className="px-3.5 py-2 rounded-xl bg-[#FFF5F7] border border-[#FFE4EC] text-[#E83D6F] text-xs font-bold hover:bg-[#FFE4EC] transition-all flex items-center gap-1.5 shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Grocery List'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {selectedData.groceries.map((item, idx) => {
              const isChecked = checkedGrocery[item];
              return (
                <button
                  key={idx}
                  onClick={() => toggleGroceryItem(item)}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    isChecked
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                      : 'bg-[#FFF5F7]/50 border-[#FFE4EC] text-[#2D1420] hover:bg-white hover:border-[#FFC2D1]'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                    isChecked
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-[#FFC2D1] bg-white'
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className={`text-xs font-bold ${isChecked ? 'line-through opacity-70' : ''}`}>
                    {item}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Herbal Tea & Hydration Companion */}
        <div className="bg-gradient-to-br from-[#FFF0F5] to-white rounded-3xl p-6 border border-[#FFC2D1] shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white border border-[#FFE4EC] text-[#E83D6F] flex items-center justify-center shadow-xs">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#2D1420]">Medicinal Herbal Brew</h3>
                <span className="text-[10px] font-bold text-[#E83D6F] uppercase tracking-wider">Phase Hydration</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#FFE4EC] space-y-2">
              <div className="text-xs font-black text-[#2D1420]">
                {selectedData.teaGuide.name}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#8A5A6A]">
                <Clock className="w-3.5 h-3.5 text-[#E83D6F]" />
                <span>{selectedData.teaGuide.timing}</span>
                <span>•</span>
                <Droplets className="w-3.5 h-3.5 text-[#E83D6F]" />
                <span>{selectedData.teaGuide.temp}</span>
              </div>
              <p className="text-xs text-[#8A5A6A] leading-relaxed pt-1 border-t border-[#FFE4EC]">
                {selectedData.teaGuide.effect}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 border border-[#FFE4EC] text-[11px] text-[#8A5A6A] flex items-start gap-2">
            <Info className="w-4 h-4 text-[#E83D6F] shrink-0 mt-0.5" />
            <span>
              Tip: Keep yourself hydrated with at least 2.5L filtered water today to assist cellular osmosis and kidney filtering.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
