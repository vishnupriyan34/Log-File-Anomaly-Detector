import React, { useState } from 'react';
import { api } from '../services/api';
import { TechBackground } from '../components/common/TechBackground';
import {
  ShieldAlert, Mail, Lock, Key, ArrowLeft,
  CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';

interface ForgotPasswordProps {
  onSwitchToLogin?: () => void;
  onNavigateToLogin?: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onSwitchToLogin, onNavigateToLogin }) => {
  const handleGoToLogin = () => {
    if (onSwitchToLogin) onSwitchToLogin();
    else if (onNavigateToLogin) onNavigateToLogin();
  };

  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const res = await api.forgotPassword(cleanEmail);
      setMessage(res.message);
      if (res.demoResetToken) {
        setResetToken(res.demoResetToken);
      }
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Failed to request reset token.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const res = await api.resetPassword(email, newPassword, resetToken);
      setMessage(res.message);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden">
      <TechBackground />

      <div className="relative z-10 w-full max-w-md my-auto">
        <div className="rounded-3xl glass-card border border-cyan-500/30 p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30 mb-3 animate-pulse-glow">
              <Key className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-100 uppercase font-mono">
              PASSWORD RECOVERY
            </h1>
            <p className="text-xs text-cyan-400/90 tracking-wide mt-1">
              SOC Identity Access Verification
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && step !== 'success' && (
            <div className="mb-4 p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {step === 'request' && (
            <form onSubmit={handleRequestToken} className="space-y-4">
              <p className="text-xs text-slate-400">
                Enter your authorized SOC user email address. We will generate a secure reset authorization token.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="forgot-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst@cyberguard.io"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 focus:border-cyan-400 text-slate-100 text-sm outline-none"
                  />
                </div>
              </div>

              <button
                id="send-reset-token-btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/25 transition-all"
              >
                {loading ? 'Processing...' : 'Generate Reset Code'}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                  Authorization Code / Token
                </label>
                <input
                  id="reset-token-input"
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="DEMO-RESET-9921"
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 focus:border-cyan-400 text-slate-100 text-sm font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="reset-new-password-input"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 focus:border-cyan-400 text-slate-100 text-sm outline-none"
                  />
                </div>
              </div>

              <button
                id="submit-new-password-btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/25 transition-all"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4 py-3">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 mb-1">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-slate-200">
                Password updated successfully. You can now login with your new credentials.
              </p>
              <button
                id="reset-success-login-btn"
                type="button"
                onClick={handleGoToLogin}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
              >
                Return to Login
              </button>
            </div>
          )}

          <div className="text-center mt-6 pt-4 border-t border-slate-800">
            <button
              id="back-to-login-btn"
              type="button"
              onClick={handleGoToLogin}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
