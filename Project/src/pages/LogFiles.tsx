import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { LogFile } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText, Search, Trash2, RefreshCw, Eye, ShieldAlert,
  Play, Download, Plus, AlertCircle, FileCode, CheckCircle2
} from 'lucide-react';

interface LogFilesProps {
  onSelectFileToAnalyze: (fileId: string) => void;
  onViewAnomalies: (fileId: string) => void;
  onNavigateToUpload: () => void;
}

export const LogFiles: React.FC<LogFilesProps> = ({
  onSelectFileToAnalyze,
  onViewAnomalies,
  onNavigateToUpload
}) => {
  const { isAnalyst } = useAuth();
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<LogFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await api.getLogFiles();
      setLogFiles(res.logFiles);
    } catch (err) {
      console.error('Failed to load log files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleReanalyze = async (file: LogFile) => {
    try {
      setAnalyzingId(file.id);
      const res = await api.reanalyzeLogFile(file.id);
      setNotification(`Re-analysis complete for ${file.filename}: ${res.totalAnomalies} threats detected.`);
      await fetchFiles();
    } catch (err: any) {
      alert(err.message || 'Failed to re-analyze log file.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;
    try {
      setDeleting(true);
      await api.deleteLogFile(fileToDelete.id);
      setNotification(`Log file ${fileToDelete.filename} deleted.`);
      setFileToDelete(null);
      await fetchFiles();
    } catch (err: any) {
      alert(err.message || 'Failed to delete file.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredFiles = logFiles.filter(f =>
    f.filename.toLowerCase().includes(search.toLowerCase()) ||
    f.uploaded_by_name?.toLowerCase().includes(search.toLowerCase()) ||
    f.file_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Uploaded Log Files</span>
          </h2>
          <p className="text-xs text-slate-400">
            Repository of parsed log archives, ingestion status and detected threat tallies
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="refresh-log-files-btn"
            onClick={fetchFiles}
            className="p-2 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Refresh files"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {isAnalyst && (
            <button
              id="upload-new-log-btn"
              onClick={onNavigateToUpload}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Log</span>
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-200">
            Dismiss
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          id="search-log-files-input"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter log archives by filename, format, or uploader..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-cyan-400 text-slate-100 text-xs outline-none transition-all"
        />
      </div>

      {/* Log Files Table Card */}
      <div className="rounded-2xl glass-card border border-cyan-500/20 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/50 text-slate-400 font-mono">
                <th className="py-3.5 px-4 font-medium">Log File</th>
                <th className="py-3.5 px-4 font-medium">Format / Size</th>
                <th className="py-3.5 px-4 font-medium">Parsed Entries</th>
                <th className="py-3.5 px-4 font-medium">Threats Found</th>
                <th className="py-3.5 px-4 font-medium">Uploaded By</th>
                <th className="py-3.5 px-4 font-medium">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredFiles.map((file) => (
                <tr key={file.id} id={`log-file-row-${file.id}`} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <FileCode className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100 font-mono">
                          {file.filename}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(file.uploaded_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    <span className="uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[10px] mr-2">
                      .{file.file_type}
                    </span>
                    {(typeof file.file_size === 'number' ? (file.file_size / 1024) : 0).toFixed(1)} KB
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                    {file.total_entries.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4">
                    {file.anomalies_count > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-mono font-bold border border-red-500/30">
                        <ShieldAlert className="w-3 h-3" />
                        {file.anomalies_count} Anomalies
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-mono">0 Clean</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-slate-300">
                    {file.uploaded_by_name || 'System Analyst'}
                  </td>

                  <td className="py-3.5 px-4">
                    <StatusBadge status={file.processing_status} />
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        id={`view-entries-btn-${file.id}`}
                        onClick={() => onSelectFileToAnalyze(file.id)}
                        className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-cyan-500/20 text-cyan-300 transition-colors"
                        title="View Parsed Entries"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        id={`view-anomalies-btn-${file.id}`}
                        onClick={() => onViewAnomalies(file.id)}
                        className="p-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 transition-colors"
                        title="Triage Anomalies"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                      </button>

                      {isAnalyst && (
                        <button
                          id={`reanalyze-btn-${file.id}`}
                          onClick={() => handleReanalyze(file)}
                          disabled={analyzingId === file.id}
                          className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Re-run ML & Rule Detection"
                        >
                          <Play className={`w-3.5 h-3.5 ${analyzingId === file.id ? 'animate-spin text-cyan-400' : ''}`} />
                        </button>
                      )}

                      {isAnalyst && (
                        <button
                          id={`delete-file-btn-${file.id}`}
                          onClick={() => setFileToDelete(file)}
                          className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                          title="Delete File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredFiles.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    {search ? 'No log files matching search query.' : 'No log files uploaded yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        id="delete-log-file-dialog"
        isOpen={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Log File Archive"
        message={`Are you sure you want to permanently delete "${fileToDelete?.filename}"? All associated parsed log entries and detected security anomalies will be erased from the SOC database.`}
        confirmText="Delete File"
        isLoading={deleting}
      />
    </div>
  );
};
