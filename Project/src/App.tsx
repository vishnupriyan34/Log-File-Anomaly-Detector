import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { UploadLogs } from './pages/UploadLogs';
import { LogFiles } from './pages/LogFiles';
import { LogAnalyzer } from './pages/LogAnalyzer';
import { Anomalies } from './pages/Anomalies';
import { Investigations } from './pages/Investigations';
import { Analytics } from './pages/Analytics';
import { Reports } from './pages/Reports';
import { UsersManagement } from './pages/UsersManagement';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';
import { TechBackground } from './components/common/TechBackground';

type AuthView = 'login' | 'signup' | 'forgot-password';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [authView, setAuthView] = useState<AuthView>('login');
  const [signupRole, setSignupRole] = useState<'admin' | 'analyst' | 'viewer'>('admin');

  // Nav state helpers
  const [activeLogFileId, setActiveLogFileId] = useState<string | undefined>(undefined);
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);
  const [anomalyFilterParams, setAnomalyFilterParams] = useState<{ severity?: string; ip?: string } | undefined>(undefined);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center relative overflow-hidden">
        <TechBackground />
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_#06b6d4]" />
          <div className="font-mono text-cyan-300 text-xs tracking-widest uppercase animate-pulse">
            INITIALIZING SOC TELEMETRY & ML PIPELINE...
          </div>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Auth screens
  if (!user) {
    if (authView === 'signup') {
      return (
        <Signup
          initialRole={signupRole}
          onSwitchToLogin={() => setAuthView('login')}
          onNavigateToLogin={() => setAuthView('login')}
        />
      );
    }
    if (authView === 'forgot-password') {
      return (
        <ForgotPassword
          onSwitchToLogin={() => setAuthView('login')}
          onNavigateToLogin={() => setAuthView('login')}
        />
      );
    }
    return (
      <Login
        onSwitchToSignup={() => {
          setSignupRole('admin');
          setAuthView('signup');
        }}
        onSwitchToForgot={() => setAuthView('forgot-password')}
        onNavigateToSignup={() => {
          setSignupRole('admin');
          setAuthView('signup');
        }}
        onNavigateToForgotPassword={() => setAuthView('forgot-password')}
        onNavigateToSignupWithRole={(role) => {
          setSignupRole(role);
          setAuthView('signup');
        }}
      />
    );
  }

  // Handlers for cross-page navigation
  const handleInspectAnomaly = (anomalyId: string) => {
    setSelectedAnomalyId(anomalyId);
    setCurrentView('anomalies');
  };

  const handleSelectFileToAnalyze = (fileId: string) => {
    setActiveLogFileId(fileId);
    setCurrentView('analyzer');
  };

  const handleViewAnomaliesForFile = (fileId: string) => {
    setAnomalyFilterParams(undefined);
    setCurrentView('anomalies');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigateToUpload={() => setCurrentView('upload')}
            onNavigateToLogs={() => setCurrentView('logs')}
            onNavigateToAnomalies={(severity) => {
              setAnomalyFilterParams(severity ? { severity } : undefined);
              setCurrentView('anomalies');
            }}
            onInspectAnomaly={handleInspectAnomaly}
            onSelectAnomaly={handleInspectAnomaly}
            onNavigateToView={(view) => setCurrentView(view)}
          />
        );

      case 'upload':
      case 'upload-logs':
        return (
          <UploadLogs
            onUploadSuccess={(fileId) => {
              setActiveLogFileId(fileId);
              setCurrentView('analyzer');
            }}
            onNavigateToAnomalies={(fileId) => {
              setCurrentView('anomalies');
            }}
          />
        );

      case 'logs':
      case 'log-files':
        return (
          <LogFiles
            onSelectFileToAnalyze={handleSelectFileToAnalyze}
            onViewAnomalies={handleViewAnomaliesForFile}
            onNavigateToUpload={() => setCurrentView('upload')}
          />
        );

      case 'analyzer':
      case 'log-analyzer':
        return (
          <LogAnalyzer
            initialFileId={activeLogFileId}
            onInspectAnomaly={handleInspectAnomaly}
          />
        );

      case 'anomalies':
        return (
          <Anomalies
            initialFilter={anomalyFilterParams}
            selectedAnomalyId={selectedAnomalyId}
            onSelectAnomaly={(id) => setSelectedAnomalyId(id)}
          />
        );

      case 'investigations':
        return (
          <Investigations
            onSelectAnomaly={handleInspectAnomaly}
          />
        );

      case 'analytics':
        return <Analytics />;

      case 'reports':
        return <Reports />;

      case 'users':
        return <UsersManagement />;

      case 'audit':
      case 'audit-logs':
        return <AuditLogs />;

      case 'settings':
        return <Settings />;

      default:
        return (
          <Dashboard
            onNavigateToUpload={() => setCurrentView('upload')}
            onNavigateToLogs={() => setCurrentView('logs')}
            onNavigateToAnomalies={() => setCurrentView('anomalies')}
            onInspectAnomaly={handleInspectAnomaly}
          />
        );
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={(view) => {
      setSelectedAnomalyId(null);
      setCurrentView(view);
    }}>
      {renderContent()}
    </Layout>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
