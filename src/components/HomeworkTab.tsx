import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HomeworkAssignment, HomeworkQuestion, RubricItem, AnswerKeyItem } from '../types';
import {
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  HelpCircle,
  Eye,
  Trash2,
  Users,
  Send,
  Plus,
  Loader2,
  FileCheck,
  Key,
} from 'lucide-react';

export const HomeworkTab: React.FC = () => {
  const {
    assignments,
    students,
    createAssignment,
    deleteAssignment,
    updateSubmissionStatus,
    checkAndQueueOverdueAlerts,
    generateAIHomework,
    setActiveTab,
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'active' | 'overdue'>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<HomeworkAssignment | null>(assignments[0] || null);
  const [detailTab, setDetailTab] = useState<'questions' | 'rubric' | 'answer-key' | 'submissions'>('questions');

  // AI Generator Modal state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [aiForm, setAiForm] = useState({
    subject: 'Life Science',
    topic: 'Photosynthesis and Ecosystems',
    grade: '8th Grade',
    difficulty: 'Standard',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    instructions: 'Include both conceptual questions and real-world application scenarios.',
  });

  const [generatedPreview, setGeneratedPreview] = useState<any | null>(null);
  const [previewTab, setPreviewTab] = useState<'questions' | 'rubric' | 'answer-key'>('questions');

  // Filter assignments
  const today = new Date().toISOString().split('T')[0];
  const filteredAssignments = assignments.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'active') return a.dueDate >= today;
    if (filter === 'overdue') return a.dueDate < today;
    return true;
  });

  // Handle AI generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const result = await generateAIHomework({
        subject: aiForm.subject,
        topic: aiForm.topic,
        grade: aiForm.grade,
        difficulty: aiForm.difficulty,
        instructions: aiForm.instructions,
      });
      setGeneratedPreview(result);
    } catch (err: any) {
      setGenerationError(err.message || 'Failed to generate homework with AI. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndAssign = () => {
    if (!generatedPreview) return;

    const newAssignment = createAssignment({
      title: generatedPreview.title,
      subject: generatedPreview.subject || aiForm.subject,
      grade: generatedPreview.grade || aiForm.grade,
      dueDate: aiForm.dueDate,
      estimatedMinutes: generatedPreview.estimatedMinutes || 30,
      summary: generatedPreview.summary || '',
      instructions: aiForm.instructions || 'Answer all questions with complete academic reasoning.',
      questions: generatedPreview.questions || [],
      rubric: generatedPreview.rubric || [],
      answerKey: generatedPreview.answerKey || [],
    });

    setSelectedAssignment(newAssignment);
    setIsGeneratorOpen(false);
    setGeneratedPreview(null);
  };

  const handleNotifyOverdue = (assignmentId: string) => {
    const queuedCount = checkAndQueueOverdueAlerts(assignmentId);
    setActiveTab('notifications');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>Curriculum & Assignment Studio</span>
            <span aria-hidden="true">·</span>
            <span>Gemini 3.8 Flash Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
            AI Homework Generator & Rubrics
          </h1>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              const queued = checkAndQueueOverdueAlerts();
              if (queued > 0) setActiveTab('notifications');
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shadow-xs"
            title="Scan for overdue submissions and queue alerts"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Scan Overdue</span>
          </button>

          <button
            onClick={() => {
              setIsGeneratorOpen(true);
              setGeneratedPreview(null);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[40px] text-xs font-medium text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Create Assignment with AI</span>
          </button>
        </div>
      </div>

      {/* Mobile View Toggle: List vs Inspector (Visible only on mobile < lg) */}
      <div className="lg:hidden flex items-center p-1 bg-slate-200/70 rounded-lg text-xs font-medium">
        <button
          onClick={() => {
            const listEl = document.getElementById('assignment-list-pane');
            listEl?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex-1 py-1.5 text-center rounded-md bg-white text-slate-900 shadow-xs"
        >
          Assignments ({filteredAssignments.length})
        </button>
        <button
          onClick={() => {
            const detailEl = document.getElementById('assignment-inspector-pane');
            detailEl?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex-1 py-1.5 text-center rounded-md text-slate-600 hover:text-slate-900"
        >
          View Details & Rubric →
        </button>
      </div>

      {/* Main Workspace Split: Assignment List + Assignment Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Assignment Roster & Filter */}
        <div id="assignment-list-pane" className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Class Assignments ({filteredAssignments.length})
            </span>

            {/* Filter segmented buttons */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
              {(['all', 'active', 'overdue'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilter(mode)}
                  className={`px-2.5 py-1 text-xs font-medium rounded capitalize transition-colors ${
                    filter === mode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredAssignments.map((assignment) => {
              const isSelected = selectedAssignment?.id === assignment.id;
              const isOverdue = assignment.dueDate < today;

              let submittedCount = 0;
              let overdueCount = 0;
              Object.values(assignment.submissions).forEach((s) => {
                if (s.status === 'submitted') submittedCount++;
                if (s.status === 'overdue') overdueCount++;
              });

              return (
                <div
                  key={assignment.id}
                  onClick={() => setSelectedAssignment(assignment)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-indigo-700">
                      {assignment.subject} · {assignment.grade}
                    </span>
                    <span
                      className={`font-mono text-[11px] ${
                        isOverdue ? 'text-rose-600 font-medium' : 'text-slate-500'
                      }`}
                    >
                      Due {assignment.dueDate}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 mb-1.5 leading-snug">
                    {assignment.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                    {assignment.summary || assignment.instructions}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      ~{assignment.estimatedMinutes}m
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-slate-400" />
                      {assignment.questions.length} questions
                    </span>
                    <span className="font-mono text-slate-700 font-medium">
                      {submittedCount}/{students.length} submitted
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 cols): Selected Assignment Detailed Inspector */}
        <div id="assignment-inspector-pane" className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {selectedAssignment ? (
            <div>
              {/* Header */}
              <div className="p-6 border-b border-slate-200 bg-slate-50/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-indigo-700">
                    <span>{selectedAssignment.subject}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedAssignment.grade}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-slate-600">Due: {selectedAssignment.dueDate}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleNotifyOverdue(selectedAssignment.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors"
                      title="Draft parent alerts for all unsubmitted students"
                    >
                      <Send className="w-3 h-3 text-amber-700" />
                      <span>Notify Overdue Parents</span>
                    </button>

                    <button
                      onClick={() => deleteAssignment(selectedAssignment.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-slate-900 font-display mb-1">
                  {selectedAssignment.title}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedAssignment.summary}
                </p>
              </div>

              {/* Inspector Sub-Tabs (Clean buttons) */}
              <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 overflow-x-auto text-xs font-medium">
                <button
                  onClick={() => setDetailTab('questions')}
                  className={`pb-2.5 px-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    detailTab === 'questions'
                      ? 'border-indigo-600 text-indigo-700 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Questions & Problems ({selectedAssignment.questions.length})
                </button>

                <button
                  onClick={() => setDetailTab('rubric')}
                  className={`pb-2.5 px-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    detailTab === 'rubric'
                      ? 'border-indigo-600 text-indigo-700 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Grading Rubric Matrix ({selectedAssignment.rubric.length})
                </button>

                <button
                  onClick={() => setDetailTab('answer-key')}
                  className={`pb-2.5 px-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    detailTab === 'answer-key'
                      ? 'border-indigo-600 text-indigo-700 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Teacher Answer Key
                </button>

                <button
                  onClick={() => setDetailTab('submissions')}
                  className={`pb-2.5 px-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    detailTab === 'submissions'
                      ? 'border-indigo-600 text-indigo-700 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Student Submissions ({students.length})
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-6">
                {/* 1. Questions Tab */}
                {detailTab === 'questions' && (
                  <div className="space-y-5">
                    {selectedAssignment.questions.map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">
                            Part {idx + 1}: {q.type.toUpperCase()} Question
                          </span>
                          <span className="font-mono text-indigo-700 font-medium">
                            {q.points} Points
                          </span>
                        </div>

                        <p className="text-xs text-slate-900 font-medium leading-relaxed">
                          {q.prompt}
                        </p>

                        {q.type === 'mcq' && q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {q.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className="px-3 py-1.5 rounded border border-slate-200 bg-white text-xs text-slate-700 flex items-center gap-2"
                              >
                                <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center font-mono text-[10px] text-slate-500 shrink-0">
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {q.type !== 'mcq' && (
                          <div className="p-2.5 rounded border border-dashed border-slate-300 bg-white text-[11px] text-slate-400 font-mono">
                            Student answer input area (text response)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Rubric Tab */}
                {detailTab === 'rubric' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500">
                      Standardized evaluation criteria visible to students and guardians for fair scoring:
                    </p>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                      {selectedAssignment.rubric.map((item, idx) => (
                        <div key={idx} className="p-4 bg-white hover:bg-slate-50/50">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-900 mb-1">
                            <span>{item.criteria}</span>
                            <span className="font-mono text-indigo-700 font-medium">
                              Max {item.points} Pts
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">{item.descriptor}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Answer Key Tab */}
                {detailTab === 'answer-key' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                      <Key className="w-4 h-4 shrink-0 text-amber-700" />
                      <span>
                        Confidential Teacher Answer Key & Scoring Guide (internal instructional reference).
                      </span>
                    </div>

                    <div className="space-y-4">
                      {selectedAssignment.answerKey.map((keyItem, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1.5"
                        >
                          <div className="text-xs font-semibold text-slate-800">
                            Question {idx + 1} Solution
                          </div>
                          <div className="text-xs font-medium text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">
                            {keyItem.correctAnswer}
                          </div>
                          <p className="text-xs text-slate-600 pt-1">
                            <span className="font-semibold text-slate-700">Explanation: </span>
                            {keyItem.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Submissions Tab */}
                {detailTab === 'submissions' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>Roster of 8th Grade Section A</span>
                      <span>Click to toggle submission state</span>
                    </div>

                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                      {students.map((student) => {
                        const sub = selectedAssignment.submissions[student.id] || { status: 'pending' };

                        return (
                          <div
                            key={student.id}
                            className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={student.avatarUrl}
                                alt={student.name}
                                referrerPolicy="no-referrer"
                                className="w-7 h-7 rounded-full object-cover border border-slate-200"
                              />
                              <div>
                                <span className="text-xs font-semibold text-slate-900">{student.name}</span>
                                <div className="text-[11px] text-slate-500">Guardian: {student.parentName}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {sub.status === 'submitted' ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                    Submitted ({sub.score || 35} Pts)
                                  </span>
                                  <button
                                    onClick={() => updateSubmissionStatus(selectedAssignment.id, student.id, 'pending')}
                                    className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                                  >
                                    Reset
                                  </button>
                                </div>
                              ) : sub.status === 'overdue' ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                                    Overdue
                                  </span>
                                  <button
                                    onClick={() => updateSubmissionStatus(selectedAssignment.id, student.id, 'submitted', 32)}
                                    className="px-2 py-0.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                                  >
                                    Mark Done
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => updateSubmissionStatus(selectedAssignment.id, student.id, 'submitted', 35)}
                                    className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                                  >
                                    Mark Submitted
                                  </button>
                                  <button
                                    onClick={() => updateSubmissionStatus(selectedAssignment.id, student.id, 'overdue')}
                                    className="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors"
                                  >
                                    Flag Overdue
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium">Select an assignment to view questions and rubrics</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Assignment Generator Modal */}
      {isGeneratorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-700 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    AI Homework Studio (Gemini 3.8 Flash)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Generates curriculum-aligned questions, evaluation rubrics, and answer keys in seconds
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGeneratorOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {!generatedPreview ? (
              /* Step 1: Input Form */
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Subject
                    </label>
                    <select
                      value={aiForm.subject}
                      onChange={(e) => setAiForm({ ...aiForm, subject: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none bg-white font-medium text-slate-800"
                    >
                      <option value="Life Science">Life Science / Biology</option>
                      <option value="Pre-Algebra & Mathematics">Pre-Algebra & Mathematics</option>
                      <option value="Physical Science & Chemistry">Physical Science & Chemistry</option>
                      <option value="US History & Civics">US History & Civics</option>
                      <option value="English Literature & Composition">English Literature</option>
                      <option value="Computer Science & Logic">Computer Science & Logic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Target Grade
                    </label>
                    <select
                      value={aiForm.grade}
                      onChange={(e) => setAiForm({ ...aiForm, grade: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none bg-white font-medium text-slate-800"
                    >
                      <option value="6th Grade">6th Grade (Middle School)</option>
                      <option value="7th Grade">7th Grade (Middle School)</option>
                      <option value="8th Grade">8th Grade (Oakridge Standard)</option>
                      <option value="9th Grade">9th Grade (High School)</option>
                      <option value="10th Grade">10th Grade (High School)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Lesson Topic / Unit Objective
                  </label>
                  <input
                    type="text"
                    required
                    value={aiForm.topic}
                    onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
                    placeholder="e.g. Newton's Third Law of Motion with Action-Reaction pairs"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={aiForm.difficulty}
                      onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none bg-white font-medium text-slate-800"
                    >
                      <option value="Foundational">Foundational / Review</option>
                      <option value="Standard">Standard Curriculum Aligned</option>
                      <option value="Advanced Honors">Advanced / Honors Rigor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={aiForm.dueDate}
                      onChange={(e) => setAiForm({ ...aiForm, dueDate: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Pedagogical Focus & Custom Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={aiForm.instructions}
                    onChange={(e) => setAiForm({ ...aiForm, instructions: e.target.value })}
                    placeholder="e.g. Include 1 scenario about space exploration, require unit vocabulary..."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                {generationError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    {generationError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsGeneratorOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors shadow-xs disabled:opacity-60"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating Questions with Gemini...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate Assignment</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Generated Result Review */
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Assignment Generated Successfully</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{generatedPreview.title}</h4>
                  <p className="text-xs text-slate-600 mt-1">{generatedPreview.summary}</p>
                </div>

                {/* Sub-tabs for review */}
                <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-medium">
                  <button
                    onClick={() => setPreviewTab('questions')}
                    className={`pb-2 px-1 border-b-2 ${
                      previewTab === 'questions'
                        ? 'border-indigo-600 text-indigo-700 font-semibold'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Questions ({generatedPreview.questions?.length || 0})
                  </button>
                  <button
                    onClick={() => setPreviewTab('rubric')}
                    className={`pb-2 px-1 border-b-2 ${
                      previewTab === 'rubric'
                        ? 'border-indigo-600 text-indigo-700 font-semibold'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Grading Rubrics ({generatedPreview.rubric?.length || 0})
                  </button>
                  <button
                    onClick={() => setPreviewTab('answer-key')}
                    className={`pb-2 px-1 border-b-2 ${
                      previewTab === 'answer-key'
                        ? 'border-indigo-600 text-indigo-700 font-semibold'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Answer Key ({generatedPreview.answerKey?.length || 0})
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-3 p-1">
                  {previewTab === 'questions' && (
                    <div className="space-y-3">
                      {generatedPreview.questions?.map((q: any, i: number) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                          <div className="flex justify-between font-semibold text-slate-800 mb-1">
                            <span>Q{i + 1} ({q.type.toUpperCase()})</span>
                            <span className="font-mono text-indigo-700">{q.points} Pts</span>
                          </div>
                          <p className="text-slate-900 mb-2">{q.prompt}</p>
                          {q.options && (
                            <ul className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                              {q.options.map((opt: string, oIdx: number) => (
                                <li key={oIdx} className="bg-white p-1 rounded border border-slate-200">
                                  {opt}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {previewTab === 'rubric' && (
                    <div className="space-y-2">
                      {generatedPreview.rubric?.map((r: any, i: number) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                          <div className="flex justify-between font-semibold text-slate-900 mb-0.5">
                            <span>{r.criteria}</span>
                            <span className="font-mono text-indigo-700">{r.points} Pts</span>
                          </div>
                          <p className="text-slate-600">{r.descriptor}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {previewTab === 'answer-key' && (
                    <div className="space-y-2">
                      {generatedPreview.answerKey?.map((k: any, i: number) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                          <div className="font-semibold text-emerald-800 mb-0.5">
                            Q{i + 1} Solution: {k.correctAnswer}
                          </div>
                          <p className="text-slate-600 text-[11px]">{k.explanation}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setGeneratedPreview(null)}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    ← Edit Generator Inputs
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsGeneratorOpen(false)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAndAssign}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors shadow-xs"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Save & Assign to Class ({students.length} students)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
