import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Anomaly, SeverityLevel, AnomalyStatus } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { AnomalyDetailsModal } from '../components/anomalies/AnomalyDetailsModal';
import { useAuth } from '../contexts/AuthContext';
import {
  ShieldAlert, Filter, Search, Download, CheckSquare,
  Square, RefreshCw, Eye, Sparkles, ExternalLink,
  CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight
} from 'lucide-react';

interface AnomaliesProps {
  initialFilter?: {
    severity?: string;
    logFileId?: string;
    ip?: string;
  };
  selectedAnomalyId?: string | null;
  onSelectAnomaly?: (id: string | null) => void;
}

export const Anomalies: React.FC<AnomaliesProps> = ({
  initialFilter,
  selectedAnomalyId: propAnomalyId,
  onSelectAnomaly
}) => {
  const { isAnalyst } = useAuth();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [severityFilter, setSeverityFilter] = useState(initialFilter?.severity || 'all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ipFilter, setIpFilter] = useState(initialFilter?.ip || '');
  const [search, setSearch] = useState('');

  // Selected for inspection modal
  const [inspectAnomalyId, setInspectAnomalyId] = useState<string | null>(propAnomalyId || null);

  // Multi-select bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const res = await api.getAnomalies({
        severity: severityFilter !== 'all' ? severityFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        ip: ipFilter || undefined,
        search: search || undefined
      });
      setAnomalies(res.anomalies);
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to load anomalies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, [severityFilter, typeFilter, statusFilter, ipFilter, search]);

  useEffect(() => {
    if (propAnomalyId) {
      setInspectAnomalyId(propAnomalyId);
    }
  }, [propAnomalyId]);

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedAnomalies.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedAnomalies.map(a => a.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = async (status: AnomalyStatus) => {
    if (selectedIds.length === 0) return;
    try {
      setBulkLoading(true);
      await Promise.all(
        selectedIds.map(id => api.updateAnomaly(id, { status }))
      );
      await fetchAnomalies();
    } catch (err: any) {
      alert(err.message || 'Failed to update selected anomalies.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (anomalies.length === 0) return;
    const headers = ['ID', 'Severity', 'Anomaly Type', 'Confidence', 'Score', 'Source IP', 'Username', 'Request URL', 'Status', 'Detected At', 'Description'];
    const rows = anomalies.map(a => [
      a.id,
      a.severity,
      `"${a.anomaly_type.replace(/"/g, '""')}"`,
      `${a.confidence_score}%`,
      (typeof a.anomaly_score === 'number' ? a.anomaly_score : (Number(a.anomaly_score) || 0.85)).toFixed(2),
      a.source_ip,
      a.username,
      `"${a.request_url.replace(/"/g, '""')}"`,
      a.status,
      a.detected_at,
      `"${a.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `soc_anomalies_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(anomalies.length / pageSize) || 1;
  const paginatedAnomalies = anomalies.slice((page - 1) * pageSize, page * pageSize);

  // Anomaly summary counts
  const counts = {
    critical: anomalies.filter(a => a.severity === 'critical').length,
    high: anomalies.filter(a => a.severity === 'high').length,
    medium: anomalies.filter(a => a.severity === 'medium').length,
    low: anomalies.filter(a => a.severity === 'low').length,
  };

  return (
    <div className="space-y-6">
      {/* Title & Stats Badges */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <span>Threat Anomalies Triage</span>
          </h2>
          <p className="text-xs text-slate-400">
            Ranked security incidents detected via Isolation Forest ML & Rule-based heuristics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="export-anomalies-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            id="refresh-anomalies-list-btn"
            onClick={fetchAnomalies}
            className="p-2 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Refresh anomalies"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Filter Counts Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => { setSeverityFilter(severityFilter === 'critical' ? 'all' : 'critical'); setPage(1); }}
          className={`p-3 rounded-xl border text-left transition-all ${
            severityFilter === 'critical'
              ? 'bg-red-500/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
              : 'bg-slate-900/50 border-slate-800 hover:border-red-500/30'
          }`}
        >
          <span className="text-[10px] uppercase font-mono text-red-400 block font-semibold">Critical Threats</span>
          <span className="text-xl font-bold font-mono text-slate-100">{counts.critical}</span>
        </button>

        <button
          onClick={() => { setSeverityFilter(severityFilter === 'high' ? 'all' : 'high'); setPage(1); }}
          className={`p-3 rounded-xl border text-left transition-all ${
            severityFilter === 'high'
              ? 'bg-orange-500/20 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
              : 'bg-slate-900/50 border-slate-800 hover:border-orange-500/30'
          }`}
        >
          <span className="text-[10px] uppercase font-mono text-orange-400 block font-semibold">High Severity</span>
          <span className="text-xl font-bold font-mono text-slate-100">{counts.high}</span>
        </button>

        <button
          onClick={() => { setSeverityFilter(severityFilter === 'medium' ? 'all' : 'medium'); setPage(1); }}
          className={`p-3 rounded-xl border text-left transition-all ${
            severityFilter === 'medium'
              ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : 'bg-slate-900/50 border-slate-800 hover:border-amber-500/30'
          }`}
        >
          <span className="text-[10px] uppercase font-mono text-amber-400 block font-semibold">Medium Alerts</span>
          <span className="text-xl font-bold font-mono text-slate-100">{counts.medium}</span>
        </button>

        <button
          onClick={() => { setSeverityFilter(severityFilter === 'low' ? 'all' : 'low'); setPage(1); }}
          className={`p-3 rounded-xl border text-left transition-all ${
            severityFilter === 'low'
              ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : 'bg-slate-900/50 border-slate-800 hover:border-emerald-500/30'
          }`}
        >
          <span className="text-[10px] uppercase font-mono text-emerald-400 block font-semibold">Low Priority</span>
          <span className="text-xl font-bold font-mono text-slate-100">{counts.low}</span>
        </button>
      </div>

      {/* Filter Options */}
      <div className="p-4 rounded-2xl glass-card border border-cyan-500/20 shadow-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <input
              id="anomalies-search-input"
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search threat ID, IP, user, URL..."
              className="w-full pl-3 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <select
              id="anomalies-severity-select"
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-100 outline-none"
            >
              <option value="all">Severity: All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <select
              id="anomalies-status-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-100 outline-none"
            >
              <option value="all">Status: All</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="false_positive">False Positive</option>
            </select>
          </div>

          <div>
            <input
              id="anomalies-ip-filter-input"
              type="text"
              value={ipFilter}
              onChange={(e) => { setIpFilter(e.target.value); setPage(1); }}
              placeholder="Filter by Source IP..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-100 font-mono placeholder-slate-500 outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Bulk Action Bar if items selected */}
        {selectedIds.length > 0 && isAnalyst && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 animate-fadeIn">
            <span className="text-xs font-mono text-cyan-300">
              <span className="font-bold">{selectedIds.length}</span> anomalies selected
            </span>

            <div className="flex items-center gap-2">
              <button
                id="bulk-resolve-btn"
                onClick={() => handleBulkStatusUpdate('resolved')}
                disabled={bulkLoading}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Resolved</span>
              </button>

              <button
                id="bulk-investigate-btn"
                onClick={() => handleBulkStatusUpdate('investigating')}
                disabled={bulkLoading}
                className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1 transition-all"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Mark Investigating</span>
              </button>

              <button
                id="bulk-false-positive-btn"
                onClick={() => handleBulkStatusUpdate('false_positive')}
                disabled={bulkLoading}
                className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium flex items-center gap-1 transition-all"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>False Positive</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Anomalies Table */}
      <div className="rounded-2xl glass-card border border-cyan-500/20 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/70 text-slate-400">
                {isAnalyst && (
                  <th className="py-3 px-4 w-10">
                    <button onClick={handleSelectAll} className="text-slate-400 hover:text-slate-200">
                      {selectedIds.length === paginatedAnomalies.length && paginatedAnomalies.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                )}
                <th className="py-3 px-4 font-medium">Severity</th>
                <th className="py-3 px-4 font-medium">Threat Vector</th>
                <th className="py-3 px-4 font-medium">Source IP</th>
                <th className="py-3 px-4 font-medium">Confidence</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Detection Time</th>
                <th className="py-3 px-4 text-right">Triage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedAnomalies.map((anom) => (
                <tr
                  key={anom.id}
                  id={`anomaly-row-${anom.id}`}
                  onClick={() => setInspectAnomalyId(anom.id)}
                  className={`hover:bg-cyan-500/5 cursor-pointer transition-colors ${
                    selectedIds.includes(anom.id) ? 'bg-cyan-500/10' : ''
                  }`}
                >
                  {isAnalyst && (
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleSelect(anom.id)}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        {selectedIds.includes(anom.id) ? (
                          <CheckSquare className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  )}

                  <td className="py-3 px-4">
                    <SeverityBadge severity={anom.severity} size="sm" />
                  </td>

                  <td className="py-3 px-4 text-slate-100 font-bold font-sans">
                    <div className="flex items-center gap-1.5">
                      <span>{anom.anomaly_type}</span>
                      {anom.ai_analysis && (
                        <span title="AI Inspected" className="text-purple-400">
                          <Sparkles className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 font-normal truncate max-w-xs">
                      {anom.request_url}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-cyan-300 font-bold">
                    {anom.source_ip}
                  </td>

                  <td className="py-3 px-4 text-purple-300">
                    <span className="font-bold">{anom.confidence_score}%</span>
                    <span className="text-slate-500 text-[10px] ml-1">({(typeof anom.anomaly_score === 'number' ? anom.anomaly_score : (Number(anom.anomaly_score) || 0.85)).toFixed(2)})</span>
                  </td>

                  <td className="py-3 px-4">
                    <StatusBadge status={anom.status} />
                  </td>

                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(anom.detected_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      id={`inspect-anomaly-btn-${anom.id}`}
                      onClick={(e) => { e.stopPropagation(); setInspectAnomalyId(anom.id); }}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold flex items-center gap-1 ml-auto transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Triage</span>
                    </button>
                  </td>
                </tr>
              ))}

              {paginatedAnomalies.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No anomalies found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/40">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs text-slate-300 disabled:opacity-40"
            >
              Previous
            </button>
            <div className="text-xs font-mono text-slate-400">
              Page {page} of {totalPages} ({anomalies.length} items)
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs text-slate-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Detailed Investigation & AI Modal */}
      <AnomalyDetailsModal
        anomalyId={inspectAnomalyId}
        onClose={() => {
          setInspectAnomalyId(null);
          if (onSelectAnomaly) onSelectAnomaly(null);
        }}
        onAnomalyUpdated={(updated) => {
          setAnomalies(prev => prev.map(a => a.id === updated.id ? updated : a));
        }}
      />
    </div>
  );
};
