import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Bell,
  UserCheck,
  BookOpen,
  LayoutDashboard,
  ShieldCheck,
  ArrowRightLeft,
  Menu,
  X,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentPersona,
    setCurrentPersona,
    alerts,
    students,
    activeParentStudentId,
    setActiveParentStudentId,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pendingAlertsCount = alerts.filter((a) => a.status === 'pending').length;
  const currentStudent = students.find((s) => s.id === activeParentStudentId) || students[0];

  const handleNavClick = (tab: any, persona?: 'teacher' | 'parent') => {
    if (persona) setCurrentPersona(persona);
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14 sm:h-16">
            {/* Zone 1: Wordmark */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-indigo-700 flex items-center justify-center text-white shadow-xs">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('overview', 'teacher');
                }}
                className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap hover:text-indigo-700 transition-colors"
              >
                Smart Attendance
              </a>
            </div>

            {/* Zone 2: Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-medium text-slate-600">
              <button
                onClick={() => handleNavClick('overview', 'teacher')}
                className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'overview' && currentPersona === 'teacher'
                    ? 'text-indigo-700 font-semibold border-b-2 border-indigo-700'
                    : 'hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => handleNavClick('attendance', 'teacher')}
                className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'attendance' && currentPersona === 'teacher'
                    ? 'text-indigo-700 font-semibold border-b-2 border-indigo-700'
                    : 'hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Attendance</span>
              </button>

              <button
                onClick={() => handleNavClick('homework', 'teacher')}
                className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'homework' && currentPersona === 'teacher'
                    ? 'text-indigo-700 font-semibold border-b-2 border-indigo-700'
                    : 'hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Homework Studio</span>
              </button>

              <button
                onClick={() => handleNavClick('notifications', 'teacher')}
                className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 relative ${
                  activeTab === 'notifications' && currentPersona === 'teacher'
                    ? 'text-indigo-700 font-semibold border-b-2 border-indigo-700'
                    : 'hover:text-slate-900'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Parent Alerts</span>
                {pendingAlertsCount > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-rose-100 text-rose-800">
                    {pendingAlertsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNavClick('parent-portal', 'parent')}
                className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 ${
                  currentPersona === 'parent'
                    ? 'text-indigo-700 font-semibold border-b-2 border-indigo-700'
                    : 'hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Parent Portal</span>
              </button>
            </nav>

            {/* Zone 3: Desktop Role Switcher / Quick Action */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              {currentPersona === 'teacher' ? (
                <>
                  <button
                    onClick={() => handleNavClick('attendance', 'teacher')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[36px]"
                    title="Launch QR Attendance Scanner"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>QR Scanner</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('parent-portal', 'parent')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[36px]"
                    title="Switch to Parent Portal view"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                    <span>Switch to Parent View</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={activeParentStudentId}
                    onChange={(e) => setActiveParentStudentId(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 max-w-[190px] truncate"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.parentName})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleNavClick('overview', 'teacher')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[36px] shadow-xs"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Admin Suite</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Header Right Controls (Toggle & Hamburger) */}
            <div className="flex sm:hidden items-center gap-1.5">
              <button
                onClick={() => {
                  if (currentPersona === 'teacher') {
                    setCurrentPersona('parent');
                    setActiveTab('parent-portal');
                  } else {
                    setCurrentPersona('teacher');
                    setActiveTab('overview');
                  }
                }}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-md border min-h-[36px] flex items-center gap-1 transition-colors bg-slate-100 text-slate-800 border-slate-300"
              >
                <ArrowRightLeft className="w-3 h-3 text-slate-500" />
                <span>{currentPersona === 'teacher' ? 'Parent' : 'Admin'}</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Drawer Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 shadow-lg">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Classroom Navigation
            </div>
            <button
              onClick={() => handleNavClick('overview', 'teacher')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2.5 min-h-[44px] ${
                activeTab === 'overview' && currentPersona === 'teacher'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-600" />
              <span>Overview & Dashboard</span>
            </button>

            <button
              onClick={() => handleNavClick('attendance', 'teacher')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2.5 min-h-[44px] ${
                activeTab === 'attendance' && currentPersona === 'teacher'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>Roll Call Attendance</span>
            </button>

            <button
              onClick={() => handleNavClick('homework', 'teacher')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2.5 min-h-[44px] ${
                activeTab === 'homework' && currentPersona === 'teacher'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>AI Homework Studio</span>
            </button>

            <button
              onClick={() => handleNavClick('notifications', 'teacher')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between min-h-[44px] ${
                activeTab === 'notifications' && currentPersona === 'teacher'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-indigo-600" />
                <span>Parent Alert Center</span>
              </div>
              {pendingAlertsCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-rose-100 text-rose-800">
                  {pendingAlertsCount} pending
                </span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('parent-portal', 'parent')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2.5 min-h-[44px] ${
                currentPersona === 'parent'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Parent Portal View</span>
            </button>

            {currentPersona === 'parent' && (
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Viewing Guardian of:
                </label>
                <select
                  value={activeParentStudentId}
                  onChange={(e) => setActiveParentStudentId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.parentName})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Thumb Zone - 44px+ targets) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg pb-safe">
        <div className="grid grid-cols-5 items-center h-16 px-1">
          <button
            onClick={() => handleNavClick('overview', 'teacher')}
            className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
              activeTab === 'overview' && currentPersona === 'teacher'
                ? 'text-indigo-700 font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Overview</span>
          </button>

          <button
            onClick={() => handleNavClick('attendance', 'teacher')}
            className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
              activeTab === 'attendance' && currentPersona === 'teacher'
                ? 'text-indigo-700 font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Attendance</span>
          </button>

          <button
            onClick={() => handleNavClick('homework', 'teacher')}
            className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
              activeTab === 'homework' && currentPersona === 'teacher'
                ? 'text-indigo-700 font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Homework</span>
          </button>

          <button
            onClick={() => handleNavClick('notifications', 'teacher')}
            className={`flex flex-col items-center justify-center min-h-[44px] py-1 relative transition-colors ${
              activeTab === 'notifications' && currentPersona === 'teacher'
                ? 'text-indigo-700 font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className="relative">
              <Bell className="w-5 h-5 mb-0.5" />
              {pendingAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-rose-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center font-mono">
                  {pendingAlertsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-tight">Alerts</span>
          </button>

          <button
            onClick={() => handleNavClick('parent-portal', 'parent')}
            className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
              currentPersona === 'parent'
                ? 'text-indigo-700 font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Parent</span>
          </button>
        </div>
      </div>
    </>
  );
};
