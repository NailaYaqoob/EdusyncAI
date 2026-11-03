import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus } from '../types';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Search,
  Filter,
  ArrowRight,
  Phone,
  Mail,
  UserCheck,
} from 'lucide-react';

export const AttendanceTab: React.FC = () => {
  const {
    students,
    attendance,
    selectedDate,
    setSelectedDate,
    setAttendanceStatus,
    markAllPresent,
    setActiveTab,
    alerts,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | AttendanceStatus>('all');
  const [activeExcuseModal, setActiveExcuseModal] = useState<{ studentId: string; studentName: string; currentReason: string } | null>(null);
  const [excuseInput, setExcuseInput] = useState('');

  // Get records for current date
  const todayRecords = attendance.filter((a) => a.date === selectedDate);
  const presentCount = todayRecords.filter((a) => a.status === 'present').length;
  const absentCount = todayRecords.filter((a) => a.status === 'absent').length;
  const tardyCount = todayRecords.filter((a) => a.status === 'tardy').length;
  const excusedCount = todayRecords.filter((a) => a.status === 'excused').length;

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.parentName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;
    const record = todayRecords.find((r) => r.studentId === student.id);
    const status = record?.status || 'present';
    return status === filterStatus;
  });

  const handleSaveExcuse = () => {
    if (!activeExcuseModal) return;
    setAttendanceStatus(activeExcuseModal.studentId, 'excused', excuseInput);
    setActiveExcuseModal(null);
    setExcuseInput('');
  };

  return (
    <div className="space-y-6">
      {/* Tab Header & Date Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>Roll Call Register</span>
            <span aria-hidden="true">·</span>
            <span>Grade 8, Section A</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{students.length} Total Students</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
            Daily Attendance & Absence Tracking
          </h1>
        </div>

        {/* Date Selector & Primary Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 text-xs shadow-xs">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="font-medium text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={markAllPresent}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Mark All Present</span>
          </button>
        </div>
      </div>

      {/* Absence Notification Notification Callout Banner */}
      {absentCount > 0 && (
        <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-rose-900">
                {absentCount} Unexcused Absence{absentCount > 1 ? 's' : ''} Logged for Today
              </div>
              <div className="text-xs text-rose-700">
                Parent SMS and Email notices have been queued automatically in the dispatch simulator.
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('notifications')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-rose-800 bg-white border border-rose-300 hover:bg-rose-50 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            <span>Review & Dispatch Notices</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setFilterStatus('present')}
          className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
            filterStatus === 'present'
              ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Present</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">{presentCount}</div>
        </div>

        <div
          onClick={() => setFilterStatus('absent')}
          className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
            filterStatus === 'absent'
              ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Absent</span>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 tabular-nums">{absentCount}</div>
        </div>

        <div
          onClick={() => setFilterStatus('tardy')}
          className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
            filterStatus === 'tardy'
              ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Tardy</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 tabular-nums">{tardyCount}</div>
        </div>

        <div
          onClick={() => setFilterStatus('excused')}
          className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
            filterStatus === 'excused'
              ? 'bg-slate-100 border-slate-300 ring-1 ring-slate-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Excused</span>
            <FileText className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-700 tabular-nums">{excusedCount}</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student, roll number, or guardian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:bg-white"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto overflow-x-auto">
            {(['all', 'present', 'absent', 'tardy', 'excused'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize whitespace-nowrap shrink-0 ${
                  filterStatus === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Responsive Attendance Roster: Mobile Card View (< md) + Desktop Table View (>= md) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* 1. Mobile Touch Roster Cards (md:hidden) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filteredStudents.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No students found matching your criteria.
            </div>
          ) : (
            filteredStudents.map((student) => {
              const record = todayRecords.find((r) => r.studentId === student.id);
              const currentStatus: AttendanceStatus = record?.status || 'present';

              return (
                <div key={student.id} className="p-4 space-y-3 bg-white hover:bg-slate-50/50 transition-colors">
                  {/* Top row: Avatar + Name + Cumulative % */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={student.avatarUrl}
                        alt={student.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-sm text-slate-900">{student.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Roll #{student.rollNumber} · {student.grade}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-mono font-bold tabular-nums ${
                          student.overallAttendance >= 95
                            ? 'text-emerald-700'
                            : student.overallAttendance >= 90
                            ? 'text-slate-700'
                            : 'text-rose-600'
                        }`}
                      >
                        {student.overallAttendance}%
                      </span>
                      <div className="text-[10px] text-slate-400">Attendance</div>
                    </div>
                  </div>

                  {/* Guardian details */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                    <span>Guardian: {student.parentName}</span>
                    <a
                      href={`tel:${student.parentPhone}`}
                      className="font-mono text-indigo-700 font-semibold flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{student.parentPhone}</span>
                    </a>
                  </div>

                  {/* 4-way Touch Button Grid (Thumb friendly min 44px) */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setAttendanceStatus(student.id, 'present')}
                      className={`min-h-[44px] rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                        currentStatus === 'present'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 active:bg-slate-200'
                      }`}
                    >
                      Present
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttendanceStatus(student.id, 'absent')}
                      className={`min-h-[44px] rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                        currentStatus === 'absent'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 active:bg-slate-200'
                      }`}
                    >
                      Absent
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttendanceStatus(student.id, 'tardy')}
                      className={`min-h-[44px] rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                        currentStatus === 'tardy'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 active:bg-slate-200'
                      }`}
                    >
                      Tardy
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveExcuseModal({
                          studentId: student.id,
                          studentName: student.name,
                          currentReason: record?.excuseReason || '',
                        });
                        setExcuseInput(record?.excuseReason || '');
                      }}
                      className={`min-h-[44px] rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                        currentStatus === 'excused'
                          ? 'bg-slate-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 active:bg-slate-200'
                      }`}
                    >
                      Excused
                    </button>
                  </div>

                  {/* Bottom info note if excuse or alert exists */}
                  {record?.excuseReason ? (
                    <div className="text-[11px] text-slate-600 italic bg-amber-50/70 p-2 rounded">
                      Note: {record.excuseReason}
                    </div>
                  ) : currentStatus === 'absent' ? (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-rose-700 font-medium text-[11px]">Parent Alert Queued</span>
                      <button
                        onClick={() => setActiveTab('notifications')}
                        className="text-xs font-medium text-indigo-700"
                      >
                        Preview Alert →
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {/* 2. Desktop Table View (hidden on mobile, visible on md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Student & Roll</th>
                <th className="py-3 px-4">Guardian Contact</th>
                <th className="py-3 px-4">Term Attendance</th>
                <th className="py-3 px-4">Status & Action</th>
                <th className="py-3 px-4 text-right">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const record = todayRecords.find((r) => r.studentId === student.id);
                  const currentStatus: AttendanceStatus = record?.status || 'present';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Student info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatarUrl}
                            alt={student.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-slate-900">{student.name}</div>
                            <div className="text-slate-500 font-mono text-[11px]">
                              Roll #{student.rollNumber}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Guardian info */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{student.parentName}</div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {student.parentPhone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {student.parentEmail}
                          </span>
                        </div>
                      </td>

                      {/* Cumulative rate */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-semibold tabular-nums ${
                              student.overallAttendance >= 95
                                ? 'text-emerald-700'
                                : student.overallAttendance >= 90
                                ? 'text-slate-700'
                                : 'text-rose-600'
                            }`}
                          >
                            {student.overallAttendance}%
                          </span>
                          <span className="text-slate-400 text-[11px]">cumulative</span>
                        </div>
                      </td>

                      {/* 4-way Status Selector Control */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 gap-0.5">
                          <button
                            type="button"
                            onClick={() => setAttendanceStatus(student.id, 'present')}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-100'
                            }`}
                          >
                            Present
                          </button>

                          <button
                            type="button"
                            onClick={() => setAttendanceStatus(student.id, 'absent')}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                              currentStatus === 'absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-rose-700 hover:bg-slate-100'
                            }`}
                          >
                            Absent
                          </button>

                          <button
                            type="button"
                            onClick={() => setAttendanceStatus(student.id, 'tardy')}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                              currentStatus === 'tardy'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-amber-700 hover:bg-slate-100'
                            }`}
                          >
                            Tardy
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveExcuseModal({
                                studentId: student.id,
                                studentName: student.name,
                                currentReason: record?.excuseReason || '',
                              });
                              setExcuseInput(record?.excuseReason || '');
                            }}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                              currentStatus === 'excused'
                                ? 'bg-slate-700 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            Excused
                          </button>
                        </div>
                      </td>

                      {/* Excuse Notes / Alert badge */}
                      <td className="py-3.5 px-4 text-right">
                        {record?.excuseReason ? (
                          <span
                            className="text-slate-600 cursor-pointer hover:underline text-[11px]"
                            title={record.excuseReason}
                            onClick={() => {
                              setActiveExcuseModal({
                                studentId: student.id,
                                studentName: student.name,
                                currentReason: record.excuseReason || '',
                              });
                              setExcuseInput(record.excuseReason || '');
                            }}
                          >
                            {record.excuseReason.length > 25
                              ? `${record.excuseReason.slice(0, 25)}...`
                              : record.excuseReason}
                          </span>
                        ) : currentStatus === 'absent' ? (
                          <button
                            onClick={() => setActiveTab('notifications')}
                            className="text-xs text-rose-700 hover:text-rose-800 font-medium inline-flex items-center gap-1"
                          >
                            <span>Alert Queued</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">
                            {record?.markedAt || '08:00 AM'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Excuse Modal Dialog */}
      {activeExcuseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-semibold text-slate-900 mb-1 font-display">
              Log Excuse Note for {activeExcuseModal.studentName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Specify the doctor verification, parent call note, or family reason for the excused absence.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Excuse Reason & Documentation
                </label>
                <textarea
                  rows={3}
                  value={excuseInput}
                  onChange={(e) => setExcuseInput(e.target.value)}
                  placeholder="e.g. Scheduled dental surgery verified by parent phone note..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              {/* Quick Reason Pills */}
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  'Medical / Doctor Appointment',
                  'Flu / Illness at home',
                  'Family Emergency',
                  'School Bus Breakdown',
                  'Approved School Field Trip',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setExcuseInput(reason)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] transition-colors"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setActiveExcuseModal(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveExcuse}
                className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors shadow-xs"
              >
                Save as Excused
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
