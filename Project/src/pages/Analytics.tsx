import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Anomaly, DashboardMetrics } from '../types';
import {
  BarChart3, Calendar, TrendingUp, ShieldAlert, Cpu,
  Activity, PieChart as PieIcon, RefreshCw, Zap
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { metrics, charts } = data;

  return (
    <div className="space-y-6">
      {/* Title & Range Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>Threat Intelligence & Security Analytics</span>
          </h2>
          <p className="text-xs text-slate-400">
            Temporal attack vectors, machine learning isolation variance, and behavioral metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 flex items-center text-xs">
            <button
              onClick={() => setTimeRange('24h')}
              className={`px-3 py-1 rounded-lg font-mono transition-colors ${
                timeRange === '24h' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              24H
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1 rounded-lg font-mono transition-colors ${
                timeRange === '7d' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              7D
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1 rounded-lg font-mono transition-colors ${
                timeRange === '30d' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              30D
            </button>
          </div>

          <button
            id="refresh-analytics-btn"
            onClick={loadAnalytics}
            className="p-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row 1: Attack Trend & Severity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl glass-card border border-cyan-500/20 p-5 shadow-xl">
          <h3 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Detection Volume Trend by Severity</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Daily distribution of Critical vs High vs Medium anomaly alerts
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.anomalyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D1527',
                    borderColor: 'rgba(6,182,212,0.3)',
                    borderRadius: '12px',
                    color: '#F1F5F9',
                    fontSize: '12px'
                  }}
                />
                <Legend />
                <Bar dataKey="critical" name="Critical" fill="#EF4444" stackId="a" />
                <Bar dataKey="high" name="High" fill="#F97316" stackId="a" />
                <Bar dataKey="medium" name="Medium" fill="#FBBF24" stackId="a" />
                <Bar dataKey="low" name="Low" fill="#10B981" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl glass-card border border-cyan-500/20 p-5 shadow-xl">
          <h3 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span>Detected Attack Vector Classification</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Most frequent threat patterns identified in recent ingest streams
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.anomalyTypes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#64748B" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={10} width={130} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D1527',
                    borderColor: 'rgba(6,182,212,0.3)',
                    borderRadius: '12px',
                    color: '#F1F5F9',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" name="Incidents" fill="#06B6D4" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Top Adversary Nodes Table & System Efficacy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl glass-card border border-cyan-500/20 p-5 shadow-xl">
          <h3 className="text-sm font-bold text-slate-100 mb-1">
            Top Threat Origins & Adversary Profile
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Ranked IP addresses exhibiting anomalous traffic spikes or malicious injection patterns
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2">Source IP</th>
                  <th className="pb-2">Total Attacks</th>
                  <th className="pb-2">Critical Count</th>
                  <th className="pb-2">Primary Target Vector</th>
                  <th className="pb-2">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {charts.topSuspiciousIps.map((item: any) => (
                  <tr key={item.ip} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 text-cyan-300 font-bold">{item.ip}</td>
                    <td className="py-2.5 text-slate-100 font-bold">{item.count}</td>
                    <td className="py-2.5 text-red-400">{item.criticalCount}</td>
                    <td className="py-2.5 text-slate-300">{item.primaryThreat}</td>
                    <td className="py-2.5 text-slate-500">{new Date(item.lastDetected).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl glass-card border border-cyan-500/20 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 mb-1">
              Engine Performance
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              SOC detection metrics
            </p>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400 block font-mono">ISOLATION FOREST SENSITIVITY</span>
                <span className="text-xl font-bold font-mono text-cyan-400">85% Threshold</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400 block font-mono">PRECISION ACCURACY</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{metrics.detectionAccuracy}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400 block font-mono">RESOLVED INCIDENT RATIO</span>
                <span className="text-xl font-bold font-mono text-purple-400">
                  {metrics && Number(metrics.anomaliesDetected) > 0
                    ? `${(((Number(metrics.resolvedIncidents) || 0) / Number(metrics.anomaliesDetected)) * 100).toFixed(0)}%`
                    : '100%'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
