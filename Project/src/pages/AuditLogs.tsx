import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import {
  FileText, Search, RefreshCw, CheckCircle2,
  AlertCircle, Shield, User, Clock, Terminal
} from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs();
      setLogs(res.auditLogs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter((log) => {
    if (actionFilter !== 'ALL' && !log.action.toLowerCase().includes(actionFilter.toLowerCase())) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.user_name.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.resource_type.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-purple-400" />
            <span>SOC System Audit Trail (Admin)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Immutable log of user authentication, model executions, threat status modifications and rule updates
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <input
            id="search-audit-logs-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by actor, action, details..."
            className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <select
            id="filter-audit-action-select"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-100 outline-none"
          >
            <option value="ALL">Action: All</option>
            <option value="AUTH">Authentication / Logins</option>
            <option value="LOG_UPLOAD">Log Uploads</option>
            <option value="ANOMALY">Anomaly Status Updates</option>
            <option value="AI_ANALYSIS">AI Intelligence Invocations</option>
            <option value="USER">User Management</option>
            <option value="SETTINGS">Settings Changes</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl glass-card border border-purple-500/20 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/70 text-slate-400">
                <th className="py-3 px-4 font-medium">Timestamp</th>
                <th className="py-3 px-4 font-medium">User Actor</th>
                <th className="py-3 px-4 font-medium">Action</th>
                <th className="py-3 px-4 font-medium">Resource</th>
                <th className="py-3 px-4 font-medium">Result</th>
                <th className="py-3 px-4 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-sans font-bold text-slate-200">
                    {log.user_name}
                  </td>
                  <td className="py-3 px-4 text-purple-300 font-bold">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-cyan-300">
                    {log.resource_type}
                  </td>
                  <td className="py-3 px-4">
                    {log.status === 'success' ? (
                      <span className="text-emerald-400 inline-flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> OK
                      </span>
                    ) : (
                      <span className="text-red-400 inline-flex items-center gap-1 font-bold">
                        <AlertCircle className="w-3 h-3" /> FAILED
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-sm truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No audit records matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
