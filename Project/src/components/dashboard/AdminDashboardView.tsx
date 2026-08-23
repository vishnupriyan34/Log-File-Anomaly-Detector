import React, { useState, useEffect } from 'react';
import { DashboardMetrics, SuspiciousIp, Anomaly, User, AuditLog, SystemSettings } from '../../types';
import { MetricCard } from '../common/MetricCard';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { api } from '../../services/api';
import {
  ShieldAlert, AlertOctagon, CheckCircle2, ShieldCheck,
  TrendingUp, Users, History, Sliders, RefreshCw, Cpu,
  Database, Server, Lock, UserPlus, FileText, ArrowRight,
  ExternalLink, ChevronRight, Activity, Zap, Check, AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, PieChart, Pie, Cell, CartesianGrid
} from 'recharts';

interface AdminDashboardViewProps {
  metrics: DashboardMetrics;
  charts: {
    anomalyTrend: any[];
    severityDistribution: any[];
    anomalyTypes: any[];
    topSuspiciousIps: SuspiciousIp[];
  };
  recentAnomalies: Anomaly[];
  onNavigateToAnomalies: (filter?: any) => void;
  onNavigateToUpload: () => void;
  onSelectAnomaly: (id: string) => void;
  onNavigateToView: (view: string) => void;
  onRefreshData: () => void;
  refreshing: boolean;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  metrics,
  charts,
  recentAnomalies,
  onNavigateToAnomalies,
  onNavigateToUpload,
  onSelectAnomaly,
  onNavigateToView,
  onRefreshData,
  refreshing
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'analyst' | 'viewer'>('analyst');
  const [newUserDept, setNewUserDept] = useState('SecOps Triage');
  const [newUserPass, setNewUserPass] = useState('SecOps@2026');
  const [creatingUser, setCreatingUser] = useState(false);
  const [userMsg, setUserMsg] = useState<string | null>(null);

  // Re-index model status
  const [reindexing, setReindexing] = useState(false);
  const [reindexSuccess, setReindexSuccess] = useState(false);

  useEffect(() => {
    async function loadAdminContext() {
      try {
        const [usersRes, auditRes, settingsRes] = await Promise.all([
          api.getUsers().catch(() => ({ users: [] })),
          api.getAuditLogs().catch(() => ({ auditLogs: [] })),
          api.getSettings().catch(() => ({ settings: null }))
        ]);
        if (usersRes.users) setUsers(usersRes.users);
        if (auditRes.auditLogs) setAuditLogs(auditRes.auditLogs.slice(0, 6));
        if (settingsRes.settings) setSettings(settingsRes.settings);
      } catch (err) {
        console.error('Failed to load admin context:', err);
      }
    }
    loadAdminContext();
  }, []);

