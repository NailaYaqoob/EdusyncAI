/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { OverviewTab } from './components/OverviewTab';
import { AttendanceTab } from './components/AttendanceTab';
import { HomeworkTab } from './components/HomeworkTab';
import { NotificationTab } from './components/NotificationTab';
import { ParentPortalTab } from './components/ParentPortalTab';

const MainLayout: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* 3-Zone Navigation Header */}
      <Navbar />

      {/* Main Viewport Content Area with mobile bottom padding */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'attendance' && <AttendanceTab />}
        {activeTab === 'homework' && <HomeworkTab />}
        {activeTab === 'notifications' && <NotificationTab />}
        {activeTab === 'parent-portal' && <ParentPortalTab />}
      </main>

      {/* Clean Footer (Hidden on small mobile screens to keep view clean, shown on md+) */}
      <footer className="hidden md:block bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">EduSync AI</span>
            <span aria-hidden="true">·</span>
            <span>Oakridge Academy K-12 Classroom Management</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Powered by Gemini 3.8 Flash</span>
            <span aria-hidden="true">·</span>
            <span>FERPA Compliant Data Simulation</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
