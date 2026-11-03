import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  BookOpen,
  Send,
  AlertCircle,
  CheckCircle2,
  FileText,
  Calendar,
  MessageSquare,
  Award,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

export const ParentPortalTab: React.FC = () => {
  const {
    students,
    attendance,
    assignments,
    alerts,
    selectedDate,
    activeParentStudentId,
    setActiveParentStudentId,
    submitParentExcuse,
    acknowledgeAlert,
  } = useApp();

  const currentStudent = students.find((s) => s.id === activeParentStudentId) || students[0];

  // Absence excuse form state
  const [excuseDate, setExcuseDate] = useState(selectedDate);
  const [excuseCategory, setExcuseCategory] = useState('Medical / Illness');
  const [excuseDetails, setExcuseDetails] = useState('');
  const [excuseSubmittedMsg, setExcuseSubmittedMsg] = useState(false);

  // Parent direct reply to alerts
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [selectedHomeworkForReview, setSelectedHomeworkForReview] = useState<string | null>(null);

  // Student specific records
  const studentAttendance = attendance.filter((a) => a.studentId === currentStudent.id);
  const todayRecord = studentAttendance.find((a) => a.date === selectedDate);
  const studentAlerts = alerts.filter((a) => a.studentId === currentStudent.id);

  const handleSubmitExcuse = (e: React.FormEvent) => {
    e.preventDefault();
    const fullReason = `${excuseCategory}: ${excuseDetails || 'Doctor note attached.'}`;
    submitParentExcuse(currentStudent.id, excuseDate, fullReason);
    setExcuseSubmittedMsg(true);
    setExcuseDetails('');
    setTimeout(() => setExcuseSubmittedMsg(false), 4000);
  };

  const handleAcknowledge = (alertId: string) => {
    const reply = replyTextMap[alertId] || 'Acknowledged by parent.';
    acknowledgeAlert(alertId, reply);
    setReplyTextMap({ ...replyTextMap, [alertId]: '' });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Guardian Identity Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={currentStudent.avatarUrl}
              alt={currentStudent.name}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full object-cover border-2 border-indigo-100 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-indigo-700 mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Parent & Guardian Access Portal</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 font-display">
                {currentStudent.name}
              </h1>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>{currentStudent.grade}</span>
                <span aria-hidden="true">·</span>
                <span>{currentStudent.section}</span>
                <span aria-hidden="true">·</span>
                <span>Roll #{currentStudent.rollNumber}</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-slate-700">Logged in as {currentStudent.parentName}</span>
              </div>
            </div>
          </div>

          {/* Switch Student Dropdown */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <label className="text-xs text-slate-500 whitespace-nowrap">Switch Student:</label>
            <select
              value={activeParentStudentId}
              onChange={(e) => setActiveParentStudentId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.parentName})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Attendance Card & Excuse Form */}
        <div className="space-y-6">
          {/* Real-time Attendance Status Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 font-display mb-3 flex items-center justify-between">
              <span>Attendance Status</span>
              <span className="font-mono text-xs text-slate-500">{selectedDate}</span>
            </h2>

            {/* Today's Status Box */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Today&apos;s Roll Call</div>
                  <div className="text-base font-bold capitalize text-slate-900 mt-0.5 flex items-center gap-1.5">
                    {todayRecord?.status === 'present' ? (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-emerald-700">Present in Class</span>
                      </>
                    ) : todayRecord?.status === 'absent' ? (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span className="text-rose-700">Marked Absent</span>
                      </>
                    ) : todayRecord?.status === 'tardy' ? (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="text-amber-700">Tardy (Late Arrival)</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                        <span className="text-slate-700">Excused Absence</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">Cumulative Rate</div>
                  <div className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                    {currentStudent.overallAttendance}%
                  </div>
                </div>
              </div>

              {todayRecord?.excuseReason && (
                <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-700">Note: </span>
                  {todayRecord.excuseReason}
                </div>
              )}
            </div>

            {/* Attendance Progress Bar */}
            <div className="space-y-1.5 mb-5">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>School Minimum Benchmark</span>
                <span className="font-mono text-emerald-700 font-medium">95.0% Goal</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    currentStudent.overallAttendance >= 95
                      ? 'bg-emerald-600'
                      : currentStudent.overallAttendance >= 90
                      ? 'bg-indigo-600'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${currentStudent.overallAttendance}%` }}
                />
              </div>
            </div>

            {/* Recent 5-Day Attendance Records */}
            <div className="border-t border-slate-100 pt-4">
              <div className="text-xs font-semibold text-slate-800 mb-2">Recent School Days</div>
              <div className="space-y-1.5">
                {studentAttendance.slice(0, 5).map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-50 text-slate-700"
                  >
                    <span className="font-mono text-[11px]">{rec.date}</span>
                    <span
                      className={`capitalize font-medium text-[11px] ${
                        rec.status === 'present'
                          ? 'text-emerald-700'
                          : rec.status === 'absent'
                          ? 'text-rose-700'
                          : rec.status === 'tardy'
                          ? 'text-amber-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Absence Excuse Submission Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 font-display mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-700" />
              <span>Submit Absence Excuse Note</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Provide documentation for missed class to convert an unexcused absence to excused.
            </p>

            <form onSubmit={handleSubmitExcuse} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Absence Date
                </label>
                <input
                  type="date"
                  value={excuseDate}
                  onChange={(e) => setExcuseDate(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reason Category
                </label>
                <select
                  value={excuseCategory}
                  onChange={(e) => setExcuseCategory(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-white font-medium text-slate-800"
                >
                  <option value="Medical / Doctor Visit">Medical / Doctor Visit</option>
                  <option value="Illness at Home">Illness / Fever at Home</option>
                  <option value="Family Bereavement">Family Bereavement / Emergency</option>
                  <option value="Transportation Delay">Transit / Bus Failure</option>
                  <option value="Religious Observance">Religious Observance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Note Details / Clinic Name
                </label>
                <textarea
                  rows={2}
                  value={excuseDetails}
                  onChange={(e) => setExcuseDetails(e.target.value)}
                  placeholder="e.g. Appointment with Dr. Miller at Oakridge Pediatrics. Doctor note signed."
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              {excuseSubmittedMsg && (
                <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excuse successfully recorded and sent to Attendance Office!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold min-h-[44px] flex items-center justify-center transition-colors shadow-xs active:scale-[0.99]"
              >
                Submit Excuse to School
              </button>
            </form>
          </div>
        </div>

        {/* Middle Column: Assignments & Rubrics View */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 font-display">
                  Homework & Assignments
                </h2>
                <p className="text-xs text-slate-500">
                  Track deadlines, questions, and evaluation criteria
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {assignments.length} Total
              </span>
            </div>

            <div className="space-y-3">
              {assignments.map((asg) => {
                const sub = asg.submissions[currentStudent.id] || { status: 'pending' };
                const isSelected = selectedHomeworkForReview === asg.id;

                return (
                  <div
                    key={asg.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-50/30 ring-1 ring-indigo-300'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-indigo-700">{asg.subject}</span>
                      <span
                        className={`font-medium ${
                          sub.status === 'submitted'
                            ? 'text-emerald-700'
                            : sub.status === 'overdue'
                            ? 'text-rose-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {sub.status === 'submitted'
                          ? `✓ Submitted (${sub.score || 35} Pts)`
                          : sub.status === 'overdue'
                          ? '⚠ Overdue'
                          : '⏱ Pending'}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 mb-1">{asg.title}</h3>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mb-2">
                      <span className="font-mono">Due: {asg.dueDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>{asg.questions.length} Questions</span>
                      <span aria-hidden="true">·</span>
                      <span>~{asg.estimatedMinutes}m</span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedHomeworkForReview(isSelected ? null : asg.id)
                      }
                      className="text-xs font-medium text-indigo-700 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <span>{isSelected ? 'Hide Assignment Details' : 'Inspect Questions & Rubric'}</span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90' : ''}`}
                      />
                    </button>

                    {/* Expanded details */}
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-slate-200 text-xs space-y-3">
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                          <span className="font-semibold text-slate-700">Instructions: </span>
                          <span className="text-slate-600">{asg.instructions}</span>
                        </div>

                        {/* Questions snippet */}
                        <div className="space-y-2">
                          <span className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                            Questions ({asg.questions.length}):
                          </span>
                          {asg.questions.map((q, qIdx) => (
                            <div key={qIdx} className="p-2 rounded bg-white border border-slate-200 text-xs">
                              <div className="font-medium text-slate-900 mb-0.5">
                                Q{qIdx + 1}: {q.prompt}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Type: {q.type.toUpperCase()} · {q.points} Points
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Rubrics snippet */}
                        <div className="space-y-1.5">
                          <span className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                            Grading Criteria Rubrics:
                          </span>
                          {asg.rubric.map((r, rIdx) => (
                            <div key={rIdx} className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded">
                              <span className="font-semibold text-slate-800">{r.criteria} ({r.points} Pts): </span>
                              <span>{r.descriptor}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: School Notices & Alert Inbox */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 font-display">
                  School Notifications Inbox
                </h2>
                <p className="text-xs text-slate-500">
                  Notices sent to {currentStudent.parentPhone} and {currentStudent.parentEmail}
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {studentAlerts.length} Messages
              </span>
            </div>

            {studentAlerts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-lg">
                <p className="text-xs font-medium">No alerts for {currentStudent.name}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Attendance is nominal and all assignments are up to date.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {studentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`font-semibold ${
                          alert.type === 'absence'
                            ? 'text-rose-700'
                            : alert.type === 'overdue_homework'
                            ? 'text-amber-700'
                            : 'text-indigo-700'
                        }`}
                      >
                        {alert.type === 'absence'
                          ? 'Absence Alert'
                          : alert.type === 'overdue_homework'
                          ? 'Overdue Homework'
                          : 'Attendance Review'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {alert.createdAt}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 font-mono leading-relaxed bg-white p-2.5 rounded border border-slate-200">
                      {alert.smsMessage}
                    </p>

                    {alert.parentReply ? (
                      <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                        <span className="font-semibold">Your Response: </span>
                        <span>{alert.parentReply}</span>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          value={replyTextMap[alert.id] || ''}
                          onChange={(e) =>
                            setReplyTextMap({
                              ...replyTextMap,
                              [alert.id]: e.target.value,
                            })
                          }
                          placeholder="Type reply or explanation to school..."
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-white"
                        />

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleAcknowledge(alert.id)}
                            className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold min-h-[40px] flex items-center justify-center transition-colors shadow-xs"
                          >
                            ✓ Acknowledge & Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
