import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize Google GenAI client if API key is provided
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Endpoint: Generate structured AI Homework Assignment
app.post('/api/homework/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      subject = 'General Science',
      topic = 'Ecosystems and Biodiversity',
      grade = '8th Grade',
      difficulty = 'Standard',
      instructions = '',
    } = req.body;

    if (aiClient) {
      const prompt = `You are an expert K-12 curriculum designer. Create a comprehensive, standards-aligned homework assignment on:
Topic: "${topic}"
Subject: "${subject}"
Target Grade: "${grade}"
Target Difficulty: "${difficulty}"
Special Teacher Instructions: "${instructions || 'Ensure questions evaluate both conceptual understanding and practical application'}"

Output valid JSON matching this structure:
{
  "title": "Creative, engaging assignment title",
  "subject": "${subject}",
  "grade": "${grade}",
  "estimatedMinutes": 35,
  "summary": "2-sentence overview of learning outcomes",
  "questions": [
    {
      "id": "q1",
      "prompt": "Clear, engaging question prompt",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "points": 5
    },
    {
      "id": "q2",
      "prompt": "Second question prompt",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "points": 5
    },
    {
      "id": "q3",
      "prompt": "Short response conceptual question",
      "type": "short",
      "points": 10
    },
    {
      "id": "q4",
      "prompt": "Application or critical thinking question",
      "type": "essay",
      "points": 15
    }
  ],
  "rubric": [
    {
      "criteria": "Accuracy & Understanding",
      "points": 15,
      "descriptor": "Demonstrates mastery of core concepts with factual accuracy"
    },
    {
      "criteria": "Critical Analysis & Reasoning",
      "points": 10,
      "descriptor": "Provides logical justifications and connects ideas effectively"
    },
    {
      "criteria": "Clarity & Academic Expression",
      "points": 10,
      "descriptor": "Clear scientific or academic terminology and organized writing"
    }
  ],
  "answerKey": [
    {
      "questionId": "q1",
      "correctAnswer": "The correct option text",
      "explanation": "Concise pedagogical explanation of why this answer is correct"
    },
    {
      "questionId": "q2",
      "correctAnswer": "The correct option text",
      "explanation": "Explanation of the correct choice"
    },
    {
      "questionId": "q3",
      "correctAnswer": "Key expected elements in student response",
      "explanation": "Key terms and concepts student should mention"
    },
    {
      "questionId": "q4",
      "correctAnswer": "Model high-scoring response framework",
      "explanation": "Scoring guide for evaluating full points"
    }
  ]
}`;

      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                subject: { type: Type.STRING },
                grade: { type: Type.STRING },
                estimatedMinutes: { type: Type.INTEGER },
                summary: { type: Type.STRING },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      prompt: { type: Type.STRING },
                      type: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      points: { type: Type.INTEGER },
                    },
                  },
                },
                rubric: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      criteria: { type: Type.STRING },
                      points: { type: Type.INTEGER },
                      descriptor: { type: Type.STRING },
                    },
                  },
                },
                answerKey: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      questionId: { type: Type.STRING },
                      correctAnswer: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                    },
                  },
                },
              },
            },
          },
        });

        const raw = response.text?.trim() || '{}';
        const parsed = JSON.parse(raw);
        if (parsed.title && parsed.questions?.length) {
          res.json({ success: true, assignment: parsed });
          return;
        }
      } catch (geminiErr: any) {
        console.warn('Gemini API call encountered temporary issue, activating fallback generator:', geminiErr?.message || geminiErr);
      }
    }

    // High-quality curricular fallback if no API key is attached or temporary service spike
    const fallbackAssignment = {
      title: `${topic} Investigation`,
      subject,
      grade,
      estimatedMinutes: 30,
      summary: `Practice assignment exploring fundamental mechanisms and applications of ${topic}.`,
      questions: [
        {
          id: 'q1',
          prompt: `Which of the following best defines the primary principle behind ${topic}?`,
          type: 'mcq',
          options: [
            `The systematic equilibrium governing ${topic}`,
            `An isolated reaction independent of external energy`,
            `The random dissipation of structural components`,
            `A static state with zero exchange of material`,
          ],
          points: 5,
        },
        {
          id: 'q2',
          prompt: `In standard real-world conditions, what is the primary limiting factor in ${topic}?`,
          type: 'mcq',
          options: [
            'Available energy concentration and substrate throughput',
            'Arbitrary ambient noise and pressure variations',
            'Uniform gravitational pull across all media',
            'Infrared reflectivity of inert surrounding boundaries',
          ],
          points: 5,
        },
        {
          id: 'q3',
          prompt: `Explain how changes in environmental variables directly influence the stability of ${topic}. (2-3 sentences)`,
          type: 'short',
          points: 10,
        },
        {
          id: 'q4',
          prompt: `Design a hypothetical real-life scenario where understanding ${topic} solves a community or technological challenge. Outline your proposed approach.`,
          type: 'essay',
          points: 15,
        },
      ],
      rubric: [
        {
          criteria: 'Conceptual Understanding',
          points: 15,
          descriptor: 'Accurately explains core scientific principles with appropriate terminology.',
        },
        {
          criteria: 'Application & Reasoning',
          points: 10,
          descriptor: 'Applies concepts logically to practical problem-solving scenarios.',
        },
        {
          criteria: 'Structure & Academic Clarity',
          points: 10,
          descriptor: 'Well-organized response adhering to academic formatting standards.',
        },
      ],
      answerKey: [
        {
          questionId: 'q1',
          correctAnswer: `The systematic equilibrium governing ${topic}`,
          explanation: `This option correctly represents the core governing model for ${topic}.`,
        },
        {
          questionId: 'q2',
          correctAnswer: 'Available energy concentration and substrate throughput',
          explanation: 'Resource availability and rate constraints are the definitive limiting factor.',
        },
        {
          questionId: 'q3',
          correctAnswer: 'Environmental shifts perturb equilibrium states, altering throughput and efficiency.',
          explanation: 'Full credit requires mentioning variable perturbation and resulting equilibrium impact.',
        },
        {
          questionId: 'q4',
          correctAnswer: 'Student outlines realistic challenge, specifies mechanism, and provides measurable solution.',
          explanation: 'Evaluate based on relevance, plausibility, and integration of unit vocabulary.',
        },
      ],
    };

    res.json({ success: true, assignment: fallbackAssignment });
  } catch (error: any) {
    console.error('Homework Generation Error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to generate homework',
    });
  }
});

