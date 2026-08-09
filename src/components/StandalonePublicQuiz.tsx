import React, { useState, useEffect } from 'react';
import { GraduationCap, CheckCircle2, XCircle, Clock, Send, Award, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { SavedQuiz, QuizSubmission } from '../types';

interface StandalonePublicQuizProps {
  quizId: string;
}

export const StandalonePublicQuiz: React.FC<StandalonePublicQuizProps> = ({ quizId }) => {
  const [quiz, setQuiz] = useState<SavedQuiz | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Student Identity State
  const [studentName, setStudentName] = useState<string>('');
  const [rollNo, setRollNo] = useState<string>('');
  const [department, setDepartment] = useState<string>('Physics');
  const [semester, setSemester] = useState<number>(1);
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  // Quiz Execution State
  const [answers, setAnswers] = useState<Record<string | number, number>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<QuizSubmission | null>(null);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(0);

  // Fetch Quiz Details
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/quizzes/${quizId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Quiz not found or link has expired.');
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.quiz) {
          setQuiz(data.quiz);
          setTimeLeftSec((data.quiz.timeLimitMins || 20) * 60);
          if (data.quiz.department) setDepartment(data.quiz.department);
        } else if (isMounted) {
          setError('Quiz paper details could not be loaded.');
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Unable to connect to Digboi College Quiz Server.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [quizId]);

  // Timer Effect
  useEffect(() => {
    if (!hasStarted || submitted || timeLeftSec <= 0) return;
    const interval = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [hasStarted, submitted, timeLeftSec]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !rollNo.trim()) {
      alert('Please enter your Full Name and College Roll Number.');
      return;
    }
    setHasStarted(true);
  };

  const handleSelectOption = (qId: string | number, optIdx: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const calculateScore = () => {
    if (!quiz) return { earned: 0, total: 0 };
    let earned = 0;
    let total = 0;
    quiz.questions.forEach((q) => {
      const marks = q.marks || 1;
      total += marks;
      if (answers[q.id] === q.correctIndex) {
        earned += marks;
      }
    });
    return { earned, total };
  };

  const handleAutoSubmit = () => {
    if (!submitted) {
      alert('⏰ Time is up! Submitting your quiz automatically now.');
      submitAnswers();
    }
  };

  const submitAnswers = async () => {
    if (!quiz) return;
    setSubmitting(true);

    const { earned, total } = calculateScore();
    const percentage = total > 0 ? Math.round((earned / total) * 100) : 0;

    const answersDetail: Record<string | number, { selectedOption: number; isCorrect: boolean; questionText: string }> = {};
    quiz.questions.forEach((q) => {
      const selected = answers[q.id] ?? -1;
      answersDetail[q.id] = {
        selectedOption: selected,
        isCorrect: selected === q.correctIndex,
        questionText: q.question,
      };
    });

    const payload = {
      quizId,
      studentName: studentName.trim(),
      rollNo: rollNo.trim(),
      department,
      semester,
      score: earned,
      totalMarks: total,
      percentage,
      answersDetail,
    };

    try {
      const res = await fetch('/api/submit-quiz-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.submission) {
        setSubmissionResult(data.submission);
      }
    } catch (e) {
      console.warn('Network submission fallback:', e);
    } finally {
      setSubmitted(true);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-sm border border-slate-200">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="font-bold text-slate-800 text-base">Loading Digboi College Quiz Paper...</h3>
          <p className="text-xs text-slate-500 mt-1">Fetching questions and instructions from server.</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md border border-slate-200">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Quiz Paper Unavailable</h3>
          <p className="text-xs text-slate-600 mt-2 mb-6">{error || 'This quiz could not be loaded or may have been deleted by the faculty.'}</p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-[#1976d2] rounded-lg hover:bg-blue-700"
          >
            Return to Digboi College Portal
          </a>
        </div>
      </div>
    );
  }

  const { earned, total } = calculateScore();
  const percentage = total > 0 ? Math.round((earned / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 font-sans text-slate-800">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#1976d2] to-indigo-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold bg-blue-500/30 text-blue-100 px-2 py-0.5 rounded-full border border-blue-300/30">
                Continuous Internal Assessment
              </span>
              <h1 className="text-xl font-extrabold tracking-tight mt-1">DIGBOI COLLEGE (AUTONOMOUS)</h1>
              <p className="text-xs text-blue-100 font-medium">Department of {quiz.department || 'Academic Assessment'}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-blue-100 gap-2">
            <div>📌 <strong>Topic:</strong> {quiz.topic}</div>
            <div>⏱️ <strong>Time:</strong> {quiz.timeLimitMins} Mins</div>
            <div>💯 <strong>Total Marks:</strong> {quiz.targetTotalMarks || quiz.questions.length}</div>
          </div>
        </div>

        {/* Step 1: Student Details Entry Form */}
        {!hasStarted && !submitted && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="border-b border-slate-100 pb-4 mb-5">
              <h2 className="text-base font-bold text-slate-900">Student Identity Verification</h2>
              <p className="text-xs text-slate-500">Please enter your details to begin your assessment test.</p>
            </div>

            <form onSubmit={handleStartQuiz} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Student Name *</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Priyanku Phukan"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">College Roll Number / Enrolment No *</label>
                  <input
                    type="text"
                    required
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    placeholder="e.g. DIG-PHY-2024-012"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Semester *</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-900 text-xs">
                <strong>📝 Guidelines:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 text-slate-600">
                  <li>Ensure you answer all questions before time expires.</li>
                  <li>Your score will be logged directly with your Faculty Mentor.</li>
                  <li>Do not refresh or close the tab while taking the test.</li>
                </ul>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#1976d2] hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm"
              >
                <span>Start Assessment Test</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Quiz Question Sheet */}
        {hasStarted && !submitted && (
          <div className="space-y-4">
            {/* Sticky Timer Bar */}
            <div className="sticky top-2 z-10 bg-slate-900 text-white rounded-xl p-3 shadow-lg flex items-center justify-between border border-slate-700 text-xs font-semibold">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Candidate: {studentName} ({rollNo})</span>
              </div>
              <div className="flex items-center space-x-1 font-mono text-sm font-bold text-amber-300 bg-slate-800 px-3 py-1 rounded-lg">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{formatTime(timeLeftSec)}</span>
              </div>
            </div>

            {/* Questions List */}
            {quiz.questions.map((q, qIdx) => (
              <div key={q.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    <span className="text-blue-600 mr-1.5">Q{qIdx + 1}.</span>
                    {q.question}
                  </h3>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 shrink-0 ml-2">
                    {q.marks || 1} {q.marks === 1 ? 'Mark' : 'Marks'}
                  </span>
                </div>

                <div className="space-y-2 mt-3">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = answers[q.id] === oIdx;
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelectOption(q.id, oIdx)}
                        className={`w-full text-left p-3 rounded-xl text-xs font-medium border transition-all flex items-center space-x-3 ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-300'
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Submit Section */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 text-center space-y-3">
              <p className="text-xs text-slate-500">
                You have answered {Object.keys(answers).length} of {quiz.questions.length} questions.
              </p>
              <button
                type="button"
                onClick={submitAnswers}
                disabled={submitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Marks to Mentor...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Quiz & View Score</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Result Scorecard */}
        {submitted && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Award className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Quiz Assessment Submitted!</h2>
              <p className="text-xs text-slate-500">Your score has been saved and shared with your Faculty Mentor.</p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-[10px] uppercase font-bold text-slate-400">Student</p>
                <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{studentName}</p>
                <p className="text-[10px] text-slate-500">{rollNo}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                <p className="text-[10px] uppercase font-bold text-blue-600">Marks Scored</p>
                <p className="text-lg font-black text-blue-900 mt-0.5">{earned} / {total}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <p className="text-[10px] uppercase font-bold text-emerald-600">Percentage</p>
                <p className="text-lg font-black text-emerald-900 mt-0.5">{percentage}%</p>
              </div>
            </div>

            {/* Answer Explanations */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <span>Detailed Question Review</span>
              </h3>

              {quiz.questions.map((q, qIdx) => {
                const userAns = answers[q.id];
                const isCorrect = userAns === q.correctIndex;

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between font-bold text-slate-800">
                      <span>Q{qIdx + 1}. {q.question}</span>
                      {isCorrect ? (
                        <span className="flex items-center space-x-1 text-emerald-600 text-[11px] shrink-0 ml-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Correct (+{q.marks || 1})</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-red-600 text-[11px] shrink-0 ml-2">
                          <XCircle className="w-4 h-4" />
                          <span>Incorrect (0)</span>
                        </span>
                      )}
                    </div>

                    <p className="text-slate-600">
                      <strong>Your Answer:</strong> {userAns !== undefined ? `${String.fromCharCode(65 + userAns)}) ${q.options[userAns]}` : 'Not Answered'}
                    </p>
                    {!isCorrect && (
                      <p className="text-emerald-700 font-semibold">
                        <strong>Correct Answer:</strong> {String.fromCharCode(65 + q.correctIndex)}) {q.options[q.correctIndex]}
                      </p>
                    )}
                    {q.explanation && (
                      <p className="text-slate-500 italic bg-white/70 p-2 rounded-lg border border-slate-200/60 mt-1">
                        💡 <strong>Explanation:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center pt-2">
              <a
                href="/"
                className="inline-flex items-center px-5 py-2.5 text-xs font-bold text-white bg-[#1976d2] rounded-xl hover:bg-blue-700 shadow-md transition-all"
              >
                Go to Digboi College EduPulse Portal
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
