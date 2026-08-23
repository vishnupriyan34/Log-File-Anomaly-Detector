import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Investigation } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Binary, Search, ShieldCheck, Clock, User,
  FileText, CheckCircle2, AlertCircle, RefreshCw, Layers
} from 'lucide-react';

interface InvestigationsProps {
  onSelectAnomaly: (anomalyId: string) => void;
}

export const Investigations: React.FC<InvestigationsProps> = ({ onSelectAnomaly }) => {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchInvestigations = async () => {
    try {
      setLoading(true);
      const res = await api.getInvestigations();
      setInvestigations(res.investigations);
    } catch (err) {
      console.error('Failed to load investigations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, []);

  const filtered = investigations.filter((inv) => {
    if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        inv.id.toLowerCase().includes(q) ||
        inv.anomaly_id.toLowerCase().includes(q) ||
        inv.analyst_name.toLowerCase().includes(q) ||
        inv.notes.toLowerCase().includes(q) ||
        inv.action_taken.toLowerCase().includes(q)
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
            <Binary className="w-5 h-5 text-cyan-400" />
            <span>Incident Investigations Board</span>
          </h2>
          <p className="text-xs text-slate-400">
            Timeline of SOC analyst remediation actions, forensic findings, and containment notes
          </p>
        </div>

        <button
          id="refresh-investigations-btn"
          onClick={fetchInvestigations}
          className="p-2 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 transition-colors"
          title="Refresh investigations"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <input
            id="search-investigations-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search investigation notes, anomaly ID, action taken..."
            className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <select
            id="filter-investigation-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-100 outline-none"
          >
            <option value="ALL">Status: All</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="false_positive">False Positive</option>
          </select>
        </div>
      </div>

      {/* Investigations List */}
      <div className="space-y-3">
        {filtered.map((inv) => (
          <div
            key={inv.id}
            id={`investigation-card-${inv.id}`}
            className="p-4 rounded-2xl glass-card border border-cyan-500/20 hover:border-cyan-500/40 transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-cyan-400">{inv.id}</span>
                <span className="text-slate-600">•</span>
                <button
                  id={`link-anomaly-btn-${inv.anomaly_id}`}
                  onClick={() => onSelectAnomaly(inv.anomaly_id)}
                  className="font-mono text-xs text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2"
                >
                  Anomaly: {inv.anomaly_id}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={inv.status} />
                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(inv.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-200 leading-relaxed">
              {inv.notes}
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
              <div className="text-cyan-300">
                Action: <span className="text-slate-300">{inv.action_taken}</span>
              </div>
              <div className="text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3 text-cyan-400" />
                <span>{inv.analyst_name}</span>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-500 rounded-2xl glass-card border border-slate-800">
            No investigation records found.
          </div>
        )}
      </div>
    </div>
  );
};