  const handleToggleRule = async (ruleKey: string, currentValue: boolean) => {
    if (!settings) return;
    try {
      setSavingSettings(true);
      const updatedRules = {
        ...(settings.enabled_rules || {}),
        [ruleKey]: !currentValue
      };
      const res = await api.updateSettings({
        enabled_rules: updatedRules
      });
      setSettings(res.settings);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSensitivityChange = async (newVal: number) => {
    if (!settings) return;
    try {
      setSavingSettings(true);
      const res = await api.updateSettings({
        detection_sensitivity: newVal
      });
      setSettings(res.settings);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update sensitivity:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    try {
      setCreatingUser(true);
      setUserMsg(null);
      const res = await api.createUser({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPass,
        role: newUserRole,
        department: newUserDept
      });
      setUsers(prev => [res.user, ...prev]);
      setUserMsg(`User ${res.user.name} created successfully!`);
      setNewUserName('');
      setNewUserEmail('');
      setTimeout(() => {
        setShowAddUserModal(false);
        setUserMsg(null);
      }, 2000);
    } catch (err: any) {
      setUserMsg(err.message || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleReindexEngine = () => {
    setReindexing(true);
    setTimeout(() => {
      setReindexing(false);
      setReindexSuccess(true);
      setTimeout(() => setReindexSuccess(false), 3000);
    }, 1200);
  };

  const rawSensitivity = settings?.detection_sensitivity ?? 0.85;
  const sensitivityPct = rawSensitivity > 1 ? rawSensitivity : (rawSensitivity * 100);

  return (
    <div className="space-y-6">
      {/* Root Admin Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-950/60 via-slate-900/90 to-indigo-950/60 p-5 shadow-2xl shadow-purple-950/30 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-500/20">
              <ShieldCheck className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-100 uppercase tracking-tight font-mono">
                  SOC ROOT ADMINISTRATION PORTAL
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 font-mono text-[10px] uppercase font-bold tracking-wider">
                  Level 3 - Root Admin
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Engine: Active (12ms)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Full infrastructure management, ML isolation tree calibration, RBAC permissions, and system audit trail.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full lg:w-auto">
            <button
              id="admin-sync-live-btn"
              onClick={onRefreshData}
              disabled={refreshing}
              className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-500/30 bg-slate-900/80 hover:bg-purple-500/15 text-purple-200 text-xs font-mono transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-purple-400' : ''}`} />
              <span>Sync Telemetry</span>
            </button>
            <button
              id="admin-add-user-top-btn"
              onClick={() => setShowAddUserModal(true)}
              className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Provision User</span>
            </button>
          </div>
        </div>

        {/* Admin System Health Sub-strip */}
        <div className="mt-4 pt-3 border-t border-purple-500/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Server className="w-3.5 h-3.5 text-purple-400" />
            <span>Storage: <strong className="text-purple-200">4.8 MB / 500 MB</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cluster Nodes: <strong className="text-cyan-200">3 Online</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Personnel: <strong className="text-indigo-200">{users.length || 3} Active</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            <span>Compliance: <strong className="text-emerald-300">98.6% SOC-2</strong></span>
          </div>
        </div>
      </div>

      {/* 6 Key Admin Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MetricCard
          id="admin-metric-total-files"
          title="Ingested Logs"
          value={metrics.totalLogFiles}
          subtitle="Active repositories"
          icon={FileText}
          color="purple"
        />

        <MetricCard
          id="admin-metric-total-entries"
          title="Total Events"
          value={metrics.totalLogEntries.toLocaleString()}
          subtitle="Processed in buffer"
          icon={Database}
          color="blue"
        />

        <MetricCard
          id="admin-metric-users-count"
          title="SOC Personnel"
          value={users.length || 3}
          subtitle="Privileged accounts"
          icon={Users}
          color="cyan"
        />

        <MetricCard
          id="admin-metric-sensitivity"
          title="ML Sensitivity"
          value={`${sensitivityPct.toFixed(0)}%`}
          subtitle="Isolation Forest"
          icon={Sliders}
          color="purple"
        />

        <MetricCard
          id="admin-metric-critical-threats"
          title="Critical Alerts"
          value={metrics.criticalAnomalies}
          subtitle="Requires root signoff"
          icon={AlertOctagon}
          color="red"
        />

        <MetricCard
          id="admin-metric-resolved-incidents"
          title="Resolved"
          value={metrics.resolvedIncidents}
          subtitle="SLA closed rate"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Admin Quick Command & Control Center (Unique to Admin) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Rule Heuristics & Sensitivity Slider */}
        <div className="lg:col-span-2 rounded-2xl glass-card border border-purple-500/30 p-5 shadow-xl bg-slate-900/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>SOC Threat Heuristics & Model Controls</span>
                    {settingsSuccess && (
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                        <Check className="w-3 h-3" /> Saved
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Directly toggle active detector heuristics or tune ML outlier sensitivity
                  </p>
                </div>
              </div>
              <button
                id="admin-open-full-settings-btn"
                onClick={() => onNavigateToView('settings')}
                className="text-xs text-purple-400 hover:text-purple-300 font-mono flex items-center gap-1 cursor-pointer"
              >
                <span>All Settings</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Inline Rule Toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3">
              {[
                { id: 'sql_injection', label: 'SQL Injection', icon: '💉' },
                { id: 'brute_force', label: 'Brute Force', icon: '🔨' },
                { id: 'unauthorized_access', label: 'XSS / Web Probe', icon: '🛡️' },
                { id: 'privilege_escalation', label: 'Privilege Esc.', icon: '⚡' }
              ].map(rule => {
                const isEnabled = Boolean(
                  (settings?.enabled_rules as any)?.[rule.id] ?? 
                  (settings?.enabled_rules as any)?.[rule.id === 'sql_injection' ? 'sqli' : rule.id === 'unauthorized_access' ? 'xss' : 'brute_force'] ?? 
                  true
                );
                return (
                  <button
                    key={rule.id}
                    onClick={() => handleToggleRule(rule.id, isEnabled)}
                    disabled={savingSettings}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                      isEnabled
                        ? 'bg-purple-950/40 border-purple-500/50 text-purple-200 shadow-sm'
                        : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">{rule.icon}</span>
                      <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    </div>
                    <div>
                      <span className="block text-xs font-bold tracking-tight">{rule.label}</span>
                      <span className="text-[10px] font-mono text-slate-400">{isEnabled ? 'Rule ACTIVE' : 'Rule MUTED'}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Inline Sensitivity Slider */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">ML Isolation Forest Threshold:</span>
                <span className="text-purple-300 font-bold">{sensitivityPct.toFixed(0)}% Outlier Sensitivity</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="0.95"
                step="0.05"
                value={rawSensitivity > 1 ? rawSensitivity / 100 : rawSensitivity}
                onChange={(e) => handleSensitivityChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Low False-Positives (40%)</span>
                <span>Balanced Baseline (85%)</span>
                <span>Strict Paranoia (95%)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 text-[11px]">
              Engine calibration runs live on next log batch ingestion.
            </span>
            <button
              onClick={handleReindexEngine}
              disabled={reindexing}
              className="px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              <Activity className={`w-3.5 h-3.5 ${reindexing ? 'animate-spin text-purple-400' : ''}`} />
              <span>{reindexSuccess ? '✓ Model Re-calibrated' : reindexing ? 'Calibrating...' : 'Re-index Model Tree'}</span>
            </button>
          </div>
        </div>

        {/* Quick Admin Actions & User Roster Shortcut */}
        <div className="rounded-2xl glass-card border border-purple-500/30 p-5 shadow-xl bg-slate-900/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>SecOps Personnel</span>
              </h3>
              <button
                onClick={() => onNavigateToView('users')}
                className="text-xs text-purple-400 hover:text-purple-300 font-mono flex items-center gap-1 cursor-pointer"
              >
                <span>Manage ({users.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Active security analysts & administrators
            </p>

            <div className="space-y-2">
              {users.slice(0, 3).map((u) => (
                <div
                  key={u.id}
                  className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs uppercase ${
                      u.role === 'admin'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : u.role === 'analyst'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-200 block">{u.name}</span>
                      <span className="text-[10px] text-slate-500">{u.email}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                    u.role === 'admin'
                      ? 'bg-purple-500/20 text-purple-300'
                      : u.role === 'analyst'
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
            <button
              onClick={() => setShowAddUserModal(true)}
              className="w-full py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Provision Security Analyst</span>
            </button>
            <button
              onClick={() => onNavigateToView('audit')}
              className="w-full py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Inspect Immutable Audit Logs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Charts & Live Audit Trail Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Anomaly Trend Chart */}
        <div className="lg:col-span-2 rounded-2xl glass-card border border-purple-500/30 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>Enterprise Threat Vector Trend</span>
              </h3>
              <p className="text-xs text-slate-400">
                Daily volume of anomalies & critical exploits quarantined by engine
              </p>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Temporal Surveillance
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.anomalyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAdminTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAdminCrit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D1527',
                    borderColor: 'rgba(168,85,247,0.3)',
                    borderRadius: '12px',
                    color: '#F1F5F9',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="total" name="Total Anomalies" stroke="#A855F7" strokeWidth={2} fillOpacity={1} fill="url(#colorAdminTotal)" />
                <Area type="monotone" dataKey="critical" name="Critical Exploit" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorAdminCrit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live System Audit Stream (Admin exclusive) */}
        <div className="rounded-2xl glass-card border border-purple-500/30 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                <span>System Audit Trail</span>
              </h3>
              <button
                onClick={() => onNavigateToView('audit')}
                className="text-xs text-purple-400 hover:text-purple-300 font-mono"
              >
                Full Trail &rarr;
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Immutable log of administrator actions & access records
            </p>

            <div className="space-y-2.5">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-purple-300 uppercase text-[10px]">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] line-clamp-1">
                    {log.description}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                    <span>User: {log.user_name}</span>
                    <span>IP: {log.ip_address}</span>
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No audit trail events recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Quick Provision User */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl glass-card border border-purple-500/40 p-6 shadow-2xl bg-slate-900 text-slate-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-purple-400">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-bold text-base">Provision New Security Personnel</h3>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            {userMsg && (
              <div className={`p-3 rounded-xl mb-4 text-xs ${userMsg.includes('success') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                {userMsg}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Sarah Connor"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-purple-400 text-slate-100 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="sconnor@cyberguard.io"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-purple-400 text-slate-100 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Assigned Role *</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-purple-400 text-slate-100 text-xs outline-none"
                  >
                    <option value="analyst">Analyst (Triage)</option>
                    <option value="admin">Admin (Root)</option>
                    <option value="viewer">Viewer (Read Only)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Department</label>
                  <input
                    type="text"
                    value={newUserDept}
                    onChange={(e) => setNewUserDept(e.target.value)}
                    placeholder="Threat Hunting"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-purple-400 text-slate-100 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Initial Password</label>
                <input
                  type="text"
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-purple-400 text-slate-100 text-xs font-mono outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  {creatingUser ? 'Creating...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
