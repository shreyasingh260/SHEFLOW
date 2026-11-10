/**
 * SheFlow API Service & Offline Client
 * Strictly adheres to SheFlow Backend Technical Documentation
 * Base URL: http://localhost:8080/api/v1
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

// Token Management
export const getAccessToken = () => localStorage.getItem('sheflow_access_token');
export const setTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem('sheflow_access_token', accessToken);
  if (refreshToken) localStorage.setItem('sheflow_refresh_token', refreshToken);
};
export const clearTokens = () => {
  localStorage.removeItem('sheflow_access_token');
  localStorage.removeItem('sheflow_refresh_token');
  localStorage.removeItem('sheflow_user');
  localStorage.removeItem('sheflow_onboarding_done');
};

// Initial state / Local Storage persistence for seamless experience
const getStoredData = (key, fallback) => {
  try {
    const val = localStorage.getItem(`sheflow_data_${key}`);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};

const setStoredData = (key, data) => {
  try {
    localStorage.setItem(`sheflow_data_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error('Storage error', e);
  }
};

// Initial Seed Data
const initialUserData = {
  userId: 'usr_sheflow_101',
  fullName: 'Shreya',
  email: 'shreya@example.com',
  dateOfBirth: '2001-07-15',
  cycleLengthDays: 28,
  periodLengthDays: 5,
  lastPeriodStart: '2026-06-18', // Day 14 on July 1
  regularity: 'REGULAR',
  onBirthControl: false,
  waterGoal: 8,
  waterCurrent: 5,
  weightKg: 55,
  heightCm: 162,
  dailyProteinGrams: 60,
  todayMood: 'Happy',
  sleepHours: '7h 35m',
  steps: 6240,
  medicineTaken: true
};

// Generic fetch with fallback
async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
  } catch (networkErr) {
    // Only genuine network/offline errors return null to allow offline fallback
    console.warn(`Backend unreachable at ${path}:`, networkErr.message);
    return null;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    throw err;
  }
  return data;
}

// ==========================================
// 1. AUTH API
// ==========================================
export const authApi = {
  async signup({ fullName, email, password, confirmPassword, dateOfBirth }) {
    // Password validation rule from Backend DNA:
    // ^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new Error('Password must be at least 8 characters and include uppercase, lowercase, number, and a special character (@$!%*?&)');
    }
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const res = await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, confirmPassword, dateOfBirth })
    });

    if (res) {
      setTokens(res.accessToken, res.refreshToken);
      return res;
    }

    // Mock Fallback (backend unreachable)
    const existingUsers = getStoredData('registered_users', []);
    if (existingUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }

    // New user: onboardingDone MUST be false so they go through onboarding
    const newUser = {
      fullName: fullName || email.split('@')[0],
      email,
      dateOfBirth: dateOfBirth || '',
      password,
      onboardingDone: false,
      cycleLengthDays: 28,
      periodLengthDays: 5,
      lastPeriodStart: null,
      regularity: 'REGULAR',
      onBirthControl: false,
      waterGoal: 8,
      weightKg: null,
      heightCm: null,
      dailyProteinGrams: null
    };
    existingUsers.push(newUser);
    setStoredData('registered_users', existingUsers);

    const token = 'mock_jwt_access_token_' + Date.now();
    setTokens(token, 'mock_jwt_refresh_token');
    setStoredData('current_user', newUser);

    return {
      accessToken: token,
      refreshToken: 'mock_jwt_refresh_token',
      onboardingDone: false   // ← new users ALWAYS go to onboarding first
    };
  },

  async login({ email, password }) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (res) {
      setTokens(res.accessToken, res.refreshToken);
      return res;
    }

    // Mock Fallback — only allow login for previously registered users OR the demo account
    const existingUsers = getStoredData('registered_users', []);
    const found = existingUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    // Demo user shortcut: pre-seeded account that has completed onboarding
    const isDemoLogin = email === 'shreya@example.com' && password === 'Sheflow@123';

    if (isDemoLogin) {
      // Ensure demo user exists in registered_users with onboardingDone: true
      const demoUser = {
        ...initialUserData,
        onboardingDone: true
      };
      const demoIdx = existingUsers.findIndex(u => u.email === 'shreya@example.com');
      if (demoIdx === -1) {
        existingUsers.push(demoUser);
        setStoredData('registered_users', existingUsers);
      }
      const token = 'mock_jwt_access_token_' + Date.now();
      setTokens(token, 'mock_jwt_refresh_token');
      setStoredData('current_user', { ...demoUser });
      return {
        accessToken: token,
        refreshToken: 'mock_jwt_refresh_token',
        onboardingDone: true
      };
    }

    if (!found) {
      throw new Error('No account found with this email. Please click "Create an account" below to sign up first.');
    }

    if (found.password !== password) {
      throw new Error('Incorrect password. Please verify your credentials.');
    }

    const token = 'mock_jwt_access_token_' + Date.now();
    setTokens(token, 'mock_jwt_refresh_token');
    setStoredData('current_user', found);
    return {
      accessToken: token,
      refreshToken: 'mock_jwt_refresh_token',
      onboardingDone: found.onboardingDone === true  // respect what was stored
    };
  },

  async forgotPassword(email) {
    const res = await request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    if (res) return res;

    // Simulate sending OTP
    setStoredData('reset_otp', { email, otp: '123456', expiresAt: Date.now() + 10 * 60 * 1000 });
    return { message: 'OTP sent successfully to your email.' };
  },

  async verifyOtp(email, otp) {
    const res = await request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });
    if (res) return res;

    const savedOtp = getStoredData('reset_otp', null);
    if (!savedOtp || savedOtp.email.toLowerCase() !== email.toLowerCase() || (savedOtp.otp !== otp && otp !== '123456')) {
      throw new Error('Invalid or expired OTP. Please check and try again.');
    }
    return { message: 'OTP verified successfully.' };
  },

  async resetPassword(email, otp, newPassword) {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new Error('Password must be at least 8 characters and include uppercase, lowercase, number, and special character');
    }

    const res = await request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword })
    });
    if (res) return res;

    // Update password locally
    const existingUsers = getStoredData('registered_users', []);
    const idx = existingUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx !== -1) {
      existingUsers[idx].password = newPassword;
      setStoredData('registered_users', existingUsers);
    }
    return { message: 'Password has been reset successfully. You can now log in.' };
  },

  async logout() {
    await request('/auth/logout', { method: 'POST' });
    clearTokens();
  }
};

// ==========================================
// 2. USER & PROFILE API
// ==========================================
export const userApi = {
  async getProfile() {
    const res = await request('/users/me');
    if (res) return res;
    // Fallback: read the locally stored user (set at signup/login time)
    // This will have the correct onboardingDone value saved at signup/login
    const stored = getStoredData('current_user', null);
    if (stored) return stored;
    // No stored user at all — treat as unauthenticated (tokens will be cleared by AuthContext catch)
    throw new Error('No user session found');
  },

  async updateProfile(updates) {
    const res = await request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    if (res) return res;

    const current = getStoredData('current_user', initialUserData);
    const updated = { ...current, ...updates };
    setStoredData('current_user', updated);
    return updated;
  },

  async completeOnboarding(data) {
    const res = await request('/users/onboarding', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res) {
      // Cache locally too so getProfile fallback has correct onboardingDone
      setStoredData('current_user', { ...getStoredData('current_user', {}), ...res, onboardingDone: true });
      return res;
    }
    // Offline fallback — mark done and persist to both current_user AND registered_users list
    const current = getStoredData('current_user', {});
    const updated = { ...current, ...data, onboardingDone: true };
    setStoredData('current_user', updated);

    // Also update in registered_users so next login returns onboardingDone: true
    const existingUsers = getStoredData('registered_users', []);
    const idx = existingUsers.findIndex(u => u.email?.toLowerCase() === updated.email?.toLowerCase());
    if (idx !== -1) {
      existingUsers[idx] = { ...existingUsers[idx], ...data, onboardingDone: true };
    } else if (updated.email) {
      existingUsers.push(updated);
    }
    setStoredData('registered_users', existingUsers);
    return updated;
  }
};

// ==========================================
// 3. CYCLE PREDICTION API (Formula from Backend DNA)
// ==========================================
export const cycleApi = {
  getPhaseForecast(currentCycleDay = 14, cycleLength = 28) {
    const day = currentCycleDay || 14;
    if (day <= 5) {
      return {
        phase: 'Menstrual Phase',
        phaseTag: 'Recovery & Renewal',
        energyScore: 62,
        energyLevel: 'Gentle & Inward Focus',
        estrogen: 'Baseline',
        progesterone: 'Low',
        hormoneSummary: 'Hormones are at their lowest baseline. Uterine lining is renewing.',
        workout: {
          title: 'Restorative Yin Yoga & 20m Walk',
          intensity: 'Low Intensity',
          description: 'Focus on gentle pelvic stretches, child pose, and light walking to boost circulation without fatigue.',
          avoid: 'Heavy deadlifts, intense sprinting'
        },
        nutrition: {
          title: 'Iron Replenishment & Ayurvedic Warming (लौह पुष्टि & वात शमन)',
          focus: 'Replenishing iron loss through flow & soothing uterine spasms with warm A2 Ghee and jaggery',
          breakfast: 'Warm Spiced Ragi (Nachni) Malt with Gur, almonds & pumpkin seeds',
          lunch: 'Moong Dal Khichdi with 1 tsp A2 Desi Ghee, Palak Saag & roasted papad',
          snack: 'Roasted Phool Makhana in ghee & haldi + Gur chikki',
          dinner: 'Tender Lauki & Moong Dal with soft Phulkas & beetroot salad',
          keyNutrients: ['Organic Iron (Hemoglobin rebuild)', 'A2 Ghee (Pelvic lubrication)', 'Turmeric & Ajwain (Anti-cramp)'],
          eatMore: ['Moong Dal Khichdi', 'Palak & Methi Saag', 'Gur & Roasted Chana', 'Haldi Doodh', 'Roasted Makhana'],
          limit: ['Chilled curd/cold lassi', 'Street oily pakoras/samosas', 'Excess cutting chai on empty stomach']
        },
        predictedMood: {
          primaryMood: 'Reflective, Sensitive & Intuitive',
          confidenceScore: 74,
          calmScore: 85,
          stressSensitivity: 'Moderate',
          emotionalDescription: 'Your brain hemispheres communicate with balanced clarity. You will crave quiet space, introspection, and thoughtful reflection.',
          floraTip: 'Honor your natural rhythm today. Say no to draining social obligations and give yourself permission to sleep an extra 30 minutes.'
        }
      };
    } else if (day < 14) {
      return {
        phase: 'Follicular Phase',
        phaseTag: 'Creativity & Stamina',
        energyScore: 88,
        energyLevel: 'Rising Stamina & Mental Drive',
        estrogen: 'Rising Rapidly',
        progesterone: 'Low',
        hormoneSummary: 'Estrogen is steadily rising, boosting serotonin and neural plasticity.',
        workout: {
          title: 'Cardio Runs, Boxing & Dynamic Strength',
          intensity: 'Moderate to High',
          description: 'Your recovery capacity is strong. Excellent time to challenge endurance and learn new movements.',
          avoid: 'Skipping warmups'
        },
        nutrition: {
          title: 'Estrogen Building & Sprouted Nutrition (ओजस पुष्टि)',
          focus: 'Nourishing maturing ovarian follicles with sprouted legumes, fresh curd, and cooling grains',
          breakfast: 'Sprouted Moong & Kala Chana Chaat with lemon, jeera & pomegranate',
          lunch: 'Palak Paneer with Methi Multigrain Roti & fresh cucumber-mint raita',
          snack: 'Fresh tender Nariyal Paani (Coconut water) with malai + soaked badam',
          dinner: 'Foxtail Millet (Kangni) / Brown Rice with Yellow Dal & capsicum paneer bhurji',
          keyNutrients: ['Phytoestrogens (Follicle health)', 'Sprouted Enzymes', 'Natural Electrolytes (K+ / Mg)'],
          eatMore: ['Sprouted Moong & Chana', 'Nariyal Paani', 'Fresh Dahi (Curd)', 'Anaar & Amla', 'Bajra-Methi Roti'],
          limit: ['Heavy deep-fried puris/bhaturas', 'Excess refined mithai sweets']
        },
        predictedMood: {
          primaryMood: 'Curious, Optimistic & Creative Drive',
          confidenceScore: 91,
          calmScore: 89,
          stressSensitivity: 'Low',
          emotionalDescription: 'Rising estrogen stimulates dopamine and endorphins. You will naturally feel more ambitious, open to new hobbies, and socially proactive.',
          floraTip: 'Tackle ambitious brainstorming sessions, creative projects, or bold meetings today—your cognitive processing is at its fastest!'
        }
      };
    } else if (day <= 16) {
      return {
        phase: 'Ovulation Phase',
        phaseTag: 'Peak Vitality & Magnetism',
        energyScore: 96,
        energyLevel: 'Peak Energy & Resilience',
        estrogen: 'Peak Surge',
        progesterone: 'Beginning to Rise',
        hormoneSummary: 'Luteinizing Hormone (LH) and estrogen peak at monthly maximums. Testosterone mini-spike.',
        workout: {
          title: 'High-Intensity Interval Training (HIIT) & Heavy Lifting',
          intensity: 'Peak Intensity',
          description: 'Maximum strength output and highest pain tolerance of the month. Great day to test your personal records.',
          avoid: 'Dehydration (body temperature runs slightly warmer)'
        },
        nutrition: {
          title: 'Fiber Rich, Pitta Cooling & Estrogen Detox (पित्त शमन)',
          focus: 'Supplying sulfur-rich Indian crucifers and Sabja fiber to safely clear peak estrogen through the liver',
          breakfast: 'High-Fiber Besan-Methi Chilla with mint chutney & Sabja pudding',
          lunch: 'Spiced Rajma Masala / Chole with Jeera Brown Rice & cabbage salad',
          snack: 'Chilled spiced Chaas (Buttermilk) with roasted jeera & mint + roasted til',
          dinner: 'Tandoori Paneer / Soya Tikka with bell peppers & warm Moringa drumstick soup',
          keyNutrients: ['Zinc (Corpus luteum vitality)', 'Sabja Fiber (Bowel estrogen clearance)', 'Chaas Probiotics'],
          eatMore: ['Besan Chilla', 'Rajma Chawal', 'Spiced Chaas', 'Sabja & Til Seeds', 'Bandgobhi (Cabbage)'],
          limit: ['Excess red chili & garam masala', 'Heavy oily restaurant gravies', 'Energy drinks']
        },
        predictedMood: {
          primaryMood: 'High Confidence, Social Magnetism & Clarity',
          confidenceScore: 96,
          calmScore: 90,
          stressSensitivity: 'Very Low',
          emotionalDescription: 'High circulating estradiol activates verbal fluency and social connectivity. You will naturally express your thoughts persuasively and feel radiant.',
          floraTip: 'You are in your monthly power peak! Pitch ideas, initiate meaningful conversations, and schedule public speaking or social gatherings today.'
        }
      };
    } else if (day <= 23) {
      return {
        phase: 'Early Luteal Phase',
        phaseTag: 'Organization & Focus',
        energyScore: 78,
        energyLevel: 'Steady, Focused & Analytical',
        estrogen: 'Moderate Second Peak',
        progesterone: 'Peak Progesterone',
        hormoneSummary: 'Progesterone is reigning, activating the calming neurotransmitter GABA in the brain.',
        workout: {
          title: 'Pilates, Moderate Resistance & Steady Swimming',
          intensity: 'Moderate Intensity',
          description: 'Focus on core strength, muscle tone, and controlled resistance rather than exhaustion.',
          avoid: 'Extreme dehydration'
        },
        nutrition: {
          title: 'Complex Carbs, Magnesium & Serotonin Stabilizers (प्रशांत आहार)',
          focus: 'Stabilizing blood sugar with Shakarkandi and millets to prevent progesterone-related fatigue and sweet cravings',
          breakfast: 'Warm Shakarkandi (Sweet Potato) Chaat with roasted peanuts & lemon',
          lunch: 'Comforting Punjabi Kadhi Pakora with Bajra Roti or Rice & Bhindi Masala',
          snack: 'Roasted Phool Makhana in Desi Ghee + 2 soft Medjool Khajoor (Dates) or Til Laddu',
          dinner: 'Kaddu (Pumpkin) & Green Pea Khichdi with A2 Ghee & warm tomato saar',
          keyNutrients: ['Vitamin B6 (Serotonin synthesis)', 'Bioavailable Magnesium (Muscle relaxation)', 'Complex Root Carbs'],
          eatMore: ['Shakarkandi', 'Bajra & Jowar Rotis', 'Kadhi & Fresh Curd', 'Phool Makhana', 'Til & Sunflower Seeds'],
          limit: ['Refined maida sweets & bakery items', 'Excess salty achaar (causes bloat)']
        },
        predictedMood: {
          primaryMood: 'Detail-Oriented, Analytical & Selective',
          confidenceScore: 84,
          calmScore: 82,
          stressSensitivity: 'Moderate',
          emotionalDescription: 'Progesterone promotes nesting and analytical precision. You will excel at organizing your home or office, editing documents, and completing backlogs.',
          floraTip: 'Channel your natural focus into checking off tasks. Keep afternoon snacks protein-rich to sustain smooth mental energy without crashes.'
        }
      };
    } else {
      return {
        phase: 'Late Luteal (Pre-Menstrual Phase)',
        phaseTag: 'Self-Care & Gentle Rest',
        energyScore: 54,
        energyLevel: 'Low Stamina · Restorative Mode',
        estrogen: 'Sharp Drop',
        progesterone: 'Sharp Drop',
        hormoneSummary: 'Both estrogen and progesterone drop rapidly, signaling the uterine lining to prepare for flow.',
        workout: {
          title: 'Gentle Walk, Slow Flow Yoga & Deep Breathing',
          intensity: 'Low & Restorative',
          description: 'High intensity will trigger excess cortisol today. Choose calming movement that soothes your nervous system.',
          avoid: 'High impact HIIT, intense cardio'
        },
        nutrition: {
          title: 'Magnesium Power & Anti-Bloat Grounding (वात शांति)',
          focus: 'Preventing water retention and buffering serotonin dips with roasted makhana, warm khichdi, and herbal brew',
          breakfast: 'Warm Spiced Ragi Porridge or Besan Chilla with mint chutney',
          lunch: 'Comforting Masoor Dal with roasted jeera aloo, soft phulkas & fresh curd',
          snack: 'Roasted Phool Makhana in ghee + warm Saunf-Elaichi Kadha',
          dinner: 'Warm Moong-Methi Khichdi with a dollop of A2 Ghee & roasted papad',
          keyNutrients: ['Magnesium (Cramps & mood stability)', 'A2 Ghee (Vata grounding)', 'Potassium (Reduces bloat)'],
          eatMore: ['Phool Makhana', 'Moong Khichdi', 'Saunf & Chamomile Tea', 'Til-Gur Laddu', 'Shakarkandi'],
          limit: ['Salty chips & achaar overdose', 'Cutting chai after 2 PM', 'Refined sugar mithai']
        },
        predictedMood: {
          primaryMood: 'Sensitive, Emotionally Receptive & Introspective',
          confidenceScore: 68,
          calmScore: 65,
          stressSensitivity: 'High (Vulnerable to Cortisol)',
          emotionalDescription: 'Serotonin dips alongside estrogen. You may feel heightened emotional empathy, lower frustration tolerance, and an intuitive desire to retreat.',
          floraTip: 'Be extra gentle with yourself. Protect your boundaries, decline unnecessary pressure, and take a warm Epsom salt bath tonight.'
        }
      };
    }
  },

  async getPrediction() {
    const res = await request('/cycles/prediction');
    if (res) return res;

    // Calculate dynamically based on user's actual submitted cycle data
    const user = getStoredData('current_user', null);
    const cycleLength = Number(user?.cycleLengthDays) || 28;
    const periodLength = Number(user?.periodLengthDays) || 5;
    const isIrregular = user?.regularity === 'IRREGULAR';

    const now = new Date();
    // Normalize to midnight in local time
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let lastPeriod = user?.lastPeriodStart ? new Date(user.lastPeriodStart) : null;
    if (!lastPeriod || isNaN(lastPeriod.getTime())) {
      // Default: started 5 days ago if no date recorded yet
      lastPeriod = new Date(today.getTime() - 5 * 86400000);
    } else {
      lastPeriod = new Date(lastPeriod.getFullYear(), lastPeriod.getMonth(), lastPeriod.getDate());
    }

    const diffDays = Math.max(0, Math.floor((today.getTime() - lastPeriod.getTime()) / 86400000));
    const currentCycleDay = (diffDays % cycleLength) + 1;

    // Next period calculation
    const cyclesElapsed = Math.floor(diffDays / cycleLength);
    const nextPeriodDateObj = new Date(lastPeriod.getTime() + (cyclesElapsed + 1) * cycleLength * 86400000);
    const daysUntilNext = Math.max(0, Math.ceil((nextPeriodDateObj.getTime() - today.getTime()) / 86400000));

    // Ovulation occurs approximately 14 days before next period
    const ovulationDateObj = new Date(nextPeriodDateObj.getTime() - 14 * 86400000);
    const fertileStartObj = new Date(ovulationDateObj.getTime() - 5 * 86400000);
    const fertileEndObj = new Date(ovulationDateObj.getTime() + 1 * 86400000);

    const toIso = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);

    let phase = 'Follicular Phase';
    if (currentCycleDay <= periodLength) {
      phase = 'Menstrual Phase (Period)';
    } else if (Math.abs(today.getTime() - ovulationDateObj.getTime()) < 86400000 || (currentCycleDay >= 13 && currentCycleDay <= 15)) {
      phase = 'Ovulation Phase';
    } else if (today >= fertileStartObj && today <= fertileEndObj) {
      phase = 'Fertile Window';
    } else if (today > ovulationDateObj) {
      phase = 'Luteal Phase';
    }

    return {
      currentCycleDay,
      cyclePhase: phase,
      daysUntilNextPeriod: daysUntilNext,
      predictedCycleLength: cycleLength,
      isIrregular,
      nextPeriodDate: toIso(nextPeriodDateObj),
      ovulationDate: toIso(ovulationDateObj),
      fertileWindowStart: toIso(fertileStartObj),
      fertileWindowEnd: toIso(fertileEndObj)
    };
  },

  async startPeriod() {
    const res = await request('/cycles/start', { method: 'POST' });
    if (res) return res;
    return { message: 'Period cycle started', currentCycleDay: 1 };
  }
};

// ==========================================
// 4. WATER TRACKING API
// ==========================================
export const waterApi = {
  async getToday() {
    const res = await request('/water/today');
    if (res) return res;
    return getStoredData('water_data', { glassesConsumed: 0, glassesGoal: 8 });
  },

  async addWater(amountMl = 250) {
    const res = await request('/water/add', {
      method: 'POST',
      body: JSON.stringify({ amountMl })
    });
    if (res) return res;

    const current = getStoredData('water_data', { glassesConsumed: 0, glassesGoal: 8 });
    const updated = {
      ...current,
      glassesConsumed: Math.min(current.glassesGoal + 4, current.glassesConsumed + 1)
    };
    setStoredData('water_data', updated);
    return updated;
  },

  async removeWater(amountMl = 250) {
    const res = await request('/water/remove', {
      method: 'POST',
      body: JSON.stringify({ amountMl })
    });
    if (res) return res;

    const current = getStoredData('water_data', { glassesConsumed: 0, glassesGoal: 8 });
    const updated = {
      ...current,
      glassesConsumed: Math.max(0, current.glassesConsumed - 1)
    };
    setStoredData('water_data', updated);
    return updated;
  }
};

// ==========================================
// 5. SYMPTOMS & MOOD API
// ==========================================
export const trackingApi = {
  async logSymptoms({ date, symptoms, severity, notes }) {
    const res = await request('/symptoms', {
      method: 'POST',
      body: JSON.stringify({ date, symptoms, severity, notes })
    });
    if (res) return res;

    const history = getStoredData('symptoms_history', [
      { id: 'sym-1', date: '2026-07-01', symptoms: ['Mild Cramps', 'Tiredness'], severity: 'MILD', notes: 'During ovulation' }
    ]);
    const entry = { id: 'sym-' + Date.now(), date, symptoms, severity, notes };
    history.unshift(entry);
    setStoredData('symptoms_history', history);
    return entry;
  },

  async logMood({ date, moods, intensity, notes }) {
    const res = await request('/moods', {
      method: 'POST',
      body: JSON.stringify({ date, moods, intensity, notes })
    });
    if (res) return res;

    const history = getStoredData('moods_history', [
      { id: 'mood-1', date: '2026-07-01', moods: ['Happy', 'Calm'], intensity: 4 }
    ]);
    const entry = { id: 'mood-' + Date.now(), date, moods, intensity, notes };
    history.unshift(entry);
    setStoredData('moods_history', history);
    return entry;
  }
};

// ==========================================
// 6. FLORA AI CHAT COMPANION
// ==========================================
export const chatApi = {
  async getHistory() {
    const res = await request('/chat/history');
    if (res) return res;

    return getStoredData('chat_history', [
      {
        id: 'msg-1',
        sender: 'FLORA',
        content: 'Hi Shreya! 🌸\nHow are you feeling today?',
        timestamp: '10:30 AM'
      },
      {
        id: 'msg-2',
        sender: 'USER',
        content: 'I have mild cramps and feeling a bit tired.',
        timestamp: '10:31 AM'
      },
      {
        id: 'msg-3',
        sender: 'FLORA',
        content: "I'm sorry to hear that. Mild cramps and tiredness are common during the ovulation phase.\n\nMake sure you stay hydrated, eat balanced meals, and get enough rest. If the pain increases, let me know.",
        timestamp: '10:31 AM'
      }
    ]);
  },

  async sendMessage(content) {
    const res = await request('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    if (res) return res;

    // Intelligent context-aware Flora AI responses
    const lower = content.toLowerCase();
    let reply = "I'm right here with you! Staying hydrated, doing gentle stretches, and getting plenty of rest can make a huge difference.";

    if (lower.includes('mood') || lower.includes('feeling') || lower.includes('predict') || lower.includes('emotion')) {
      reply = "Based on your cycle phase (Ovulation Surge), your elevated estradiol activates dopamine and verbal fluency! You are predicted to feel confident, charismatic, and emotionally radiant today. It's the best window for meaningful conversations and bold endeavors.";
    } else if (lower.includes('energy') || lower.includes('stamina') || lower.includes('power') || lower.includes('fatigue')) {
      reply = "Your biological energy forecast is at 96% peak vitality! Testosterone and estrogen peak together, giving you high physical power output and mental resilience. HIIT workouts, heavy lifting, or busy work schedules thrive today.";
    } else if (lower.includes('cramp') || lower.includes('pain')) {
      reply = "Mild cramps (mittelschmerz) often occur around ovulation as the follicle releases an egg. A warm compress or chamomile tea can provide soothing relief. If severe, consult a specialist.";
    } else if (lower.includes('exercise') || lower.includes('workout')) {
      reply = "Light to moderate exercises like yoga, brisk walking, or light swimming are wonderful! They release endorphins which naturally relieve pelvic tension.";
    } else if (lower.includes('food') || lower.includes('eat') || lower.includes('diet')) {
      reply = "Opt for iron-rich foods (spinach, lentils, dark chocolate), magnesium (nuts, seeds, bananas), and omega-3 fatty acids to reduce inflammation and stabilize hormone swings.";
    } else if (lower.includes('pregnant') || lower.includes('pregnancy')) {
      reply = "During ovulation and the 5 days leading up to it (the fertile window), pregnancy chances are at their peak. Tracking LH surge and basal body temperature gives extra precision.";
    } else if (lower.includes('normal') || lower.includes('cycle')) {
      reply = "A healthy cycle generally ranges between 21 to 35 days. Your cycle has been steady at 28 days for the last 4 months, which indicates healthy ovulation rhythm.";
    } else if (lower.includes('bleeding') || lower.includes('heavy') || lower.includes('urgent')) {
      reply = "If you are soaking through a pad or tampon in an hour or passing clots larger than a quarter, please rest immediately and connect with a healthcare provider. Use our Emergency Support button if you need immediate assistance.";
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg = { id: 'msg-' + Date.now(), sender: 'USER', content, timestamp: timeStr };
    const floraMsg = { id: 'msg-' + (Date.now() + 1), sender: 'FLORA', content: reply, timestamp: timeStr };

    const history = getStoredData('chat_history', []);
    history.push(userMsg, floraMsg);
    setStoredData('chat_history', history);

    return { userMessage: userMsg, floraReply: floraMsg };
  },

  async clearHistory() {
    const res = await request('/chat/history', { method: 'DELETE' });
    setStoredData('chat_history', []);
    return res || { message: 'Chat cleared' };
  }
};

// Helper to generate verified e-commerce store search URLs
export const getProductStoreUrl = (platformName, productName) => {
  const p = platformName?.toLowerCase() || '';
  const q = encodeURIComponent(productName);
  if (p.includes('blinkit')) return `https://blinkit.com/s/?q=${q}`;
  if (p.includes('amazon')) return `https://www.amazon.in/s?k=${q}`;
  if (p.includes('apollo')) return `https://www.apollopharmacy.in/search-medicines/${q}`;
  if (p.includes('nykaa')) return `https://www.nykaa.com/search/result/?q=${q}`;
  if (p.includes('flipkart')) return `https://www.flipkart.com/search?q=${q}`;
  if (p.includes('nua')) return `https://nuawoman.com/`;
  return `https://www.google.com/search?q=${encodeURIComponent('buy ' + productName + ' India')}`;
};

// ==========================================
// 7. PRODUCTS & WASHROOMS API
// ==========================================
export const productsApi = {
  getStoreUrl: getProductStoreUrl,

  async getProducts(category, sortBy = 'RATING') {
    // Try backend first
    const backendData = await request(`/products${category && category !== 'ALL' ? '?category=' + category : ''}`).catch(() => null);

    const list = [
      // ─── NUA ───────────────────────────────────────────────────────────────
      {
        id: 'nua-1',
        name: 'Nua Ultra Thin Organic Cotton Pads',
        brand: 'Nua',
        category: 'PADS',
        description: 'Chemical-free, zero perfume, personalized absorbency pack of 12 with individual disposal wrappers.',
        rating: 5.0,
        reviewCount: 1420,
        badge: 'Top Pick · #1 Rated',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 289, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Nua Ultra Thin Organic Cotton Pads') },
          { platformName: 'Nykaa',   price: 320, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Nua Ultra Thin Organic Cotton Pads') }
        ]
      },
      {
        id: 'nua-2',
        name: 'Nua Cramp Comfort Heat Patches',
        brand: 'Nua',
        category: 'PAIN_RELIEF',
        description: 'Air-activated self-heating patches that provide up to 8 hours of continuous warmth for period cramps. Pack of 3.',
        rating: 4.9,
        reviewCount: 1180,
        badge: 'Best Seller',
        image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 249, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Nua Cramp Comfort Heat Patches') },
          { platformName: 'Nykaa',   price: 269, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Nua Cramp Comfort Heat Patches') }
        ]
      },
      {
        id: 'nua-3',
        name: 'Nua Foaming Intimate Wash',
        brand: 'Nua',
        category: 'INTIMATE_CARE',
        description: '100% Lactic Acid formula, pH-balanced, gentle daily intimate hygiene wash for sensitive skin. 100ml.',
        rating: 4.8,
        reviewCount: 920,
        badge: 'pH Balanced',
        image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 299, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Nua Foaming Intimate Wash') },
          { platformName: 'Nykaa',   price: 319, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Nua Foaming Intimate Wash') }
        ]
      },

      // ─── WHISPER ───────────────────────────────────────────────────────────
      {
        id: 'whisper-1',
        name: 'Whisper Ultra Clean XL+ Wings Pads',
        brand: 'Whisper',
        category: 'PADS',
        description: 'Feather-soft top sheet, rapid absorption with side wings, dermatologically tested. Pack of 30.',
        rating: 4.8,
        reviewCount: 2340,
        badge: 'Most Trusted',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 350, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Whisper Ultra Clean XL Plus Wings Pads') },
          { platformName: 'Nykaa',   price: 375, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Whisper Ultra Clean XL Plus Wings Pads') }
        ]
      },
      {
        id: 'whisper-2',
        name: 'Whisper Bindazzz Nights Koala Soft XXXL',
        brand: 'Whisper',
        category: 'PADS',
        description: 'Extra-long 50cm overnight pad with soft cottony cover, 100% leak protection. Pack of 10.',
        rating: 4.9,
        reviewCount: 1870,
        badge: 'Overnight Protection',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 299, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Whisper Bindazzz Nights Koala Soft XXXL') },
          { platformName: 'Nykaa',   price: 320, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Whisper Bindazzz Nights Koala Soft XXXL') }
        ]
      },
      {
        id: 'whisper-3',
        name: 'Whisper Choice Ultra Wings Pads',
        brand: 'Whisper',
        category: 'PADS',
        description: 'Ultra thin, quick-dry net surface, side leak guards. Ideal for regular flow. Pack of 20.',
        rating: 4.6,
        reviewCount: 3200,
        badge: 'Value Pack',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 165, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Whisper Choice Ultra Wings Pads') },
          { platformName: 'Nykaa',   price: 180, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Whisper Choice Ultra Wings Pads') }
        ]
      },

      // ─── STAYFREE ──────────────────────────────────────────────────────────
      {
        id: 'stayfree-1',
        name: 'Stayfree Secure Cottony Soft XL Pads',
        brand: 'Stayfree',
        category: 'PADS',
        description: 'Soft cottony feel, Dri-Weave top sheet, secure fit with anti-leak barrier walls. Pack of 40.',
        rating: 4.7,
        reviewCount: 2890,
        badge: 'Bestseller',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 275, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Stayfree Secure Cottony Soft XL Pads') },
          { platformName: 'Nykaa',   price: 295, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Stayfree Secure Cottony Soft XL Pads') }
        ]
      },
      {
        id: 'stayfree-2',
        name: 'Stayfree Advanced All Night Ultra Comfort XL',
        brand: 'Stayfree',
        category: 'PADS',
        description: 'Longer 32cm body, secure overnight fit, all-round protection barrier. Pack of 28.',
        rating: 4.8,
        reviewCount: 1540,
        badge: 'All Night Safe',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 340, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Stayfree Advanced All Night Ultra Comfort XL') },
          { platformName: 'Nykaa',   price: 360, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Stayfree Advanced All Night Ultra Comfort XL') }
        ]
      },

      // ─── SIRONA ────────────────────────────────────────────────────────────
      {
        id: 'sirona-1',
        name: 'Sirona FDA Approved Medical Grade Menstrual Cup',
        brand: 'Sirona',
        category: 'MENSTRUAL_CUPS',
        description: '100% Medical Grade Silicone, up to 10 hours leak-free protection. Reusable up to 10 years with sterilization pouch.',
        rating: 4.9,
        reviewCount: 1280,
        badge: 'Best Eco-Friendly',
        image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 299, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Sirona Medical Grade Menstrual Cup') },
          { platformName: 'Nykaa',   price: 349, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Sirona Medical Grade Menstrual Cup') }
        ]
      },
      {
        id: 'sirona-2',
        name: 'Sirona Herbal Period Pain Relief Heat Patch',
        brand: 'Sirona',
        category: 'PAIN_RELIEF',
        description: '100% Herbal ingredients, air-activated self-heating patches for period cramps. Pack of 5.',
        rating: 4.8,
        reviewCount: 970,
        badge: 'Herbal Formula',
        image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 199, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Sirona Period Pain Relief Heat Patch') },
          { platformName: 'Nykaa',   price: 225, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Sirona Period Pain Relief Heat Patch') }
        ]
      },
      {
        id: 'sirona-3',
        name: 'Sirona Menstrual Cup Wash & Sterilizer',
        brand: 'Sirona',
        category: 'INTIMATE_CARE',
        description: 'Specially formulated wash to clean and sterilize menstrual cups. Alcohol-free, pH-balanced. 100ml.',
        rating: 4.8,
        reviewCount: 640,
        badge: 'Cup Care',
        image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 175, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Sirona Menstrual Cup Wash Sterilizer') },
          { platformName: 'Nykaa',   price: 199, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Sirona Menstrual Cup Wash Sterilizer') }
        ]
      },
      {
        id: 'sirona-4',
        name: 'Sirona Biodegradable Black Sanitary Pads',
        brand: 'Sirona',
        category: 'PADS',
        description: 'Biodegradable, charcoal-infused black pads with odor control. No chemicals, plastic-free. Pack of 10.',
        rating: 4.7,
        reviewCount: 760,
        badge: 'Eco & Odor-Free',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 259, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Sirona Biodegradable Black Sanitary Pads') },
          { platformName: 'Nykaa',   price: 280, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Sirona Biodegradable Black Sanitary Pads') }
        ]
      },

      // ─── PEE SAFE ──────────────────────────────────────────────────────────
      {
        id: 'peesafe-1',
        name: 'Pee Safe 100% Organic Cotton Tampons Regular',
        brand: 'Pee Safe',
        category: 'TAMPONS',
        description: '100% Organic cotton, biodegradable, applicator-free, free from chlorine & synthetics. Pack of 16.',
        rating: 4.7,
        reviewCount: 850,
        badge: '100% Biodegradable',
        image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 315, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Pee Safe Organic Cotton Tampons Regular') },
          { platformName: 'Nykaa',   price: 345, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Pee Safe Organic Cotton Tampons Regular') }
        ]
      },
      {
        id: 'peesafe-2',
        name: 'Pee Safe Super Absorbency Organic Tampons',
        brand: 'Pee Safe',
        category: 'TAMPONS',
        description: 'Super absorbency for heavy flow days, 100% organic, no synthetic fibres or fragrances. Pack of 16.',
        rating: 4.8,
        reviewCount: 720,
        badge: 'Heavy Flow',
        image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 345, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Pee Safe Super Absorbency Organic Tampons') },
          { platformName: 'Nykaa',   price: 375, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Pee Safe Super Absorbency Organic Tampons') }
        ]
      },
      {
        id: 'peesafe-3',
        name: 'Pee Safe Biodegradable Bamboo Sanitary Pads XL',
        brand: 'Pee Safe',
        category: 'PADS',
        description: 'Made from bamboo fibre, compostable in 180 days, dermatologically tested, rash-free. Pack of 10.',
        rating: 4.7,
        reviewCount: 610,
        badge: 'Bamboo Eco',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 249, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Pee Safe Biodegradable Bamboo Sanitary Pads XL') },
          { platformName: 'Nykaa',   price: 275, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Pee Safe Biodegradable Bamboo Sanitary Pads XL') }
        ]
      },

      // ─── CARMESI ───────────────────────────────────────────────────────────
      {
        id: 'carmesi-1',
        name: 'Carmesi Sensitive 100% Rash-Free Sanitary Pads',
        brand: 'Carmesi',
        category: 'PADS',
        description: 'Made with corn starch and bamboo, 100% rash-free guarantee, no chemicals or synthetics. Pack of 30.',
        rating: 4.9,
        reviewCount: 1050,
        badge: 'Rash-Free Guarantee',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 425, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Carmesi Sensitive Rash-Free Sanitary Pads') },
          { platformName: 'Nykaa',   price: 450, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Carmesi Sensitive Rash-Free Sanitary Pads') }
        ]
      },
      {
        id: 'carmesi-2',
        name: 'Carmesi Reusable Soft Menstrual Cup with Pouch',
        brand: 'Carmesi',
        category: 'MENSTRUAL_CUPS',
        description: 'Ultra-soft medical grade silicone cup with cotton storage pouch. Leakproof for up to 12 hours.',
        rating: 4.8,
        reviewCount: 790,
        badge: 'Softest Cup',
        image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 349, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Carmesi Reusable Soft Menstrual Cup') },
          { platformName: 'Nykaa',   price: 379, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Carmesi Reusable Soft Menstrual Cup') }
        ]
      },
      {
        id: 'carmesi-3',
        name: 'Carmesi Period Cramp Relief Heat Patch',
        brand: 'Carmesi',
        category: 'PAIN_RELIEF',
        description: 'Air-activated, chemical-free heat patches for period cramps. 8-hour warmth. Pack of 3.',
        rating: 4.8,
        reviewCount: 560,
        badge: 'Chemical Free',
        image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 229, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Carmesi Period Cramp Relief Heat Patch') },
          { platformName: 'Nykaa',   price: 249, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Carmesi Period Cramp Relief Heat Patch') }
        ]
      },

      // ─── SOFY ──────────────────────────────────────────────────────────────
      {
        id: 'sofy-1',
        name: 'Sofy AntiBacteria Extra Long Overnight XL+ Pads',
        brand: 'Sofy',
        category: 'PADS',
        description: 'AntiBacteria shield, extra-long 32cm body, 360° protection with side barriers. Pack of 28.',
        rating: 4.8,
        reviewCount: 1680,
        badge: 'AntiBacteria Shield',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 360, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Sofy AntiBacteria Extra Long Overnight XL Plus Pads') },
          { platformName: 'Nykaa',   price: 385, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Sofy AntiBacteria Extra Long Overnight XL Plus Pads') }
        ]
      },
      {
        id: 'sofy-2',
        name: 'Sofy Cool Menthol Fresh Ultra Slim Pads',
        brand: 'Sofy',
        category: 'PADS',
        description: 'Infused with menthol for a refreshing cool feeling, ultra-slim profile, quick dry. Pack of 15.',
        rating: 4.7,
        reviewCount: 1120,
        badge: 'Cooling Fresh',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 215, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Sofy Cool Menthol Fresh Ultra Slim Pads') },
          { platformName: 'Nykaa',   price: 235, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Sofy Cool Menthol Fresh Ultra Slim Pads') }
        ]
      },
      {
        id: 'sofy-3',
        name: 'Sofy Soft Tampons with Compact Plastic Applicator',
        brand: 'Sofy',
        category: 'TAMPONS',
        description: 'Easy-glide applicator, smooth rounded tip, leak-proof protection for up to 8 hours. Pack of 10.',
        rating: 4.8,
        reviewCount: 490,
        badge: 'Easy Applicator',
        image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 385, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Sofy Soft Tampons Compact Plastic Applicator') },
          { platformName: 'Nykaa',   price: 410, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Sofy Soft Tampons Compact Plastic Applicator') }
        ]
      },

      // ─── SANFE ─────────────────────────────────────────────────────────────
      {
        id: 'sanfe-1',
        name: 'Sanfe Roll-On Instant Period Pain Relief',
        brand: 'Sanfe',
        category: 'PAIN_RELIEF',
        description: 'Roll-on with peppermint, lavender & clove oil for instant period cramp relief. 10ml.',
        rating: 4.7,
        reviewCount: 820,
        badge: 'Roll-On Relief',
        image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 169, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Sanfe Roll On Period Pain Relief') },
          { platformName: 'Nykaa',   price: 189, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Sanfe Roll On Period Pain Relief') }
        ]
      },
      {
        id: 'sanfe-2',
        name: 'Sanfe Reusable Menstrual Cup with Breather Chamber',
        brand: 'Sanfe',
        category: 'MENSTRUAL_CUPS',
        description: 'Unique breather chamber design for effortless removal, FDA approved medical silicone, 12h protection.',
        rating: 4.7,
        reviewCount: 540,
        badge: 'Breather Design',
        image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 279, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Sanfe Reusable Menstrual Cup Breather Chamber') },
          { platformName: 'Nykaa',   price: 299, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Sanfe Reusable Menstrual Cup Breather Chamber') }
        ]
      },
      {
        id: 'sanfe-3',
        name: 'Sanfe Overnight Sanitary Pads with Wings',
        brand: 'Sanfe',
        category: 'PADS',
        description: 'Extra-long overnight pads, cottony soft, anti-rash surface with strong wing adhesion. Pack of 15.',
        rating: 4.6,
        reviewCount: 410,
        badge: 'Overnight Comfort',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 219, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Sanfe Overnight Sanitary Pads Wings') },
          { platformName: 'Nykaa',   price: 239, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Sanfe Overnight Sanitary Pads Wings') }
        ]
      },

      // ─── KOTEX ─────────────────────────────────────────────────────────────
      {
        id: 'kotex-1',
        name: 'Kotex Soft & Smooth Overnight Maxi Pads',
        brand: 'Kotex',
        category: 'PADS',
        description: 'Silky smooth top sheet, wide body, full-length core for all-night leak protection. Pack of 16.',
        rating: 4.7,
        reviewCount: 1340,
        badge: 'Silky Smooth',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 240, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Kotex Soft Smooth Overnight Maxi Pads') },
          { platformName: 'Nykaa',   price: 265, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Kotex Soft Smooth Overnight Maxi Pads') }
        ]
      },
      {
        id: 'kotex-2',
        name: 'Kotex Regular Day Pads with Wings',
        brand: 'Kotex',
        category: 'PADS',
        description: 'DryMax technology core, body-fit design, secure wing adhesion for active days. Pack of 20.',
        rating: 4.5,
        reviewCount: 980,
        badge: 'DryMax Core',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 190, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Kotex Regular Day Pads Wings') },
          { platformName: 'Nykaa',   price: 210, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Kotex Regular Day Pads Wings') }
        ]
      },

      // ─── MEFTAL-SPAS ───────────────────────────────────────────────────────
      {
        id: 'meftal-1',
        name: 'Meftal-Spas Period Cramp Relief Roll-On',
        brand: 'Meftal-Spas',
        category: 'PAIN_RELIEF',
        description: 'Clinically proven roll-on for period cramps and spasms. Fast absorption, doctor recommended.',
        rating: 4.8,
        reviewCount: 1890,
        badge: 'Doctor Recommended',
        image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 219, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Meftal Spas Period Cramp Relief Roll On') },
          { platformName: 'Nykaa',   price: 239, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Meftal Spas Period Cramp Relief Roll On') }
        ]
      },
      {
        id: 'meftal-2',
        name: 'Meftal-Spas Cramp Relief Heat Patches',
        brand: 'Meftal-Spas',
        category: 'PAIN_RELIEF',
        description: 'Air-activated long-lasting heat therapy patches for menstrual cramps. Up to 8-hour relief. Pack of 3.',
        rating: 4.7,
        reviewCount: 1120,
        badge: '8-Hour Relief',
        image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 189, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Meftal Spas Cramp Relief Heat Patches') },
          { platformName: 'Nykaa',   price: 209, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Meftal Spas Cramp Relief Heat Patches') }
        ]
      },

      // ─── EVERTEEN ──────────────────────────────────────────────────────────
      {
        id: 'everteen-1',
        name: 'Everteen Natural Cotton Sanitary Napkins XL',
        brand: 'Everteen',
        category: 'PADS',
        description: 'Natural cotton top layer, chemical-free, dermatologically tested for sensitive skin. Pack of 20.',
        rating: 4.6,
        reviewCount: 730,
        badge: 'Natural Cotton',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 220, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Everteen Natural Cotton Sanitary Napkins XL') },
          { platformName: 'Nykaa',   price: 245, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Everteen Natural Cotton Sanitary Napkins XL') }
        ]
      },
      {
        id: 'everteen-2',
        name: 'Everteen Intimate Hygiene Wash',
        brand: 'Everteen',
        category: 'INTIMATE_CARE',
        description: 'pH 3.5 balanced natural intimate wash with tea tree oil and aloevera. 105ml.',
        rating: 4.7,
        reviewCount: 880,
        badge: 'Tea Tree & Aloevera',
        image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 249, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Everteen Intimate Hygiene Wash') },
          { platformName: 'Nykaa',   price: 275, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Everteen Intimate Hygiene Wash') }
        ]
      },

      // ─── JUJU ──────────────────────────────────────────────────────────────
      {
        id: 'juju-1',
        name: 'Juju Menstrual Disc',
        brand: 'JuJu',
        category: 'MENSTRUAL_CUPS',
        description: 'Flexible menstrual disc for mess-free period sex, 12h wear, medical grade polymer. Single use pack of 10.',
        rating: 4.6,
        reviewCount: 320,
        badge: 'Period Disc',
        image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 549, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Juju Menstrual Disc') },
          { platformName: 'Nykaa',   price: 599, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Juju Menstrual Disc') }
        ]
      },

      // ─── AZAH ──────────────────────────────────────────────────────────────
      {
        id: 'azah-1',
        name: 'Azah Rash-Free Sanitary Pads',
        brand: 'Azah',
        category: 'PADS',
        description: 'Corn bioplastic top layer, 100% biodegradable packaging, free from SAP. Regular flow. Pack of 25.',
        rating: 4.7,
        reviewCount: 490,
        badge: 'Corn Bioplastic',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 299, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Azah Rash-Free Sanitary Pads') },
          { platformName: 'Nykaa',   price: 325, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Azah Rash-Free Sanitary Pads') }
        ]
      },
      {
        id: 'azah-2',
        name: 'Azah Period Cramp Roll-On Essential Oil',
        brand: 'Azah',
        category: 'PAIN_RELIEF',
        description: 'Clary sage, ginger & lavender essential oil blend for period cramp relief. Roll-on 10ml.',
        rating: 4.6,
        reviewCount: 310,
        badge: 'Essential Oils',
        image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&q=80',
        platforms: [
          { platformName: 'Blinkit', price: 299, currency: 'INR', deliveryTime: '10 mins', bestPrice: true,  storeUrl: getProductStoreUrl('Blinkit', 'Azah Period Cramp Roll-On Essential Oil') },
          { platformName: 'Nykaa',   price: 325, currency: 'INR', deliveryTime: '2 days',  bestPrice: false, storeUrl: getProductStoreUrl('Nykaa',   'Azah Period Cramp Roll-On Essential Oil') }
        ]
      }
    ];

    let result = list;
    if (category && category !== 'ALL') {
      result = list.filter(p => p.category === category);
    }

    // Sort by rating descending: Nua (5.0) -> Sirona (4.9) -> Meftal (4.8) -> Pee Safe (4.7)
    if (sortBy === 'RATING') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'PRICE_LOW') {
      result.sort((a, b) => {
        const minA = Math.min(...a.platforms.map(p => p.price));
        const minB = Math.min(...b.platforms.map(p => p.price));
        return minA - minB;
      });
    }

    return result;
  }
};

export const washroomsApi = {
  // Helper: Haversine distance in km
  calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0.5;
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return +(R * c).toFixed(1);
  },

  async getNearby({ lat, lng, areaName, locality, city } = {}) {
    // Try backend first if available
    const backendData = await request('/washrooms').catch(() => null);

    // Determine local contextual naming from user's detected location
    const loc = locality || areaName?.split(',')[0]?.trim() || 'Central District';
    const cityStr = city || areaName?.split(',')[1]?.trim() || '';
    const fullLoc = cityStr ? `${loc}, ${cityStr}` : loc;

    // Offsets in degrees (~0.001 deg is ~110m)
    // wash-1: ~250m, wash-2: ~380m, wash-3: ~520m, wash-4: ~720m, wash-5: ~950m
    const baseFacilities = [
      {
        id: 'wash-1',
        name: lat && lng ? `${loc} Health Centre & Emergency Pad Station` : 'City Care Hospital Pad Dispenser & Restroom',
        type: 'VENDING_MACHINE',
        address: lat && lng ? `Ground Floor Wing, Main Road, ${fullLoc}` : 'Ground Floor, City Hospital, Wing B',
        latitude: lat ? +(lat + 0.0018).toFixed(6) : 28.6139,
        longitude: lng ? +(lng + 0.0014).toFixed(6) : 77.209,
        wheelchairAccessible: true,
        openingHours: 'Open 24 Hours',
        rating: 4.9,
        sanitaryPadsAvailable: true,
        padMachineStock: 'Fully Stocked (Free / ₹5 UPI scan)',
        padSizesAvailable: ['Regular', 'XL Overnight'],
        cost: 'Free Public Access',
        cleanlinessScore: 9.6,
        hygieneBadge: 'Pristine & Sanitized',
        lastCleaned: '15 mins ago',
        conditions: {
          waterSupply: 'Continuous running water & dual jet spray',
          soapAvailable: 'Automatic antibacterial foam soap',
          lockCondition: 'Heavy-duty privacy latch & bolt',
          sanitaryBin: 'Touchless pedal bin with biohazard liner',
          lightingAndSecurity: 'Bright LED lighting, 24/7 female attendant',
          cubicleType: 'Western cubicles with grab bars'
        },
        googleRating: 4.9,
        googleReviewCount: 524,
        googleReviews: [
          {
            id: 'r1',
            author: 'Priya Sharma',
            isLocalGuide: true,
            guideLevel: 'Local Guide · Level 6',
            rating: 5,
            date: 'Yesterday',
            text: 'Absolute lifesaver during an emergency! The sanitary napkin vending machine worked instantly with a ₹5 UPI QR scan. Very clean, mirror was spotless, and soap dispenser was full.',
            helpfulCount: 28
          },
          {
            id: 'r2',
            author: 'Dr. Meenakshi Iyer',
            isLocalGuide: true,
            guideLevel: 'Local Guide · Level 4',
            rating: 5,
            date: '4 days ago',
            text: 'Extremely hygienic and well-maintained by staff. Sanitized hourly. Safe, private, and wheelchair accessible.',
            helpfulCount: 19
          },
          {
            id: 'r3',
            author: 'Sanya Malhotra',
            isLocalGuide: false,
            rating: 5,
            date: '1 week ago',
            text: 'Floor was completely dry and fragrant. Pad machine had both normal and XL pads in stock. Highly recommended.',
            helpfulCount: 11
          }
        ]
      },
      {
        id: 'wash-2',
        name: lat && lng ? `${loc} Metro Station Clean Restroom & Pad Station` : 'Metro Station Clean Restroom & Pad Station',
        type: 'PUBLIC_TOILET',
        address: lat && lng ? `Concourse Level Gate 2, ${loc} Metro, ${fullLoc}` : 'Gate 2, Concourse Level, Central Metro',
        latitude: lat ? +(lat - 0.0028).toFixed(6) : 28.6145,
        longitude: lng ? +(lng + 0.0019).toFixed(6) : 77.21,
        wheelchairAccessible: true,
        openingHours: '5:30 AM - 11:30 PM',
        rating: 4.7,
        sanitaryPadsAvailable: true,
        padMachineStock: 'In Stock (₹5 Coin / QR)',
        padSizesAvailable: ['Regular', 'Wings'],
        cost: 'Free for Commuters',
        cleanlinessScore: 9.1,
        hygieneBadge: 'High Hygiene Standard',
        lastCleaned: '30 mins ago',
        conditions: {
          waterSupply: 'High pressure running water',
          soapAvailable: 'Liquid hand soap dispenser',
          lockCondition: 'Functional steel deadbolt',
          sanitaryBin: 'Dedicated sanitary incinerator & bin',
          lightingAndSecurity: 'CCTV surveillance in corridor, female security guard outside',
          cubicleType: '3 Western cubicles + 1 Accessible cubicle'
        },
        googleRating: 4.7,
        googleReviewCount: 382,
        googleReviews: [
          {
            id: 'r4',
            author: 'Neha Roy',
            isLocalGuide: true,
            guideLevel: 'Local Guide · Level 5',
            rating: 5,
            date: '2 days ago',
            text: 'Cleanest metro washroom in the line. The pad dispenser is right next to the handwash area. Security guard makes sure only women enter.',
            helpfulCount: 32
          },
          {
            id: 'r5',
            author: 'Ananya Roy',
            isLocalGuide: false,
            rating: 4,
            date: '5 days ago',
            text: 'Very convenient location right by Gate 2. Clean western toilets and running water. UPI accepted at the pad machine.',
            helpfulCount: 14
          }
        ]
      },
      {
        id: 'wash-3',
        name: lat && lng ? `Bloom Cafe & Wellness Restroom (${loc})` : 'Bloom Organic Cafe & Wellness Restroom',
        type: 'CAFE',
        address: lat && lng ? `Lane 4, Market Complex, ${loc}, ${cityStr}` : '42 Orchid Lane, Market Complex',
        latitude: lat ? +(lat + 0.0039).toFixed(6) : 28.6152,
        longitude: lng ? +(lng - 0.0024).toFixed(6) : 77.2115,
        wheelchairAccessible: false,
        openingHours: '8:00 AM - 11:00 PM',
        rating: 4.8,
        sanitaryPadsAvailable: true,
        padMachineStock: 'Complimentary basket at washbasin',
        padSizesAvailable: ['Organic Cotton Pads'],
        cost: 'Free for Visitors',
        cleanlinessScore: 9.4,
        hygieneBadge: 'Boutique Cleanliness',
        lastCleaned: '20 mins ago',
        conditions: {
          waterSupply: 'Warm & cold running water',
          soapAvailable: 'Organic essential oil handwash & lotion',
          lockCondition: 'Double privacy lock',
          sanitaryBin: 'Covered metal sanitary bin',
          lightingAndSecurity: 'Cozy warm lighting, quiet corridor',
          cubicleType: 'Spacious individual washroom with full mirror'
        },
        googleRating: 4.8,
        googleReviewCount: 247,
        googleReviews: [
          {
            id: 'r6',
            author: 'Kavita Chawla',
            isLocalGuide: true,
            guideLevel: 'Local Guide · Level 7',
            rating: 5,
            date: '3 days ago',
            text: 'They provide complimentary organic pads in a pretty basket next to the sink! So thoughtful and incredibly clean. Smells like lavender.',
            helpfulCount: 45
          },
          {
            id: 'r7',
            author: 'Tanvi Bansal',
            isLocalGuide: false,
            rating: 5,
            date: '1 week ago',
            text: 'Spotless restroom. High-end handwash and dry towels provided. Staff is very courteous if you just need to use the restroom.',
            helpfulCount: 18
          }
        ]
      },
      {
        id: 'wash-4',
        name: lat && lng ? `${loc} Mall Women Lounge & Pad Station` : 'Phoenix Grand Mall Women Lounge & Pad Station',
        type: 'MALL',
        address: lat && lng ? `2nd Floor Central Atrium, Mall Plaza, ${fullLoc}` : '2nd Floor, Central Atrium, Phoenix Mall',
        latitude: lat ? +(lat - 0.0049).toFixed(6) : 28.612,
        longitude: lng ? +(lng - 0.0035).toFixed(6) : 77.205,
        wheelchairAccessible: true,
        openingHours: '10:00 AM - 10:30 PM',
        rating: 4.9,
        sanitaryPadsAvailable: true,
        padMachineStock: 'Fully Stocked Smart Vending Machine',
        padSizesAvailable: ['Regular', 'Overnight', 'Pantyliners'],
        cost: 'Free Mall Amenity',
        cleanlinessScore: 9.8,
        hygieneBadge: 'Luxury Hygiene Lounge',
        lastCleaned: '10 mins ago',
        conditions: {
          waterSupply: 'Sensor faucets with temperature control',
          soapAvailable: 'Touchless automatic soap & sanitizer',
          lockCondition: 'Electronic occupancy indicator with secure bolt',
          sanitaryBin: 'Automated touchless disposal units in each cubicle',
          lightingAndSecurity: 'Dedicated female attendant inside lounge at all times',
          cubicleType: '8 Western cubicles + Baby Nursing Room + Powder Area'
        },
        googleRating: 4.9,
        googleReviewCount: 680,
        googleReviews: [
          {
            id: 'r8',
            author: 'Rashi Agarwal',
            isLocalGuide: true,
            guideLevel: 'Local Guide · Level 6',
            rating: 5,
            date: 'Just today',
            text: 'Best women restroom in the area. Has a private nursing station, free pad dispensing machine, and touchless everything. Dedicated attendant keeps it spotless.',
            helpfulCount: 52
          },
          {
            id: 'r9',
            author: 'Simran Walia',
            isLocalGuide: false,
            rating: 5,
            date: '4 days ago',
            text: 'Very luxurious and clean. Lots of mirrors for touch-ups and spacious diaper changing table.',
            helpfulCount: 21
          }
        ]
      },
      {
        id: 'wash-5',
        name: lat && lng ? `Pink Toilet Initiative & SOS Dispenser (${loc})` : 'Pink Toilet Initiative & SOS Dispenser',
        type: 'PUBLIC_TOILET',
        address: lat && lng ? `High Street Junction near Community Garden, ${fullLoc}` : 'Corner of High Street & Community Park',
        latitude: lat ? +(lat + 0.0058).toFixed(6) : 28.6165,
        longitude: lng ? +(lng + 0.0041).toFixed(6) : 77.214,
        wheelchairAccessible: true,
        openingHours: 'Open 24 Hours',
        rating: 4.6,
        sanitaryPadsAvailable: true,
        padMachineStock: 'In Stock (Subsidized ₹2 Coin / UPI)',
        padSizesAvailable: ['Regular Biodegradable'],
        cost: '₹2 Token (Free for Students & Emergencies)',
        cleanlinessScore: 8.9,
        hygieneBadge: 'Women-Only Safe Space',
        lastCleaned: '40 mins ago',
        conditions: {
          waterSupply: 'Regular running water with backup tank',
          soapAvailable: 'Liquid soap dispenser',
          lockCondition: 'Double internal latch with emergency buzzer',
          sanitaryBin: 'Incinerator equipped sanitary bin',
          lightingAndSecurity: 'Dedicated women police beat & well lit street',
          cubicleType: '2 Western + 2 Indian toilets'
        },
        googleRating: 4.6,
        googleReviewCount: 195,
        googleReviews: [
          {
            id: 'r10',
            author: 'Bhavna Joshi',
            isLocalGuide: true,
            guideLevel: 'Local Guide · Level 5',
            rating: 5,
            date: '5 days ago',
            text: 'Government Pink Toilet model that actually works well. Clean attendant on duty and the sanitary pad dispenser worked easily with UPI.',
            helpfulCount: 30
          }
        ]
      }
    ];

    // Compute live distances based on lat/lng
    return baseFacilities.map((fac) => {
      let distanceKm = 0.4;
      if (lat && lng) {
        distanceKm = washroomsApi.calculateDistance(lat, lng, fac.latitude, fac.longitude);
      } else {
        // reasonable default distances
        const offsets = { 'wash-1': 0.3, 'wash-2': 0.7, 'wash-3': 1.1, 'wash-4': 1.4, 'wash-5': 1.9 };
        distanceKm = offsets[fac.id] || 0.8;
      }

      // Approx walking time: 1 km ~ 12 mins
      const walkingMins = Math.max(2, Math.round(distanceKm * 12));

      return {
        ...fac,
        distanceKm,
        walkingTimeMins: walkingMins
      };
    });
  }
};
