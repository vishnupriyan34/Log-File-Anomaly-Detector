import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { TechBackground } from '../components/common/TechBackground';
import {
  ShieldAlert, User, Mail, Lock, Building, Eye, EyeOff,
  Sparkles, ArrowRight, AlertCircle, CheckCircle2, Moon, Sun
} from 'lucide-react';

interface SignupProps {
  onSwitchToLogin?: () => void;
  onNavigateToLogin?: () => void;
  initialRole?: 'admin' | 'analyst' | 'viewer';
}

export const Signup: React.FC<SignupProps> = ({ onSwitchToLogin, onNavigateToLogin, initialRole = 'admin' }) => {
  const handleGoToLogin = () => {
    if (onSwitchToLogin) onSwitchToLogin();
    else if (onNavigateToLogin) onNavigateToLogin();
  };

  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'analyst' | 'viewer'>(initialRole);
  const [department, setDepartment] = useState('Security Operations Center');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
    }
  }, [initialRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanEmail || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please retype carefully.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await register({
        name: cleanName,
        email: cleanEmail,
        password,
        role,
        department: department.trim() || 'Security Operations Center'
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden">
      <TechBackground />

      <div className="absolute top-6 right-6 z-20">
        <button
          id="signup-theme-toggle-btn"
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-slate-900/60 hover:bg-cyan-500/15 text-slate-200 text-xs font-mono transition-all backdrop-blur-md"
        >
          {theme === 'dark' ? (
            <>
              <Moon className="w-3.5 h-3.5 text-cyan-400" />
              <span>🌙 Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>☀️ Light Mode</span>
            </>
          )}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-lg my-8">
        <div className="rounded-3xl glass-card border border-cyan-500/30 p-8 sm:p-10 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30 mb-3 animate-pulse-glow">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-black tracking-tight text-slate-100 uppercase font-mono">
              CREATE SOC ACCOUNT
            </h1>
            <p className="text-xs text-cyan-400/90 tracking-wide mt-1">
              Join the AI-Powered Log Monitoring Platform
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-slate-100 text-sm placeholder-slate-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@soc.corp"
                    required
                    className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-slate-100 text-sm placeholder-slate-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                Select Account Role *
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    role === 'admin'
                      ? 'bg-purple-950/60 border-purple-500 text-purple-200 ring-1 ring-purple-500/50 shadow-md shadow-purple-500/20'
                      : 'bg-slate-900/50 border-slate-800 hover:border-purple-500/40 text-slate-400'
                  }`}
                >
                  <span className="font-bold text-xs">Admin</span>
                  <span className="text-[10px] text-purple-400">Full Access</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('analyst')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    role === 'analyst'
                      ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/50 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900/50 border-slate-800 hover:border-cyan-500/40 text-slate-400'
                  }`}
                >
                  <span className="font-bold text-xs">Analyst</span>
                  <span className="text-[10px] text-cyan-400">Triage & AI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('viewer')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    role === 'viewer'
                      ? 'bg-emerald-950/60 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400/50 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900/50 border-slate-800 hover:border-emerald-500/40 text-slate-400'
                  }`}
                >
                  <span className="font-bold text-xs">Viewer</span>
                  <span className="text-[10px] text-emerald-400">Read-Only</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                  Department / Squad
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-department-input"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Threat Hunting & Incident Response"
                    className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60 focus:border-cyan-400 text-slate-100 text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    required
                    className="w-full pl-10 pr-8 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60 focus:border-cyan-400 text-slate-100 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-confirm-password-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                    className="w-full pl-10 pr-8 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60 focus:border-cyan-400 text-slate-100 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-400">
              Select your role to configure workspace permissions according to your team needs.
            </p>

            <button
              id="signup-submit-button"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm tracking-wider uppercase shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4 cursor-pointer"
            >
              {loading ? (
                <span>CREATING ACCOUNT...</span>
              ) : (
                <>
                  <span>REGISTER & ENTER PLATFORM</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 pt-5 border-t border-slate-800">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <button
                id="switch-to-login-btn"
                type="button"
                onClick={handleGoToLogin}
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors underline underline-offset-4 cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
