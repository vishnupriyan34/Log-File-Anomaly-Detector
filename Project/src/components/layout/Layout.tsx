import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  currentView?: string;
  onViewChange?: (view: string) => void;
  currentTab?: string;
  setCurrentTab?: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentView,
  onViewChange,
  currentTab,
  setCurrentTab,
  children
}) => {
  const activeTab = currentView || currentTab || 'dashboard';
  const handleTabChange = (tab: string) => {
    if (onViewChange) onViewChange(tab);
    if (setCurrentTab) setCurrentTab(tab);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#070B14] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Sidebar */}
      <Sidebar
        currentTab={activeTab}
        setCurrentTab={handleTabChange}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          currentTab={activeTab}
          onUploadClick={() => handleTabChange('upload')}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

