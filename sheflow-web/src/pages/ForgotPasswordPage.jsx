import React, { useState } from 'react';
import { Sparkles, Mail, KeyRound, Lock, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { authApi } from '../api/backendApi';

export default function ForgotPasswordPage({ onNavigateLogin }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) return setError('Please enter your email');

    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSuccessMsg('A 6-digit OTP code has been sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please check email address.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp) return setError('Please enter the OTP');

    setLoading(true);
    try {
      await authApi.verifyOtp(email, otp);
      setSuccessMsg('OTP verified successfully! Create your new password.');
      setStep(3);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError('Password must be 8+ characters with uppercase, lowercase, number, and special character');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(email, otp, newPassword);
      setSuccessMsg('Your password has been changed! Redirecting to login...');
      setTimeout(() => {
        onNavigateLogin();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#FFE4EC] p-6 sm:p-10 relative overflow-hidden">
        <button
          onClick={onNavigateLogin}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8E7582] hover:text-[#E83D6F] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#FFE1E8] text-[#E83D6F] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold font-display text-[#2D1420]">
            Password Recovery
          </h2>
          <p className="text-xs text-[#7C6A75] mt-1">
            {step === 1 && 'Enter your registered email to receive a recovery OTP.'}
            {step === 2 && 'Enter the 6-digit OTP code sent to your email.'}
            {step === 3 && 'Set a strong, new password for your SheFlow account.'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? 'w-8 bg-[#E83D6F]' : s < step ? 'w-4 bg-green-500' : 'w-4 bg-[#FFE1E8]'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-[#FFF0F3] border border-[#FFCCD8] text-xs text-[#D4265A] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-[#E8F5E9] border border-[#C8E6C9] text-xs text-green-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* STEP 1: Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-1">
                Account Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8E7582] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="shreya@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFF7F9] border border-[#FFE1E8] text-xs sm:text-sm text-[#2D1420] focus:outline-hidden focus:border-[#E83D6F]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#E83D6F] hover:bg-[#D4265A] text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Sending OTP...' : 'Send Recovery OTP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-1">
                Enter 6-Digit OTP (Use 123456 for demo)
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest text-lg font-bold py-3 rounded-2xl bg-[#FFF7F9] border border-[#FFE1E8] text-[#2D1420] focus:outline-hidden focus:border-[#E83D6F]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#E83D6F] hover:bg-[#D4265A] text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Verifying...' : 'Verify OTP Code'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8E7582] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 8 chars with upper, lower, num, symbol"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFF7F9] border border-[#FFE1E8] text-xs sm:text-sm text-[#2D1420] focus:outline-hidden focus:border-[#E83D6F]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#2D1420] uppercase tracking-wider block mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8E7582] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFF7F9] border border-[#FFE1E8] text-xs sm:text-sm text-[#2D1420] focus:outline-hidden focus:border-[#E83D6F]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#E83D6F] hover:bg-[#D4265A] text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Updating Password...' : 'Reset Password & Log In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
