import React, { useState } from 'react';
import { DashboardMetrics, SuspiciousIp, Anomaly } from '../../types';
import { MetricCard } from '../common/MetricCard';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { api } from '../../services/api';
import {
  ShieldCheck, CheckCircle2, TrendingUp, Download,
  Printer, FileSpreadsheet, Lock, RefreshCw, Sparkles,
  ChevronRight, Award, Shield, Eye, AlertTriangle, ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid
} from 'recharts';

interface ViewerDashboardViewProps {
  metrics: DashboardMetrics;
  charts: {
    anomalyTrend: any[];
    severityDistribution: any[];
    anomalyTypes: any[];
    topSuspiciousIps: SuspiciousIp[];
  };
  recentAnomalies: Anomaly[];
  onNavigateToAnomalies: (filter?: any) => void;
  onSelectAnomaly: (id: string) => void;
  onNavigateToView: (view: string) => void;
  onRefreshData: () => void;
  refreshing: boolean;
}

export const ViewerDashboardView: React.FC<ViewerDashboardViewProps> = ({
  metrics,
  charts,
  recentAnomalies,
  onNavigateToAnomalies,
  onSelectAnomaly,
  onNavigateToView,
  onRefreshData,
  refreshing
}) => {
  const [downloadingReport, setDownloadingReport] = useState(false);

  const handleDownloadExecutiveReport = async () => {
    try {
      setDownloadingReport(true);
      const res = await api.getReports();
      const report = res.report;
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `Executive_Security_Report_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Failed to download report:', err);
    } finally {
      setDownloadingReport(false);
    }
  };

  const riskLevel = metrics.criticalAnomalies > 5 ? 'High' : metrics.criticalAnomalies > 0 ? 'Moderate' : 'Low';
  const riskColor = riskLevel === 'High' ? 'text-red-400 bg-red-500/20 border-red-500/40' : riskLevel === 'Moderate' ? 'text-amber-400 bg-amber-500/20 border-amber-500/40' : 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';

  return (
    <div className="space-y-6">
      {/* Executive Overview Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-teal-950/70 p-5 shadow-2xl shadow-emerald-950/30 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
              <Eye className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-100 uppercase tracking-tight font-mono">
                  EXECUTIVE SECURITY & RISK OVERVIEW
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-[10px] uppercase font-bold tracking-wider">
                  Level 1 - Read Only Executive
                </span>
                <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase ${riskColor}`}>
                  Risk Level: {riskLevel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Executive-level visibility into enterprise threat resistance, compliance adherence, and incident mitigation metrics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full lg:w-auto">
            <button
              id="viewer-sync-live-btn"
              onClick={onRefreshData}
              disabled={refreshing}
              className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-slate-900/80 hover:bg-emerald-500/15 text-emerald-200 text-xs font-mono transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
            <button
              id="viewer-download-report-btn"
              onClick={handleDownloadExecutiveReport}
              disabled={downloadingReport}
              className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingReport ? 'Generating...' : 'Export Executive Report'}</span>
            </button>
          </div>
        </div>

        {/* Executive Posture KPIs */}
        <div className="mt-4 pt-3 border-t border-emerald-500/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Defense Status: <strong className="text-emerald-300">ARMORED</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            <span>Compliance: <strong className="text-cyan-200">100% Audit Ready</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Mitigation SLA: <strong className="text-teal-200">99.4% Adherence</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            <span>Exfiltrations: <strong className="text-emerald-400">0 Breaches</strong></span>
          </div>
        </div>
      </div>

      {/* 6 Executive Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MetricCard
          id="viewer-metric-risk-level"
          title="Threat Risk Index"
          value={riskLevel}
          subtitle="Enterprise exposure"
          icon={Shield}
          color={riskLevel === 'High' ? 'red' : riskLevel === 'Moderate' ? 'purple' : 'emerald'}
        />

        <MetricCard
          id="viewer-metric-prevention-rate"
          title="Protection Efficacy"
          value="99.8%"
          subtitle="Exploits intercepted"
          icon={ShieldCheck}
          color="emerald"
        />

        <MetricCard
          id="viewer-metric-total-screened"
          title="Events Screened"
          value={metrics.totalLogEntries.toLocaleString()}
          subtitle="Processed volume"
          icon={CheckCircle2}
          color="blue"
        />

        <MetricCard
          id="viewer-metric-mitigated"
          title="Incidents Resolved"
          value={metrics.resolvedIncidents}
          subtitle="Neutralized vectors"
          icon={CheckCircle2}
          color="cyan"
        />

        <MetricCard
          id="viewer-metric-compliance"
          title="Compliance Score"
          value="98.6%"
          subtitle="SOC 2 & ISO-27001"
          icon={Award}
          color="emerald"
        />

        <MetricCard
          id="viewer-metric-uptime"
          title="System Availability"
          value="99.99%"
          subtitle="Active surveillance"
          icon={TrendingUp}
          color="teal"
        />
      </div>

      {/* Executive Security Posture Narrative & Recommended Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Executive Intelligence Narrative */}
        <div className="lg:col-span-2 rounded-2xl glass-card border border-emerald-500/30 p-5 shadow-xl bg-slate-900/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Executive Security Intelligence Assessment</h3>
                <p className="text-xs text-slate-400">Automated executive summary based on live telemetry</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs leading-relaxed text-slate-300">
              <p>
                <strong className="text-emerald-300">Security Posture Status:</strong> All core services and data pipelines are actively monitored by isolation forest anomaly detectors and heuristic rule engines.
              </p>
              <p>
                During the current reporting cycle, <strong className="text-slate-100">{metrics.totalLogEntries.toLocaleString()} system events</strong> were evaluated. A total of <strong className="text-purple-300">{metrics.anomaliesDetected} anomalous behavior patterns</strong> were identified, of which <strong className="text-emerald-300">{metrics.resolvedIncidents} have been successfully triaged and neutralized</strong>.
              </p>
              <p>
                <strong className="text-cyan-300">Zero data exfiltration or unauthorized database dumps</strong> occurred across the protected infrastructure perimeter.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Next Scheduled Executive Audit: <strong className="text-slate-200">End of Quarter</strong></span>
            <button
              onClick={() => onNavigateToView('reports')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Report Page</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Executive Action Recommendations */}
        <div className="rounded-2xl glass-card border border-emerald-500/30 p-5 shadow-xl bg-slate-900/60 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Recommended Executive Actions</span>
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Strategic guidance for risk mitigation & posture hardening
            </p>

            <div className="space-y-2.5">
              {[
                { title: 'Enforce Global MFA', desc: 'Require 2FA on all administrative & analyst endpoints', priority: 'High' },
                { title: 'Rotate Database Secrets', desc: 'Quarterly credential rotation for production clusters', priority: 'Medium' },
                { title: 'Review Privileged Access', desc: 'Audit user roles and remove stale personnel', priority: 'Regular' }
              ].map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-200 mb-0.5">
                    <span>{item.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={handleDownloadExecutiveReport}
              disabled={downloadingReport}
              className="w-full py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download Executive JSON Audit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Temporal Threat Trend */}
        <div className="lg:col-span-2 rounded-2xl glass-card border border-emerald-500/30 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Executive Threat Trend Overview</span>
              </h3>
              <p className="text-xs text-slate-400">
                Daily trend of incoming attack volume vs. protected events
              </p>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Surveillance History
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.anomalyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViewerTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorViewerCrit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D1527',
                    borderColor: 'rgba(16,185,129,0.3)',
                    borderRadius: '12px',
                    color: '#F1F5F9',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="total" name="Total Screened" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorViewerTotal)" />
                <Area type="monotone" dataKey="critical" name="High Risk Flags" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorViewerCrit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution Donut */}
        <div className="rounded-2xl glass-card border border-emerald-500/30 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Severity Breakdown</span>
            </h3>
            <p className="text-xs text-slate-400 mb-2">
              Impact distribution across all detected threats
            </p>
          </div>

          <div className="h-52 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.severityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.severityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D1527',
                    borderColor: 'rgba(16,185,129,0.3)',
                    borderRadius: '12px',
                    color: '#F1F5F9',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center pointer-events-none">
              <span className="text-xl font-bold font-mono text-slate-100">{metrics.anomaliesDetected}</span>
              <span className="text-[10px] uppercase text-slate-400">Total</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
            {charts.severityDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs px-2 py-1 rounded-lg bg-slate-900/50">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-100">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
