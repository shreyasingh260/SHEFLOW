import React, { useState } from 'react';
import { Sparkles, Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onNavigateSignup, onNavigateForgotPassword, onLoginSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both your email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      onLoginSuccess(res);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('shreya@example.com');
    setPassword('Sheflow@123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#FFE4EC] p-6 sm:p-10 relative overflow-hidden">
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FFE1E8] rounded-full text-xs font-bold text-[#E83D6F] mb-3">
            <Sparkles className="w-4 h-4 text-[#E83D6F]" />
            <span>Welcome to SheFlow</span>
          </div>
          <h2 className="text-3xl font-extrabold font-display text-[#2D1420]">
            Log In to SheFlow
          </h2>
          <p className="text-xs sm:text-sm text-[#7C6A75] mt-1">
            Access your personalized cycle dashboard & Flora AI companion.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-[#FFF0F3] border border-[#FFCCD8] text-xs text-[#D4265A] flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8E7582] absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="shreya@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFF7F9] border border-[#FFE1E8] text-xs sm:text-sm text-[#2D1420] placeholder-[#B59DAA] focus:outline-hidden focus:border-[#E83D6F] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={onNavigateForgotPassword}
                className="text-xs font-semibold text-[#E83D6F] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8E7582] absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#FFF7F9] border border-[#FFE1E8] text-xs sm:text-sm text-[#2D1420] placeholder-[#B59DAA] focus:outline-hidden focus:border-[#E83D6F] focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-[#8E7582] hover:text-[#2D1420]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#685361]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="rounded-md border-[#FFC2D1] text-[#E83D6F] focus:ring-[#E83D6F]"
              />
              <span>Remember me</span>
            </label>

            {/* Quick Demo Fill Shortcut */}
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-semibold text-[#8E7582] hover:text-[#E83D6F] underline decoration-dotted"
            >
              Fill Demo User
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-[#E83D6F] hover:bg-[#D4265A] active:scale-[0.99] text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center mt-6 pt-5 border-t border-[#FFE4EC]">
          <p className="text-xs text-[#7C6A75]">
            New to SheFlow?{' '}
            <button
              onClick={onNavigateSignup}
              className="text-[#E83D6F] font-bold hover:underline"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
