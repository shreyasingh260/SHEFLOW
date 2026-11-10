import React, { useState } from 'react';
import { Sparkles, Eye, EyeOff, Lock, Mail, User, Calendar, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

export default function SignupPage({ onNavigateLogin, onSignupSuccess }) {
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Validation tests based on backend rule: ^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$
  const password = formData.password;
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*?&]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;
  const passwordsMatch = formData.password && formData.password === formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim()) {
      setError('Please provide your full name');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please provide a valid email address');
      return;
    }
    if (!isPasswordValid) {
      setError('Password does not satisfy all security requirements');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signup(formData);
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      onSignupSuccess();
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-[#FFE4EC] p-6 sm:p-10 relative overflow-hidden">
        {/* Top Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FFE1E8] rounded-full text-xs font-bold text-[#E83D6F] mb-3">
            <Sparkles className="w-4 h-4 text-[#E83D6F]" />
            <span>Join SheFlow Community</span>
          </div>
          <h2 className="text-3xl font-extrabold font-display text-[#2D1420]">
            Create Your Account
          </h2>
          <p className="text-xs sm:text-sm text-[#7C6A75] mt-1">
            Empower your health journey with tailored cycle predictions.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-[#FFF0F3] border border-[#FFCCD8] text-xs text-[#D4265A] flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#8E7582] absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Shreya Singh"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFF7F9] border border-[#FFE1E8] text-xs sm:text-sm text-[#2D1420] placeholder-[#B59DAA] focus:outline-hidden focus:border-[#E83D6F] focus:bg-white transition-all"
              />
            </div>
          </div>

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
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="shreya@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFF7F9] border border-[#FFE1E8] text-xs sm:text-sm text-[#2D1420] placeholder-[#B59DAA] focus:outline-hidden focus:border-[#E83D6F] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Date of Birth (Optional) */}
          <div>
            <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-1">
              Date of Birth <span className="text-[#8E7582] font-normal lowercase">(optional)</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#8E7582] absolute left-3.5 top-3.5" />
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFF7F9] border border-[#FFE1E8] text-xs sm:text-sm text-[#2D1420] focus:outline-hidden focus:border-[#E83D6F] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8E7582] absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="At least 8 chars with upper, lower, number, symbol"
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

            {/* Live Password Rules Feedback */}
            <div className="grid grid-cols-2 gap-1.5 mt-2 text-[10px] sm:text-xs">
              <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-green-600' : 'text-[#8E7582]'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>8+ characters</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-green-600' : 'text-[#8E7582]'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>1 uppercase letter</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasLower ? 'text-green-600' : 'text-[#8E7582]'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>1 lowercase letter</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasNumber && hasSpecial ? 'text-green-600' : 'text-[#8E7582]'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Number & symbol (@$!%*?&)</span>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8E7582] absolute left-3.5 top-3.5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Re-enter your password"
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#FFF7F9] border border-[#FFE1E8] text-xs sm:text-sm text-[#2D1420] placeholder-[#B59DAA] focus:outline-hidden focus:border-[#E83D6F] focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-3.5 text-[#8E7582] hover:text-[#2D1420]"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.confirmPassword && !passwordsMatch && (
              <p className="text-[11px] text-[#D4265A] mt-1 font-medium">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-[#E83D6F] hover:bg-[#D4265A] active:scale-[0.99] text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center mt-6 pt-5 border-t border-[#FFE4EC]">
          <p className="text-xs text-[#7C6A75]">
            Already have a SheFlow account?{' '}
            <button
              onClick={onNavigateLogin}
              className="text-[#E83D6F] font-bold hover:underline"
            >
              Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
