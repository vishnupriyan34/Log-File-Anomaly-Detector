import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Anomaly, LogEntry, Investigation, AIReportData } from '../../types';
import { Modal } from '../common/Modal';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import {
  ShieldAlert, Sparkles, Cpu, Layers, Terminal, CheckCircle2,
  AlertTriangle, Shield, User, Globe, Clock, ArrowRight,
  ExternalLink, FileText, Send, Loader2, AlertOctagon
} from 'lucide-react';

interface AnomalyDetailsModalProps {
  anomalyId: string | null;
  onClose: () => void;
  onAnomalyUpdated: (updatedAnomaly: Anomaly) => void;
}

export const AnomalyDetailsModal: React.FC<AnomalyDetailsModalProps> = ({
  anomalyId,
  onClose,
  onAnomalyUpdated
}) => {
  const { isAnalyst, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [anomaly, setAnomaly] = useState<Anomaly | null>(null);
  const [surroundingLogs, setSurroundingLogs] = useState<LogEntry[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);

  // AI Analysis state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<AIReportData | null>(null);

  // Investigation form
  const [newNote, setNewNote] = useState('');
  const [newAction, setNewAction] = useState('');
  const [newStatus, setNewStatus] = useState<'investigating' | 'resolved' | 'false_positive'>('investigating');
  const [submittingInv, setSubmittingInv] = useState(false);

  useEffect(() => {
    if (!anomalyId) return;

    async function loadDetails() {
      try {
        setLoading(true);
        const res = await api.getAnomalyDetails(anomalyId!);
        setAnomaly(res.anomaly);
        setSurroundingLogs(res.surroundingLogs);
        setInvestigations(res.investigations);

        if (res.anomaly.ai_analysis) {
          try {
            setAiReport(JSON.parse(res.anomaly.ai_analysis));
          } catch {
            // ignore
          }
        } else {
          setAiReport(null);
        }

        setNewStatus(res.anomaly.status === 'open' ? 'investigating' : res.anomaly.status as any);
      } catch (err) {
        console.error('Failed to load anomaly details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [anomalyId]);

  const handleRunAiAnalysis = async () => {
    if (!anomaly) return;
    try {
      setAiLoading(true);
      const res = await api.analyzeAnomalyWithAI(anomaly.id);
      setAiReport(res.aiReport);
      const updatedAnomaly = {
        ...anomaly,
        ai_analysis: JSON.stringify(res.aiReport),
        mitre_tactic: res.aiReport.mitreTactic
      };
      setAnomaly(updatedAnomaly);
      onAnomalyUpdated(updatedAnomaly);
    } catch (err: any) {
      alert(err.message || 'Failed to complete AI threat intelligence analysis.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anomaly || !newNote.trim()) return;

    try {
      setSubmittingInv(true);
      const res = await api.createInvestigation({
        anomaly_id: anomaly.id,
        notes: newNote,
        action_taken: newAction || 'SOC analyst investigation updated.',
        status: newStatus
      });

      // Update anomaly status in DB as well
      const updatedRes = await api.updateAnomaly(anomaly.id, { status: newStatus });
      setAnomaly(updatedRes.anomaly);
      onAnomalyUpdated(updatedRes.anomaly);

      setInvestigations([res.investigation, ...investigations]);
      setNewNote('');
      setNewAction('');
    } catch (err: any) {
      alert(err.message || 'Failed to record investigation.');
    } finally {
      setSubmittingInv(false);
    }
  };

  if (!anomalyId) return null;

  return (
    <Modal
      id="anomaly-details-modal"
      isOpen={!!anomalyId}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5 flex-wrap">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <span className="font-mono text-sm sm:text-base">Threat Incident: {anomalyId}</span>
          {anomaly && <SeverityBadge severity={anomaly.severity} size="sm" />}
        </div>
      }
      maxWidth="4xl"
    >
      {loading || !anomaly ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 uppercase text-[10px] block font-mono">Anomaly Type</span>
              <span className="text-slate-100 font-bold font-mono">{anomaly.anomaly_type}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 uppercase text-[10px] block font-mono">Source IP</span>
              <span className="text-cyan-300 font-bold font-mono">{anomaly.source_ip}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 uppercase text-[10px] block font-mono">Confidence / Score</span>
              <span className="text-purple-300 font-mono font-bold">
                {anomaly.confidence_score ?? 90}% (Score: {(typeof anomaly.anomaly_score === 'number' ? anomaly.anomaly_score : (Number(anomaly.anomaly_score) || 0.85)).toFixed(2)})
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 uppercase text-[10px] block font-mono">Current Status</span>
              <div className="mt-0.5">
                <StatusBadge status={anomaly.status} />
              </div>
            </div>
          </div>

          {/* Threat Description & Heuristics */}
          <div className="p-4 rounded-xl glass-card border border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Heuristic & Detection Signature
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase">
                Method: {anomaly.detection_method}
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {anomaly.description}
            </p>
            {anomaly.recommended_action && (
              <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                <span className="text-cyan-400 font-semibold">Immediate Recommendation: </span>
                {anomaly.recommended_action}
              </div>
            )}
          </div>

          {/* Surrounding Log Stream Context */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Forensic Stream Context (Target Log & Surrounding Sequence)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {surroundingLogs.length} events
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 max-h-48 overflow-y-auto space-y-1.5 font-mono text-[11px]">
              {surroundingLogs.map((log) => {
                const isTarget = log.id === anomaly.log_entry_id;
                return (
                  <div
                    key={log.id}
                    className={`p-2 rounded-lg transition-colors ${
                      isTarget
                        ? 'bg-red-500/20 border border-red-500/40 text-red-200'
                        : 'bg-slate-900/40 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                      <span className="text-cyan-400">{log.ip_address} [{log.username}]</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="break-all">
                      <span className="font-bold mr-2 text-purple-300">{log.http_method}</span>
                      <span className="text-slate-300">{log.request_url}</span>
                      <span className="ml-2 px-1 rounded bg-slate-800 text-[10px]">{log.status_code}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gemini AI SOC Intelligence Section */}
          <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide font-mono flex items-center gap-2">
                    <span>AI SOC Threat Intelligence</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Gemini 3.7 Flash
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Automated MITRE ATT&CK mapping, threat blast radius & remediation advisory
                  </p>
                </div>
              </div>

              {isAnalyst && (
                <button
                  id="run-gemini-soc-analysis-btn"
                  onClick={handleRunAiAnalysis}
                  disabled={aiLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-600/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{aiReport ? 'Re-Analyze with AI' : 'Run AI Threat Analysis'}</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {aiReport ? (
              <div className="space-y-3 pt-2 text-xs">
                {/* MITRE ATT&CK Banner */}
                <div className="p-3 rounded-xl bg-purple-900/30 border border-purple-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="font-semibold text-purple-200">MITRE ATT&CK Tactic:</span>
                    <span className="font-mono font-bold text-purple-300">{aiReport.mitreTactic}</span>
                  </div>
                </div>

                {/* Threat Executive Summary */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase font-mono block mb-1">
                    Threat Summary:
                  </span>
                  <p className="text-slate-200 bg-slate-900/60 p-3 rounded-xl border border-slate-800 leading-relaxed">
                    {aiReport.threatSummary}
                  </p>
                </div>

                {/* Impact Assessment */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase font-mono block mb-1">
                    Impact & Blast Radius:
                  </span>
                  <p className="text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 leading-relaxed">
                    {aiReport.impactAssessment}
                  </p>
                </div>

                {/* Remediation Checklist */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase font-mono block mb-1">
                    Actionable Remediation Protocol:
                  </span>
                  <ul className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    {aiReport.remediationSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-purple-500/30 rounded-xl bg-purple-950/10">
                <p className="text-xs text-purple-300 font-medium">
                  Click "Run AI Threat Analysis" to generate instant deep SOC intelligence powered by Gemini 3.7 Flash.
                </p>
              </div>
            )}
          </div>

          {/* Investigation History & Entry Form */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>SOC Investigation Logs ({investigations.length})</span>
            </h4>

            {isAnalyst && (
              <form onSubmit={handleAddInvestigation} className="p-4 rounded-xl glass-card border border-cyan-500/20 space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 uppercase font-mono mb-1">
                    Investigation Notes & Findings *
                  </label>
                  <textarea
                    id="investigation-notes-input"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={2}
                    placeholder="Document adversary IP blocking, credentials invalidated, patch applied..."
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-100 outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 uppercase font-mono mb-1">
                      Action Taken
                    </label>
                    <input
                      id="investigation-action-input"
                      type="text"
                      value={newAction}
                      onChange={(e) => setNewAction(e.target.value)}
                      placeholder="e.g. Added IP to firewall blocklist"
                      className="w-full p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-100 outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 uppercase font-mono mb-1">
                      Update Anomaly Status
                    </label>
                    <select
                      id="investigation-status-select"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as any)}
                      className="w-full p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-100 outline-none"
                    >
                      <option value="investigating">Investigating (In Progress)</option>
                      <option value="resolved">Resolved (Mitigated)</option>
                      <option value="false_positive">False Positive (Benign)</option>
                    </select>
                  </div>
                </div>

                <button
                  id="record-investigation-submit-btn"
                  type="submit"
                  disabled={submittingInv || !newNote.trim()}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingInv ? 'Saving...' : 'Record Investigation Finding'}</span>
                </button>
              </form>
            )}

            {/* Timeline List */}
            <div className="space-y-2">
              {investigations.map((inv) => (
                <div key={inv.id} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-semibold text-slate-200">{inv.analyst_name}</span>
                    <span className="font-mono text-[10px]">{new Date(inv.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-300">{inv.notes}</p>
                  {inv.action_taken && (
                    <div className="text-[11px] text-cyan-400 font-mono">
                      Action: {inv.action_taken}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
