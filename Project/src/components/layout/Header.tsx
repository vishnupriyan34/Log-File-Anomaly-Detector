import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Menu, Moon, Sun, ShieldAlert, Sparkles,
  Upload, Bell, CheckCircle, Search
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onUploadClick: () => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onUploadClick,
  onToggleSidebar
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAnalyst } = useAuth();

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Cybersecurity Operations Center',
      subtitle: 'Real-time telemetry, anomaly surveillance & threat vectors'
    },
    logs: {
      title: 'Log File Management',
      subtitle: 'Repository of uploaded logs and parsing telemetry'
    },
    'log-files': {
      title: 'Log File Management',
      subtitle: 'Repository of uploaded logs and parsing telemetry'
    },
    upload: {
      title: 'Log Ingestion & Analysis',
      subtitle: 'Ingest raw server logs (.log, .csv, .json, .txt) with ML detection'
    },
    'upload-logs': {
      title: 'Log Ingestion & Analysis',
      subtitle: 'Ingest raw server logs (.log, .csv, .json, .txt) with ML detection'
    },
    analyzer: {
      title: 'Log Stream Explorer',
      subtitle: 'Deep query, filter and inspect structured log entries'
    },
    'log-analyzer': {
      title: 'Log Stream Explorer',
      subtitle: 'Deep query, filter and inspect structured log entries'
    },
    anomalies: {
      title: 'Threat Anomalies Triage',
      subtitle: 'Classified security incidents with isolation & rule heuristics'
    },
    investigations: {
      title: 'Incident Investigations Board',
      subtitle: 'SOC analyst investigation logs, mitigation actions and evidence'
    },
    analytics: {
      title: 'Threat Intelligence Analytics',
      subtitle: 'Multi-dimensional temporal distribution & attack trends'
    },
    reports: {
      title: 'SOC Executive Intelligence Reports',
      subtitle: 'Generate printable compliance summaries and forensic exports'
    },
    users: {
      title: 'User & Access Management',
      subtitle: 'RBAC user accounts, security roles and access provisioning'
    },
    audit: {
      title: 'System Audit Trail',
      subtitle: 'Immutable record of user actions and security events'
    },
    'audit-logs': {
      title: 'System Audit Trail',
      subtitle: 'Immutable record of user actions and security events'
    },
    settings: {
      title: 'System & Detection Settings',
      subtitle: 'Machine learning sensitivity, rule thresholds & model settings'
    }
  };

  const currentMeta = tabTitles[currentTab] || {
    title: 'Security Operations',
    subtitle: 'AI-Powered Anomaly Monitoring'
  };

  return (
    <header
      id="main-header"
      className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 py-3.5 glass-card border-b border-cyan-500/20 bg-[#070B14]/80 backdrop-blur-md"
    >
      {/* Left: Mobile Menu & Current Page Title */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-sidebar-toggle"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 lg:hidden transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 dark:text-slate-100 flex items-center gap-2">
            <span>{currentMeta.title}</span>
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 hidden sm:block">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls: Threat Beacon, Upload CTA, Dark/Light Switch */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Real-time SOC Beacon */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-ping" />
          <span className="font-semibold">ENGINE: ACTIVE</span>
        </div>

        {/* Quick Upload CTA for Analysts/Admins */}
        {isAnalyst && (
          <button
            id="header-quick-upload-btn"
            onClick={onUploadClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/25 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Log</span>
          </button>
        )}

        {/* Theme Switch Button in top-right corner as specified */}
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/25 bg-slate-900/50 hover:bg-cyan-500/10 text-xs font-medium text-slate-200 transition-all shadow-sm"
        >
          {theme === 'dark' ? (
            <>
              <Moon className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline font-mono">🌙 Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="hidden md:inline font-mono">☀️ Light Mode</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
