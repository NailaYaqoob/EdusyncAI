export type AttendanceStatus = 'present' | 'absent' | 'tardy' | 'excused';

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  grade: string;
  section: string;
  avatarUrl: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  guardianRelation: string;
  preferredLanguage: string;
  overallAttendance: number; // percentage e.g. 94.5
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  excuseReason?: string;
  markedAt: string;
}

export interface HomeworkQuestion {
  id: string;
  prompt: string;
  type: 'mcq' | 'short' | 'essay';
  options?: string[];
  points: number;
}

export interface RubricItem {
  criteria: string;
  points: number;
  descriptor: string;
}

export interface AnswerKeyItem {
  questionId: string;
  correctAnswer: string;
  explanation: string;
}

export interface HomeworkSubmission {
  studentId?: string;
  status: 'submitted' | 'pending' | 'overdue';
  submittedAt?: string;
  score?: number;
  maxScore?: number;
  feedback?: string;
}

export interface HomeworkAssignment {
  id: string;
  title: string;
  subject: string;
  grade: string;
  assignedDate: string;
  dueDate: string;
  estimatedMinutes: number;
  summary: string;
  instructions: string;
  questions: HomeworkQuestion[];
  rubric: RubricItem[];
  answerKey: AnswerKeyItem[];
  submissions: Record<string, HomeworkSubmission>;
}

export type AlertType = 'absence' | 'overdue_homework' | 'low_attendance';
export type AlertUrgency = 'standard' | 'high' | 'urgent';
export type AlertChannel = 'sms' | 'email' | 'both';
export type AlertStatus = 'pending' | 'dispatched' | 'acknowledged';

export interface NotificationAlert {
  id: string;
  studentId: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  type: AlertType;
  urgency: AlertUrgency;
  channel: AlertChannel;
  status: AlertStatus;
  smsMessage: string;
  emailSubject: string;
  emailBody: string;
  actionPrompt: string;
  relatedAssignmentTitle?: string;
  occurrenceDate: string;
  createdAt: string;
  dispatchedAt?: string;
  acknowledgedAt?: string;
  parentReply?: string;
}
