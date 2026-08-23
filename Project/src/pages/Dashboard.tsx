import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DashboardMetrics, SuspiciousIp, Anomaly, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { AdminDashboardView } from '../components/dashboard/AdminDashboardView';
import { AnalystDashboardView } from '../components/dashboard/AnalystDashboardView';
import { ViewerDashboardView } from '../components/dashboard/ViewerDashboardView';
import {
  ShieldCheck, Crosshair, Eye, RefreshCw, AlertOctagon, ArrowRight
} from 'lucide-react';

interface DashboardProps {
  onNavigateToAnomalies: (filter?: any) => void;
  onNavigateToUpload: () => void;
  onSelectAnomaly: (id: string) => void;
  onInspectAnomaly?: (id: string) => void;
  onNavigateToLogs?: () => void;
  onNavigateToView?: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigateToAnomalies,
  onNavigateToUpload,
  onSelectAnomaly,
  onInspectAnomaly,
  onNavigateToLogs,
  onNavigateToView = () => {}
}) => {
  const { user } = useAuth();
  const [activeRoleView, setActiveRoleView] = useState<UserRole>(user?.role || 'analyst');

  const [data, setData] = useState<{
    metrics: DashboardMetrics;
    charts: {
      anomalyTrend: any[];
      severityDistribution: any[];
      anomalyTypes: any[];
      topSuspiciousIps: SuspiciousIp[];
    };
    recentAnomalies: Anomaly[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sync user role to view when user changes
  useEffect(() => {
    if (user?.role) {
      setActiveRoleView(user.role);
    }
  }, [user?.role]);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const res = await api.getDashboardAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectAnomalyItem = (id: string) => {
    if (onSelectAnomaly) {
      onSelectAnomaly(id);
    } else if (onInspectAnomaly) {
      onInspectAnomaly(id);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-cyan-400 animate-pulse">
            INITIALIZING ROLE TELEMETRY & ML INFERENCE...
          </p>
        </div>
      </div>
    );
  }

  const { metrics, charts, recentAnomalies } = data;

  return (
    <div className="space-y-6">
      {/* Top Threat Alert Banner if Critical threats exist */}
      {metrics.criticalAnomalies > 0 && activeRoleView !== 'viewer' && (
        <div
          id="critical-threat-alert-banner"
          className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-red-500/10 p-4 sm:p-5 text-red-300 shadow-[0_0_25px_rgba(239,68,68,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-red-200 uppercase tracking-wide flex items-center gap-2 font-mono">
                <span>ACTIVE THREAT ELEVATION</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-600 text-white font-mono">
                  {metrics.criticalAnomalies} CRITICAL
                </span>
              </h3>
              <p className="text-xs text-red-300/80 mt-0.5">
                Immediate investigation recommended for high-confidence SQLi / unauthorized privilege elevation anomalies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="triage-critical-anomalies-btn"
              onClick={() => onNavigateToAnomalies({ severity: 'critical' })}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Triage Critical Incidents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Role Dashboard Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 px-2 font-bold uppercase tracking-wider">
            Dashboard Perspective:
          </span>
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
            <button
              id="switch-admin-dashboard-btn"
              onClick={() => setActiveRoleView('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeRoleView === 'admin'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-purple-300 hover:bg-purple-950/30'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin (Root)</span>
            </button>

            <button
              id="switch-analyst-dashboard-btn"
              onClick={() => setActiveRoleView('analyst')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeRoleView === 'analyst'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/30'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Analyst (Hunter)</span>
            </button>

            <button
              id="switch-viewer-dashboard-btn"
              onClick={() => setActiveRoleView('viewer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeRoleView === 'viewer'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/30'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Viewer (Exec)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 px-2">
          <span>Current Account:</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-bold uppercase">
            {user?.name || 'SecOps User'} ({user?.role || 'analyst'})
          </span>
        </div>
      </div>

      {/* Render the Selected Role-Based Dashboard View */}
      {activeRoleView === 'admin' && (
        <AdminDashboardView
          metrics={metrics}
          charts={charts}
          recentAnomalies={recentAnomalies}
          onNavigateToAnomalies={onNavigateToAnomalies}
          onNavigateToUpload={onNavigateToUpload}
          onSelectAnomaly={handleSelectAnomalyItem}
          onNavigateToView={onNavigateToView}
          onRefreshData={loadData}
          refreshing={refreshing}
        />
      )}

      {activeRoleView === 'analyst' && (
        <AnalystDashboardView
          metrics={metrics}
          charts={charts}
          recentAnomalies={recentAnomalies}
          onNavigateToAnomalies={onNavigateToAnomalies}
          onNavigateToUpload={onNavigateToUpload}
          onSelectAnomaly={handleSelectAnomalyItem}
          onNavigateToView={onNavigateToView}
          onRefreshData={loadData}
          refreshing={refreshing}
        />
      )}

      {activeRoleView === 'viewer' && (
        <ViewerDashboardView
          metrics={metrics}
          charts={charts}
          recentAnomalies={recentAnomalies}
          onNavigateToAnomalies={onNavigateToAnomalies}
          onSelectAnomaly={handleSelectAnomalyItem}
          onNavigateToView={onNavigateToView}
          onRefreshData={loadData}
          refreshing={refreshing}
        />
      )}
    </div>
  );
};