// Endpoint: Generate custom AI Parent Notification
app.post('/api/alerts/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      studentName = 'Student',
      parentName = 'Parent/Guardian',
      type = 'absence',
      details = {},
      tone = 'supportive',
      language = 'English',
    } = req.body;

    const { date, homeworkTitle, dueDate, attendanceRate, consecutiveDays } = details;

    if (aiClient) {
      const prompt = `You are a school communications specialist composing an official parent alert for Oakridge Academy K-12.
Student: ${studentName}
Parent: ${parentName}
Alert Type: ${type} (Options: absence, overdue_homework, low_attendance)
Context Details:
- Date of occurrence: ${date || 'Today'}
- Homework Title (if applicable): ${homeworkTitle || 'N/A'}
- Due Date (if applicable): ${dueDate || 'N/A'}
- Attendance Rate (if applicable): ${attendanceRate ? attendanceRate + '%' : 'N/A'}
- Consecutive Days Missed: ${consecutiveDays || 1}

Communication Tone: ${tone} (e.g., supportive, formal, or urgent)
Target Language: ${language}

Generate a JSON object with:
1. smsMessage: A punchy SMS text message under 160 characters (must include student first name, reason, and school contact/action).
2. emailSubject: A clear, professional email subject line with student name and category.
3. emailBody: A warm, clear, 2-paragraph email formatted with HTML (<p>, <strong>, <ul>, etc.) providing context, school policy, and concrete next steps for the guardian.
4. actionPrompt: A single line summary of what the parent should do next (e.g. "Reply with excuse note or submit via Parent Portal").`;

      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                smsMessage: { type: Type.STRING },
                emailSubject: { type: Type.STRING },
                emailBody: { type: Type.STRING },
                actionPrompt: { type: Type.STRING },
              },
            },
          },
        });

        const raw = response.text?.trim() || '{}';
        const parsed = JSON.parse(raw);
        if (parsed.smsMessage && parsed.emailSubject) {
          res.json({ success: true, alert: parsed });
          return;
        }
      } catch (geminiErr: any) {
        console.warn('Gemini Alert generator encountered issue, activating fallback:', geminiErr?.message || geminiErr);
      }
    }

    // High quality deterministic fallback
    let smsMessage = '';
    let emailSubject = '';
    let emailBody = '';
    let actionPrompt = '';

    if (type === 'absence') {
      smsMessage = `School Alert: ${studentName} was marked absent today (${date || 'today'}). Please submit an excuse note on Portal or call 042-35892104.`;
      emailSubject = `Attendance Notice: ${studentName} Absent on ${date || 'Today'}`;
      emailBody = `<p>Dear ${parentName},</p>
<p>We are reaching out to inform you that <strong>${studentName}</strong> was marked absent from their classes today, <strong>${date || 'today'}</strong>. Consistent attendance is essential for academic growth.</p>
<p>If this absence is excused (illness, doctor visit, or family emergency), please log into your <strong>Parent Portal</strong> to submit a note or reply directly to this notification. If you believe this record is an error, please contact the main office.</p>
<p>Warm regards,<br>Attendance Administration<br>Quaid Public Academy</p>`;
      actionPrompt = 'Submit doctor note or absence explanation via Parent Portal';
    } else if (type === 'overdue_homework') {
      smsMessage = `School Alert: ${studentName}'s assignment "${homeworkTitle || 'Homework'}" is overdue. Please ensure completion tonight.`;
      emailSubject = `Academic Update: Overdue Assignment for ${studentName}`;
      emailBody = `<p>Dear ${parentName},</p>
<p>This is a friendly reminder that <strong>${studentName}</strong> has not yet submitted the following required assignment:</p>
<ul>
  <li><strong>Assignment:</strong> ${homeworkTitle || 'Class Assignment'}</li>
  <li><strong>Original Due Date:</strong> ${dueDate || 'Past Due'}</li>
  <li><strong>Subject:</strong> Coursework & Practice</li>
</ul>
<p>We encourage you to check in with ${studentName} this evening. They can access the full assignment instructions and grading rubric on their student portal. Late submissions submitted within 48 hours receive partial credit support.</p>
<p>Thank you for partnering with us in your student's academic growth.</p>
<p>Best regards,<br>Grade 8 Academic Team<br>Oakridge Academy</p>`;
      actionPrompt = 'Review missing assignment in the Parent Portal with student';
    } else {
      smsMessage = `Oakridge Notice: ${studentName}'s attendance has dropped to ${attendanceRate || 'below threshold'}%. Let's connect on support.`;
      emailSubject = `Important Notice: Attendance Monitoring for ${studentName}`;
      emailBody = `<p>Dear ${parentName},</p>
<p>Our attendance tracking system has indicated that <strong>${studentName}'s</strong> cumulative attendance rate is currently at <strong>${attendanceRate || '88'}%</strong>, which is below our recommended 95% benchmark.</p>
<p>Consistent attendance is directly tied to student academic success and wellbeing. We want to work collaboratively with your family to identify any barriers and support ${studentName} in maintaining regular attendance.</p>
<p>Please reach out to our student counselor or reply to schedule a brief conference.</p>
<p>Sincerely,<br>Oakridge Student Services</p>`;
      actionPrompt = 'Schedule an advisor check-in or review attendance history';
    }

    res.json({
      success: true,
      alert: {
        smsMessage,
        emailSubject,
        emailBody,
        actionPrompt,
      },
    });
  } catch (error: any) {
    console.error('Notification Generation Error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to generate parent alert',
    });
  }
});

// Configure Vite middleware in development or serve static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduSync AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
