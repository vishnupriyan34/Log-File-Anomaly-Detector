import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { LogFile } from '../types';
import {
  UploadCloud, FileCode, CheckCircle2, AlertCircle,
  FileText, Sparkles, Database, ShieldAlert, Play, ArrowRight,
  RefreshCw, Terminal, Layers
} from 'lucide-react';

interface UploadLogsProps {
  onUploadSuccess: (logFileId: string) => void;
  onNavigateToAnomalies: (logFileId?: string) => void;
}

export const UploadLogs: React.FC<UploadLogsProps> = ({
  onUploadSuccess,
  onNavigateToAnomalies
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text' | 'samples'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [pastedFilename, setPastedFilename] = useState('manual_input.log');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    logFile: LogFile;
    totalEntries: number;
    anomaliesDetected: number;
    formatDetected?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const validExts = ['.log', '.txt', '.csv', '.json'];
    const hasValidExt = validExts.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setError('Please upload a valid log file (.log, .txt, .csv, or .json).');
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(25);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev < 85 ? prev + 15 : prev));
      }, 150);

      const res = await api.uploadLog(selectedFile);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to upload and parse log file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadText = async () => {
    if (!rawText.trim()) {
      setError('Please paste log contents into the editor.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(40);

      const res = await api.uploadLogContent(rawText, pastedFilename);
      setUploadProgress(100);
      setUploadResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to parse pasted log content.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSample = async (sampleType: 'sqli_attack' | 'ssh_bruteforce' | 'cloud_json' | 'microservice_500') => {
    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(50);
      const res = await api.loadSampleLog(sampleType);
      setUploadProgress(100);
      setUploadResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load sample dataset.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-cyan-400" />
          <span>Log Ingestion & Anomaly Detection</span>
        </h2>
        <p className="text-xs text-slate-400">
          Upload server logs (.log, .txt, .csv, .json) to execute our multi-layer Rule & Isolation Forest ML detector
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          id="upload-tab-file"
          onClick={() => { setActiveTab('file'); setUploadResult(null); setError(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'file'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>File Upload (.log, .csv, .json)</span>
        </button>

        <button
          id="upload-tab-samples"
          onClick={() => { setActiveTab('samples'); setUploadResult(null); setError(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'samples'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Sample Attack Datasets</span>
        </button>

        <button
          id="upload-tab-text"
          onClick={() => { setActiveTab('text'); setUploadResult(null); setError(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'text'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Paste Raw Text</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Card after Upload */}
      {uploadResult && (
        <div
          id="upload-success-result-card"
          className="rounded-2xl border border-cyan-500/40 bg-cyan-950/30 p-6 shadow-2xl backdrop-blur-xl animate-fadeIn space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 font-mono">
                  LOG INGESTION & PIPELINE COMPLETE
                </h3>
                <p className="text-xs text-cyan-300">
                  File: <span className="font-semibold">{uploadResult.logFile.filename}</span>
                </p>
              </div>
            </div>
            <button
              id="upload-another-file-btn"
              onClick={() => { setUploadResult(null); setSelectedFile(null); }}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Upload Another
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 font-mono">Total Entries</div>
              <div className="text-xl font-bold font-mono text-slate-100">{uploadResult.totalEntries}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 font-mono">Anomalies Flagged</div>
              <div className="text-xl font-bold font-mono text-purple-400">{uploadResult.anomaliesDetected}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 font-mono">Parser Engine</div>
              <div className="text-sm font-bold text-cyan-400 font-mono mt-1">{uploadResult.formatDetected || 'Autodetect'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 font-mono">Model Isolation</div>
              <div className="text-sm font-bold text-emerald-400 font-mono mt-1">IsoForest active</div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              id="triage-detected-anomalies-btn"
              onClick={() => onNavigateToAnomalies(uploadResult.logFile.id)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-cyan-500/25 flex items-center gap-2"
            >
              <span>View & Triage Anomalies ({uploadResult.anomaliesDetected})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="inspect-log-file-entries-btn"
              onClick={() => onUploadSuccess(uploadResult.logFile.id)}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold"
            >
              Inspect Log Entries
            </button>
          </div>
        </div>
      )}

      {/* Tab 1: Drag & Drop File Upload */}
      {activeTab === 'file' && !uploadResult && (
        <div className="space-y-4">
          <div
            id="drag-and-drop-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-3xl border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
                : 'border-slate-700/80 hover:border-cyan-500/40 bg-slate-900/40 hover:bg-slate-900/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".log,.txt,.csv,.json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelected(e.target.files[0]);
                }
              }}
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <UploadCloud className="w-10 h-10 animate-bounce" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {selectedFile ? selectedFile.name : 'Drag and drop your server log file here, or click to browse'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supported formats: Common/Combined Web Logs (.log), Syslog (.log/.txt), CSV (.csv), JSON Telemetry (.json) up to 25MB
                </p>
              </div>

              {selectedFile && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono border border-cyan-500/30">
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{(typeof selectedFile.size === 'number' ? (selectedFile.size / 1024) : 0).toFixed(1)} KB</span>
                </div>
              )}
            </div>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="p-4 rounded-2xl glass-card border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
                <span>PARSING & RUNNING ISOLATION FOREST ML...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-600 transition-all duration-300 shadow-[0_0_12px_#06b6d4]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {selectedFile && !isUploading && (
            <button
              id="start-upload-button"
              onClick={handleUploadFile}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Analyze & Detect Anomalies in {selectedFile.name}</span>
            </button>
          )}
        </div>
      )}

      {/* Tab 2: Sample Attack Datasets */}
      {activeTab === 'samples' && !uploadResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl glass-card border border-red-500/20 hover:border-red-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25">
                  Web Attack Simulation
                </span>
                <span className="text-xs font-mono text-slate-400">Apache HTTP</span>
              </div>
              <h4 className="text-sm font-bold text-slate-100">
                SQL Injection & Automated Scanner (sqlmap)
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Simulates UNION SELECT injection attacks, DROP TABLE exploits, and sleep-based time blind SQL attacks targeting user credentials.
              </p>
            </div>
            <button
              id="load-sample-sqli-btn"
              onClick={() => handleLoadSample('sqli_attack')}
              disabled={isUploading}
              className="mt-4 w-full py-2.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Load SQLi Dataset</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl glass-card border border-orange-500/20 hover:border-orange-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25">
                  Auth Brute Force
                </span>
                <span className="text-xs font-mono text-slate-400">Linux Syslog</span>
              </div>
              <h4 className="text-sm font-bold text-slate-100">
                SSH Password Spray & Credential Stuffing
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Burst of failed SSH root/admin logins from adversary botnet IP followed by unusual account privilege access.
              </p>
            </div>
            <button
              id="load-sample-ssh-btn"
              onClick={() => handleLoadSample('ssh_bruteforce')}
              disabled={isUploading}
              className="mt-4 w-full py-2.5 rounded-xl bg-orange-600/80 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Load SSH Brute Force Dataset</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl glass-card border border-purple-500/20 hover:border-purple-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/25">
                  Cloud Security Telemetry
                </span>
                <span className="text-xs font-mono text-slate-400">AWS / JSON</span>
              </div>
              <h4 className="text-sm font-bold text-slate-100">
                Privilege Escalation & Directory Traversal
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Structured cloud security events containing Nikto traversal attempts (`/../../.env`) and unauthorized role grant calls.
              </p>
            </div>
            <button
              id="load-sample-cloud-btn"
              onClick={() => handleLoadSample('cloud_json')}
              disabled={isUploading}
              className="mt-4 w-full py-2.5 rounded-xl bg-purple-600/80 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Load Cloud JSON Dataset</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl glass-card border border-cyan-500/20 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
                  Service Outage & Spikes
                </span>
                <span className="text-xs font-mono text-slate-400">Microservice CSV</span>
              </div>
              <h4 className="text-sm font-bold text-slate-100">
                500 Internal Error Cascade & Latency Anomalies
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Database connection exhaustion and 500 error spikes with high latency times analyzed by Isolation Forest.
              </p>
            </div>
            <button
              id="load-sample-microservice-btn"
              onClick={() => handleLoadSample('microservice_500')}
              disabled={isUploading}
              className="mt-4 w-full py-2.5 rounded-xl bg-cyan-600/80 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Load Microservice CSV Dataset</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Paste Raw Text */}
      {activeTab === 'text' && !uploadResult && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-slate-300">
              Virtual File Name:
            </label>
            <input
              id="pasted-filename-input"
              type="text"
              value={pastedFilename}
              onChange={(e) => setPastedFilename(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono outline-none"
            />
          </div>

          <div>
            <textarea
              id="raw-log-textarea"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={10}
              placeholder={`Paste any standard log lines here, e.g.:
192.168.1.100 - admin [23/Aug/2026:10:00:00 +0000] "GET /api/v1/health HTTP/1.1" 200 45 "-" "Mozilla/5.0"
194.26.29.112 - - [23/Aug/2026:10:01:00 +0000] "GET /products?id=1%20UNION%20SELECT%20null,password%20FROM%20users-- HTTP/1.1" 200 1420 "-" "sqlmap/1.6"
Aug 23 01:10:02 gateway sshd[14201]: Failed password for root from 185.220.101.5 port 42310 ssh2`}
              className="w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-700 text-xs text-slate-200 font-mono focus:border-cyan-400 outline-none leading-relaxed"
            />
          </div>

          <button
            id="submit-pasted-log-btn"
            onClick={handleUploadText}
            disabled={isUploading || !rawText.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Process & Analyze Pasted Logs</span>
          </button>
        </div>
      )}
    </div>
  );
};
