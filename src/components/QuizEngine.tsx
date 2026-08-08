import React, { useState } from 'react';
import { 
  HelpCircle, 
  CheckCircle2, 
  Award, 
  RefreshCw, 
  BookOpen, 
  Printer, 
  Target, 
  Hash, 
  BookmarkCheck,
  Plus,
  Edit3,
  Trash2,
  Share2,
  Send,
  Shuffle,
  Copy,
  MessageSquare,
  X,
  Check,
  PlusCircle,
  FileText
} from 'lucide-react';
import { Student, Department, ALL_DEPARTMENTS } from '../types';

interface QuizEngineProps {
  students: Student[];
}

export interface Question {
  id: number | string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  marks: number;
}

// Preset topics and questions removed for manual faculty entry
const TOPIC_PRESETS: Partial<Record<Department, string[]>> = {};
const CURATED_QUESTIONS_DATABASE: Record<string, Question[]> = {};

export const QuizEngine: React.FC<QuizEngineProps> = ({ students }) => {
  const [selectedSubject, setSelectedSubject] = useState<Department>('Electronic');
  const [topicInput, setTopicInput] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'Introductory' | 'Intermediate' | 'Advanced' | 'Honors'>('Intermediate');
  const [questionCount, setQuestionCount] = useState<number | ''>(5);
  const [targetTotalMarks, setTargetTotalMarks] = useState<number | ''>(20);
  const [quizTimeLimitMins, setQuizTimeLimitMins] = useState<number | ''>(30);
  const [marksPerQuestion, setMarksPerQuestion] = useState<number | ''>(2);

  // Active Quiz Question Set - Initialized empty as requested
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);

  // Calculate sum of question marks
  const effectiveTargetMarks = typeof targetTotalMarks === 'number' ? targetTotalMarks : 20;
  const effectiveMarksPerQ = typeof marksPerQuestion === 'number' ? marksPerQuestion : 2;
  const sumAssignedMarks = quizQuestions.reduce((acc, q) => acc + (q.marks || effectiveMarksPerQ), 0);
  const isMarksMismatch = quizQuestions.length > 0 && sumAssignedMarks !== effectiveTargetMarks;

  const handleAutoBalanceMarks = () => {
    if (quizQuestions.length === 0) return;
    const perQ = Math.round((effectiveTargetMarks / quizQuestions.length) * 10) / 10;
    setQuizQuestions((prev) => prev.map((q) => ({ ...q, marks: perQ })));
  };

  const handleClearAllQuestions = () => {
    if (quizQuestions.length === 0) return;
    if (window.confirm('Are you sure you want to delete all questions from this quiz?')) {
      setQuizQuestions([]);
      setAnswers({});
      setSubmitted(false);
    }
  };

  const handleLoadSampleTemplate = () => {
    const curated = CURATED_QUESTIONS_DATABASE[topicInput] || [];
    if (curated.length > 0) {
      setQuizQuestions(curated);
    } else {
      setQuizQuestions([
        {
          id: `sample_1`,
          question: `In ${selectedSubject} (${topicInput}), what is the primary fundamental principle or law evaluated during sessional assessment?`,
          options: [
            `Fundamental conservation law and boundary equilibrium in ${topicInput}`,
            `Arbitrary empirical parameter without theoretical constraint`,
            `Non-linear condition expansion`,
            `Static kinetic invariance`
          ],
          correctIndex: 0,
          explanation: `In ${selectedSubject}, ${topicInput} relies on balance equations and verified physical models.`,
          marks: effectiveMarksPerQ
        }
      ]);
    }
    setAnswers({});
    setSubmitted(false);
  };

  // Student Test Mode State
  const [answers, setAnswers] = useState<Record<string | number, number>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [shuffleNotice, setShuffleNotice] = useState<string | null>(null);

  // Educator Manual Question Builder Modal State
  const [isBuilderOpen, setIsBuilderOpen] = useState<boolean>(false);
  const [editingQId, setEditingQId] = useState<string | number | null>(null);
  
  // Manual Question Form fields
  const [formQuestionText, setFormQuestionText] = useState('');
  const [formOptA, setFormOptA] = useState('');
  const [formOptB, setFormOptB] = useState('');
  const [formOptC, setFormOptC] = useState('');
  const [formOptD, setFormOptD] = useState('');
  const [formCorrectIndex, setFormCorrectIndex] = useState<number>(0);
  const [formExplanation, setFormExplanation] = useState('');
  const [formMarks, setFormMarks] = useState<number | ''>(2);

  // WhatsApp Sharing Modal State
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState<boolean>(false);
  const [customPhone, setCustomPhone] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // When Department Changes
  const handleDepartmentChange = (dept: Department) => {
    setSelectedSubject(dept);
  };

  // When Topic Changes
  const handleTopicSelectChange = (topic: string) => {
    setTopicInput(topic);
  };

  // Reshuffle / Randomize Questions & Options
  const handleRandomReshuffle = () => {
    if (quizQuestions.length === 0) return;

    // Fisher-Yates shuffle array
    const shuffledQList = [...quizQuestions];
    for (let i = shuffledQList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledQList[i], shuffledQList[j]] = [shuffledQList[j], shuffledQList[i]];
    }

    // Reshuffle options for each question preserving correct answer
    const fullyShuffled = shuffledQList.map((q) => {
      const optionsWithOriginalIndices = q.options.map((opt, idx) => ({
        text: opt,
        isCorrect: idx === q.correctIndex
      }));

      // Shuffle options
      for (let i = optionsWithOriginalIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [optionsWithOriginalIndices[i], optionsWithOriginalIndices[j]] = [
          optionsWithOriginalIndices[j],
          optionsWithOriginalIndices[i]
        ];
      }

      const newOptions = optionsWithOriginalIndices.map((o) => o.text);
      const newCorrectIndex = optionsWithOriginalIndices.findIndex((o) => o.isCorrect);

      return {
        ...q,
        options: newOptions,
        correctIndex: newCorrectIndex
      };
    });

    setQuizQuestions(fullyShuffled);
    setAnswers({});
    setSubmitted(false);
    setShuffleNotice('🔀 Reshuffled questions & options order for unbiased student assessment!');
    setTimeout(() => setShuffleNotice(null), 4000);
  };

  // Open Manual Question Builder
  const handleOpenBuilder = (questionToEdit?: Question) => {
    if (questionToEdit) {
      setEditingQId(questionToEdit.id);
      setFormQuestionText(questionToEdit.question);
      setFormOptA(questionToEdit.options[0] || '');
      setFormOptB(questionToEdit.options[1] || '');
      setFormOptC(questionToEdit.options[2] || '');
      setFormOptD(questionToEdit.options[3] || '');
      setFormCorrectIndex(questionToEdit.correctIndex);
      setFormExplanation(questionToEdit.explanation);
      setFormMarks(questionToEdit.marks || marksPerQuestion);
    } else {
      setEditingQId(null);
      setFormQuestionText('');
      setFormOptA('');
      setFormOptB('');
      setFormOptC('');
      setFormOptD('');
      setFormCorrectIndex(0);
      setFormExplanation('');
      setFormMarks(marksPerQuestion);
    }
    setIsBuilderOpen(true);
  };

  // Save Custom Question from Manual Form
  const handleSaveCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestionText.trim() || !formOptA.trim() || !formOptB.trim()) {
      alert('Please fill in Question text and at least Options A and B.');
      return;
    }

    const optionsList = [formOptA.trim(), formOptB.trim(), formOptC.trim() || 'None of the above', formOptD.trim() || 'All of the above'];

    if (editingQId !== null) {
      // Edit existing
      setQuizQuestions((prev) =>
        prev.map((q) =>
          q.id === editingQId
            ? {
                ...q,
                question: formQuestionText.trim(),
                options: optionsList,
                correctIndex: formCorrectIndex,
                explanation: formExplanation.trim() || 'Custom faculty explanation.',
                marks: formMarks
              }
            : q
        )
      );
    } else {
      // Add new question
      const newQ: Question = {
        id: `m_${Date.now()}`,
        question: formQuestionText.trim(),
        options: optionsList,
        correctIndex: formCorrectIndex,
        explanation: formExplanation.trim() || 'Custom faculty explanation.',
        marks: formMarks
      };
      setQuizQuestions((prev) => [...prev, newQ]);
    }

    setIsBuilderOpen(false);
  };

  // Delete Question
  const handleDeleteQuestion = (qId: string | number) => {
    if (confirm('Are you sure you want to remove this question from the set?')) {
      setQuizQuestions((prev) => prev.filter((q) => q.id !== qId));
    }
  };

  // Student Option Selection
  const handleSelectOption = (qId: string | number, optIdx: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const totalMarksPossible = quizQuestions.reduce((acc, q) => acc + (q.marks || marksPerQuestion), 0);

  const calculateScoreMarks = () => {
    let earned = 0;
    quizQuestions.forEach((q) => {
      if (answers[q.id] === q.correctIndex) {
        earned += q.marks || marksPerQuestion;
      }
    });
    return earned;
  };

  const resetQuiz = () => {
    setAnswers({});
    setSubmitted(false);
  };

  // WhatsApp Formatted Text Payload
  const getWhatsAppShareText = () => {
    let text = `*DIGBOI COLLEGE (AUTONOMOUS)*\n`;
    text += `*Department of ${selectedSubject.toUpperCase()}*\n`;
    text += `*Topic:* ${topicInput}\n`;
    text += `*Level:* ${difficulty}\n`;
    text += `*Time Allowed:* ${quizTimeLimitMins} Minutes | *Total Marks:* ${targetTotalMarks} Marks (${quizQuestions.length} Questions)\n`;
    text += `------------------------------------\n\n`;

    quizQuestions.forEach((q, idx) => {
      text += `*Q${idx + 1}.* ${q.question} _[${q.marks || marksPerQuestion} Marks]_\n`;
      q.options.forEach((opt, oIdx) => {
        text += `   (${String.fromCharCode(65 + oIdx)}) ${opt}\n`;
      });
      text += `\n`;
    });

    text += `------------------------------------\n`;
    text += `*Instructions:* Complete within ${quizTimeLimitMins} Minutes and submit to your Mentor. Generated via Digboi College EduPulse Portal.`;
    return text;
  };

  // Send Direct to WhatsApp
  const handleShareToWhatsApp = (phone?: string) => {
    const rawText = getWhatsAppShareText();
    const encodedText = encodeURIComponent(rawText);
    let url = `https://api.whatsapp.com/send?text=${encodedText}`;

    if (phone && phone.trim()) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    }

    window.open(url, '_blank');
  };

  const handleCopyWhatsAppText = () => {
    const text = getWhatsAppShareText();
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  // Print Question Paper
  const handlePrintQuestionPaper = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Digboi College - ${selectedSubject} Quiz Paper</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #0f172a; line-height: 1.5; }
          .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; text-transform: uppercase; color: #1e3a8a; }
          .subtitle { font-size: 14px; font-weight: 600; color: #475569; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 25px; background: #f8fafc; padding: 12px 18px; border-radius: 8px; font-size: 13px; border: 1px solid #e2e8f0; }
          .question-box { margin-bottom: 20px; page-break-inside: avoid; }
          .q-title { font-weight: bold; font-size: 14px; margin-bottom: 8px; }
          .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; margin-left: 20px; }
          .option-item { background: #ffffff; padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 6px; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">DIGBOI COLLEGE (AUTONOMOUS)</div>
          <div class="subtitle">DEPARTMENT OF ${selectedSubject.toUpperCase()}</div>
          <div style="font-size: 12px; margin-top: 5px;">FYUGP Continuous Internal Assessment / Sessional Quiz Paper</div>
        </div>

        <div class="meta-grid">
          <div><strong>Topic:</strong> ${topicInput}</div>
          <div><strong>Total Marks:</strong> ${targetTotalMarks} Marks</div>
          <div><strong>Difficulty Level:</strong> ${difficulty}</div>
          <div><strong>Time Allowed:</strong> ${quizTimeLimitMins} Minutes</div>
        </div>

        <div style="margin-bottom: 20px; font-size: 12px; font-style: italic; color: #475569;">
          Instructions: Select the single best answer for each question below. All questions carry equal marks.
        </div>

        ${quizQuestions.map((q, idx) => `
          <div class="question-box">
            <div class="q-title">Q${idx + 1}. ${q.question} <span style="float: right; font-weight: normal; font-size: 12px; color: #64748b;">[${q.marks} Marks]</span></div>
            <div class="options-grid">
              ${q.options.map((opt, oIdx) => `
                <div class="option-item">(${String.fromCharCode(65 + oIdx)}) ${opt}</div>
              `).join('')}
            </div>
          </div>
        `).join('')}

        <div class="footer">
          Generated via Digboi College EduPulse Diagnostic System • Official Mentorship & Examination Module
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const currentPresets = TOPIC_PRESETS[selectedSubject] || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-6 h-6 text-[#1976d2]" />
            <h2 className="text-xl font-extrabold text-slate-900">100% Topic-Specific Assessment & Quiz Engine</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Faculty topic selection, manual custom question builder, random question reshuffling, & direct WhatsApp group sharing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Reshuffle Button */}
          <button
            onClick={handleRandomReshuffle}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl flex items-center space-x-1.5 border border-amber-200 transition-colors cursor-pointer"
            title="Randomly reshuffle question and option order for students"
          >
            <Shuffle className="w-4 h-4 text-amber-700" />
            <span>Random Reshuffle</span>
          </button>

          {/* WhatsApp Share Button */}
          <button
            onClick={() => setIsWhatsAppOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <MessageSquare className="w-4 h-4 text-white" />
            <span>Send to WhatsApp</span>
          </button>

          {/* Print Paper */}
          <button
            onClick={handlePrintQuestionPaper}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Paper</span>
          </button>

          {submitted && (
            <button
              onClick={resetQuiz}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#1976d2] font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retake Test</span>
            </button>
          )}
        </div>
      </div>

      {shuffleNotice && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-bold flex items-center space-x-2 animate-bounce">
          <Shuffle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{shuffleNotice}</span>
        </div>
      )}

      {/* Marks Allocation Warning Banner */}
      {isMarksMismatch && (
        <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-2xl text-amber-950 text-xs font-bold flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-200 rounded-xl shrink-0 text-amber-900">
              <Award className="w-5 h-5 text-amber-900" />
            </div>
            <div>
              <p className="font-black text-amber-900 text-xs uppercase tracking-wide">
                ⚠️ Quiz Marks Allocation Mismatch Warning!
              </p>
              <p className="text-amber-800 font-medium text-xs mt-0.5">
                Target Quiz Total Marks is set to <strong className="underline text-amber-950 font-black">{targetTotalMarks} Marks</strong>, but assigned marks across all {quizQuestions.length} questions equal <strong className="underline text-red-700 font-black">{sumAssignedMarks} Marks</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={handleAutoBalanceMarks}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl transition-all text-xs whitespace-nowrap shadow-xs cursor-pointer"
          >
            ⚖️ Auto-Balance Marks ({targetTotalMarks / (quizQuestions.length || 1)} Marks/Q)
          </button>
        </div>
      )}

      {/* Faculty Assessment Setup Panel */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md space-y-5">
        <div className="flex items-center justify-between border-b border-blue-400/30 pb-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-amber-300" />
            <h3 className="text-base font-bold text-white">Faculty Assessment Setup & Quiz Parameters</h3>
          </div>
          <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-blue-100 backdrop-blur-xs flex items-center space-x-1.5">
            <Target className="w-3.5 h-3.5 text-amber-300" />
            <span>
              Target: <strong className="text-amber-300 font-black">{targetTotalMarks} Marks</strong> | Time: <strong className="text-amber-300 font-black">{quizTimeLimitMins} Mins</strong> ({quizQuestions.length} Questions)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs text-slate-800">
          {/* 1. Department Selection */}
          <div>
            <label className="block text-[11px] font-bold text-blue-100 mb-1 flex items-center space-x-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>Department</span>
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => handleDepartmentChange(e.target.value as Department)}
              className="w-full bg-white border-0 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-amber-400 outline-none cursor-pointer"
            >
              {ALL_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* 2. Manual Topic Input */}
          <div>
            <label className="block text-[11px] font-bold text-blue-100 mb-1 flex items-center space-x-1">
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Syllabus Core Topic</span>
            </label>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => handleTopicSelectChange(e.target.value)}
              placeholder="Type syllabus topic manually..."
              className="w-full bg-white border-0 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-amber-400 outline-none"
            />
          </div>

          {/* 3. Target Quiz Total Marks */}
          <div>
            <label className="block text-[11px] font-bold text-blue-100 mb-1">Total Quiz Marks Target</label>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                min="1"
                max="500"
                value={targetTotalMarks}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setTargetTotalMarks('');
                  } else {
                    const parsed = parseInt(val, 10);
                    setTargetTotalMarks(isNaN(parsed) ? '' : parsed);
                  }
                }}
                onBlur={() => {
                  if (targetTotalMarks === '' || targetTotalMarks <= 0) setTargetTotalMarks(20);
                }}
                className="w-full bg-white border-0 rounded-xl px-3 py-2 font-extrabold text-slate-900 focus:ring-2 focus:ring-amber-400 outline-none"
              />
              <span className="text-[10px] text-blue-200 font-bold shrink-0">Marks</span>
            </div>
          </div>

          {/* 4. Quiz Completion Time Limit */}
          <div>
            <label className="block text-[11px] font-bold text-blue-100 mb-1">Time Limit for Completion</label>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                min="1"
                max="300"
                value={quizTimeLimitMins}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setQuizTimeLimitMins('');
                  } else {
                    const parsed = parseInt(val, 10);
                    setQuizTimeLimitMins(isNaN(parsed) ? '' : parsed);
                  }
                }}
                onBlur={() => {
                  if (quizTimeLimitMins === '' || quizTimeLimitMins <= 0) setQuizTimeLimitMins(30);
                }}
                className="w-full bg-white border-0 rounded-xl px-3 py-2 font-extrabold text-slate-900 focus:ring-2 focus:ring-amber-400 outline-none"
              />
              <span className="text-[10px] text-blue-200 font-bold shrink-0">Mins</span>
            </div>
          </div>

          {/* 5. Default Marks Per Question */}
          <div>
            <label className="block text-[11px] font-bold text-blue-100 mb-1">Default Marks / Question</label>
            <select
              value={marksPerQuestion}
              onChange={(e) => {
                const newM = Number(e.target.value);
                setMarksPerQuestion(newM);
                setQuizQuestions((prev) => prev.map((q) => ({ ...q, marks: newM })));
              }}
              className="w-full bg-white border-0 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-amber-400 outline-none cursor-pointer"
            >
              <option value={1}>1 Mark / Question</option>
              <option value={2}>2 Marks / Question</option>
              <option value={3}>3 Marks / Question</option>
              <option value={5}>5 Marks / Question</option>
              <option value={10}>10 Marks / Question</option>
            </select>
          </div>
        </div>

        {/* Action Row for Educator */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-blue-400/30">
          <div className="text-xs text-blue-100 font-medium">
            Quiz Status: <strong className="text-white font-bold">{selectedSubject}</strong> → <span className="underline decoration-amber-400 font-bold">{topicInput}</span> ({quizQuestions.length} Questions, {sumAssignedMarks}/{targetTotalMarks} Marks allocated, {quizTimeLimitMins} mins time limit)
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto flex-wrap">
            {quizQuestions.length > 0 && (
              <button
                onClick={handleClearAllQuestions}
                className="px-3.5 py-2 bg-red-600/90 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                title="Delete all questions in this quiz"
              >
                🗑️ Clear All Questions
              </button>
            )}
            {quizQuestions.length === 0 && (
              <button
                onClick={handleLoadSampleTemplate}
                className="px-3 py-2 bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                title="Load sample practice questions for selected topic"
              >
                ⚡ Load Sample Preset
              </button>
            )}
            <button
              onClick={handleAutoBalanceMarks}
              className="px-3.5 py-2 bg-blue-800 hover:bg-blue-700 text-blue-100 font-bold text-xs rounded-xl border border-blue-400/40 transition-colors cursor-pointer"
              title="Auto-divide target total marks equally among all questions"
            >
              ⚖️ Auto-Balance Marks
            </button>
            <button
              onClick={() => handleOpenBuilder()}
              className="w-full sm:w-auto px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>+ Add Manual Question</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quiz Display & Interactive Test Body */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[#1976d2]" />
            <span className="font-extrabold text-slate-900 text-sm">
              [{selectedSubject}] Question Paper: <span className="text-[#1976d2] font-black">{topicInput}</span>
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="bg-blue-50 text-[#1976d2] font-bold px-3 py-1 rounded-full border border-blue-100">
              {quizQuestions.length} Questions
            </span>
            <span className="bg-amber-50 text-amber-800 font-bold px-3 py-1 rounded-full border border-amber-200">
              Total: {totalMarksPossible} Marks
            </span>
            <button
              onClick={handleRandomReshuffle}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded-full transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Shuffle className="w-3 h-3 text-slate-600" />
              <span>Reshuffle</span>
            </button>
          </div>
        </div>

        {quizQuestions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-3">
            <p className="text-xs text-slate-500 font-bold">No questions present in this topic set yet.</p>
            <button
              onClick={() => handleOpenBuilder()}
              className="px-4 py-2 bg-[#1976d2] text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              + Add First Custom Question
            </button>
          </div>
        ) : (
          quizQuestions.map((q, idx) => {
            const selectedOpt = answers[q.id];
            const qMarks = q.marks || marksPerQuestion;

            return (
              <div key={q.id || idx} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3 relative group">
                {/* Educator Controls for Each Question */}
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-slate-900 text-sm leading-relaxed pr-16">
                    Q{idx + 1}. {q.question}
                  </p>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <span className="text-[11px] font-bold bg-blue-100 text-[#1976d2] px-2 py-0.5 rounded-md">
                      [{qMarks} {qMarks === 1 ? 'Mark' : 'Marks'}]
                    </span>

                    <button
                      onClick={() => handleOpenBuilder(q)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Edit Question"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete Question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Question Options */}
                <div className="space-y-2">
                  {q.options.map((opt, oIdx) => {
                    let optStyle = 'bg-white border-slate-200 hover:bg-blue-50/50 text-slate-800';
                    if (selectedOpt === oIdx) {
                      optStyle = 'bg-blue-100 border-[#1976d2] font-semibold text-[#1976d2]';
                    }
                    if (submitted) {
                      if (oIdx === q.correctIndex) {
                        optStyle = 'bg-emerald-100 border-emerald-500 font-bold text-emerald-800';
                      } else if (selectedOpt === oIdx && oIdx !== q.correctIndex) {
                        optStyle = 'bg-red-100 border-red-400 text-red-700';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectOption(q.id, oIdx)}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${optStyle}`}
                      >
                        <span className="font-bold mr-2">({String.fromCharCode(65 + oIdx)})</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {submitted && (
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-700">Academic Explanation:</span>
                    <p className="text-slate-600 leading-relaxed">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })
        )}

        {quizQuestions.length > 0 && (!submitted ? (
          <button
            onClick={() => setSubmitted(true)}
            disabled={Object.keys(answers).length === 0}
            className="w-full py-3 bg-[#1976d2] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Submit Quiz & Evaluate Marks</span>
          </button>
        ) : (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
            <div className="flex justify-center">
              <Award className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-extrabold text-emerald-900">
              Marks Scored: {calculateScoreMarks()} / {totalMarksPossible} Marks ({Math.round((calculateScoreMarks() / (totalMarksPossible || 1)) * 100)}%)
            </h3>
            <p className="text-xs text-emerald-800 max-w-lg mx-auto font-medium">
              Diagnostic performance evaluated for <strong>{selectedSubject} ({topicInput})</strong>. Recorded in Digboi College Continuous Evaluation & Mentorship Portal.
            </p>
          </div>
        ))}
      </div>

      {/* MODAL 1: EDUCATOR MANUAL QUESTION BUILDER */}
      {isBuilderOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  {editingQId !== null ? 'Edit Custom Question' : 'Add Educator Custom Question'}
                </h3>
              </div>
              <button
                onClick={() => setIsBuilderOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomQuestion} className="p-5 space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Question Text *</label>
                <textarea
                  rows={3}
                  required
                  value={formQuestionText}
                  onChange={(e) => setFormQuestionText(e.target.value)}
                  placeholder="e.g. What is the physical significance of the square of the wavefunction |Ψ|²?"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Options A, B, C, D */}
              <div className="space-y-2">
                <label className="block text-slate-700 font-bold">Answer Options *</label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-500">A.</span>
                    <input
                      type="text"
                      required
                      value={formOptA}
                      onChange={(e) => setFormOptA(e.target.value)}
                      placeholder="Option A"
                      className="w-full bg-white px-2 py-1 border border-slate-300 rounded-lg outline-none"
                    />
                  </div>

                  <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-500">B.</span>
                    <input
                      type="text"
                      required
                      value={formOptB}
                      onChange={(e) => setFormOptB(e.target.value)}
                      placeholder="Option B"
                      className="w-full bg-white px-2 py-1 border border-slate-300 rounded-lg outline-none"
                    />
                  </div>

                  <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-500">C.</span>
                    <input
                      type="text"
                      value={formOptC}
                      onChange={(e) => setFormOptC(e.target.value)}
                      placeholder="Option C"
                      className="w-full bg-white px-2 py-1 border border-slate-300 rounded-lg outline-none"
                    />
                  </div>

                  <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-500">D.</span>
                    <input
                      type="text"
                      value={formOptD}
                      onChange={(e) => setFormOptD(e.target.value)}
                      placeholder="Option D"
                      className="w-full bg-white px-2 py-1 border border-slate-300 rounded-lg outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Correct Option & Marks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Select Correct Option *</label>
                  <select
                    value={formCorrectIndex}
                    onChange={(e) => setFormCorrectIndex(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-emerald-50 text-emerald-900 font-extrabold outline-none"
                  >
                    <option value={0}>Option A is Correct</option>
                    <option value={1}>Option B is Correct</option>
                    <option value={2}>Option C is Correct</option>
                    <option value={3}>Option D is Correct</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Marks Assigned *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formMarks}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setFormMarks('');
                      } else {
                        const parsed = parseInt(val, 10);
                        setFormMarks(isNaN(parsed) ? '' : parsed);
                      }
                    }}
                    onBlur={() => {
                      if (formMarks === '' || formMarks <= 0) setFormMarks(2);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-extrabold text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Academic Explanation (Optional)</label>
                <input
                  type="text"
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Provide step-by-step reasoning or formula proof"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1976d2] hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Question</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: WHATSAPP SHARE & BROADCAST MODAL */}
      {isWhatsAppOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-sm">Send Question Paper to WhatsApp Groups / Numbers</h3>
              </div>
              <button
                onClick={() => setIsWhatsAppOpen(false)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-medium">
              <p className="text-slate-600">
                Instantly transmit this <strong>[{selectedSubject}] - {topicInput}</strong> question paper ({quizQuestions.length} Questions, {totalMarksPossible} Marks) to your official WhatsApp class group or student numbers.
              </p>

              {/* Option 1: Direct Group Share */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <span className="font-bold text-emerald-900 block">Option 1: Direct Share to WhatsApp Group or App</span>
                <p className="text-[11px] text-emerald-800">
                  Clicking below opens WhatsApp Web or App with the pre-formatted question paper ready to send to any group.
                </p>
                <button
                  onClick={() => handleShareToWhatsApp()}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Open WhatsApp & Select Group / Contact</span>
                </button>
              </div>

              {/* Option 2: Target Phone Number */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 block">Option 2: Send to Specific WhatsApp Number</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none font-mono"
                  />
                  <button
                    onClick={() => handleShareToWhatsApp(customPhone)}
                    disabled={!customPhone.trim()}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    Send
                  </button>
                </div>
              </div>

              {/* Option 3: Copy Formatted Text */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold">Preview Formatted WhatsApp Message Payload:</label>
                  <button
                    onClick={handleCopyWhatsAppText}
                    className="text-xs font-bold text-[#1976d2] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copySuccess ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={6}
                  value={getWhatsAppShareText()}
                  className="w-full p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setIsWhatsAppOpen(false)}
                  className="px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
