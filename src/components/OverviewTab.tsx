import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  UserX,
  AlertTriangle,
  Clock,
  Sparkles,
  Send,
  ArrowRight,
  BookOpen,
  Calendar,
} from 'lucide-react';

export const OverviewTab: React.FC = () => {
  const {
    students,
    attendance,
    assignments,
    alerts,
    selectedDate,
    setActiveTab,
    setAttendanceStatus,
    dispatchAllPendingAlerts,
  } = useApp();

  const todayRecords = attendance.filter((a) => a.date === selectedDate);
  const presentCount = todayRecords.filter((a) => a.status === 'present').length;
  const absentCount = todayRecords.filter((a) => a.status === 'absent').length;
  const tardyCount = todayRecords.filter((a) => a.status === 'tardy').length;
  const excusedCount = todayRecords.filter((a) => a.status === 'excused').length;

  const totalMarked = todayRecords.length;
  const attendanceRate = totalMarked > 0 ? Math.round(((presentCount + tardyCount) / totalMarked) * 100) : 100;

  // Overdue count across all active assignments
  let overdueSubmissionsCount = 0;
  assignments.forEach((asg) => {
    Object.values(asg.submissions).forEach((sub) => {
      if (sub.status === 'overdue') overdueSubmissionsCount++;
    });
  });

  const pendingAlerts = alerts.filter((a) => a.status === 'pending');
  const absentStudents = students.filter((s) => {
    const record = todayRecords.find((r) => r.studentId === s.id);
    return record?.status === 'absent';
  });

  return (
    <div className="space-y-8">
      {/* Welcome & Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>Farqaleet GGSS</span>
            <span aria-hidden="true">·</span>
            <span>Grade 8, Section A</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{selectedDate}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">
            Daily Overview
          </h1>
        </div>

        {/* Action strip with mobile wrapping */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setActiveTab('attendance')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Take Roll Call</span>
          </button>

          <button
            onClick={() => setActiveTab('homework')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Homework</span>
          </button>

          {pendingAlerts.length > 0 && (
            <button
              onClick={() => {
                dispatchAllPendingAlerts();
                setActiveTab('notifications');
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-medium text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 transition-colors whitespace-nowrap shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Alerts ({pendingAlerts.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stat Cards (Single elevation, hairline borders, tabular figures) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Enrolled Students</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
            {students.length}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="text-emerald-700 font-medium font-mono tabular-nums">{presentCount} present</span>
            <span>·</span>
            <span className="text-amber-700 font-mono tabular-nums">{tardyCount} late</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Today&apos;s Attendance Rate</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-3xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
            {attendanceRate}%
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <span>Target benchmark: 95.0%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Absences Today</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-bold font-mono tracking-tight text-rose-600 tabular-nums">
            {absentCount}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <span>{excusedCount} on leave</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Overdue Submissions</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-bold font-mono tracking-tight text-amber-600 tabular-nums">
            {overdueSubmissionsCount}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <span>Across {assignments.length} assignments</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Workflow Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Real-time Attendance & Absences Spotlight */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 font-display">
                  Today&apos;s Absences & Quick Action
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Students marked absent today are automatically synced with parent alert notifications
                </p>
              </div>
              <button
                onClick={() => setActiveTab('attendance')}
                className="text-xs font-medium text-indigo-700 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                <span>Full Roll Call</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {absentStudents.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg">
                <p className="text-xs font-medium text-emerald-800">No unexcused absences recorded today!</p>
                <p className="text-xs text-slate-500 mt-1">
                  All students in Grade 8 Section A are marked present or on leave.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {absentStudents.map((student) => {
                  const studentAlert = alerts.find(
                    (a) => a.studentId === student.id && a.type === 'absence' && a.occurrenceDate === selectedDate
                  );

                  return (
                    <div
                      key={student.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatarUrl}
                          alt={student.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{student.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-2">
                            <span>Roll {student.rollNumber}</span>
                            <span aria-hidden="true">·</span>
                            <span>Guardian: {student.parentName} ({student.guardianRelation})</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-slate-600">{student.parentPhone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => setAttendanceStatus(student.id, 'present')}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 rounded border border-slate-200 transition-colors"
                          title="Change to Present if student arrived late"
                        >
                          Mark Present
                        </button>
                        <button
                          onClick={() => setActiveTab('notifications')}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors"
                        >
                          <span>{studentAlert?.status === 'dispatched' ? 'Alert Sent' : 'Preview Alert'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Homework Roster */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 font-display">
                  Active Homework & Completion Rates
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated deadline tracker with AI-generated rubrics and question sets
                </p>
              </div>
              <button
                onClick={() => setActiveTab('homework')}
                className="text-xs font-medium text-indigo-700 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                <span>Manage Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {assignments.map((assignment) => {
                const totalStudents = students.length;
                let submitted = 0;
                let overdue = 0;
                Object.values(assignment.submissions).forEach((sub) => {
                  if (sub.status === 'submitted') submitted++;
                  if (sub.status === 'overdue') overdue++;
                });

                const completionPercent = Math.round((submitted / totalStudents) * 100);

                return (
                  <div
                    key={assignment.id}
                    className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors bg-slate-50/50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <div className="text-xs font-medium text-indigo-700">
                          {assignment.subject} · {assignment.grade}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900">{assignment.title}</h3>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        Due: {assignment.dueDate}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                      <span>Completion: {submitted}/{totalStudents} students ({completionPercent}%)</span>
                      {overdue > 0 && (
                        <span className="text-rose-700 font-medium">
                          {overdue} overdue submissions
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-600 h-full transition-all duration-300"
                        style={{ width: `${completionPercent}%` }}
                      />
                      {overdue > 0 && (
                        <div
                          className="bg-rose-500 h-full transition-all duration-300"
                          style={{ width: `${Math.round((overdue / totalStudents) * 100)}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Pending Parent Notifications Queue */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 font-display">
                  Parent Alert Dispatch Queue
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  SMS & Email notices ready for dispatch
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {pendingAlerts.length} Pending
              </span>
            </div>

            {pendingAlerts.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg">
                <p className="text-xs font-medium text-slate-700">All alerts are up to date</p>
                <p className="text-xs text-slate-500 mt-1">
                  Marking absences or overdue work will populate notices here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAlerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 border border-slate-200 rounded-lg hover:border-indigo-200 transition-colors bg-slate-50/50"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-900">{alert.studentName}</span>
                      <span className="text-xs text-rose-700 font-medium">
                        {alert.type === 'absence' ? 'Absence Alert' : 'Overdue Homework'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-2 font-mono">
                      {alert.smsMessage}
                    </p>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 text-slate-500">
                      <span>To: {alert.parentName}</span>
                      <button
                        onClick={() => setActiveTab('notifications')}
                        className="text-indigo-700 hover:text-indigo-800 font-medium"
                      >
                        Preview & Send →
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setActiveTab('notifications')}
                  className="w-full py-2.5 px-4 text-xs font-medium text-center text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 block"
                >
                  Open Notification Center ({pendingAlerts.length})
                </button>
              </div>
            )}
          </div>

          {/* Quick Parent Portal Guide */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-medium mb-1.5">
              <BookOpen className="w-4 h-4" />
              <span>Parent Portal Preview</span>
            </div>
            <h3 className="text-sm font-semibold mb-2">Simulate Parent Engagement</h3>
            <p className="text-xs text-indigo-200 leading-relaxed mb-4">
              Switch roles to view the portal from a guardian&apos;s perspective. Parents can review daily attendance, inspect homework rubrics, and submit doctor absence notes.
            </p>
            <button
              onClick={() => setActiveTab('parent-portal')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-indigo-950 rounded-lg hover:bg-indigo-50 transition-colors shadow-xs"
            >
              <span>Explore Parent Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
