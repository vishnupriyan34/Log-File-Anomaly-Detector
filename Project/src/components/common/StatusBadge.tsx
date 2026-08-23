import React from 'react';
import { AnomalyStatus, ProcessingStatus } from '../../types';
import { ShieldAlert, Search, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

interface StatusBadgeProps {
  status: AnomalyStatus | ProcessingStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'open':
      return (
        <span id="status-badge-open" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
          <ShieldAlert className="w-3.5 h-3.5" />
          Open
        </span>
      );
    case 'investigating':
      return (
        <span id="status-badge-investigating" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
          <Search className="w-3.5 h-3.5" />
          Investigating
        </span>
      );
    case 'resolved':
      return (
        <span id="status-badge-resolved" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Resolved
        </span>
      );
    case 'false_positive':
      return (
        <span id="status-badge-false-positive" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/15 text-slate-400 border border-slate-500/20">
          <XCircle className="w-3.5 h-3.5" />
          False Positive
        </span>
      );
    case 'completed':
      return (
        <span id="status-badge-completed" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Completed
        </span>
      );
    case 'processing':
    case 'analyzing':
      return (
        <span id={`status-badge-${status}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {status === 'analyzing' ? 'Analyzing ML & Rules...' : 'Processing...'}
        </span>
      );
    case 'failed':
      return (
        <span id="status-badge-failed" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
          <XCircle className="w-3.5 h-3.5" />
          Failed
        </span>
      );
    default:
      return (
        <span id={`status-badge-default-${status}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
          <Clock className="w-3.5 h-3.5" />
          {status}
        </span>
      );
  }
};
