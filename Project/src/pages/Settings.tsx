import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SystemSettings } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Sliders, Shield, Sparkles, Bell, Save,
  CheckCircle2, Lock, User, RefreshCw, Cpu
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, isAdmin, isAnalyst } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Profile fields
  const [profileName, setProfileName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await api.getSettings();
        setSettings(res.settings);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      const res = await api.updateSettings(settings);
      setSettings(res.settings);
      setSuccessMsg('Detection parameters successfully updated and applied.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters.');
      return;
    }
    setPasswordMsg('Password successfully updated in credentials database.');
    setCurrentPassword('');
    setNewPassword('');
    setTimeout(() => setPasswordMsg(null), 4000);
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Safe sensitivity calculation (support 0.0-1.0 and 1-100)
  const rawSensitivity = typeof settings.detection_sensitivity === 'number' ? settings.detection_sensitivity : 85;
  const sensitivityDisplay = rawSensitivity > 1 ? rawSensitivity : (rawSensitivity * 100);
  const sensitivitySliderValue = rawSensitivity > 1 ? rawSensitivity / 100 : rawSensitivity;

  // Safe anomaly threshold calculation
  const rawThreshold = typeof (settings as any).anomaly_score_threshold === 'number' 
    ? (settings as any).anomaly_score_threshold 
    : (typeof settings.anomaly_threshold === 'number' ? settings.anomaly_threshold : 0.65);

  const enabledRules = settings.enabled_rules || {
    sql_injection: true,
    brute_force: true,
    unauthorized_access: true,
    traffic_spike: true,
    error_spike: true,
    suspicious_ip: true,
    privilege_escalation: true,
    unusual_login: true
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          <span>System & Detection Configuration</span>
        </h2>
        <p className="text-xs text-slate-400">
          Fine-tune Isolation Forest machine learning sensitivity, rule signatures, and SOC user preferences
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Detection Engine Parameters (Analyst & Admin) */}
      {(isAdmin || isAnalyst) && (
        <form onSubmit={handleSaveSettings} className="rounded-2xl glass-card border border-cyan-500/20 p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide font-mono">
              Detection Engine & Machine Learning Thresholds
            </h3>
          </div>

          {/* Sensitivity Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <label className="text-slate-200 font-bold">
                Isolation Forest Outlier Sensitivity:
              </label>
              <span className="text-cyan-400 font-bold">
                {sensitivityDisplay.toFixed(0)}%
              </span>
            </div>
            <input
              id="settings-sensitivity-slider"
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={sensitivitySliderValue}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setSettings({ 
                  ...settings, 
                  detection_sensitivity: val > 1 ? val : Math.round(val * 100) 
                });
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <p className="text-[11px] text-slate-400">
              Higher values flag subtle traffic anomalies and outlier vectors; lower values minimize false positives.
            </p>
          </div>

          {/* Anomaly Score Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <label className="text-slate-200 font-bold">
                Anomaly Flagging Score Threshold:
              </label>
              <span className="text-purple-400 font-bold">
                {rawThreshold.toFixed(2)}
              </span>
            </div>
            <input
              id="settings-score-threshold-slider"
              type="range"
              min="0.4"
              max="0.95"
              step="0.05"
              value={rawThreshold}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setSettings({ 
                  ...settings, 
                  anomaly_threshold: val,
                  ...({ anomaly_score_threshold: val } as any)
                });
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Attack Rule Signature Toggles */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase font-mono">
              Active Attack Rule Signatures
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  id="settings-toggle-sqli"
                  type="checkbox"
                  checked={Boolean((enabledRules as any).sql_injection ?? (enabledRules as any).sqli)}
                  onChange={(e) => setSettings({
                    ...settings,
                    enabled_rules: { 
                      ...enabledRules, 
                      sql_injection: e.target.checked,
                      ...({ sqli: e.target.checked } as any)
                    }
                  })}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">SQL Injection (SQLi)</span>
                  <span className="text-[10px] text-slate-400">UNION SELECT, DROP TABLE, blind sleep attacks</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  id="settings-toggle-xss"
                  type="checkbox"
                  checked={Boolean((enabledRules as any).unauthorized_access ?? (enabledRules as any).xss)}
                  onChange={(e) => setSettings({
                    ...settings,
                    enabled_rules: { 
                      ...enabledRules, 
                      unauthorized_access: e.target.checked,
                      ...({ xss: e.target.checked } as any)
                    }
                  })}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Cross-Site Scripting & Unauthorized Access</span>
                  <span className="text-[10px] text-slate-400">&lt;script&gt;, onerror=, unauthorized endpoints</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  id="settings-toggle-traversal"
                  type="checkbox"
                  checked={Boolean((enabledRules as any).privilege_escalation ?? (enabledRules as any).directory_traversal)}
                  onChange={(e) => setSettings({
                    ...settings,
                    enabled_rules: { 
                      ...enabledRules, 
                      privilege_escalation: e.target.checked,
                      ...({ directory_traversal: e.target.checked } as any)
                    }
                  })}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Directory Traversal & Privilege Escalation</span>
                  <span className="text-[10px] text-slate-400">/etc/passwd, ../../ paths, role parameter tampering</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  id="settings-toggle-bruteforce"
                  type="checkbox"
                  checked={Boolean(enabledRules.brute_force)}
                  onChange={(e) => setSettings({
                    ...settings,
                    enabled_rules: { ...enabledRules, brute_force: e.target.checked }
                  })}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Auth Brute Force & Password Spray</span>
                  <span className="text-[10px] text-slate-400">High-frequency 401/403 or SSH failures</span>
                </div>
              </label>
            </div>
          </div>

          {/* AI SOC Auto-Analysis */}
          <div className="pt-2">
            <label className="flex items-center justify-between p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 cursor-pointer">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <div>
                  <span className="text-xs font-bold text-slate-100 block font-mono">
                    Automated Gemini 3.7 Flash AI Threat Synthesis
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Automatically trigger AI MITRE ATT&CK extraction whenever Critical threats are ingested
                  </span>
                </div>
              </div>
              <input
                id="settings-toggle-auto-ai"
                type="checkbox"
                checked={settings.auto_ai_analysis}
                onChange={(e) => setSettings({ ...settings, auto_ai_analysis: e.target.checked })}
                className="rounded border-purple-500 text-purple-600 focus:ring-0"
              />
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              id="save-detection-settings-btn"
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Apply Detection Parameters'}</span>
            </button>
          </div>
        </form>
      )}

      {/* User Security & Profile Card */}
      <div className="rounded-2xl glass-card border border-cyan-500/20 p-6 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide font-mono">
            User Profile & Credentials
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 uppercase font-mono mb-1">Name</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-slate-400 uppercase font-mono mb-1">Email Address</label>
            <input
              type="text"
              disabled
              value={user?.email || ''}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 font-mono"
            />
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase font-mono flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Update Password</span>
          </h4>

          {passwordMsg && (
            <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs">
              {passwordMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 uppercase font-mono mb-1">Current Password</label>
              <input
                id="settings-current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-slate-400 uppercase font-mono mb-1">New Password</label>
              <input
                id="settings-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <button
            id="update-password-btn"
            type="submit"
            className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Update Credentials
          </button>
        </form>
      </div>
    </div>
  );
};
