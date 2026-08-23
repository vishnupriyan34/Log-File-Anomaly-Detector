import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { TechBackground } from '../components/common/TechBackground';
import {
  ShieldAlert, Lock, Mail, Eye, EyeOff, Sparkles,
  ArrowRight, ShieldCheck, UserCheck, Moon, Sun, AlertCircle,
  Activity, CheckCircle2
} from 'lucide-react';

interface LoginProps {
  onSwitchToSignup?: () => void;
  onSwitchToForgot?: () => void;
  onNavigateToSignup?: () => void;
  onNavigateToForgotPassword?: () => void;
  onNavigateToSignupWithRole?: (role: 'admin' | 'analyst' | 'viewer') => void;
}

type RoleType = 'admin' | 'analyst' | 'viewer';

export const Login: React.FC<LoginProps> = ({
  onSwitchToSignup,
  onSwitchToForgot,
  onNavigateToSignup,
  onNavigateToForgotPassword,
  onNavigateToSignupWithRole
}) => {
  const [selectedRole, setSelectedRole] = useState<RoleType>('admin');

  const handleGoToSignup = (role: RoleType = selectedRole) => {
    if (onNavigateToSignupWithRole) {
      onNavigateToSignupWithRole(role);
    } else if (onSwitchToSignup) {
      onSwitchToSignup();
    } else if (onNavigateToSignup) {
      onNavigateToSignup();
    }
  };

  const handleGoToForgot = () => {
    if (onSwitchToForgot) onSwitchToForgot();
    else if (onNavigateToForgotPassword) onNavigateToForgotPassword();
  };

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const roleMeta: Record<RoleType, {
    title: string;
    subtitle: string;
    badge: string;
    accentColor: string;
    activeBorder: string;
    activeBg: string;
    icon: React.ReactNode;
    features: string[];
    placeholderEmail: string;
  }> = {
    admin: {
      title: 'Administrator Portal',
      subtitle: 'Complete SOC Management & Configuration Access',
      badge: 'Level 3 - Root Admin',
      accentColor: 'text-purple-400',
      activeBorder: 'border-purple-500 shadow-lg shadow-purple-500/20',
      activeBg: 'bg-purple-500/20 text-purple-200 border-purple-500/40',
      icon: <ShieldCheck className="w-4 h-4 text-purple-400" />,
      features: ['Full ML Engine & Sensitivity Tuning', 'User Management & Role Permissions', 'Audit Logs & Investigation Reports'],
      placeholderEmail: 'admin@cyberguard.io'
    },
    analyst: {
      title: 'Security Analyst Portal',
      subtitle: 'Threat Hunting & Anomaly Investigation',
      badge: 'Level 2 - SecOps Analyst',
      accentColor: 'text-cyan-400',
      activeBorder: 'border-cyan-400 shadow-lg shadow-cyan-500/20',
      activeBg: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
      icon: <UserCheck className="w-4 h-4 text-cyan-400" />,
      features: ['Multi-Format Log File Ingestion', 'AI Threat Intelligence & Remediation', 'Anomaly Triage & Incident Workflow'],
      placeholderEmail: 'analyst@cyberguard.io'
    },
    viewer: {
      title: 'Viewer Dashboard Portal',
      subtitle: 'Real-time Telemetry & Security Metrics',
      badge: 'Level 1 - Read Only',
      accentColor: 'text-emerald-400',
      activeBorder: 'border-emerald-500 shadow-lg shadow-emerald-500/20',
      activeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
      icon: <Eye className="w-4 h-4 text-emerald-400" />,
      features: ['Real-time Attack Telemetry Charts', 'Parsed Event Streams & Threat Logs', 'Read-Only Security Overview'],
      placeholderEmail: 'viewer@cyberguard.io'
    }
  };

  const currentRoleInfo = roleMeta[selectedRole];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await login(cleanEmail, password);
    } catch (err: any) {
      setError(err.message || `Authentication failed. Make sure your account is registered for ${currentRoleInfo.title} or create a new account.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden">
      {/* Floating Animated Tech Background */}
      <TechBackground />

      {/* Top right Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          id="login-theme-toggle-btn"
          onClick={toggleTheme}
          title="Toggle Dark/Light Mode"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-slate-900/60 hover:bg-cyan-500/15 text-slate-200 text-xs font-mono transition-all backdrop-blur-md cursor-pointer"
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

      {/* Main Glassmorphism Login Card */}
      <div className="relative z-10 w-full max-w-lg my-auto">
        <div className="rounded-3xl glass-card border border-cyan-500/30 p-6 sm:p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
          {/* Header & Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30 mb-3 animate-pulse-glow">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-100 uppercase font-mono">
              LOG FILE <span className="text-cyan-400">ANOMALY</span> DETECTOR
            </h1>

            <p className="text-xs font-semibold text-cyan-400/90 tracking-wide mt-1 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              SOC Anomaly Detection & AI Threat Intelligence
            </p>
          </div>

          {/* 3 Separate Role Sign-In Selector Tabs */}
          <div className="mb-6">
            <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2 text-center">
              Select Role Portal To Sign In:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="role-tab-admin-btn"
                type="button"
                onClick={() => {
                  setSelectedRole('admin');
                  setError(null);
                }}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-left cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'bg-purple-950/50 border-purple-500/80 text-purple-200 ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/20'
                    : 'bg-slate-900/50 border-slate-800 hover:border-purple-500/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-1.5 rounded-xl ${selectedRole === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'}`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs tracking-wide">Admin</span>
                <span className="text-[10px] text-purple-400/90 font-mono">SOC Root</span>
              </button>

              <button
                id="role-tab-analyst-btn"
                type="button"
                onClick={() => {
                  setSelectedRole('analyst');
                  setError(null);
                }}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-left cursor-pointer ${
                  selectedRole === 'analyst'
                    ? 'bg-cyan-950/50 border-cyan-400/80 text-cyan-200 ring-2 ring-cyan-400/30 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900/50 border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-1.5 rounded-xl ${selectedRole === 'analyst' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                  <UserCheck className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs tracking-wide">Analyst</span>
                <span className="text-[10px] text-cyan-400/90 font-mono">SecOps</span>
              </button>

              <button
                id="role-tab-viewer-btn"
                type="button"
                onClick={() => {
                  setSelectedRole('viewer');
                  setError(null);
                }}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-left cursor-pointer ${
                  selectedRole === 'viewer'
                    ? 'bg-emerald-950/50 border-emerald-400/80 text-emerald-200 ring-2 ring-emerald-400/30 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-900/50 border-slate-800 hover:border-emerald-500/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-1.5 rounded-xl ${selectedRole === 'viewer' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                  <Eye className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs tracking-wide">Viewer</span>
                <span className="text-[10px] text-emerald-400/90 font-mono">Read Only</span>
              </button>
            </div>

            {/* Selected Role Capabilities Banner */}
            <div className={`mt-3 p-3 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
              selectedRole === 'admin'
                ? 'bg-purple-900/20 border-purple-500/30 text-purple-300'
                : selectedRole === 'analyst'
                ? 'bg-cyan-900/20 border-cyan-500/30 text-cyan-300'
                : 'bg-emerald-900/20 border-emerald-500/30 text-emerald-300'
            }`}>
              <div className="flex items-center gap-2">
                {currentRoleInfo.icon}
                <div>
                  <span className="font-bold">{currentRoleInfo.title}</span>
                  <p className="text-[11px] text-slate-400 font-normal">{currentRoleInfo.subtitle}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700/60 uppercase">
                {currentRoleInfo.badge}
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Dedicated Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                {selectedRole.toUpperCase()} EMAIL ADDRESS
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={currentRoleInfo.placeholderEmail}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-slate-100 text-sm placeholder-slate-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  id="forgot-password-link"
                  onClick={handleGoToForgot}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-slate-100 text-sm placeholder-slate-500 outline-none transition-all"
                />
                <button
                  type="button"
                  id="toggle-password-visibility-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400/20"
                />
                <span className="text-xs text-slate-400">Remember Session</span>
              </label>
            </div>

            <button
              id="login-submit-button"
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-sm tracking-wider uppercase shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/25'
                  : selectedRole === 'analyst'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25'
              }`}
            >
              {loading ? (
                <span>AUTHENTICATING {selectedRole.toUpperCase()}...</span>
              ) : (
                <>
                  <span>SIGN IN AS {selectedRole.toUpperCase()}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Signup for this role */}
          <div className="text-center mt-6 pt-5 border-t border-slate-800/80">
            <p className="text-xs text-slate-400">
              Need a new account?{' '}
              <button
                id="switch-to-signup-btn"
                type="button"
                onClick={() => handleGoToSignup(selectedRole)}
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors underline underline-offset-4 cursor-pointer"
              >
                Sign Up as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} &rarr;
              </button>
            </p>
          </div>

          {/* Quick Register / Create other roles */}
          <div className="mt-5 pt-4 border-t border-slate-800/60">
            <p className="text-[11px] font-mono text-center text-slate-400 mb-2 uppercase tracking-wider">
              — Register a New Account for Other Roles —
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="signup-role-admin-btn"
                type="button"
                onClick={() => handleGoToSignup('admin')}
                className="p-2 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer group"
                title="Create a new Administrator account"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span>Admin</span>
                <span className="text-[9px] text-purple-400/80 font-normal">Sign Up</span>
              </button>
              <button
                id="signup-role-analyst-btn"
                type="button"
                onClick={() => handleGoToSignup('analyst')}
                className="p-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer group"
                title="Create a new Security Analyst account"
              >
                <UserCheck className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Analyst</span>
                <span className="text-[9px] text-cyan-400/80 font-normal">Sign Up</span>
              </button>
              <button
                id="signup-role-viewer-btn"
                type="button"
                onClick={() => handleGoToSignup('viewer')}
                className="p-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer group"
                title="Create a new Viewer account"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Viewer</span>
                <span className="text-[9px] text-emerald-400/80 font-normal">Sign Up</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
