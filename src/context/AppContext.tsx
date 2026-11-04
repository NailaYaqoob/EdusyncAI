import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Student,
  AttendanceRecord,
  AttendanceStatus,
  HomeworkAssignment,
  NotificationAlert,
  AlertType,
  AlertUrgency,
  AlertChannel,
  QRScanLog,
} from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_ATTENDANCE,
  INITIAL_ASSIGNMENTS,
  INITIAL_ALERTS,
  TODAY_STR,
} from '../data/mockData';

interface AppContextType {
  students: Student[];
  attendance: AttendanceRecord[];
  assignments: HomeworkAssignment[];
  alerts: NotificationAlert[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  activeTab: 'overview' | 'attendance' | 'homework' | 'notifications' | 'parent-portal';
  setActiveTab: (tab: 'overview' | 'attendance' | 'homework' | 'notifications' | 'parent-portal') => void;
  currentPersona: 'teacher' | 'parent';
  setCurrentPersona: (persona: 'teacher' | 'parent') => void;
  activeParentStudentId: string;
  setActiveParentStudentId: (studentId: string) => void;

  // QR Attendance
  qrScanLogs: QRScanLog[];
  processQRScan: (payload: string, scannerDevice?: string) => { success: boolean; student?: Student; isDuplicate?: boolean; message: string; timestamp: string };
  clearQRLogs: () => void;

  // Actions
  setAttendanceStatus: (studentId: string, status: AttendanceStatus, excuseReason?: string) => void;
  markAllPresent: () => void;
  createAssignment: (newAssignment: Omit<HomeworkAssignment, 'id' | 'assignedDate' | 'submissions'>) => HomeworkAssignment;
  updateSubmissionStatus: (assignmentId: string, studentId: string, status: 'submitted' | 'pending' | 'overdue', score?: number, feedback?: string) => void;
  checkAndQueueOverdueAlerts: (assignmentId?: string) => number;
  dispatchAlert: (alertId: string) => void;
  dispatchAllPendingAlerts: () => void;
  acknowledgeAlert: (alertId: string, reply?: string) => void;
  submitParentExcuse: (studentId: string, date: string, reason: string) => void;
  deleteAssignment: (assignmentId: string) => void;

  // AI Helpers (via server endpoints)
  generateAIHomework: (params: { subject: string; topic: string; grade: string; difficulty: string; instructions?: string }) => Promise<any>;
  generateAIAlert: (params: { studentName: string; parentName: string; type: AlertType; details: any; tone?: string; language?: string }) => Promise<any>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('edusync_v2_students');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0 && parsed[0].name.includes('Fatima')) return parsed;
      } catch (e) {
        // use default
      }
    }
    return INITIAL_STUDENTS;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('edusync_v2_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [assignments, setAssignments] = useState<HomeworkAssignment[]>(() => {
    const saved = localStorage.getItem('edusync_v2_assignments');
    return saved ? JSON.parse(saved) : INITIAL_ASSIGNMENTS;
  });

  const [alerts, setAlerts] = useState<NotificationAlert[]>(() => {
    const saved = localStorage.getItem('edusync_v2_alerts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0 && !JSON.stringify(parsed).includes('Oakridge')) {
          return parsed;
        }
      } catch (e) {
        // use default
      }
    }
    return INITIAL_ALERTS;
  });

  const [selectedDate, setSelectedDate] = useState<string>(TODAY_STR);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'homework' | 'notifications' | 'parent-portal'>('overview');
  const [currentPersona, setCurrentPersona] = useState<'teacher' | 'parent'>('teacher');
  const [activeParentStudentId, setActiveParentStudentId] = useState<string>('std-1');

  const INITIAL_QR_LOGS: QRScanLog[] = [
    {
      id: 'qr-log-1',
      studentId: 'std-1',
      studentName: 'Fatima Zahra',
      rollNumber: 'GGSS-8A-01',
      grade: 'Grade 8',
      section: 'A',
      timestamp: '08:02 AM',
      date: TODAY_STR,
      status: 'success',
      scannerDevice: 'Main Gate Scanner #1',
      message: 'Identity Verified: Checked in on time',
    },
    {
      id: 'qr-log-2',
      studentId: 'std-2',
      studentName: 'Ayesha Malik',
      rollNumber: 'GGSS-8A-02',
      grade: 'Grade 8',
      section: 'A',
      timestamp: '08:05 AM',
      date: TODAY_STR,
      status: 'success',
      scannerDevice: 'Main Gate Scanner #1',
      message: 'Identity Verified: Checked in on time',
    },
    {
      id: 'qr-log-3',
      studentId: 'std-3',
      studentName: 'Zainab Bibi',
      rollNumber: 'GGSS-8A-03',
      grade: 'Grade 8',
      section: 'A',
      timestamp: '08:09 AM',
      date: TODAY_STR,
      status: 'success',
      scannerDevice: 'Classroom Tablet Scanner',
      message: 'Identity Verified: Checked in on time',
    },
  ];

  const [qrScanLogs, setQrScanLogs] = useState<QRScanLog[]>(() => {
    const saved = localStorage.getItem('farqaleet_qr_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_QR_LOGS;
  });


  const handleSetActiveTab = (tab: 'overview' | 'attendance' | 'homework' | 'notifications' | 'parent-portal') => {
    setActiveTab(tab);
    if (tab === 'parent-portal') {
      setCurrentPersona('parent');
    } else {
      setCurrentPersona('teacher');
    }
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('edusync_v2_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('edusync_v2_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('edusync_v2_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('edusync_v2_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('farqaleet_qr_logs', JSON.stringify(qrScanLogs));
  }, [qrScanLogs]);


  // Recalculate student attendance when records change
  const updateStudentAttendanceRate = (studentId: string, newRecords: AttendanceRecord[]) => {
    const studentRecords = newRecords.filter((r) => r.studentId === studentId);
    if (studentRecords.length === 0) return;
    const presentCount = studentRecords.filter((r) => r.status === 'present' || r.status === 'tardy').length;
    const rate = Math.round((presentCount / studentRecords.length) * 1000) / 10;

    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, overallAttendance: rate } : s))
    );
  };

  // Set Attendance for a student on current selectedDate
  const setAttendanceStatus = (studentId: string, status: AttendanceStatus, excuseReason?: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const existingIdx = attendance.findIndex(
      (a) => a.studentId === studentId && a.date === selectedDate
    );

    let updatedAttendance: AttendanceRecord[];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (existingIdx >= 0) {
      updatedAttendance = [...attendance];
      updatedAttendance[existingIdx] = {
        ...updatedAttendance[existingIdx],
        status,
        excuseReason: excuseReason || updatedAttendance[existingIdx].excuseReason,
        markedAt: nowTime,
      };
    } else {
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}-${studentId}`,
        studentId,
        date: selectedDate,
        status,
        excuseReason,
        markedAt: nowTime,
      };
      updatedAttendance = [newRecord, ...attendance];
    }

    setAttendance(updatedAttendance);
    updateStudentAttendanceRate(studentId, updatedAttendance);

    // If marked absent, automatically draft or update a parent alert
    if (status === 'absent') {
      const existingAlert = alerts.find(
        (a) => a.studentId === studentId && a.type === 'absence' && a.occurrenceDate === selectedDate
      );

      if (!existingAlert) {
        const newAlert: NotificationAlert = {
          id: `alt-${Date.now()}-${studentId}`,
          studentId: student.id,
          studentName: student.name,
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail,
          type: 'absence',
          urgency: 'high',
          channel: 'both',
          status: 'pending',
          smsMessage: `Farqaleet GGSS Alert: ${student.name} was marked absent today (${selectedDate}). Please submit an excuse note via the Parent Portal or call 042-35892104.`,
          emailSubject: `Daily Attendance Notice: ${student.name} Absent Today (${selectedDate})`,
          emailBody: `<p>Dear ${student.parentName},</p>
<p>Our morning attendance records indicate that <strong>${student.name}</strong> was marked absent from ${student.grade} (${student.section}) today, <strong>${selectedDate}</strong>.</p>
<p>Daily school attendance is vital for learning continuity. If this absence is excused (medical appointment, illness, or emergency), please submit an excuse note directly through your <strong>Parent Portal</strong> or reply to this message.</p>
<p>If you believe this record is in error, please contact our attendance coordinator at 042-35892104.</p>
<p>Sincerely,<br>Farqaleet GGSS Attendance Office</p>`,
          actionPrompt: 'Submit excuse note via Parent Portal or contact attendance office',
          occurrenceDate: selectedDate,
          createdAt: `${selectedDate} ${nowTime}`,
        };

        setAlerts((prev) => [newAlert, ...prev]);
      }
    }
  };

  // Mark all students present for selectedDate
  const markAllPresent = () => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = [...attendance];

    students.forEach((student) => {
      const idx = updated.findIndex((a) => a.studentId === student.id && a.date === selectedDate);
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], status: 'present', markedAt: nowTime };
      } else {
        updated.push({
          id: `att-${Date.now()}-${student.id}`,
          studentId: student.id,
          date: selectedDate,
          status: 'present',
          markedAt: nowTime,
        });
      }
    });

    setAttendance(updated);
    students.forEach((s) => updateStudentAttendanceRate(s.id, updated));
  };

  // Create new homework assignment
  const createAssignment = (newAssignmentData: Omit<HomeworkAssignment, 'id' | 'assignedDate' | 'submissions'>): HomeworkAssignment => {
    const initialSubmissions: Record<string, { status: 'pending' }> = {};
    students.forEach((s) => {
      initialSubmissions[s.id] = { status: 'pending' };
    });

    const newAssignment: HomeworkAssignment = {
      ...newAssignmentData,
      id: `hw-${Date.now()}`,
      assignedDate: TODAY_STR,
      submissions: initialSubmissions,
    };

    setAssignments((prev) => [newAssignment, ...prev]);
    return newAssignment;
  };

  const deleteAssignment = (assignmentId: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
  };

  // QR Code Processing
  const processQRScan = (payload: string, scannerDevice: string = 'Digital Scanner') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let targetStudentId = '';
    let targetRoll = '';

    try {
      const data = JSON.parse(payload);
      targetStudentId = data.studentId || data.id || '';
      targetRoll = data.rollNumber || data.roll || '';
    } catch {
      const trimmed = payload.trim();
      targetStudentId = trimmed;
      targetRoll = trimmed;
    }

    const student = students.find(
      (s) =>
        (targetStudentId && s.id.toLowerCase() === targetStudentId.toLowerCase()) ||
        (targetRoll && s.rollNumber.toLowerCase() === targetRoll.toLowerCase()) ||
        payload.toLowerCase().includes(s.id.toLowerCase()) ||
        payload.toLowerCase().includes(s.rollNumber.toLowerCase())
    );

    if (!student) {
      const invalidLog: QRScanLog = {
        id: `qr-err-${Date.now()}`,
        studentId: 'unknown',
        studentName: 'Unrecognized Badge',
        rollNumber: 'N/A',
        grade: 'N/A',
        section: 'N/A',
        timestamp: timeStr,
        date: selectedDate,
        status: 'invalid',
        scannerDevice,
        message: `Unrecognized badge data: "${payload.slice(0, 32)}"`,
      };
      setQrScanLogs((prev) => [invalidLog, ...prev]);
      return {
        success: false,
        message: 'Invalid badge! QR code does not belong to any enrolled student at Farqaleet GGSS.',
        timestamp: timeStr,
      };
    }

    // Check if student already marked present today
    const existingIdx = attendance.findIndex(
      (a) => a.studentId === student.id && a.date === selectedDate
    );

    if (existingIdx >= 0 && attendance[existingIdx].status === 'present') {
      const existingCheckIn = attendance[existingIdx].checkInTime || attendance[existingIdx].markedAt;
      const dupLog: QRScanLog = {
        id: `qr-dup-${Date.now()}`,
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        grade: student.grade,
        section: student.section,
        timestamp: timeStr,
        date: selectedDate,
        status: 'duplicate',
        scannerDevice,
        message: `Already checked in today at ${existingCheckIn}`,
      };
      setQrScanLogs((prev) => [dupLog, ...prev]);
      return {
        success: true,
        isDuplicate: true,
        student,
        message: `${student.name} (${student.rollNumber}) is ALREADY marked Present today (Check-in: ${existingCheckIn}). Duplicate scan recorded.`,
        timestamp: timeStr,
      };
    }

    // Mark as present
    const updated = [...attendance];
    const newRecord: AttendanceRecord = {
      id: existingIdx >= 0 ? attendance[existingIdx].id : `att-${Date.now()}-${student.id}`,
      studentId: student.id,
      date: selectedDate,
      status: 'present',
      markedAt: timeStr,
      checkInTime: timeStr,
      scanMethod: 'qr',
    };

    if (existingIdx >= 0) {
      updated[existingIdx] = newRecord;
    } else {
      updated.unshift(newRecord);
    }

    setAttendance(updated);
    updateStudentAttendanceRate(student.id, updated);

    // If an absence alert was queued, remove it
    setAlerts((prev) =>
      prev.filter((a) => !(a.studentId === student.id && a.type === 'absence' && a.occurrenceDate === selectedDate))
    );

    const successLog: QRScanLog = {
      id: `qr-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      grade: student.grade,
      section: student.section,
      timestamp: timeStr,
      date: selectedDate,
      status: 'success',
      scannerDevice,
      message: `Verified: Checked in and marked Present`,
    };

    setQrScanLogs((prev) => [successLog, ...prev]);

    return {
      success: true,
      isDuplicate: false,
      student,
      message: `Verified! ${student.name} (${student.rollNumber}) marked Present at ${timeStr}.`,
      timestamp: timeStr,
    };
  };

  const clearQRLogs = () => {
    setQrScanLogs([]);
    localStorage.removeItem('farqaleet_qr_logs');
  };


  // Update a student's submission status
  const updateSubmissionStatus = (
    assignmentId: string,
    studentId: string,
    status: 'submitted' | 'pending' | 'overdue',
    score?: number,
    feedback?: string
  ) => {
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id !== assignmentId) return a;
        const currentSub = a.submissions[studentId] || { status: 'pending' };
        return {
          ...a,
          submissions: {
            ...a.submissions,
            [studentId]: {
              ...currentSub,
              status,
              score: score !== undefined ? score : currentSub.score,
              feedback: feedback !== undefined ? feedback : currentSub.feedback,
              submittedAt: status === 'submitted' ? new Date().toISOString().replace('T', ' ').slice(0, 16) : currentSub.submittedAt,
            },
          },
        };
      })
    );

    // If marked overdue, queue parent alert
    if (status === 'overdue') {
      const student = students.find((s) => s.id === studentId);
      const assignment = assignments.find((a) => a.id === assignmentId);
      if (student && assignment) {
        const existingAlert = alerts.find(
          (al) => al.studentId === studentId && al.type === 'overdue_homework' && al.relatedAssignmentTitle === assignment.title
        );

        if (!existingAlert) {
          const newAlert: NotificationAlert = {
            id: `alt-${Date.now()}-${studentId}`,
            studentId,
            studentName: student.name,
            parentName: student.parentName,
            parentPhone: student.parentPhone,
            parentEmail: student.parentEmail,
            type: 'overdue_homework',
            urgency: 'standard',
            channel: 'both',
            status: 'pending',
            smsMessage: `Farqaleet GGSS Alert: ${student.name}'s assignment "${assignment.title}" is overdue. Please check Parent Portal.`,
            emailSubject: `Academic Notice: Overdue Homework for ${student.name}`,
            emailBody: `<p>Dear ${student.parentName},</p>
<p>We are writing to inform you that <strong>${student.name}</strong> has not submitted the required assignment for <strong>${assignment.subject}</strong>:</p>
<ul>
  <li><strong>Title:</strong> ${assignment.title}</li>
  <li><strong>Due Date:</strong> ${assignment.dueDate} (Overdue)</li>
  <li><strong>Estimated Time:</strong> ${assignment.estimatedMinutes} mins</li>
</ul>
<p>Late work submitted within 48 hours is eligible for partial credit. Please log into the Parent Portal to view the full prompt and rubrics.</p>
<p>Warm regards,<br>Farqaleet GGSS Academic Department</p>`,
            actionPrompt: 'Review missing assignment in the Parent Portal with student',
            relatedAssignmentTitle: assignment.title,
            occurrenceDate: assignment.dueDate,
            createdAt: `${TODAY_STR} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          };
          setAlerts((prev) => [newAlert, ...prev]);
        }
      }
    }
  };

  // Check and queue alerts for overdue assignments
  const checkAndQueueOverdueAlerts = (assignmentId?: string): number => {
    let queuedCount = 0;
    const targetAssignments = assignmentId
      ? assignments.filter((a) => a.id === assignmentId)
      : assignments;

    const todayDate = new Date(TODAY_STR);

    targetAssignments.forEach((assignment) => {
      const dueDate = new Date(assignment.dueDate);
      const isPastDue = dueDate < todayDate;

      if (isPastDue) {
        Object.entries(assignment.submissions).forEach(([studentId, sub]) => {
          if (sub.status === 'pending' || sub.status === 'overdue') {
            const student = students.find((s) => s.id === studentId);
            if (!student) return;

            const alreadyExists = alerts.some(
              (al) => al.studentId === studentId && al.type === 'overdue_homework' && al.relatedAssignmentTitle === assignment.title
            );

            if (!alreadyExists) {
              const newAlert: NotificationAlert = {
                id: `alt-${Date.now()}-${studentId}`,
                studentId,
                studentName: student.name,
                parentName: student.parentName,
                parentPhone: student.parentPhone,
                parentEmail: student.parentEmail,
                type: 'overdue_homework',
                urgency: 'standard',
                channel: 'both',
                status: 'pending',
                smsMessage: `Farqaleet GGSS Alert: ${student.name}'s assignment "${assignment.title}" is overdue. Please check Parent Portal.`,
                emailSubject: `Academic Notice: Overdue Homework for ${student.name}`,
                emailBody: `<p>Dear ${student.parentName},</p>
<p>We are writing to let you know that <strong>${student.name}</strong> has not yet submitted their assignment: <strong>${assignment.title}</strong> (due ${assignment.dueDate}).</p>
<p>Please check the Parent Portal to review questions and encourage submission tonight.</p>
<p>Warm regards,<br>Farqaleet GGSS</p>`,
                actionPrompt: 'Review missing assignment in the Parent Portal with student',
                relatedAssignmentTitle: assignment.title,
                occurrenceDate: assignment.dueDate,
                createdAt: `${TODAY_STR} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              };

              setAlerts((prev) => [newAlert, ...prev]);
              queuedCount++;
            }
          }
        });
      }
    });

    return queuedCount;
  };

  // Dispatch individual alert
  const dispatchAlert = (alertId: string) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'dispatched', dispatchedAt: `${TODAY_STR} ${nowTime}` } : a))
    );
  };

  // Dispatch all pending alerts
  const dispatchAllPendingAlerts = () => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAlerts((prev) =>
      prev.map((a) => (a.status === 'pending' ? { ...a, status: 'dispatched', dispatchedAt: `${TODAY_STR} ${nowTime}` } : a))
    );
  };

  // Acknowledge alert by parent
  const acknowledgeAlert = (alertId: string, reply?: string) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'acknowledged',
              acknowledgedAt: `${TODAY_STR} ${nowTime}`,
              parentReply: reply || a.parentReply,
            }
          : a
      )
    );
  };

  // Parent submits an excuse note
  const submitParentExcuse = (studentId: string, date: string, reason: string) => {
    // Update attendance record to 'excused'
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const existingIdx = attendance.findIndex((a) => a.studentId === studentId && a.date === date);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let updatedAttendance: AttendanceRecord[];
    if (existingIdx >= 0) {
      updatedAttendance = [...attendance];
      updatedAttendance[existingIdx] = {
        ...updatedAttendance[existingIdx],
        status: 'excused',
        excuseReason: reason,
        markedAt: nowTime,
      };
    } else {
      updatedAttendance = [
        {
          id: `att-${Date.now()}-${studentId}`,
          studentId,
          date,
          status: 'excused',
          excuseReason: reason,
          markedAt: nowTime,
        },
        ...attendance,
      ];
    }
    setAttendance(updatedAttendance);
    updateStudentAttendanceRate(studentId, updatedAttendance);

    // Update any matching absence alerts to 'acknowledged' with the parent reply
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.studentId === studentId && a.type === 'absence' && a.occurrenceDate === date) {
          return {
            ...a,
            status: 'acknowledged',
            acknowledgedAt: `${TODAY_STR} ${nowTime}`,
            parentReply: `Excuse submitted: ${reason}`,
          };
        }
        return a;
      })
    );
  };

  // Server API caller: Homework Generation
  const generateAIHomework = async (params: {
    subject: string;
    topic: string;
    grade: string;
    difficulty: string;
    instructions?: string;
  }) => {
    try {
      const res = await fetch('/api/homework/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate homework');
      }
      return data.assignment;
    } catch (err) {
      console.error('Error invoking /api/homework/generate:', err);
      throw err;
    }
  };

  // Server API caller: Notification Generation
  const generateAIAlert = async (params: {
    studentName: string;
    parentName: string;
    type: AlertType;
    details: any;
    tone?: string;
    language?: string;
  }) => {
    try {
      const res = await fetch('/api/alerts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate parent alert');
      }
      return data.alert;
    } catch (err) {
      console.error('Error invoking /api/alerts/generate:', err);
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
        students,
        attendance,
        assignments,
        alerts,
        selectedDate,
        setSelectedDate,
        activeTab,
        setActiveTab: handleSetActiveTab,
        currentPersona,
        setCurrentPersona,
        activeParentStudentId,
        setActiveParentStudentId,
        qrScanLogs,
        processQRScan,
        clearQRLogs,
        setAttendanceStatus,
        markAllPresent,
        createAssignment,
        updateSubmissionStatus,
        checkAndQueueOverdueAlerts,
        dispatchAlert,
        dispatchAllPendingAlerts,
        acknowledgeAlert,
        submitParentExcuse,
        deleteAssignment,
        generateAIHomework,
        generateAIAlert,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
