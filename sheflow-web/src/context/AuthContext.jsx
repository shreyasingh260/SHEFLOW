import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, userApi, getAccessToken, clearTokens } from '../api/backendApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getAccessToken());
  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(
    localStorage.getItem('sheflow_onboarding_done') === 'true'
  );

  const loadUser = useCallback(async () => {
    const storedToken = getAccessToken();
    if (storedToken) {
      try {
        const profile = await userApi.getProfile();
        setUser(profile);
        const done = Boolean(profile?.onboardingDone || localStorage.getItem('sheflow_onboarding_done') === 'true');
        setOnboardingDone(done);
        if (done) localStorage.setItem('sheflow_onboarding_done', 'true');
      } catch {
        clearTokens();
        setUser(null);
        setOnboardingDone(false);
      }
    } else {
      setUser(null);
      setOnboardingDone(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUser();
  }, [token, loadUser]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    setToken(res.accessToken);
    // onboardingDone strictly reflects the user's saved status
    const isDone = Boolean(res?.onboardingDone);
    setOnboardingDone(isDone);
    if (isDone) localStorage.setItem('sheflow_onboarding_done', 'true');
    else localStorage.removeItem('sheflow_onboarding_done');

    try {
      const profile = await userApi.getProfile();
      setUser(profile);
      const finalDone = Boolean(profile?.onboardingDone ?? isDone);
      setOnboardingDone(finalDone);
      if (finalDone) localStorage.setItem('sheflow_onboarding_done', 'true');
    } catch {
      // If getProfile fails, keep res info
    }
    return res;
  };

  const signup = async (payload) => {
    const res = await authApi.signup(payload);
    setToken(res.accessToken);
    // New user → onboarding is ALWAYS false until they fill their cycle info
    localStorage.removeItem('sheflow_onboarding_done');
    setOnboardingDone(false);
    try {
      const profile = await userApi.getProfile();
      setUser(profile);
      setOnboardingDone(false); // Guarantee onboarding is required
    } catch {
      setUser({ fullName: payload.fullName, email: payload.email, onboardingDone: false });
    }
    return res;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch (e) { console.warn('Logout error', e); }
    clearTokens();
    setToken(null);
    setUser(null);
    setOnboardingDone(false);
  };

  // Call this after onboarding completes to refresh user state
  const refreshProfile = useCallback(async () => {
    try {
      const profile = await userApi.getProfile();
      setUser(profile);
      const isDone = Boolean(profile?.onboardingDone || localStorage.getItem('sheflow_onboarding_done') === 'true');
      setOnboardingDone(isDone);
      return profile;
    } catch (e) {
      console.warn('refreshProfile error', e);
      return null;
    }
  }, []);

  const completeOnboarding = async (data) => {
    const res = await userApi.completeOnboarding(data);
    localStorage.setItem('sheflow_onboarding_done', 'true');
    setUser(prev => ({ ...(prev || {}), ...res, onboardingDone: true }));
    setOnboardingDone(true);
    return res;
  };

  const isComplete = Boolean(onboardingDone || user?.onboardingDone || localStorage.getItem('sheflow_onboarding_done') === 'true');

  return (
    <AuthContext.Provider value={{
      user, token, isAuthenticated: !!user,
      loading, onboardingDone: isComplete,
      login, signup, logout, refreshProfile, completeOnboarding
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
