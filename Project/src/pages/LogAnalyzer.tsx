import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { LogFile, LogEntry } from '../types';
import { Modal } from '../components/common/Modal';
import {
  SearchCode, Filter, RefreshCw, AlertTriangle, CheckCircle,
  FileText, ExternalLink, Code, Calendar, Globe, User, Server
} from 'lucide-react';

interface LogAnalyzerProps {
  initialFileId?: string;
  onInspectAnomaly?: (anomalyId: string) => void;
}

export const LogAnalyzer: React.FC<LogAnalyzerProps> = ({
  initialFileId,
  onInspectAnomaly
}) => {
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>(initialFileId || '');
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [anomalyFilter, setAnomalyFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Selected single entry for detailed modal
  const [inspectedEntry, setInspectedEntry] = useState<LogEntry | null>(null);

  useEffect(() => {
    async function loadFiles() {
      try {
        const res = await api.getLogFiles();
        setLogFiles(res.logFiles);
        if (!selectedFileId && res.logFiles.length > 0) {
          setSelectedFileId(res.logFiles[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch files:', err);
      }
    }
    loadFiles();
  }, []);

  useEffect(() => {
    if (initialFileId) {
      setSelectedFileId(initialFileId);
    }
  }, [initialFileId]);

  useEffect(() => {
    if (!selectedFileId) return;
    async function loadEntries() {
      try {
        setLoading(true);
        const res = await api.getLogFileDetails(selectedFileId);
        setEntries(res.entries);
      } catch (err) {
        console.error('Failed to load file entries:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEntries();
  }, [selectedFileId]);

  const filteredEntries = entries.filter((e) => {
    if (methodFilter !== 'ALL' && e.http_method !== methodFilter) return false;

    if (statusFilter === '2xx' && (e.status_code < 200 || e.status_code >= 300)) return false;
    if (statusFilter === '3xx' && (e.status_code < 300 || e.status_code >= 400)) return false;
    if (statusFilter === '4xx' && (e.status_code < 400 || e.status_code >= 500)) return false;
    if (statusFilter === '5xx' && e.status_code < 500) return false;

    if (anomalyFilter === 'ANOMALOUS' && !e.is_anomalous) return false;
    if (anomalyFilter === 'NORMAL' && e.is_anomalous) return false;

    if (search) {
      const q = search.toLowerCase();
      return (
        e.ip_address.toLowerCase().includes(q) ||
        e.request_url.toLowerCase().includes(q) ||
        e.message.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q) ||
        e.user_agent.toLowerCase().includes(q) ||
        e.event_type.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const totalPages = Math.ceil(filteredEntries.length / pageSize) || 1;
  const paginatedEntries = filteredEntries.slice((page - 1) * pageSize, page * pageSize);

  const getStatusColor = (status: number) => {
    if (status >= 500) return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (status >= 400) return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    if (status >= 300) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <SearchCode className="w-5 h-5 text-cyan-400" />
            <span>Structured Log Explorer</span>
          </h2>
          <p className="text-xs text-slate-400">
            Search, filter and inspect every parsed log event and anomaly flag
          </p>
        </div>

        {/* File Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-mono hidden sm:inline">
            Active Log File:
          </label>
          <select
            id="log-explorer-file-select"
            value={selectedFileId}
            onChange={(e) => { setSelectedFileId(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-slate-100 text-xs font-mono outline-none"
          >
            {logFiles.map((f) => (
              <option key={f.id} value={f.id}>
                {f.filename} ({f.total_entries} entries)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-4 rounded-2xl glass-card border border-cyan-500/20 shadow-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search input */}
          <div className="relative">
            <input
              id="log-search-query-input"
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search IP, URL, payload, username..."
              className="w-full pl-3 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400"
            />
          </div>

          {/* HTTP Method */}
          <div>
            <select
              id="log-filter-method-select"
              value={methodFilter}
              onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-100 outline-none"
            >
              <option value="ALL">Method: ALL</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="AUTH">AUTH / SYSTEM</option>
            </select>
          </div>

          {/* Status Code */}
          <div>
            <select
              id="log-filter-status-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-100 outline-none"
            >
              <option value="ALL">Status Code: ALL</option>
              <option value="2xx">2xx Success</option>
              <option value="3xx">3xx Redirect</option>
              <option value="4xx">4xx Client Error (403/404)</option>
              <option value="5xx">5xx Server Outage (500/502)</option>
            </select>
          </div>

          {/* Anomaly Flag */}
          <div>
            <select
              id="log-filter-anomaly-select"
              value={anomalyFilter}
              onChange={(e) => { setAnomalyFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-100 outline-none font-semibold text-cyan-400"
            >
              <option value="ALL">Anomaly State: ALL</option>
              <option value="ANOMALOUS">⚠️ Anomalous Events Only</option>
              <option value="NORMAL">✅ Normal Events Only</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
          <div>
            Showing <span className="text-cyan-300 font-bold">{filteredEntries.length}</span> matching entries
          </div>
          <div>
            Page <span className="text-slate-200 font-bold">{page}</span> of {totalPages}
          </div>
        </div>
      </div>

      {/* Log Stream Table */}
      <div className="rounded-2xl glass-card border border-cyan-500/20 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/70 text-slate-400">
                <th className="py-3 px-4 font-medium">Timestamp</th>
                <th className="py-3 px-4 font-medium">Source IP</th>
                <th className="py-3 px-4 font-medium">User</th>
                <th className="py-3 px-4 font-medium">Method & Endpoint</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Latency</th>
                <th className="py-3 px-4 font-medium">Flag</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedEntries.map((entry) => (
                <tr
                  key={entry.id}
                  id={`log-entry-row-${entry.id}`}
                  onClick={() => setInspectedEntry(entry)}
                  className={`hover:bg-cyan-500/5 cursor-pointer transition-colors ${
                    entry.is_anomalous ? 'bg-red-500/5 hover:bg-red-500/10' : ''
                  }`}
                >
                  <td className="py-2.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>

                  <td className="py-2.5 px-4 text-cyan-300 font-bold">
                    {entry.ip_address}
                  </td>

                  <td className="py-2.5 px-4 text-slate-300">
                    {entry.username}
                  </td>

                  <td className="py-2.5 px-4 max-w-xs truncate text-slate-200">
                    <span className="font-bold text-purple-400 mr-2">{entry.http_method}</span>
                    <span className="text-slate-300">{entry.request_url}</span>
                  </td>

                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${getStatusColor(entry.status_code)}`}>
                      {entry.status_code}
                    </span>
                  </td>

                  <td className="py-2.5 px-4 text-slate-400">
                    {entry.response_time}ms
                  </td>

                  <td className="py-2.5 px-4">
                    {entry.is_anomalous ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] uppercase font-bold animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        Anomaly
                      </span>
                    ) : (
                      <span className="text-slate-600 text-[11px]">—</span>
                    )}
                  </td>

                  <td className="py-2.5 px-4 text-right">
                    <button
                      id={`inspect-entry-btn-${entry.id}`}
                      onClick={(e) => { e.stopPropagation(); setInspectedEntry(entry); }}
                      className="p-1 rounded bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {paginatedEntries.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No log entries match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/40">
            <button
              id="log-prev-page-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs text-slate-300 disabled:opacity-40"
            >
              Previous
            </button>
            <div className="text-xs font-mono text-slate-400">
              Page {page} of {totalPages}
            </div>
            <button
              id="log-next-page-btn"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs text-slate-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Inspected Log Entry Detail Modal */}
      {inspectedEntry && (
        <Modal
          id="log-entry-detail-modal"
          isOpen={!!inspectedEntry}
          onClose={() => setInspectedEntry(null)}
          title={
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-cyan-400" />
              <span>Event Details: {inspectedEntry.id}</span>
            </div>
          }
          maxWidth="3xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-500 uppercase text-[10px] block font-mono">Timestamp</span>
                <span className="text-slate-100 font-mono">{new Date(inspectedEntry.timestamp).toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-500 uppercase text-[10px] block font-mono">Source IP</span>
                <span className="text-cyan-300 font-mono font-bold">{inspectedEntry.ip_address}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-500 uppercase text-[10px] block font-mono">Username</span>
                <span className="text-slate-100 font-mono">{inspectedEntry.username}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-500 uppercase text-[10px] block font-mono">Method & Code</span>
                <span className="text-purple-300 font-mono font-bold">{inspectedEntry.http_method} — {inspectedEntry.status_code}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-500 uppercase text-[10px] block font-mono">Latency</span>
                <span className="text-slate-100 font-mono">{inspectedEntry.response_time} ms</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-500 uppercase text-[10px] block font-mono">Classification</span>
                <span className={inspectedEntry.is_anomalous ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {inspectedEntry.is_anomalous ? 'ANOMALOUS THREAT' : 'NORMAL TRAFFIC'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-1 uppercase font-mono">Request URL & Parameters:</span>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 break-all">
                {inspectedEntry.request_url}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-1 uppercase font-mono">User Agent:</span>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 break-all">
                {inspectedEntry.user_agent}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-1 uppercase font-mono">Message / Payload / Event:</span>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap">
                {inspectedEntry.message}
              </div>
            </div>

            {inspectedEntry.raw_line && (
              <div>
                <span className="text-xs text-slate-400 block mb-1 uppercase font-mono">Raw Ingest Line:</span>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400 break-all">
                  {inspectedEntry.raw_line}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
