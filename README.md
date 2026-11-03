# EduSync AI — Classroom Attendance, Homework Studio & Parent Alert Center

EduSync AI is a unified, full-stack K-12 classroom management platform built to streamline the three most time-consuming workflows for educators: daily attendance audits, differentiated assignment creation, and urgent parent communications.

The application features full **mobile-first and desktop responsiveness**, powered by **Gemini 3.8 Flash** on the server for curriculum-aligned question generation, rubrics, and automated multi-channel parent alerts (SMS & Email).

---

## Key Features

### 1. One-Tap Attendance Register & Absence Audit
- **Quick Roll Call**: Mark students **Present**, **Absent**, **Tardy**, or **Excused** with instant feedback and a **Mark All Present** bulk action.
- **Absence Auto-Detection**: Flagging a student as absent automatically prepares an official parent alert in the dispatch queue.
- **Excuse Documentation**: Record doctor's notes, medical clinic verifications, transit delays, or family emergency reasons directly against attendance records.
- **Attendance Health Analytics**: Real-time class attendance rate with benchmark tracking (95% state target) and individual student cumulative attendance rates.
- **Mobile Touch Cards**: On mobile screens, attendance rolls display as dedicated touch cards with $\ge 44\text{px}$ thumb-friendly buttons and direct phone dialer links.

### 2. AI Homework & Rubric Studio (Gemini 3.8 Flash)
- **Standards-Aligned Assignment Generator**: Input subject, topic, grade level (6th–10th Grade), difficulty, and custom pedagogical focus.
- **Structured Assessment Generation**:
  - **Multiple Choice Questions**: Concept checks with 4 answer choices.
  - **Short Answer Questions**: Formative conceptual prompts.
  - **Essay & Application Challenges**: Real-world scenarios testing higher-order critical thinking.
- **Standardized Rubric Matrices**: Detailed criteria, point allocations, and mastery descriptors visible to students and parents.
- **Confidential Teacher Answer Keys**: Model solutions and step-by-step scoring guidance for educators.
- **Submission Tracking**: Monitor who has submitted, who is pending, and who is overdue with 1-click overdue alert triggers.

### 3. Parent Alert Center & Dispatch Simulator
- **Interactive Smartphone SMS Simulator**: Realistic mobile viewport displaying live text threads, timestamps, character counts, and an interactive **Simulate Parent Reply** tool.
- **Official Email Client Preview**: Formatted HTML notification preview with school letterhead, urgency indicators, and dispatch tracking.
- **Gemini Tone & Language Rewriter**: Dynamically customize alert messaging between *Supportive & Empathetic*, *Formal Policy*, or *Urgent Escalation* in English, Spanish, or French.
- **Batch Dispatch**: Send individual notices or broadcast all pending alerts to parents in one click.

### 4. Dedicated Parent Portal View
- **Guardian Switcher**: Test the portal from any parent's perspective (e.g. Parveen Zahra for Fatima Zahra, Tariq Ali for Muhammad Ali, Asma Malik for Zainab Malik).
- **Daily Status & Attendance Record**: Inspect today's roll call status and 5-day attendance history.
- **Interactive Excuse Submission**: Parents can submit medical notes or absence reasons that immediately synchronize with the teacher's register as "Excused".
- **Homework & Rubric Inspector**: View upcoming deadlines, instructions, questions, and grading rubrics.
- **Parent Message Inbox**: Receive, acknowledge, and reply to school absence and overdue notices.

### 5. Authentic Pakistani Student Roster
The application comes pre-seeded with 12 diverse students and guardians:
- **Fatima Zahra** (Guardian: Parveen Zahra · `0300-4829104`)
- **Muhammad Ali** (Guardian: Tariq Ali · `0321-8849201`)
- **Ayesha Khan** (Guardian: Shahida Khan · `0333-5591024`)
- **Bilal Ahmed** (Guardian: Farooq Ahmed · `0301-7729184`)
- **Zainab Malik** (Guardian: Asma Malik · `0345-6618290`)
- **Hamza Tariq** (Guardian: Tariq Mahmood · `0312-4418293`)
- **Maryam Siddiqui** (Guardian: Dr. Naila Siddiqui · `0302-9918234`)
- **Usman Qureshi** (Guardian: Salman Qureshi · `0332-1192834`)
- **Hania Farooq** (Guardian: Sadia Farooq · `0308-2283741`)
- **Zaid Hashmi** (Guardian: Kamran Hashmi · `0324-5582910`)
- **Noor Fatima** (Guardian: Bushra Fatima · `0305-6671928`)
- **Saad Rehman** (Guardian: Atif Rehman · `0346-8829104`)

---

## Technical Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        EduSync AI Application                          │
├────────────────────────────────────────────────────────────────────────┤
│  Top Bar (Brand Wordmark · Navigation Links · Role Switcher)           │
│  Fixed Mobile Bottom Tab Bar (Overview · Attendance · Homework · Alerts)│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌────────────────────────────┐    ┌─────────────────────────────────┐ │
│  │     Teacher Dashboard      │    │          Parent Portal          │ │
│  ├────────────────────────────┤    ├─────────────────────────────────┤ │
│  │ • Class Attendance Matrix  │    │ • Student Attendance Health     │ │
│  │ • Mobile Touch Roster      │    │ • Active Homework & Rubrics     │ │
│  │ • AI Homework Generator    │    │ • School Alert Inbox            │ │
│  │ • Assignment Distribution  │    │ • Excuse Submission Form        │ │
│  │ • Notification Dispatch Q  │    │ • Interactive Acknowledgment    │ │
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

### Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion
- **Backend**: Express 4 running with Vite middleware in dev and static asset serving in production (`server.ts`)
- **AI Integration**: `@google/genai` using model `gemini-3.8-flash` via secure server-side proxy endpoints
- **Typography**: `Plus Jakarta Sans` for titles, `DM Sans` for body, `JetBrains Mono` for tabular metrics and timestamps
- **Storage**: Central reactive context with local storage persistence (`edusync_v2_*`)

---

## Getting Started

### Prerequisites
- Node.js $\ge 22$
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (optional for local development, automatically provided in AI Studio):
```bash
cp .env.example .env
# Edit .env and supply GEMINI_API_KEY
```

3. Start development server:
```bash
npm run dev
```
The app will run locally on `http://localhost:3000`.

4. Build and run in production:
```bash
npm run build
npm start
```

---

## API Endpoints

- `POST /api/homework/generate`: Accepts `{ subject, topic, grade, difficulty, instructions }` and returns structured JSON with questions, rubrics, and answer keys.
- `POST /api/alerts/generate`: Accepts `{ studentName, parentName, type, details, tone, language }` and returns formatted SMS text and HTML email drafts.
