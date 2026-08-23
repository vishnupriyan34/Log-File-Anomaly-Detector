import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, FileText, UploadCloud, Binary, ShieldAlert,
  SearchCode, BarChart3, FileSpreadsheet, Users, History,
  Settings, LogOut, ShieldCheck, UserCheck, Eye, Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpen,
  setIsOpen
}) => {
  const { user, logout, isAdmin } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'logs', label: 'Log Files', icon: FileText },
    { id: 'upload', label: 'Upload Logs', icon: UploadCloud, highlight: true },
    { id: 'analyzer', label: 'Log Analyzer', icon: SearchCode },
    { id: 'anomalies', label: 'Anomalies', icon: ShieldAlert },
    { id: 'investigations', label: 'Investigations', icon: Binary },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    ...(isAdmin ? [
      { id: 'users', label: 'Users', icon: Users, adminOnly: true },
      { id: 'audit', label: 'Audit Logs', icon: History, adminOnly: true }
    ] : []),
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
          <ShieldCheck className="w-3 h-3" /> Admin
        </span>
      );
    }
    if (role === 'analyst') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
          <UserCheck className="w-3 h-3" /> Analyst
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30 uppercase tracking-wider">
        <Eye className="w-3 h-3" /> Viewer
      </span>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        id="main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 ease-in-out glass-card border-r border-cyan-500/20 bg-[#070B14]/95 lg:bg-[#070B14]/70 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* App Title & Branding */}
        <div className="p-5 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-purple-600 text-white shadow-lg shadow-cyan-500/25">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-slate-100 uppercase font-mono leading-tight">
                LOG FILE <span className="text-cyan-400">ANOMALY</span> DETECTOR
              </h1>
              <p className="text-[10px] text-cyan-400/80 font-medium tracking-wide flex items-center gap-1 mt-0.5">
                <Sparkles className="w-2.5 h-2.5" /> AI-Powered SOC
              </p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id || 
              (currentTab === 'logs' && item.id === 'log-files') ||
              (currentTab === 'log-files' && item.id === 'logs') ||
              (currentTab === 'upload' && item.id === 'upload-logs') ||
              (currentTab === 'upload-logs' && item.id === 'upload') ||
              (currentTab === 'analyzer' && item.id === 'log-analyzer') ||
              (currentTab === 'log-analyzer' && item.id === 'analyzer') ||
              (currentTab === 'audit' && item.id === 'audit-logs') ||
              (currentTab === 'audit-logs' && item.id === 'audit');

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.adminOnly && (
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                    Admin
                  </span>
                )}
                {item.highlight && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Logout at Bottom */}
        <div className="p-3 border-t border-cyan-500/20 bg-slate-900/30">
          <div className="flex items-center justify-between p-2 rounded-xl border border-cyan-500/15 bg-slate-900/50">
            <div className="min-w-0 flex-1 pr-2">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {user?.name || 'SOC Officer'}
              </div>
              <div className="mt-1">
                {getRoleBadge(user?.role)}
              </div>
            </div>
            <button
              id="sidebar-logout-btn"
              onClick={logout}
              title="Logout session"
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
