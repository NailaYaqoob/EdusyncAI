# EduSync AI — Classroom Attendance, Homework Studio & Parent Alert Center

A unified K-12 classroom management platform that automates attendance tracking, generates curriculum-aligned homework assignments with rubrics and answer keys using Gemini 3.8 Flash, and simulates real-time automated SMS/Email notification dispatch to parents for absences and overdue work, complete with an interactive Parent Portal.

***

## User Review & Critical Decisions

> [!IMPORTANT]
> The following key decisions were confirmed from your interview responses and have guided the architectural specification:
> - **Educational Environment**: Tailored for **K-12 schools** featuring both an administrative **Teacher Dashboard** and a dedicated **Parent Portal** view.
> - **AI Homework Capability**: Powered by Gemini to generate **custom questions, detailed grading rubrics, and answer keys** aligned with subject, grade level, and difficulty.
> - **Parent Notification Delivery**: Features an **Interactive Notification Dispatch Simulator** supporting realistic **SMS phone simulator** and **Email client modal** previews with live send status tracking and parent acknowledgments.

***

## 1. Overview & Core Concept

EduSync AI addresses the three most time-consuming classroom operations for educators: daily attendance audits, differentiated assignment creation, and urgent parent communications.

- **What It Does**:
  1. **One-Tap Attendance Register**: Enables teachers to mark students Present, Absent, Tardy, or Excused with bulk actions and instant absence tallying.
  2. **AI Homework & Rubric Generator**: Allows teachers to input subject, topic, grade level, and learning objectives. Gemini creates structured assignments complete with question sets, points, student-facing rubrics, and confidential answer keys.
  3. **Automated Notification Engine**: Detects students flagged absent or past assignment due dates. Automatically drafts empathetic, professional parent notices (SMS & Email) and places them in an interactive dispatch queue for teacher review or auto-send.
  4. **Integrated Parent Portal**: Gives parents a transparent window into their child's daily attendance records, active assignments, pending deadlines, and direct excuse submission.

- **Target Personas**:
  - **Teachers**: Manage 20+ students, log daily attendance in under 30 seconds, create weekly homework in clicks, and eliminate manual phone calls to parents.
  - **Parents / Guardians**: Receive immediate, transparent alerts when their child misses class or misses homework, with instant reply and excuse logging.
  - **School Administrators**: Monitor school-wide attendance rates and assignment completion metrics.

***

## 2. User Experience & Visual Design

### Key User Flows

1. **Daily Roll Call & Auto-Alert Queueing**:
   - Teacher opens the **Attendance** tab for "Grade 8 - Section A".
   - Toggles status (Present / Absent / Tardy / Excused) or clicks "Mark All Present" then adjusts the 2 absent students.
   - The system immediately flags the absences and queues customizable SMS & Email alerts in the **Notification Center**.

2. **AI Homework Creation & Distribution**:
   - Teacher opens **Homework Studio** and clicks "+ Create Assignment with AI".
   - Inputs topic (e.g., "Photosynthesis & Cellular Respiration"), Grade (8th), and difficulty.
   - Server-side Gemini endpoint generates a 4-part assignment: 2 Multiple Choice questions, 1 Short Answer, 1 Critical Thinking question, plus an evaluation rubric and teacher answer key.
   - Teacher reviews, edits inline, sets a due date, and assigns it to the class.

3. **Parent Notification Dispatch & Live Simulation**:
   - In the **Notification Center**, the teacher sees real-time alert batches: "Unexcused Absence (2 students)" and "Overdue Homework: Linear Equations (3 students)".
   - Teacher can click "Generate AI Notification Draft" to customize tone (Urgent, Supportive, Formal) and language.
   - Teacher reviews the visual **SMS Simulator** (rendered inside a realistic smartphone viewport) or the **Email Client Preview**.
   - Clicks "Dispatch Notification", triggering animated dispatch feedback and updating the communication audit log.

4. **Parent Portal Experience**:
   - User switches view via the top switcher to **Parent Portal** (e.g., viewing as "Mrs. Vance, mother of Liam Vance").
   - Reviews Liam's real-time attendance rate (94.2%), notices today's absence notification, and can click "Submit Doctor's Note / Excuse".
   - Inspects pending homework assignments, reads the question details and rubrics, and views teacher remarks.

### Visual Identity & Theme

- **Aesthetic Direction**: Contemporary EdTech SaaS with an airy, purposeful layout. High legibility, crisp borders, and zero decorative fluff.
- **Color Palette & Tokens**:
  - Neutral Canvas: Crisp slate white (`#F8FAFC` / `bg-slate-50`) in light mode with deep slate structural card surfaces (`bg-white` and `bg-slate-900` dark mode).
  - Primary Brand Accent: Deep Academy Indigo (`#4338CA` / `bg-indigo-700` and `#6366F1`) representing academic trust and precision.
  - Status Accents (paired with explicit text labels):
    - Present / Completed: Forest Emerald (`#059669` / `text-emerald-700`)
    - Absent / Overdue: Brick Crimson (`#DC2626` / `text-rose-700`)
    - Tardy / Due Soon: Warm Amber (`#D97706` / `text-amber-700`)
    - Excused: Cool Slate (`#475569` / `text-slate-600`)
- **Typography & Scale**:
  - Display & Headings: `Plus Jakarta Sans` (font weight 600/700) for clean modern authority.
  - Body & Form Controls: `DM Sans` or `Plus Jakarta Sans` (14px–16px, 1.5 line height).
  - Numeric Counters & Dates: `tabular-nums font-mono` for all student counts, percentages, timestamps, and point rubrics.
- **Anti-Slop Restraint**:
  - No static pill badges on tags or statuses — quiet unboxed text with `·` bullet separators.
  - No fake compiler tickers, `//` code comments, or fake AI scores.
  - Every button and filter tab has full working event handlers.

