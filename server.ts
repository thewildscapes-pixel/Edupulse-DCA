import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to dynamically obtain Google GenAI client
  function getGenAIClient() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // 1. Health check endpoint
  app.get('/api/health', (_req, res) => {
    const key = process.env.GEMINI_API_KEY;
    res.json({
      status: 'ok',
      hasApiKey: Boolean(key),
      timestamp: new Date().toISOString()
    });
  });

  // Cross-device persistent cloud synchronization endpoints
  const DATA_FILE = path.join(process.cwd(), 'data_store.json');

  function loadDataStore() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to load data_store.json', e);
    }
    return null;
  }

  function saveDataStore(data: any) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Failed to save data_store.json', e);
    }
  }

  const initialStore = loadDataStore();

  let cloudDbStudents: any[] = initialStore?.students || [];
  let cloudDbMentors: any[] = initialStore?.mentors || [];
  let cloudDbTeacherUpdates: any[] = initialStore?.teacherUpdates || [];
  let cloudDbAdminList: string[] = initialStore?.adminList || ['thewildscapes@gmail.com', '9706375001'];
  let cloudDbBlockedLogins: string[] = initialStore?.blockedLogins || [];
  let cloudDbResources: any[] = initialStore?.resources || [];
  let cloudDbQuizzes: any[] = initialStore?.quizzes || [];

  const persistDataStore = () => {
    saveDataStore({
      students: cloudDbStudents,
      mentors: cloudDbMentors,
      teacherUpdates: cloudDbTeacherUpdates,
      adminList: cloudDbAdminList,
      blockedLogins: cloudDbBlockedLogins,
      resources: cloudDbResources,
      quizzes: cloudDbQuizzes,
    });
  };

  app.get('/api/sync-data', (_req, res) => {
    res.json({
      students: cloudDbStudents,
      mentors: cloudDbMentors,
      teacherUpdates: cloudDbTeacherUpdates,
      adminList: cloudDbAdminList,
      blockedLogins: cloudDbBlockedLogins,
      resources: cloudDbResources,
      quizzes: cloudDbQuizzes,
      timestamp: Date.now(),
    });
  });

  app.post('/api/sync-data', (req, res) => {
    const { students, mentors, teacherUpdates, adminList, blockedLogins, resources, quizzes } = req.body;

    if (Array.isArray(students)) {
      const studentMap = new Map();
      cloudDbStudents.forEach((s) => studentMap.set(s.id, s));
      students.forEach((s) => {
        const existing = studentMap.get(s.id);
        if (!existing || (s.lastModified || 0) >= (existing.lastModified || 0)) {
          studentMap.set(s.id, s);
        }
      });
      cloudDbStudents = Array.from(studentMap.values());
    }

    if (Array.isArray(mentors)) {
      const mentorMap = new Map();
      const getMentorKey = (m: any) => {
        const normE = (m.email || '').trim().toLowerCase();
        if (normE) return `email:${normE}`;
        const normP = (m.phone || '').replace(/\D/g, '').slice(-10);
        if (normP) return `phone:${normP}`;
        return `id:${m.id}`;
      };

      cloudDbMentors.forEach((m) => {
        const key = getMentorKey(m);
        mentorMap.set(key, m);
      });

      mentors.forEach((m) => {
        const key = getMentorKey(m);
        const existing = mentorMap.get(key);
        if (existing) {
          const isExistingGenericName = !existing.name || existing.name.includes('Faculty Member') || existing.name.startsWith('Prof. Faculty') || existing.name === 'Dr. Faculty';
          const isNewGenericName = !m.name || m.name.includes('Faculty Member') || m.name.startsWith('Prof. Faculty') || m.name === 'Dr. Faculty';

          let bestName = m.name || existing.name;
          if (isNewGenericName && !isExistingGenericName) {
            bestName = existing.name;
          } else if (!isNewGenericName) {
            bestName = m.name;
          }

          let bestDept = m.department || existing.department || 'Physics';
          if (m.department && m.department !== 'Physics') {
            bestDept = m.department;
          } else if (existing.department && existing.department !== 'Physics') {
            bestDept = existing.department;
          }

          let bestDesig = m.designation || existing.designation || 'Assistant Professor';
          if (m.designation && m.designation !== 'Assistant Professor') {
            bestDesig = m.designation;
          } else if (existing.designation && existing.designation !== 'Assistant Professor') {
            bestDesig = existing.designation;
          }

          const merged = {
            ...existing,
            ...m,
            id: m.id || existing.id,
            name: bestName,
            designation: bestDesig,
            department: bestDept,
            email: m.email || existing.email,
            phone: m.phone || existing.phone,
            assignedMenteeIds: Array.from(new Set([...(existing.assignedMenteeIds || []), ...(m.assignedMenteeIds || [])])),
            lastModified: Math.max(m.lastModified || 0, existing.lastModified || 0, Date.now()),
          };
          mentorMap.set(key, merged);
        } else {
          mentorMap.set(key, m);
        }
      });
      cloudDbMentors = Array.from(mentorMap.values());
    }

    if (Array.isArray(teacherUpdates)) {
      const updateMap = new Map();
      cloudDbTeacherUpdates.forEach((u) => updateMap.set(u.id, u));
      teacherUpdates.forEach((u) => updateMap.set(u.id, u));
      cloudDbTeacherUpdates = Array.from(updateMap.values());
    }

    if (Array.isArray(adminList)) {
      cloudDbAdminList = Array.from(new Set([...cloudDbAdminList, ...adminList]));
    }

    if (Array.isArray(blockedLogins)) {
      cloudDbBlockedLogins = Array.from(new Set([...cloudDbBlockedLogins, ...blockedLogins]));
    }

    if (Array.isArray(resources)) {
      const resMap = new Map();
      cloudDbResources.forEach((r) => resMap.set(r.id, r));
      resources.forEach((r) => resMap.set(r.id, r));
      cloudDbResources = Array.from(resMap.values());
    }

    if (Array.isArray(quizzes)) {
      const quizMap = new Map();
      cloudDbQuizzes.forEach((q) => quizMap.set(q.id, q));
      quizzes.forEach((q) => quizMap.set(q.id, q));
      cloudDbQuizzes = Array.from(quizMap.values());
    }

    persistDataStore();

    res.json({
      success: true,
      students: cloudDbStudents,
      mentors: cloudDbMentors,
      teacherUpdates: cloudDbTeacherUpdates,
      adminList: cloudDbAdminList,
      blockedLogins: cloudDbBlockedLogins,
      resources: cloudDbResources,
      quizzes: cloudDbQuizzes,
      timestamp: Date.now(),
    });
  });

  // Resources Endpoints
  app.get('/api/resources', (_req, res) => {
    res.json({ resources: cloudDbResources });
  });

  app.post('/api/resources', (req, res) => {
    const resource = req.body;
    if (!resource || !resource.id) {
      return res.status(400).json({ error: 'Valid resource object required' });
    }
    const idx = cloudDbResources.findIndex((r) => r.id === resource.id);
    if (idx >= 0) {
      cloudDbResources[idx] = resource;
    } else {
      cloudDbResources.unshift(resource);
    }
    persistDataStore();
    res.json({ success: true, resource, resources: cloudDbResources });
  });

  app.delete('/api/resources/:id', (req, res) => {
    const { id } = req.params;
    cloudDbResources = cloudDbResources.filter((r) => r.id !== id);
    persistDataStore();
    res.json({ success: true, resources: cloudDbResources });
  });

  // Quizzes & Submissions Endpoints
  app.get('/api/quizzes', (_req, res) => {
    res.json({ quizzes: cloudDbQuizzes });
  });

  app.get('/api/quizzes/:id', (req, res) => {
    const quiz = cloudDbQuizzes.find((q) => q.id === req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ quiz });
  });

  app.post('/api/quizzes', (req, res) => {
    const quiz = req.body;
    if (!quiz || !quiz.id) {
      return res.status(400).json({ error: 'Valid quiz object required' });
    }
    const idx = cloudDbQuizzes.findIndex((q) => q.id === quiz.id);
    if (idx >= 0) {
      cloudDbQuizzes[idx] = { ...cloudDbQuizzes[idx], ...quiz };
    } else {
      quiz.submissions = quiz.submissions || [];
      cloudDbQuizzes.unshift(quiz);
    }
    persistDataStore();
    res.json({ success: true, quiz, quizzes: cloudDbQuizzes });
  });

  app.post('/api/submit-quiz-response', (req, res) => {
    const { quizId, studentName, rollNo, department, semester, score, totalMarks, percentage, answersDetail } = req.body;

    if (!quizId || !studentName || !rollNo) {
      return res.status(400).json({ error: 'Quiz ID, student name, and roll number are required' });
    }

    const quizIndex = cloudDbQuizzes.findIndex((q) => q.id === quizId);
    const submission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      quizId,
      studentName,
      rollNo,
      department: department || 'General',
      semester: Number(semester) || 1,
      score: Number(score) || 0,
      totalMarks: Number(totalMarks) || 0,
      percentage: Number(percentage) || 0,
      submittedAt: new Date().toISOString(),
      answersDetail,
    };

    if (quizIndex >= 0) {
      if (!Array.isArray(cloudDbQuizzes[quizIndex].submissions)) {
        cloudDbQuizzes[quizIndex].submissions = [];
      }
      cloudDbQuizzes[quizIndex].submissions.unshift(submission);
    } else {
      // Create ad-hoc quiz container if not present
      cloudDbQuizzes.unshift({
        id: quizId,
        title: `Quiz Assessment (${department || 'General'})`,
        department: department || 'General',
        topic: 'General Assessment',
        difficulty: 'Standard',
        timeLimitMins: 30,
        targetTotalMarks: totalMarks || 20,
        questions: [],
        createdBy: 'Educator',
        createdAt: new Date().toISOString(),
        submissions: [submission],
      });
    }

    persistDataStore();
    res.json({ success: true, submission });
  });

  // 2. AI Student Diagnostic Analysis Endpoint
  app.post('/api/analyze-student', async (req, res) => {
    try {
      const { student, subjectData, overallAttendance, quizScores, assignmentScores, additionalContext } = req.body;

      if (!student) {
        return res.status(400).json({ error: 'Student details are required' });
      }

      const ai = getGenAIClient();

      if (!ai) {
        // Return structured fallback if API key is not configured
        const isSlow = overallAttendance < 75;
        const category = isSlow ? 'Slow Learner' : 'Average Performer';

        return res.json({
          source: 'rule_engine',
          analysis: {
            category,
            isSlowLearner: isSlow,
            diagnosticReason: isSlow
              ? `Overall attendance (${overallAttendance}%) is below the mandatory Digboi College 75% threshold.`
              : `Student shows steady academic progress with ${overallAttendance}% attendance.`,
            summary: `${student.name} (${student.rollNo}) in ${student.department} has ${overallAttendance}% attendance and stable sessional performance.`,
            positiveTraits: [
              'Regular participation in scheduled practical sessions',
              'Maintains good interpersonal conduct with faculty and peers',
              'Responsive to individual mentoring guidance'
            ],
            learningObstacles: [
              isSlow ? 'Attendance deficit impacting subject continuity' : 'Needs enhancement in higher-order analytical problem solving',
              'Conceptual gaps in core subject fundamentals'
            ],
            remedialActionPlan: [
              'Enroll in Digboi College remedial tutorials',
              'Bi-weekly progress review with assigned Faculty Mentor',
              'Submit concept reinforcement worksheets'
            ],
            parentRecommendations: [
              'Ensure minimum 2 hours of distraction-free revision daily at home',
              'Monitor attendance updates via Digboi College EduPulse portal',
              'Maintain active communication with the Faculty Mentor'
            ],
            whatsappFormattedReport: `*OFFICIAL ACADEMIC NOTICE & DIAGNOSTIC REPORT*\n*DIGBOI COLLEGE (AUTONOMOUS)*\n\nTo the Parent/Guardian of *${student.name}* (Roll: ${student.rollNo})\nDepartment: ${student.department}\nAttendance: ${overallAttendance}%\nDiagnostic Category: *${category}*\n\nPlease connect with the assigned Faculty Mentor for detailed academic guidance.`
          }
        });
      }

      const prompt = `
You are an expert Educational Diagnostician and Faculty Mentor at Digboi College (Autonomous), Assam, India.
Analyze the following student performance data and return a JSON object with your academic diagnosis, tailored remedial action plan, and official guardian report.

STUDENT PROFILE:
- Name: ${student.name}
- Roll/Reg No: ${student.rollNo}
- Program: ${student.program || 'FYUGP B.Sc / B.A / B.Com'}
- Department: ${student.department}
- Overall Attendance: ${overallAttendance}%
- Subject Marks & Attendance: ${JSON.stringify(subjectData || [])}
- Online Quiz History: ${JSON.stringify(quizScores || [])}
- Assignments: ${assignmentScores || 'N/A'}
- Educator Context: ${additionalContext || 'None'}

CRITICAL GUIDELINES:
- Attendance cutoff is 75% as per Dibrugarh University / Digboi College regulations.
- Categorize student into EXACTLY ONE of: "Slow Learner", "Needs Improvement", "Average Performer", "Good", "Outstanding".
- Set "isSlowLearner" to true if attendance < 75% or sessional average < 18/30.

Return ONLY a JSON object with this exact structure:
{
  "category": "Slow Learner" | "Needs Improvement" | "Average Performer" | "Good" | "Outstanding",
  "isSlowLearner": boolean,
  "diagnosticReason": "Concise root cause explanation based on metrics",
  "summary": "2-3 sentence overall performance evaluation",
  "positiveTraits": ["3 specific academic or behavioral strengths"],
  "learningObstacles": ["3 specific learning difficulties or gaps identified"],
  "remedialActionPlan": ["3 actionable steps for faculty mentor & student"],
  "parentRecommendations": ["3 clear instructions for home study & guardian supervision"],
  "whatsappFormattedReport": "Official notice text with WhatsApp markdown (*bold*, emoji) formatted neatly for parents"
}
`;

      let responseText = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          }
        });
        responseText = response.text || '';
      } catch (e1) {
        console.warn('gemini-3.6-flash failed in analyze-student, trying gemini-2.5-flash:', e1);
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            }
          });
          responseText = response.text || '';
        } catch (e2) {
          console.warn('gemini-2.5-flash failed in analyze-student:', e2);
        }
      }

      if (!responseText) {
        throw new Error('Empty response from AI model');
      }

      const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const analysisData = JSON.parse(cleanedText);

      return res.json({
        source: 'gemini',
        analysis: analysisData
      });
    } catch (error: any) {
      console.error('Error in /api/analyze-student:', error);
      // Fallback response so the user UI never crashes
      const { student, overallAttendance } = req.body;
      const isSlow = (overallAttendance || 0) < 75;
      const category = isSlow ? 'Slow Learner' : 'Average Performer';

      return res.json({
        source: 'rule_engine_fallback',
        analysis: {
          category,
          isSlowLearner: isSlow,
          diagnosticReason: isSlow
            ? `Attendance (${overallAttendance}%) below Digboi College 75% mandatory cutoff.`
            : `Maintains consistent academic performance with ${overallAttendance}% attendance.`,
          summary: `${student?.name || 'Student'} (${student?.rollNo || ''}) evaluated under standard Digboi College diagnostic benchmarks.`,
          positiveTraits: [
            'Regular laboratory assignment submissions',
            'Positive conduct and faculty engagement',
            'High potential for growth with structured mentoring'
          ],
          learningObstacles: [
            isSlow ? 'Low attendance impacting core lecture continuity' : 'Needs problem-solving speed improvements in sessional exams',
            'Fundamental concept revision required in core modules'
          ],
          remedialActionPlan: [
            'Enroll in Digboi College remedial classes',
            'Bi-weekly progress checks with assigned Faculty Mentor',
            'Peer group study pairing'
          ],
          parentRecommendations: [
            'Ensure minimum 2 hours of home study daily',
            'Track attendance via Digboi College EduPulse portal',
            'Maintain regular communication with the Faculty Mentor'
          ],
          whatsappFormattedReport: `*OFFICIAL ACADEMIC NOTICE & DIAGNOSTIC REPORT*\n*DIGBOI COLLEGE (AUTONOMOUS)*\n\nTo the Parent/Guardian of *${student?.name || 'Student'}*\nDepartment: ${student?.department || 'Digboi College'}\nAttendance: ${overallAttendance}%\nDiagnostic Category: *${category}*\n\nPlease contact the Faculty Mentor for detailed guidance.`
        }
      });
    }
  });

  // 3. AI Quiz Generator Endpoint
  app.post('/api/generate-quiz', async (req, res) => {
    try {
      const { subject, topic, difficulty, questionCount = 5, marksPerQuestion = 1 } = req.body;

      if (!subject || !topic) {
        return res.status(400).json({ error: 'Department/Subject and topic are required' });
      }

      const qCount = Math.max(1, Math.min(25, Number(questionCount) || 5));
      const qMarks = Math.max(1, Number(marksPerQuestion) || 1);

      const ai = getGenAIClient();

      if (!ai) {
        // Dynamic topic-tailored fallback if Gemini key is missing
        const fallbackQuestions = Array.from({ length: qCount }).map((_, i) => ({
          id: `q${i + 1}`,
          question: `[${subject} - ${topic}] Q${i + 1}: What is a fundamental law or principle governing ${topic}?`,
          options: [
            `Core theoretical principle and governing equation of ${topic}`,
            `Secondary boundary condition non-essential to ${topic}`,
            `Irrelevant empirical approximation`,
            `Inverse state transformation rule`
          ],
          correctIndex: 0,
          explanation: `In ${subject}, ${topic} relies on fundamental state principles and empirical validation.`,
          marks: qMarks
        }));
        return res.json({ questions: fallbackQuestions });
      }

      const prompt = `
You are a senior Professor and Examination Controller at Digboi College (Autonomous) / Dibrugarh University.
Generate an official undergraduate examination quiz with EXACTLY ${qCount} multiple-choice questions.

ASSIGNED SPECIFICATIONS:
- Department: ${subject}
- Specific Core Topic: ${topic}
- Difficulty Level: ${difficulty || 'Intermediate'}
- Number of Questions: ${qCount}
- Marks per Question: ${qMarks}

CRITICAL ACCURACY & SPECIFICITY MANDATE:
1. Every single question MUST be 100% SPECIFIC to the assigned topic "${topic}" within the Department of "${subject}".
2. NO GENERIC OR OUT-OF-SCOPE QUESTIONS ARE PERMITTED.
3. Include real equations, terminology, key historical facts, theorems, mechanisms, laws, or analytical problems explicitly studied under "${topic}".
4. Each question must have 4 distinct options with exactly 1 correct answer.
5. Provide a clear, step-by-step academic explanation for why the correct option is right.

Return ONLY a valid JSON array of question objects matching this exact structure:
[
  {
    "id": "q1",
    "question": "Question text directly about ${topic}?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Detailed step-by-step explanation for ${topic}.",
    "marks": ${qMarks}
  }
]
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        }
      });

      const parsed = JSON.parse(response.text || '[]');
      const questions = (Array.isArray(parsed) ? parsed : []).map((q: any, idx: number) => ({
        id: `q${idx + 1}`,
        question: q.question || `Question ${idx + 1} regarding ${topic}`,
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0,
        explanation: q.explanation || `Detailed explanation regarding ${topic}.`,
        marks: qMarks
      }));

      return res.json({ questions });
    } catch (error: any) {
      console.error('Error in /api/generate-quiz:', error);
      const { subject, topic, questionCount = 5, marksPerQuestion = 1 } = req.body;
      const qCount = Math.max(1, Math.min(25, Number(questionCount) || 5));
      const qMarks = Math.max(1, Number(marksPerQuestion) || 1);

      const fallbackQuestions = Array.from({ length: qCount }).map((_, i) => ({
        id: `q${i + 1}`,
        question: `In ${subject} (${topic}), what key principle regulates state changes in Question ${i + 1}?`,
        options: [
          `Fundamental balance and core mechanisms of ${topic}`,
          `Random non-equilibrium dissipation`,
          `Constant spatial invariance`,
          `Linear boundary expansion`
        ],
        correctIndex: 0,
        explanation: `Fundamental state principles govern ${topic} in ${subject}.`,
        marks: qMarks
      }));

      return res.json({ questions: fallbackQuestions });
    }
  });

  // 4. AI WhatsApp Communication Assistant
  app.post('/api/generate-whatsapp-msg', async (req, res) => {
    try {
      const { studentName, rollNo, department, attendance, sessionalAvg, customNote, mentorName } = req.body;

      const ai = getGenAIClient();

      if (!ai) {
        return res.json({
          message: `*OFFICIAL NOTICE — DIGBOI COLLEGE (AUTONOMOUS)*\n\nRespected Guardian,\n\nThis is regarding your ward *${studentName}* (Roll: ${rollNo}, Dept of ${department}).\n• Attendance: *${attendance}%*\n• Sessional Average: *${sessionalAvg}/30*\n• Note: ${customNote || 'Regular mentorship update'}\n\nPlease contact Faculty Mentor *${mentorName || 'Digboi College Faculty'}* for details.`
        });
      }

      const prompt = `
Compose a polite, professional, and formal WhatsApp notification to the parent of a student at Digboi College (Autonomous), Assam.

Details:
- Student Name: ${studentName}
- Roll Number: ${rollNo}
- Department: ${department}
- Attendance: ${attendance}%
- Sessional Average: ${sessionalAvg}/30
- Faculty Mentor: ${mentorName || 'Faculty Mentor'}
- Specific Teacher Remark: ${customNote || 'Regular academic check-in'}

Formatting rules:
- Use standard WhatsApp formatting (*bold*, _italic_)
- Include polite Assamese/English greeting
- Highlight attendance status (alert if below 75%)
- Request parent acknowledgment
- End with Digboi College Mentorship contact signature
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          temperature: 0.4,
        }
      });

      return res.json({ message: response.text });
    } catch (error: any) {
      console.error('Error in /api/generate-whatsapp-msg:', error);
      const { studentName, rollNo, department, attendance, sessionalAvg, customNote, mentorName } = req.body;
      return res.json({
        message: `*OFFICIAL NOTICE — DIGBOI COLLEGE (AUTONOMOUS)*\n\nRespected Guardian,\n\nThis is regarding your ward *${studentName}* (Roll: ${rollNo}, Dept of ${department}).\n• Attendance: *${attendance}%*\n• Sessional Average: *${sessionalAvg}/30*\n• Note: ${customNote || 'Regular mentorship update'}\n\nPlease contact Faculty Mentor *${mentorName || 'Digboi College Faculty'}* for details.`
      });
    }
  });

  // Vite development middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduPulse Digboi server running on http://localhost:${PORT}`);
  });
}

startServer();
