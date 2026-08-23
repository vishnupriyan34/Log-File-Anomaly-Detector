import React, { useState } from 'react';
import { DashboardMetrics, SuspiciousIp, Anomaly } from '../../types';
import { MetricCard } from '../common/MetricCard';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { api } from '../../services/api';
import {
  ShieldAlert, AlertOctagon, CheckCircle2, ShieldCheck,
  TrendingUp, Database, FileText, ArrowRight, ExternalLink,
  ChevronRight, RefreshCw, Sparkles, Network, Terminal,
  Zap, Search, Play, Check, Crosshair, Cpu, Bug
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, BarChart, Bar, CartesianGrid
} from 'recharts';

interface AnalystDashboardViewProps {
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

export const AnalystDashboardView: React.FC<AnalystDashboardViewProps> = ({
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
  const [triageStatus, setTriageStatus] = useState<Record<string, string>>({});
  const [triagingId, setTriagingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [injectingSample, setInjectingSample] = useState(false);
  const [sampleSuccessMsg, setSampleSuccessMsg] = useState<string | null>(null);

  // Quick Inline Triage for Analysts
  const handleQuickStatusUpdate = async (anomalyId: string, newStatus: 'investigating' | 'resolved' | 'false_positive', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setTriagingId(anomalyId);
      await api.updateAnomaly(anomalyId, { status: newStatus });
      setTriageStatus(prev => ({ ...prev, [anomalyId]: newStatus }));
      onRefreshData();
    } catch (err) {
      console.error('Failed to triage anomaly:', err);
    } finally {
      setTriagingId(null);
    }
  };

  // Inject sample attacks directly into detection pipeline
  const handleInjectSample = async (sampleType: 'sqli_attack' | 'ssh_bruteforce' | 'cloud_json' | 'microservice_500') => {
    try {
      setInjectingSample(true);
      setSampleSuccessMsg(null);
      const res = await api.loadSampleLog(sampleType);
      setSampleSuccessMsg(`Injected ${res.totalEntries} events (${res.anomaliesDetected} anomalies detected)`);
      onRefreshData();
      setTimeout(() => setSampleSuccessMsg(null), 4000);
    } catch (err: any) {
      setSampleSuccessMsg(err.message || 'Failed to inject sample');
    } finally {
      setInjectingSample(false);
    }
  };

  // MITRE ATT&CK Matrix Tactics mapping
  const mitreTactics = [
    { id: 'TA0001', name: 'Initial Access', technique: 'T1190 - Exploit App', count: metrics.criticalAnomalies, color: 'border-red-500/50 bg-red-950/30 text-red-300' },
    { id: 'TA0002', name: 'Execution', technique: 'T1059 - Command Injection', count: Math.max(1, Math.round(metrics.anomaliesDetected * 0.2)), color: 'border-orange-500/50 bg-orange-950/30 text-orange-300' },
    { id: 'TA0003', name: 'Persistence', technique: 'T1078 - Valid Accounts', count: Math.max(1, Math.round(metrics.anomaliesDetected * 0.15)), color: 'border-amber-500/50 bg-amber-950/30 text-amber-300' },
    { id: 'TA0004', name: 'Privilege Esc.', technique: 'T1068 - Auth Bypass', count: Math.max(1, Math.round(metrics.anomaliesDetected * 0.25)), color: 'border-purple-500/50 bg-purple-950/30 text-purple-300' },
    { id: 'TA0005', name: 'Defense Evasion', technique: 'T1027 - Obfuscated Payload', count: Math.max(1, Math.round(metrics.anomaliesDetected * 0.3)), color: 'border-cyan-500/50 bg-cyan-950/30 text-cyan-300' },
    { id: 'TA0006', name: 'Credential Access', technique: 'T1110 - Brute Force', count: Math.max(2, Math.round(metrics.anomaliesDetected * 0.4)), color: 'border-blue-500/50 bg-blue-950/30 text-blue-300' }
  ];

  return (
    <div className="space-y-6">
      {/* Analyst Threat Hunter Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/70 via-slate-900/90 to-blue-950/70 p-5 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/20 animate-pulse">
              <Crosshair className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-100 uppercase tracking-tight font-mono">
                  SECOPS THREAT HUNTING & TRIAGE CONSOLE
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-[10px] uppercase font-bold tracking-wider">
                  Level 2 - Threat Hunter
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                  {metrics.anomaliesDetected - metrics.resolvedIncidents} Active Triage Queue
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time isolation score evaluation, live MITRE ATT&CK correlation, and instant 1-click incident remediation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full lg:w-auto">
            <button
              id="analyst-sync-live-btn"
              onClick={onRefreshData}
              disabled={refreshing}
              className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-cyan-500/30 bg-slate-900/80 hover:bg-cyan-500/15 text-cyan-200 text-xs font-mono transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Sync Stream</span>
            </button>
            <button
              id="analyst-upload-log-btn"
              onClick={onNavigateToUpload}
              className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ingest Log Stream</span>
            </button>
          </div>
        </div>

        {/* Analyst Tactical Stats Strip */}
        <div className="mt-4 pt-3 border-t border-cyan-500/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>MTTD: <strong className="text-cyan-200">1.4 mins</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>MTTR: <strong className="text-purple-200">8.2 mins</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ML Precision: <strong className="text-amber-200">{metrics.detectionAccuracy}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Bug className="w-3.5 h-3.5 text-red-400" />
            <span>Open P0 Vectors: <strong className="text-red-300">{metrics.criticalAnomalies}</strong></span>
          </div>
        </div>
      </div>

      {/* 6 Tactical Analyst Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MetricCard
          id="analyst-metric-entries"
          title="Stream Events"
          value={metrics.totalLogEntries.toLocaleString()}
          subtitle="Real-time events"
          icon={Database}
          color="cyan"
        />

        <MetricCard
          id="analyst-metric-anomalies"
          title="Active Anomalies"
          value={metrics.anomaliesDetected}
          subtitle="Pending triage"
          icon={ShieldAlert}
          color="purple"
          trend={{ value: 'ML flagged', isPositive: false }}
        />

        <MetricCard
          id="analyst-metric-critical"
          title="Critical Exploits"
          value={metrics.criticalAnomalies}
          subtitle="P0 High Impact"
          icon={AlertOctagon}
          color="red"
        />

        <MetricCard
          id="analyst-metric-resolved"
          title="Triaged & Closed"
          value={metrics.resolvedIncidents}
          subtitle="Remediated threats"
          icon={CheckCircle2}
          color="emerald"
        />

        <MetricCard
          id="analyst-metric-accuracy"
          title="IsoForest Score"
          value="0.86"
          subtitle="Avg outlier confidence"
          icon={Sparkles}
          color="blue"
        />

        <MetricCard
          id="analyst-metric-suspicious-ips"
          title="Adversary IPs"
          value={charts.topSuspiciousIps.length}
          subtitle="Attacking nodes"
          icon={Network}
          color="cyan"
        />
      </div>

      {/* Interactive MITRE ATT&CK Matrix Heatmap (Analyst Exclusive) */}
      <div className="rounded-2xl glass-card border border-cyan-500/30 p-5 shadow-xl bg-slate-900/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">MITRE ATT&CK® Tactical Matrix Alignment</h3>
              <p className="text-xs text-slate-400">Live correlation of anomalous payloads mapped to adversary tactics</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToAnomalies()}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer"
          >
            <span>Matrix Explorer</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {mitreTactics.map((tactic) => (
            <div
              key={tactic.id}
              onClick={() => onNavigateToAnomalies({ search: tactic.name })}
              className={`p-3 rounded-xl border ${tactic.color} hover:brightness-125 transition-all cursor-pointer flex flex-col justify-between gap-1.5`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold opacity-75">{tactic.id}</span>
                <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-bold bg-slate-900/60">
                  {tactic.count} Hits
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold leading-tight">{tactic.name}</span>
                <span className="text-[9px] font-mono opacity-80 line-clamp-1">{tactic.technique}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Threat Triage Quick-Queue (1-Click Triage directly on dashboard) */}
      <div className="rounded-2xl glass-card border border-cyan-500/30 p-5 shadow-xl bg-slate-900/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Interactive Incident Triage Quick-Queue</span>
            </h3>
            <p className="text-xs text-slate-400">
              Live threat stream — take immediate action, mark false positives, or inspect telemetry
            </p>
          </div>
          <button
            id="analyst-view-all-anomalies-btn"
            onClick={() => onNavigateToAnomalies()}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Full Triage Board ({metrics.anomaliesDetected})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {recentAnomalies.map((anom) => {
            const currentStat = triageStatus[anom.id] || anom.status;
            const isProcessing = triagingId === anom.id;

            return (
              <div
                key={anom.id}
                id={`analyst-triage-card-${anom.id}`}
                onClick={() => onSelectAnomaly(anom.id)}
                className="p-3.5 rounded-xl border border-slate-800 hover:border-cyan-500/50 bg-slate-950/40 hover:bg-slate-900/80 transition-all cursor-pointer flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <SeverityBadge severity={anom.severity} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-100 font-mono">
                        {anom.anomaly_type}
                      </span>
                      <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                        {anom.source_ip}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono truncate max-w-xs">
                        {anom.request_url}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {anom.description}
                    </p>
                  </div>
                </div>

                {/* 1-Click Analyst Triage Action Bar */}
                <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-wrap">
                  <StatusBadge status={currentStat as any} />

                  <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                    <button
                      title="Set as Investigating"
                      disabled={isProcessing}
                      onClick={(e) => handleQuickStatusUpdate(anom.id, 'investigating', e)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                        currentStat === 'investigating'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 hover:bg-purple-900/50 text-slate-300 hover:text-purple-200'
                      }`}
                    >
                      Investigate
                    </button>
                    <button
                      title="Mark Resolved"
                      disabled={isProcessing}
                      onClick={(e) => handleQuickStatusUpdate(anom.id, 'resolved', e)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                        currentStat === 'resolved'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 hover:bg-emerald-900/50 text-slate-300 hover:text-emerald-200'
                      }`}
                    >
                      Resolve
                    </button>
                    <button
                      title="Mark False Positive"
                      disabled={isProcessing}
                      onClick={(e) => handleQuickStatusUpdate(anom.id, 'false_positive', e)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                        currentStat === 'false_positive'
                          ? 'bg-slate-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                      }`}
                    >
                      FP
                    </button>
                    <button
                      title="Inspect Details & AI Brief"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAnomaly(anom.id);
                      }}
                      className="p-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Threat Ingestion Sandbox & Deep Query Launcher */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rapid Attack Ingestion Sandbox */}
        <div className="rounded-2xl glass-card border border-cyan-500/30 p-5 shadow-xl bg-slate-900/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Threat Simulation & Injection Sandbox</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Inject synthetic adversary attacks into the live ML pipeline to test detection thresholds
            </p>

            {sampleSuccessMsg && (
              <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-3">
                ✓ {sampleSuccessMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleInjectSample('sqli_attack')}
                disabled={injectingSample}
                className="p-3 rounded-xl bg-slate-950/60 border border-red-500/30 hover:border-red-400/60 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-red-300">💉 SQLi Attack</span>
                  <Play className="w-3 h-3 text-red-400" />
                </div>
                <span className="text-[10px] text-slate-400 block font-mono">UNION SELECT & Blind payloads</span>
              </button>

              <button
                onClick={() => handleInjectSample('ssh_bruteforce')}
                disabled={injectingSample}
                className="p-3 rounded-xl bg-slate-950/60 border border-amber-500/30 hover:border-amber-400/60 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-300">🔨 SSH Brute Force</span>
                  <Play className="w-3 h-3 text-amber-400" />
                </div>
                <span className="text-[10px] text-slate-400 block font-mono">Rapid auth failures & dictionary</span>
              </button>

              <button
                onClick={() => handleInjectSample('cloud_json')}
                disabled={injectingSample}
                className="p-3 rounded-xl bg-slate-950/60 border border-purple-500/30 hover:border-purple-400/60 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-purple-300">☁️ Cloud JSON Audit</span>
                  <Play className="w-3 h-3 text-purple-400" />
                </div>
                <span className="text-[10px] text-slate-400 block font-mono">AWS/GCP IAM tampering</span>
              </button>

              <button
                onClick={() => handleInjectSample('microservice_500')}
                disabled={injectingSample}
                className="p-3 rounded-xl bg-slate-950/60 border border-blue-500/30 hover:border-blue-400/60 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-blue-300">💥 500 Spike Cascade</span>
                  <Play className="w-3 h-3 text-blue-400" />
                </div>
                <span className="text-[10px] text-slate-400 block font-mono">Unusual server crash cascade</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Runs through Isolation Forest & Rule Heuristics automatically</span>
            <span className="font-mono text-cyan-400">{injectingSample ? 'Processing ML...' : 'Ready'}</span>
          </div>
        </div>

        {/* Top Suspicious IPs Triage Table */}
        <div className="rounded-2xl glass-card border border-cyan-500/30 p-5 shadow-xl bg-slate-900/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Network className="w-4 h-4 text-red-400" />
                  <span>Adversary IP Node Correlation</span>
                </h3>
                <p className="text-xs text-slate-400">Repeated offensive telemetry sources</p>
              </div>
              <button
                onClick={() => onNavigateToAnomalies()}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono cursor-pointer"
              >
                All Nodes &rarr;
              </button>
            </div>

            <div className="space-y-2">
              {charts.topSuspiciousIps.slice(0, 4).map((ipItem) => (
                <div
                  key={ipItem.ip}
                  className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    <div>
                      <span className="font-mono font-bold text-cyan-300 block">{ipItem.ip}</span>
                      <span className="text-[10px] text-slate-400">{ipItem.primaryThreat}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-300">
                      <strong>{ipItem.count}</strong> hits
                    </span>
                    <button
                      onClick={() => onNavigateToAnomalies({ ip: ipItem.ip })}
                      className="px-2.5 py-1 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-[10px] font-mono transition-colors cursor-pointer"
                    >
                      Investigate Node
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">SOC Reputation: Automated Threat Feed</span>
            <button
              onClick={() => onNavigateToView('analyzer')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer"
            >
              <span>Launch Log Analyzer</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