***

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Full-Stack Gemini Integration via Server Endpoint**:
  - *Chosen Approach*: Implement an Express `/api/gemini/generate-homework` and `/api/gemini/generate-notification` backend proxy utilizing `@google/genai` with `gemini-3.8-flash` and strict JSON schemas.
  - *Why*: Adheres strictly to security standards by keeping `process.env.GEMINI_API_KEY` exclusively on the server, avoiding browser exposure while providing rapid structured responses.
  - *Fallback*: Intelligent pre-configured curriculum generators provide instant instant feedback if an API key is not connected.

- **Decision 2: Dual Persona Switcher (Teacher Dashboard & Parent Portal)**:
  - *Chosen Approach*: Provide a clean persona switcher in the upper workspace control bar to seamlessly transition between the Teacher Classroom Management Suite and the Parent Portal view.
  - *Why*: Allows immediate end-to-end testing of the notification lifecycle: marking an absence in the teacher view immediately reflects in the parent's alert inbox and notification simulator.

- **Decision 3: Interactive Multi-Channel Dispatch Simulator**:
  - *Chosen Approach*: Render an interactive SMS smartphone frame (with bubble chat, timestamps, and parent reply simulation) and a desktop Email modal with rich formatting.
  - *Why*: Since production SMS/Email gateways require external paid carrier credentials (Twilio/SendGrid), an authentic in-app simulator provides full functional fidelity, showing teachers exactly what parents see on their devices.

- **Decision 4: State Persistence via Reactive Local Storage**:
  - *Chosen Approach*: A centralized state store with local persistence that hydrates rich default class data (18 students, 4 subjects, active homework assignments, and notification logs).
  - *Why*: Enables teachers to modify student statuses, create new assignments, and dispatch notifications with persistent data across page refreshes.

***

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        EduSync AI Application                          │
├────────────────────────────────────────────────────────────────────────┤
│  Top Navigation (Brand Wordmark · Navigation Links · Role Switcher)     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌────────────────────────────┐    ┌─────────────────────────────────┐ │
│  │     Teacher Dashboard      │    │          Parent Portal          │ │
│  ├────────────────────────────┤    ├─────────────────────────────────┤ │
│  │ • Class Attendance Matrix  │    │ • Student Attendance Rate       │ │
│  │ • Daily Roll Call Audit    │    │ • Overdue & Upcoming Homework   │ │
│  │ • AI Homework Generator    │    │ • Assignment Rubrics & Answers  │ │
│  │ • Assignment Distribution  │    │ • School Alert Inbox            │ │
│  │ • Notification Dispatch Q  │    │ • Excuse Submission Form        │ │
│  └─────────────┬──────────────┘    └────────────────┬────────────────┘ │
│                │                                    │                  │
│                ▼                                    ▼                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                 Reactive Classroom State Store                   │  │
│  │  (Students · Attendance Records · Homework · Notification Queue) │  │
│  └─────────────────────────────┬────────────────────────────────────┘  │
│                                │                                       │
│                                ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                 Express Server Backend (/api/*)                  │  │
│  │                                                                  │  │
│  │  POST /api/homework/generate  ──► @google/genai (gemini-3.8-flash)│  │
│  │  POST /api/alerts/generate    ──► (Structured JSON Response)     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Entities & Data Model

- **Student**:
  - `id`: string
  - `name`: string
  - `rollNumber`: string
  - `grade`: string
  - `avatarUrl`: string
  - `parentName`: string
  - `parentPhone`: string
  - `parentEmail`: string
  - `preferredLanguage`: string
  - `attendanceRate`: number

- **AttendanceRecord**:
  - `id`: string
  - `studentId`: string
  - `date`: string (YYYY-MM-DD)
  - `status`: `'present' | 'absent' | 'tardy' | 'excused'`
  - `excuseReason`?: string
  - `markedAt`: string

- **HomeworkAssignment**:
  - `id`: string
  - `title`: string
  - `subject`: string
  - `grade`: string
  - `dueDate`: string
  - `instructions`: string
  - `questions`: Array<{ id: string; prompt: string; type: 'mcq' | 'short' | 'essay'; options?: string[]; points: number }>
  - `rubric`: Array<{ criteria: string; points: number; descriptor: string }>
  - `answerKey`: Array<{ questionId: string; correctAnswer: string; explanation: string }>
  - `submissions`: Record<string, { status: 'submitted' | 'pending' | 'overdue'; score?: number; submittedAt?: string }>

- **NotificationAlert**:
  - `id`: string
  - `studentId`: string
  - `type`: `'absence' | 'overdue_homework' | 'low_attendance'`
  - `urgency`: `'standard' | 'high' | 'urgent'`
  - `channel`: `'sms' | 'email' | 'both'`
  - `status`: `'pending' | 'drafted' | 'dispatched' | 'acknowledged'`
  - `smsMessage`: string
  - `emailSubject`: string
  - `emailBody`: string
  - `dispatchedAt`?: string
  - `acknowledgedAt`?: string
  - `parentResponse`?: string

### Key Sequences & Interactive Handlers

1. **Roll Call Action**: Clicking a status badge updates the student's status for the active date. If marked `'absent'`, an alert is automatically prepared in the dispatch queue.
2. **AI Assignment Generation**: Sends subject, topic, and grade to the server. The model returns structured questions, rubric, and answer key in valid JSON. The teacher can preview the student worksheet, rubric, and answer key before assigning.
3. **Dispatch Simulator**: Allows teachers to test-dispatch alerts. Renders a realistic iOS/Android SMS message thread or a rich HTML email with "Acknowledge" and "Reply" actions that update the live state.
