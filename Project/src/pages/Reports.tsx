import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  FileSpreadsheet, Printer, Download, RefreshCw,
  ShieldCheck, ShieldAlert, Sparkles, Building, Calendar
} from 'lucide-react';

export const Reports: React.FC = () => {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.getReports();
      setReport(res.report);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    if (!report) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${report.reportId}_SOC_Report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (loading || !report) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            <span>SOC Executive Intelligence Report</span>
          </h2>
          <p className="text-xs text-slate-400">
            Official cybersecurity incident audit & threat analysis summary
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="print-report-btn"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/25 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>

          <button
            id="download-report-json-btn"
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div
        id="printable-soc-report"
        className="rounded-3xl glass-card border border-cyan-500/30 p-8 sm:p-12 shadow-2xl space-y-8 bg-[#090E1A] text-slate-100 print:bg-white print:text-black print:p-0 print:border-none print:shadow-none"
      >
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyan-500/20 pb-6 print:border-gray-300">
          <div>
            <div className="inline-flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-bold mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>CyberGuard Security Operations Center</span>
            </div>
            <h1 className="text-2xl font-black font-mono uppercase tracking-tight text-slate-100 print:text-black">
              LOG ANOMALY THREAT REPORT
            </h1>
            <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
              Automated Forensic Ingestion & Machine Learning Incident Audit
            </p>
          </div>

          <div className="text-right font-mono text-xs text-slate-400 print:text-gray-600 space-y-1">
            <div>Report ID: <span className="text-cyan-400 font-bold print:text-black">{report.reportId}</span></div>
            <div>Generated: <span>{new Date(report.generatedAt).toLocaleString()}</span></div>
            <div>Analyst: <span className="text-slate-200 font-semibold print:text-black">{report.generatedBy} ({report.generatedByRole})</span></div>
            <div>Department: <span>{report.department}</span></div>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 print:text-gray-800 uppercase tracking-wider font-mono">
            1. Executive Telemetry Overview
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 print:bg-gray-100 border border-slate-800 print:border-gray-300">
              <span className="text-[10px] uppercase font-mono text-slate-400 print:text-gray-500 block">Total Logs Processed</span>
              <span className="text-2xl font-bold font-mono text-slate-100 print:text-black">{report.summary.totalLogsProcessed}</span>
              <span className="text-[10px] text-slate-500 block mt-1">({report.summary.totalEntries.toLocaleString()} events)</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 print:bg-gray-100 border border-slate-800 print:border-gray-300">
              <span className="text-[10px] uppercase font-mono text-slate-400 print:text-gray-500 block">Anomalies Detected</span>
              <span className="text-2xl font-bold font-mono text-purple-400 print:text-purple-700">{report.summary.totalAnomalies}</span>
              <span className="text-[10px] text-red-400 block mt-1">{report.summary.criticalAnomalies} Critical Threats</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 print:bg-gray-100 border border-slate-800 print:border-gray-300">
              <span className="text-[10px] uppercase font-mono text-slate-400 print:text-gray-500 block">Resolved / Contained</span>
              <span className="text-2xl font-bold font-mono text-emerald-400 print:text-emerald-700">{report.summary.resolvedIncidents}</span>
              <span className="text-[10px] text-emerald-400 block mt-1">Resolution Rate: {report.summary.resolutionRate}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 print:bg-gray-100 border border-slate-800 print:border-gray-300">
              <span className="text-[10px] uppercase font-mono text-slate-400 print:text-gray-500 block">Threat Breakdown</span>
              <div className="text-xs font-mono mt-1 space-y-0.5 print:text-black">
                <div>Crit: <span className="text-red-400 font-bold">{report.summary.criticalAnomalies}</span> | High: <span className="text-orange-400 font-bold">{report.summary.highAnomalies}</span></div>
                <div>Med: <span className="text-amber-400 font-bold">{report.summary.mediumAnomalies}</span> | Low: <span className="text-emerald-400 font-bold">{report.summary.lowAnomalies}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Attack Vectors & Adversaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl bg-slate-900/40 print:bg-gray-50 border border-slate-800 print:border-gray-300 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 print:text-gray-800 uppercase font-mono">
              2. Predominant Threat Classifications
            </h4>
            <div className="space-y-2">
              {report.mostCommonAnomalyTypes.map((item: any) => (
                <div key={item.type} className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 print:text-gray-700">{item.type}</span>
                  <span className="font-bold text-cyan-400 print:text-black">{item.count} detections</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 print:bg-gray-50 border border-slate-800 print:border-gray-300 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 print:text-gray-800 uppercase font-mono">
              3. Top Adversary Nodes
            </h4>
            <div className="space-y-2">
              {report.topSuspiciousIps.map((item: any) => (
                <div key={item.ip} className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 print:text-gray-700">{item.ip}</span>
                  <span className="font-bold text-red-400 print:text-red-700">{item.count} attacks</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Incidents Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 print:text-gray-800 uppercase tracking-wider font-mono">
            4. Verified Incident Log & Evidence Table
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 print:border-gray-400 text-slate-400 print:text-gray-600">
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Severity</th>
                  <th className="pb-2">Vector</th>
                  <th className="pb-2">Source IP</th>
                  <th className="pb-2">Confidence</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-gray-300">
                {report.incidents.map((inc: any) => (
                  <tr key={inc.id} className="text-slate-300 print:text-gray-900">
                    <td className="py-2 text-cyan-400 font-bold">{inc.id}</td>
                    <td className="py-2">
                      <span className={`uppercase font-bold ${
                        inc.severity === 'critical' ? 'text-red-400' :
                        inc.severity === 'high' ? 'text-orange-400' :
                        inc.severity === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-2">{inc.anomaly_type}</td>
                    <td className="py-2 font-bold">{inc.source_ip}</td>
                    <td className="py-2">{inc.confidence_score}%</td>
                    <td className="py-2 capitalize">{inc.status}</td>
                    <td className="py-2 text-[10px] text-slate-400">{new Date(inc.detected_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sign-off footer */}
        <div className="pt-8 border-t border-slate-800 print:border-gray-300 flex items-center justify-between text-xs text-slate-500 print:text-gray-600 font-mono">
          <div>SOC Verification Code: <span className="text-slate-300 print:text-black">AUTH-SOC-2026-OK</span></div>
          <div>Confidential — Internal Security Operations Only</div>
        </div>
      </div>
    </div>
  );
};
