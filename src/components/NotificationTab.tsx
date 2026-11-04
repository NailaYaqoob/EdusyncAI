import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NotificationAlert, AlertStatus, AlertType } from '../types';
import {
  Bell,
  Smartphone,
  Mail,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Check,
} from 'lucide-react';

export const NotificationTab: React.FC = () => {
  const {
    alerts,
    students,
    dispatchAlert,
    dispatchAllPendingAlerts,
    acknowledgeAlert,
    generateAIAlert,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | AlertStatus>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | AlertType>('all');

  // Simulator Modal States
  const [activeSmsModal, setActiveSmsModal] = useState<NotificationAlert | null>(null);
  const [activeEmailModal, setActiveEmailModal] = useState<NotificationAlert | null>(null);
  const [parentReplyInput, setParentReplyInput] = useState('');

  // AI Rewriter Modal States
  const [activeAiRewriter, setActiveAiRewriter] = useState<NotificationAlert | null>(null);
  const [aiTone, setAiTone] = useState<'supportive' | 'formal' | 'urgent'>('supportive');
  const [aiLanguage, setAiLanguage] = useState<'English' | 'Spanish' | 'French'>('English');
  const [isRewriting, setIsRewriting] = useState(false);

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
    if (typeFilter !== 'all' && alert.type !== typeFilter) return false;
    return true;
  });

  const pendingCount = alerts.filter((a) => a.status === 'pending').length;
  const dispatchedCount = alerts.filter((a) => a.status === 'dispatched').length;
  const acknowledgedCount = alerts.filter((a) => a.status === 'acknowledged').length;

  // Handle AI rewrite
  const handleRewrite = async () => {
    if (!activeAiRewriter) return;
    setIsRewriting(true);

    try {
      const generated = await generateAIAlert({
        studentName: activeAiRewriter.studentName,
        parentName: activeAiRewriter.parentName,
        type: activeAiRewriter.type,
        details: {
          date: activeAiRewriter.occurrenceDate,
          homeworkTitle: activeAiRewriter.relatedAssignmentTitle,
        },
        tone: aiTone,
        language: aiLanguage,
      });

      // Update the alert in place
      activeAiRewriter.smsMessage = generated.smsMessage;
      activeAiRewriter.emailSubject = generated.emailSubject;
      activeAiRewriter.emailBody = generated.emailBody;
      activeAiRewriter.actionPrompt = generated.actionPrompt;

      setActiveAiRewriter({ ...activeAiRewriter });
    } catch (err) {
      console.error(err);
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>Automated Parent Communication Center</span>
            <span aria-hidden="true">·</span>
            <span>SMS & Email Multi-Channel Gateway</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
            Absence & Homework Overdue Alerts
          </h1>
        </div>

        {/* Action strip */}
        <div className="flex items-center gap-3">
          {pendingCount > 0 ? (
            <button
              onClick={dispatchAllPendingAlerts}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch All Pending Notices ({pendingCount})</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-800 bg-emerald-50 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>All queue items dispatched</span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-xl border cursor-pointer transition-colors ${
            statusFilter === 'pending'
              ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Pending Dispatch</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 tabular-nums">
            {pendingCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Ready for SMS/Email broadcast</p>
        </div>

        <div
          onClick={() => setStatusFilter('dispatched')}
          className={`p-4 rounded-xl border cursor-pointer transition-colors ${
            statusFilter === 'dispatched'
              ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Dispatched Notices</span>
            <Send className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-700 tabular-nums">
            {dispatchedCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Delivered to parent devices</p>
        </div>

        <div
          onClick={() => setStatusFilter('acknowledged')}
          className={`p-4 rounded-xl border cursor-pointer transition-colors ${
            statusFilter === 'acknowledged'
              ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Parent Acknowledged</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {acknowledgedCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Verified with reply or excuse note</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {(['all', 'pending', 'dispatched', 'acknowledged'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Alert Category:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-600"
          >
            <option value="all">All Alert Types</option>
            <option value="absence">Absence Alerts Only</option>
            <option value="overdue_homework">Overdue Homework Only</option>
            <option value="low_attendance">Low Attendance Only</option>
          </select>
        </div>
      </div>

      {/* Alerts Roster */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-500">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium">No alerts found matching this filter.</p>
            <p className="text-xs text-slate-400 mt-1">
              Mark students absent in the Attendance register or flag overdue assignments to generate new notices.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const student = students.find((s) => s.id === alert.studentId);

            return (
              <div
                key={alert.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Student & Guardian Info */}
                  <div className="flex items-start gap-3.5">
                    <img
                      src={student?.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120'}
                      alt={alert.studentName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-slate-900">{alert.studentName}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span
                          className={`text-xs font-semibold ${
                            alert.type === 'absence'
                              ? 'text-rose-700'
                              : alert.type === 'overdue_homework'
                              ? 'text-amber-700'
                              : 'text-indigo-700'
                          }`}
                        >
                          {alert.type === 'absence'
                            ? 'Daily Absence Notice'
                            : alert.type === 'overdue_homework'
                            ? `Overdue: ${alert.relatedAssignmentTitle || 'Homework'}`
                            : 'Attendance Benchmark Notice'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Recipient: {alert.parentName} ({student?.guardianRelation || 'Guardian'})</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{alert.parentPhone}</span>
                        <span aria-hidden="true">·</span>
                        <span>{alert.parentEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 self-start lg:self-center">
                    {alert.status === 'pending' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-rose-50 text-rose-800 border border-rose-200">
                        <Clock className="w-3 h-3 text-rose-600" />
                        <span>Ready to Dispatch</span>
                      </span>
                    ) : alert.status === 'dispatched' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                        <Send className="w-3 h-3 text-indigo-600" />
                        <span>Dispatched at {alert.dispatchedAt?.split(' ')[1] || '8:00 AM'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Parent Acknowledged</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Message preview snippet */}
                <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>SMS Broadcast Preview</span>
                    <span className="font-mono text-slate-400">{alert.smsMessage.length} / 160 Chars</span>
                  </div>
                  <p className="font-mono text-slate-800 leading-relaxed">{alert.smsMessage}</p>

                  {alert.parentReply && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 text-emerald-900 bg-emerald-50/70 p-2 rounded">
                      <span className="font-semibold text-emerald-800">Parent Response: </span>
                      <span>&ldquo;{alert.parentReply}&rdquo;</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action strip with mobile wrapping */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    Prompt: <span className="text-slate-700 italic">{alert.actionPrompt}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* AI Rewrite Button */}
                    <button
                      onClick={() => setActiveAiRewriter(alert)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[38px] text-xs font-medium text-slate-700 hover:text-indigo-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-xs"
                      title="Adjust tone or language with Gemini"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>AI Rewrite</span>
                    </button>

                    {/* Launch SMS Simulator */}
                    <button
                      onClick={() => {
                        setActiveSmsModal(alert);
                        setParentReplyInput('');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[38px] text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-xs"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>SMS Simulator</span>
                    </button>

                    {/* Launch Email Simulator */}
                    <button
                      onClick={() => setActiveEmailModal(alert)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[38px] text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-600" />
                      <span>Email View</span>
                    </button>

                    {/* Quick Dispatch */}
                    {alert.status === 'pending' && (
                      <button
                        onClick={() => dispatchAlert(alert.id)}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 min-h-[38px] text-xs font-medium text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Now</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 1. Interactive SMS Phone Simulator Modal (Mobile & Web Scaled) */}
      {activeSmsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-[2.5rem] p-2.5 sm:p-3 shadow-2xl border-4 border-slate-800 max-w-[340px] sm:max-w-sm w-full my-auto">
            {/* Phone Screen Canvas */}
            <div className="bg-slate-50 rounded-[2rem] overflow-hidden flex flex-col h-[480px] sm:h-[530px] max-h-[82vh]">
              {/* Phone Header / Status Bar */}
              <div className="bg-slate-100 px-6 py-2 flex items-center justify-between text-[11px] font-mono text-slate-600 border-b border-slate-200">
                <span>08:42</span>
                <div className="w-16 h-3 bg-slate-300 rounded-full mx-auto" />
                <span>5G · 98%</span>
              </div>

              {/* Message Contact Header */}
              <div className="bg-white px-4 py-3 border-b border-slate-200 text-center relative">
                <button
                  onClick={() => setActiveSmsModal(null)}
                  className="absolute left-3 top-3 text-xs font-medium text-indigo-700"
                >
                  ← Close
                </button>
                <div className="w-8 h-8 rounded-full bg-indigo-700 text-white font-bold text-xs mx-auto flex items-center justify-center mb-0.5">
                  FG
                </div>
                <div className="text-xs font-bold text-slate-900">Farqaleet GGSS Alert</div>
                <div className="text-[10px] text-slate-500 font-mono">To: {activeSmsModal.parentPhone}</div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                <div className="text-center text-[10px] text-slate-400 font-mono">
                  Today · {activeSmsModal.createdAt}
                </div>

                {/* Sent SMS Bubble */}
                <div className="flex flex-col items-start max-w-[85%]">
                  <div className="p-3 rounded-2xl rounded-tl-xs bg-slate-200 text-slate-900 font-sans shadow-2xs leading-relaxed">
                    {activeSmsModal.smsMessage}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 ml-1 font-mono">
                    {activeSmsModal.status === 'pending' ? 'Draft' : 'Delivered'}
                  </span>
                </div>

                {/* Parent Reply Bubble (if exists) */}
                {activeSmsModal.parentReply && (
                  <div className="flex flex-col items-end max-w-[85%] ml-auto">
                    <div className="p-3 rounded-2xl rounded-tr-xs bg-indigo-600 text-white font-sans shadow-2xs leading-relaxed">
                      {activeSmsModal.parentReply}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 mr-1 font-mono">
                      {activeSmsModal.acknowledgedAt || 'Replied'}
                    </span>
                  </div>
                )}
              </div>

              {/* Simulator Action Drawer at Bottom of Phone */}
              <div className="p-3 bg-white border-t border-slate-200 space-y-2">
                {activeSmsModal.status === 'pending' ? (
                  <button
                    onClick={() => {
                      dispatchAlert(activeSmsModal.id);
                      activeSmsModal.status = 'dispatched';
                      setActiveSmsModal({ ...activeSmsModal });
                    }}
                    className="w-full py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch SMS Notice Now</span>
                  </button>
                ) : (
                  /* Simulate Parent Reply */
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">
                      Simulate Parent Response:
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={parentReplyInput}
                        onChange={(e) => setParentReplyInput(e.target.value)}
                        placeholder="e.g. Thanks for the heads up, we will turn it in..."
                        className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                      <button
                        onClick={() => {
                          const reply =
                            parentReplyInput ||
                            'Received. Thank you for notifying us. We will submit the medical note shortly.';
                          acknowledgeAlert(activeSmsModal.id, reply);
                          activeSmsModal.parentReply = reply;
                          activeSmsModal.status = 'acknowledged';
                          setActiveSmsModal({ ...activeSmsModal });
                          setParentReplyInput('');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg whitespace-nowrap"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interactive Email Client Modal */}
      {activeEmailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-700" />
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Official Email Notification Preview
                </h3>
              </div>
              <button
                onClick={() => setActiveEmailModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Email Metadata Header */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs space-y-1.5 mb-4">
              <div className="flex items-center">
                <span className="w-16 font-semibold text-slate-500">From:</span>
                <span className="text-slate-800">
                  Farqaleet GGSS Attendance & Academic Services &lt;attendance@farqaleetggss.edu.pk&gt;
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-16 font-semibold text-slate-500">To:</span>
                <span className="text-slate-800">
                  {activeEmailModal.parentName} &lt;{activeEmailModal.parentEmail}&gt;
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-16 font-semibold text-slate-500">Subject:</span>
                <span className="font-semibold text-slate-900">{activeEmailModal.emailSubject}</span>
              </div>
            </div>

            {/* HTML Body Display */}
            <div
              className="p-5 border border-slate-200 rounded-lg bg-white text-xs leading-relaxed text-slate-700 prose prose-sm max-w-none space-y-3"
              dangerouslySetInnerHTML={{ __html: activeEmailModal.emailBody }}
            />

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200">
              <span className="text-xs text-slate-500 font-mono">
                Status: {activeEmailModal.status.toUpperCase()}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveEmailModal(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Close Preview
                </button>

                {activeEmailModal.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => {
                      dispatchAlert(activeEmailModal.id);
                      activeEmailModal.status = 'dispatched';
                      setActiveEmailModal({ ...activeEmailModal });
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Official Email</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. AI Rewriter / Tone Adapter Modal */}
      {activeAiRewriter && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-700" />
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Customize Alert with Gemini AI
                </h3>
              </div>
              <button
                onClick={() => setActiveAiRewriter(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Communication Tone
                  </label>
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value as any)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none bg-white font-medium text-slate-800"
                  >
                    <option value="supportive">Supportive & Empathetic</option>
                    <option value="formal">Formal & Academic Policy</option>
                    <option value="urgent">Urgent Escalation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Parent Language
                  </label>
                  <select
                    value={aiLanguage}
                    onChange={(e) => setAiLanguage(e.target.value as any)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none bg-white font-medium text-slate-800"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="French">French (Français)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Current Draft Preview
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 leading-relaxed">
                  {activeAiRewriter.smsMessage}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveAiRewriter(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Done
                </button>

                <button
                  type="button"
                  onClick={handleRewrite}
                  disabled={isRewriting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors shadow-xs disabled:opacity-60"
                >
                  {isRewriting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Composing with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Regenerate Text ({aiTone})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
