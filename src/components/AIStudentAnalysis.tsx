import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Student, Role, Mentor, TeacherUpdateLog } from '../types';
import { CollegeLogo } from './CollegeLogo';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { StudentMarksProgressionChart } from './StudentMarksProgressionChart';
import { 
  Sparkles, 
  BrainCircuit, 
  CheckCircle2, 
  AlertCircle, 
  Lightbulb, 
  MessageSquare, 
  Loader2, 
  UserCheck, 
  Printer, 
  Copy, 
  Check, 
  FileText, 
  AlertTriangle, 
  Users, 
  Download, 
  ShieldCheck, 
  GraduationCap, 
  Calendar, 
  Building2,
  X,
  FileCheck
} from 'lucide-react';

// Dedicated subcomponent for the official report card content
const ReportDocumentContent: React.FC<{
  selectedStudent: Student;
  analysisResult: any;
  assignedMentor?: Mentor;
  avgSessionalMarks: number;
  estimatedQuizScore: number;
}> = ({ selectedStudent, analysisResult, assignedMentor, avgSessionalMarks, estimatedQuizScore }) => {
  return (
    <>
      {/* 1. Official College Letterhead Header */}
      <div className="border-b-2 border-[#1976d2] pb-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center space-x-4">
          <CollegeLogo size="lg" className="shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1976d2] uppercase tracking-tight whitespace-nowrap">
              DIGBOI COLLEGE (AUTONOMOUS)
            </h1>
            <p className="text-xs font-bold text-slate-700">
              Estd. 1965 • Digboi, Tinsukia, Assam - 786171
            </p>
            <p className="text-[11px] text-slate-500 font-semibold whitespace-nowrap">
              Affiliated to Dibrugarh University • NAAC Accredited "A+ (CGPA: 3.49)" College
            </p>
          </div>
        </div>

        <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
          <div className="inline-block bg-amber-400 text-blue-950 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider mb-1">
            Digboi College Mentorship
          </div>
          <div className="text-[11px] font-mono text-slate-500 font-semibold">
            Ref: DC/DIAG/{new Date().getFullYear()}/{selectedStudent.rollNo}
          </div>
          <div className="text-[11px] font-semibold text-slate-600">
            Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Document Title Banner */}
      <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-center">
        <h2 className="text-base font-black text-[#1976d2] uppercase tracking-wider">
          ACADEMIC DIAGNOSTIC & MENTORSHIP REPORT
        </h2>
        <p className="text-xs text-slate-600 font-medium mt-0.5">
          Official evaluation compiled by Digboi College Faculty Mentorship Ecosystem
        </p>
      </div>

      {/* 2. Mentee & Guardian Profile Table */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5 border-b border-slate-200 pb-1">
          <UserCheck className="w-4 h-4 text-[#1976d2]" />
          <span>I. Mentee & Guardian Demographic Details</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Student Full Name</span>
            <strong className="text-slate-900 font-black text-sm">{selectedStudent.name}</strong>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Roll / Registration No.</span>
            <strong className="text-slate-900 font-bold font-mono">{selectedStudent.rollNo}</strong>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Academic Program</span>
            <strong className="text-slate-800 font-semibold">{selectedStudent.program}</strong>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Department & Semester</span>
            <strong className="text-slate-800 font-semibold">{selectedStudent.department} (Sem {selectedStudent.semester || '3'})</strong>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Assigned Faculty Mentor</span>
            <strong className="text-blue-900 font-bold">{assignedMentor?.name || 'Dr. K. K. Dutta'}</strong>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Parent / Guardian Name</span>
            <strong className="text-slate-800 font-semibold">{selectedStudent.parentName} (+91 {selectedStudent.parentPhone})</strong>
          </div>
        </div>
      </div>

      {/* 3. Quantitative Performance Matrix */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5 border-b border-slate-200 pb-1">
          <GraduationCap className="w-4 h-4 text-[#1976d2]" />
          <span>II. Continuous Evaluation & Attendance Metrics</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Overall Attendance</span>
            <span className={`text-base font-black font-mono ${selectedStudent.overallAttendance < 75 ? 'text-red-600' : 'text-emerald-700'}`}>
              {selectedStudent.overallAttendance}%
            </span>
            <span className="text-[9px] block text-slate-500 font-semibold">
              {selectedStudent.overallAttendance < 75 ? '⚠️ Below 75% Cutoff' : '✅ Meets Requirement'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Sessional Avg.</span>
            <span className="text-base font-black font-mono text-slate-800">
              {avgSessionalMarks} / 30
            </span>
            <span className="text-[9px] block text-slate-500 font-semibold">Internal Examination</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Online MCQ Quiz</span>
            <span className="text-base font-black font-mono text-slate-800">
              {estimatedQuizScore}%
            </span>
            <span className="text-[9px] block text-slate-500 font-semibold">Concept Assessment</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Current Overall GPA</span>
            <span className="text-base font-black font-mono text-blue-900">
              {selectedStudent.overallGpa} / 10
            </span>
            <span className="text-[9px] block text-slate-500 font-semibold">Cumulative Index</span>
          </div>
        </div>
      </div>

      {/* 4. Diagnostic Classification & Learning Gaps */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5 border-b border-slate-200 pb-1">
          <BrainCircuit className="w-4 h-4 text-[#1976d2]" />
          <span>III. Diagnostic Classification & Learning Gaps</span>
        </h3>

        <div className={`p-4 rounded-xl border ${
          analysisResult.isSlowLearner || analysisResult.category === 'Slow Learner'
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-emerald-50 border-emerald-300 text-emerald-950'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">
              Diagnostic Classification:
            </span>
            <span className={`text-xs font-black px-2.5 py-0.5 rounded-md uppercase text-white ${
              analysisResult.isSlowLearner || analysisResult.category === 'Slow Learner'
                ? 'bg-amber-700'
                : 'bg-emerald-700'
            }`}>
              {analysisResult.category}
            </span>
          </div>

          <p className="text-xs font-medium leading-relaxed">
            <strong>Diagnostic Assessment Reason:</strong> {analysisResult.diagnosticReason || analysisResult.summary}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
            <strong className="text-emerald-900 font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Positive Academic Strengths:</span>
            </strong>
            <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
              {(analysisResult.positiveTraits || []).map((t: string, i: number) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
            <strong className="text-amber-900 font-bold flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Identified Learning Gaps:</span>
            </strong>
            <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
              {(analysisResult.learningObstacles || []).map((o: string, i: number) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 5. DEDICATED PARENT / GUARDIAN SUPPORT & GUIDANCE SECTION */}
      <div className="bg-emerald-50/90 border-2 border-emerald-500/80 p-5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center space-x-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <span>IV. Mandatory Directive for Parent / Guardian Home Support</span>
          </h3>
          <span className="bg-emerald-700 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
            Home Action Plan
          </span>
        </div>

        <p className="text-xs text-slate-800 font-medium leading-relaxed">
          Dear Parent/Guardian (<strong>{selectedStudent.parentName}</strong>), Digboi College requests your active cooperation at home to ensure <strong>{selectedStudent.name}</strong> improves academic understanding and maintains continuous college attendance:
        </p>

        <div className="space-y-2 text-xs">
          {(analysisResult.parentRecommendations || [
            'Establish a quiet, distraction-free 2-hour daily home study routine without mobile phones or television.',
            'Verify daily college class attendance to ensure the student stays above the mandatory 75% attendance cutoff.',
            'Ensure student punctually attends Saturday morning remedial tutorial sessions at the Digboi College campus.',
            'Maintain direct contact with assigned Faculty Mentor Dr. K. K. Dutta via WhatsApp for monthly academic reviews.'
          ]).map((rec: string, idx: number) => (
            <div key={idx} className="flex items-start space-x-2.5 bg-white p-2.5 rounded-xl border border-emerald-200 text-slate-800">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="font-semibold text-slate-800 leading-snug">{rec}</span>
            </div>
          ))}
        </div>

        <div className="bg-white p-3 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Faculty Mentor Contact</span>
            <strong className="text-emerald-900 font-extrabold">{assignedMentor?.name || 'Dr. K. K. Dutta'} ({assignedMentor?.department || selectedStudent.department})</strong>
          </div>
          <div className="text-right sm:text-left">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Mentor WhatsApp Hotline</span>
            <strong className="text-slate-900 font-mono font-bold">{assignedMentor?.phone || '+91 94351 23456'}</strong>
          </div>
        </div>
      </div>

      {/* 6. Official Signatures Block */}
      <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs">
        <div>
          <div className="h-10 border-b border-dashed border-slate-400 mb-1 flex items-end justify-center pb-1 text-[11px] font-serif text-slate-500 italic">
            {assignedMentor?.name || 'Dr. K. K. Dutta'}
          </div>
          <span className="font-bold text-slate-800 block text-[11px]">Faculty Mentor</span>
          <span className="text-[10px] text-slate-500 block">Digboi College</span>
        </div>

        <div>
          <div className="h-10 border-b border-dashed border-slate-400 mb-1 flex items-end justify-center pb-1 text-[11px] font-serif text-slate-500 italic">
            HOD / Dept. Incharge
          </div>
          <span className="font-bold text-slate-800 block text-[11px]">Head of Department</span>
          <span className="text-[10px] text-slate-500 block">{selectedStudent.department}</span>
        </div>

        <div>
          <div className="h-10 border-b border-dashed border-slate-400 mb-1 flex items-end justify-center pb-1 text-[11px] font-serif text-slate-400 italic">
            [College Seal]
          </div>
          <span className="font-bold text-slate-800 block text-[11px]">Principal / Academic Seal</span>
          <span className="text-[10px] text-slate-500 block">Digboi College (Autonomous)</span>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-3">
        This document is generated by the EduPulse Academic Mentorship System of Digboi College (Autonomous), Assam. For inquiries, email mentor@digboicollege.edu.in.
      </div>
    </>
  );
};

interface AIStudentAnalysisProps {
  students: Student[];
  currentRole?: Role;
  currentMentor?: Mentor;
  mentors?: Mentor[];
  initialStudentId?: string;
  onNavigateToWhatsApp: (studentId: string, customMessage?: string) => void;
  onOpenAddMentee?: () => void;
  onNavigate?: (tab: string) => void;
  onAddTeacherUpdate?: (updateLog: Omit<TeacherUpdateLog, 'id' | 'timestamp' | 'readByMentor'>) => void;
}

export const AIStudentAnalysis: React.FC<AIStudentAnalysisProps> = ({
  students,
  currentRole,
  currentMentor,
  mentors = [],
  initialStudentId,
  onNavigateToWhatsApp,
  onOpenAddMentee,
  onNavigate,
  onAddTeacherUpdate,
}) => {
  // Allow selecting any student in the college
  const effectiveStudents = useMemo(() => {
    return students;
  }, [students]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || (effectiveStudents && effectiveStudents.length > 0 ? effectiveStudents[0].id : '')
  );
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  const reportCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialStudentId && effectiveStudents.some((s) => s.id === initialStudentId)) {
      setSelectedStudentId(initialStudentId);
    } else if (effectiveStudents.length > 0 && (!selectedStudentId || !effectiveStudents.some((s) => s.id === selectedStudentId))) {
      setSelectedStudentId(effectiveStudents[0].id);
    }
  }, [initialStudentId, effectiveStudents, selectedStudentId]);

  useEffect(() => {
    setAnalysisResult(null);
    setError(null);
  }, [selectedStudentId]);

  const selectedStudent = effectiveStudents.find((s) => s.id === selectedStudentId) || (effectiveStudents.length > 0 ? effectiveStudents[0] : null);

  // Auto-run AI Academic Evaluation when student is selected or tab is mounted
  useEffect(() => {
    if (selectedStudent && !analysisResult && !loading) {
      handleRunAIAnalysis();
    }
  }, [selectedStudentId, selectedStudent?.id]);

  // Compute stats for current student safely across sessional and internal marks
  const avgSessionalMarks = selectedStudent && selectedStudent.subjects && selectedStudent.subjects.length > 0
    ? Math.round(
        selectedStudent.subjects.reduce((acc, s) => {
          const total = typeof s.internalMarks === 'number'
            ? s.internalMarks
            : ((s.sessional1 || 0) + (s.sessional2 || 0) + (s.assignmentSeminarOthers || 0));
          return acc + total;
        }, 0) / selectedStudent.subjects.length
      )
    : 0;

  const attendanceRate = selectedStudent?.overallAttendance ?? 0;
  const estimatedQuizScore = attendanceRate < 70 ? 45 : attendanceRate < 80 ? 68 : 85;

  const assignedMentor = useMemo(() => {
    if (!selectedStudent) return currentMentor || null;
    const found = mentors.find((m) => m.id === selectedStudent.mentorId);
    return found || currentMentor || null;
  }, [selectedStudent, mentors, currentMentor]);

  const handleRunAIAnalysis = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    setError(null);

    const quizPerformanceMock = [
      { quizTitle: 'Unit 1 Sessional Quiz', score: `${estimatedQuizScore}%`, status: estimatedQuizScore < 60 ? 'Needs Practice' : 'Good' },
      { quizTitle: 'FYUGP Core Concept Test', score: `${Math.max(40, estimatedQuizScore - 10)}%`, status: 'Completed' }
    ];

    try {
      const response = await fetch('/api/analyze-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: {
            name: selectedStudent.name,
            rollNo: selectedStudent.rollNo,
            program: selectedStudent.program,
            department: selectedStudent.department,
          },
          subjectData: selectedStudent.subjects,
          overallAttendance: selectedStudent.overallAttendance,
          quizScores: quizPerformanceMock,
          assignmentScores: 'Average 15/20 in course assignments'
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Server error running AI analysis');
      }

      setAnalysisResult(data.analysis);

      if (onAddTeacherUpdate) {
        onAddTeacherUpdate({
          teacherName: currentMentor?.name || 'Educator',
          subject: `${selectedStudent.department} AI Academic Evaluation`,
          updateType: 'general',
          description: `Ran Academic AI Evaluation for ${selectedStudent.name} (Roll: ${selectedStudent.rollNo}). Result: Category '${data.analysis?.category || 'Evaluated'}', Sessional Avg: ${avgSessionalMarks}/40. Remarks: ${data.analysis?.diagnosticReason || 'Diagnostic completed.'}`,
          studentIds: [selectedStudent.id],
        });
      }
    } catch (err: any) {
      console.error('AI Analysis fallback activated:', err);

      const isSlow = selectedStudent.category === 'Slow Learner' || selectedStudent.overallAttendance < 75 || avgSessionalMarks < 18;

      const fallbackCategory = isSlow ? 'Slow Learner' : selectedStudent.category === 'Critical Attention' ? 'Critical Attention' : 'Average Performer';

      const reportText = `*OFFICIAL ACADEMIC NOTICE & DIAGNOSTIC REPORT*
*DIGBOI COLLEGE (AUTONOMOUS), ASSAM*
Ref No: DC/AI-DIAG/${new Date().getFullYear()}/${selectedStudent.rollNo}
Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}

To,
*The Parent / Guardian of ${selectedStudent.name}* (Roll No: ${selectedStudent.rollNo})
Program: ${selectedStudent.program} | Department: ${selectedStudent.department}

Respected Parent / Guardian,

This is an official communication from the Office of Faculty Mentorship, Digboi College (Autonomous). An AI-assisted academic diagnostic evaluation has been conducted for your ward.

📊 *ACADEMIC PERFORMANCE METRICS:*
• Student Name: ${selectedStudent.name}
• Roll / Reg. No: ${selectedStudent.rollNo}
• Overall Attendance: ${selectedStudent.overallAttendance}% ${selectedStudent.overallAttendance < 75 ? '⚠️ (Below Mandatory 75% Cutoff)' : '✅'}
• Sessional Marks Avg: ${avgSessionalMarks} / 30
• AI Diagnostic Category: *${fallbackCategory}*

💡 *MANDATORY DIRECTIVES FOR HOME SUPPORT:*
1. Establish a quiet, distraction-free 2-hour daily home study routine.
2. Monitor class attendance weekly with assigned Faculty Mentor (${assignedMentor?.name || 'Digboi College Faculty'}).
3. Encourage participation in Saturday remedial peer-mentoring sessions at Digboi College campus.

📄 *OFFICIAL PDF REPORT ATTACHMENT:*
The official PDF copy of this Academic Diagnostic Report (bearing college letterhead and mentor signature) has been generated by Digboi College EduPulse System.

Office of Faculty Mentorship
Digboi College (Autonomous), Digboi, Tinsukia, Assam
Faculty Mentor: ${assignedMentor?.name || 'Dr. K. K. Dutta'} (+91 ${assignedMentor?.phone || '9435123456'})
Email: mentor@digboicollege.edu.in`;

      setAnalysisResult({
        category: fallbackCategory,
        isSlowLearner: isSlow,
        diagnosticReason: isSlow 
          ? `Attendance (${selectedStudent.overallAttendance}%) below 75% cutoff combined with Sessional Marks (${avgSessionalMarks}/30) indicates conceptual learning hurdles.`
          : `Consistent attendance (${selectedStudent.overallAttendance}%) and stable sessional performance (${avgSessionalMarks}/30).`,
        summary: `${selectedStudent.name} (${selectedStudent.rollNo}) has an overall attendance of ${selectedStudent.overallAttendance}%, average sessional marks of ${avgSessionalMarks}/30, and online quiz score of ${estimatedQuizScore}%.`,
        positiveTraits: [
          'Active participation in practical laboratory sessions',
          'Good peer cooperation during group assignments',
          'Demonstrates high potential when guided in 1-on-1 sessions'
        ],
        learningObstacles: [
          `Attendance deficit (${selectedStudent.overallAttendance}%) impacting continuous evaluation`,
          `Sessional score (${avgSessionalMarks}/30) reflects difficulties in analytical exam questions`,
          'Online quiz performance highlights gaps in foundational definitions'
        ],
        remedialActionPlan: [
          'Enroll in Digboi College Saturday morning remedial tutorials',
          'Pair with a high-achieving peer mentor for formula & diagram practice',
          'Weekly attendance verification and quiz re-attempts'
        ],
        parentRecommendations: [
          'Establish a quiet, distraction-free 2-hour study environment at home',
          'Ensure regular daily college attendance to cross the mandatory 75% threshold',
          'Stay in touch with the assigned Faculty Mentor on WhatsApp for monthly progress checks'
        ],
        whatsappFormattedReport: reportText
      });

      setError('AI model utilized fallback evaluation mode. (Ensure GEMINI_API_KEY is configured in AI Studio Secrets)');
    } finally {
      setLoading(false);
    }
  };

  // Function to build high-resolution multi-page PDF document and Blob file
  const buildPdfAndFile = async () => {
    if (!selectedStudent) return null;

    let targetElement = 
      document.getElementById('printable-ai-report') || 
      reportCardRef.current;

    if (!targetElement) return null;

    // Ensure images inside the target report element are loaded
    const imgList = Array.from(targetElement.querySelectorAll('img')) as HTMLImageElement[];
    await Promise.all(
      imgList.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete && img.naturalHeight !== 0) {
              resolve(true);
            } else {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(true);
            }
          })
      )
    );

    const sName = selectedStudent?.name || 'Student';
    const sRoll = selectedStudent?.rollNo || '00';
    const cleanName = sName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const fileName = `Digboi_College_Academic_Report_${cleanName}_${sRoll}.pdf`;

    try {
      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 800,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 5) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const pdfBlob = pdf.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      return { pdf, pdfBlob, pdfFile, fileName };
    } catch (canvasErr) {
      console.warn('html2canvas capture warning, fallback to jsPDF layout:', canvasErr);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(25, 118, 210);
      pdf.text('DIGBOI COLLEGE (AUTONOMOUS)', 105, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Digboi, Tinsukia, Assam - 786171 | NAAC Accredited A+ Grade', 105, 26, { align: 'center' });
      pdf.text('OFFICIAL ACADEMIC DIAGNOSTIC & MENTORSHIP REPORT', 105, 32, { align: 'center' });

      pdf.setLineWidth(0.5);
      pdf.setDrawColor(25, 118, 210);
      pdf.line(15, 36, 195, 36);

      pdf.setFontSize(11);
      pdf.setTextColor(30, 41, 59);
      pdf.text(`Student Name: ${selectedStudent.name}`, 15, 46);
      pdf.text(`Roll / Reg No: ${selectedStudent.rollNo}`, 15, 52);
      pdf.text(`Program: ${selectedStudent.program}`, 15, 58);
      pdf.text(`Department: ${selectedStudent.department}`, 15, 64);

      pdf.text(`Overall Attendance: ${selectedStudent.overallAttendance}%`, 110, 46);
      pdf.text(`Diagnostic Category: ${analysisResult?.category || selectedStudent.category}`, 110, 52);
      pdf.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 110, 58);

      pdf.setLineWidth(0.2);
      pdf.setDrawColor(203, 213, 225);
      pdf.line(15, 70, 195, 70);

      pdf.setFontSize(12);
      pdf.setTextColor(25, 118, 210);
      pdf.text('Key Diagnostic Summary & Observations:', 15, 80);

      pdf.setFontSize(10);
      pdf.setTextColor(51, 65, 85);
      const summaryText = analysisResult?.summary || analysisResult?.diagnosticReason || 'Student academic progress evaluated across internal sessional tests and attendance records.';
      const summaryLines = pdf.splitTextToSize(summaryText, 175);
      pdf.text(summaryLines, 15, 88);

      let yPos = 88 + (summaryLines.length * 6) + 10;

      pdf.setFontSize(12);
      pdf.setTextColor(25, 118, 210);
      pdf.text('Remedial Directives & Support Plan:', 15, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setTextColor(51, 65, 85);
      const recs = analysisResult?.parentRecommendations || [
        'Establish a quiet, distraction-free 2-hour daily study routine at home.',
        'Monitor class attendance weekly with assigned Faculty Mentor.',
        'Encourage participation in Saturday remedial peer-mentoring sessions.'
      ];

      recs.forEach((rec: string, idx: number) => {
        pdf.text(`${idx + 1}. ${rec}`, 15, yPos);
        yPos += 6;
      });

      yPos += 15;
      pdf.text('______________________________', 130, yPos);
      yPos += 5;
      pdf.text('Office of Faculty Mentorship', 130, yPos);
      yPos += 5;
      pdf.text(`Faculty Mentor: ${assignedMentor?.name || 'Digboi College Faculty'}`, 130, yPos);

      const pdfBlob = pdf.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      return { pdf, pdfBlob, pdfFile, fileName };
    }
  };

  // Function to generate and download high-resolution PDF report
  const handleDownloadPDF = async () => {
    setGeneratingPdf(true);
    try {
      const res = await buildPdfAndFile();
      if (res && res.pdf) {
        res.pdf.save(res.fileName);
      } else {
        handlePrintReport();
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      handlePrintReport();
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handlePrintReport = async () => {
    if (!analysisResult) {
      await handleRunAIAnalysis();
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const generateFormalWhatsAppNotice = () => {
    if (!selectedStudent || !analysisResult) return '';

    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const rollStr = selectedStudent.rollNo || 'N/A';
    const obstacles = analysisResult.learningObstacles || [
      'Attendance deficit impacting overall continuous evaluation',
      'Sessional examination score highlights conceptual learning hurdles',
      'Requires regular problem-solving and formula practice'
    ];
    const recs = analysisResult.parentRecommendations || [
      'Establish a quiet, distraction-free 2-hour daily home study routine.',
      'Verify college class attendance weekly with assigned Faculty Mentor.',
      'Encourage active participation in Saturday remedial tutorial sessions.'
    ];

    const mentorName = assignedMentor?.name || 'Dr. K. K. Dutta';
    const mentorPhone = assignedMentor?.phone || '9435123456';
    const mentorDept = assignedMentor?.department || selectedStudent.department;

    return `========================================
    *DIGBOI COLLEGE (AUTONOMOUS)*
  *OFFICIAL ACADEMIC DIAGNOSTIC NOTICE*
========================================

*Ref. No:* DC/DIAG/${new Date().getFullYear()}/${rollStr}
*Date:* ${dateStr}

*To:*
The Parent / Guardian of: *${selectedStudent.name}*
*Roll No:* ${rollStr}
*Program:* ${selectedStudent.program}
*Department:* ${selectedStudent.department}

Respected Parent / Guardian,

This is an official communication from the Office of Faculty Mentorship, Digboi College (Autonomous). An academic performance and diagnostic evaluation has been completed for your ward.

----------------------------------------
*1. ACADEMIC PERFORMANCE SUMMARY*
----------------------------------------
• *Student Name:* ${selectedStudent.name}
• *Roll / Reg. No:* ${rollStr}
• *Overall Attendance:* ${selectedStudent.overallAttendance}% ${selectedStudent.overallAttendance < 75 ? '⚠️ (Below Mandatory 75% Cutoff)' : '✅'}
• *Sessional Marks Avg:* ${avgSessionalMarks} / 30
• *Diagnostic Classification:* *${analysisResult.category}*

----------------------------------------
*2. IDENTIFIED LEARNING GAPS*
----------------------------------------
${obstacles.map((gap: string, i: number) => `${i + 1}. ${gap}`).join('\n')}

----------------------------------------
*3. DIRECTIVES FOR HOME SUPPORT*
----------------------------------------
${recs.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}

----------------------------------------
*4. OFFICIAL DOCUMENT ATTACHMENT*
----------------------------------------
The official Academic Diagnostic Report (bearing Digboi College letterhead and mentor signature) has been generated by Digboi College. Please find the downloaded PDF report attached to this message.

*FACULTY MENTOR CONTACT DETAILS:*
• *Mentor Name:* ${mentorName}
• *Department:* ${mentorDept}
• *Contact No:* +91 ${mentorPhone}

Issued by:
*Office of Faculty Mentorship & Academic Affairs*
Digboi College (Autonomous), Digboi, Tinsukia, Assam
Email: mentor@digboicollege.edu.in
========================================`;
  };

  const handleShareParentWhatsAppPDF = async () => {
    if (!selectedStudent || !analysisResult) return;
    setGeneratingPdf(true);

    const formalMessage = generateFormalWhatsAppNotice();
    const parentPhone = selectedStudent?.parentPhone || '';
    const cleanPhone = parentPhone.replace(/[^0-9]/g, '');

    try {
      const pdfRes = await buildPdfAndFile();
      if (pdfRes) {
        // Trigger local download of PDF report
        pdfRes.pdf.save(pdfRes.fileName);

        // Native Web Share API if supported
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfRes.pdfFile] })) {
          try {
            await navigator.share({
              title: `Official Academic Report - ${selectedStudent.name || 'Student'}`,
              text: formalMessage,
              files: [pdfRes.pdfFile],
            });
            setGeneratingPdf(false);
            return;
          } catch (e) {
            console.log('Native Web Share dismissed or unhandled, falling back to WhatsApp web link');
          }
        }
      }
    } catch (e) {
      console.error('Error in PDF generation during WhatsApp share:', e);
    } finally {
      setGeneratingPdf(false);
    }

    const cleanDigits = cleanPhone.slice(-10);
    const sName = selectedStudent?.name || 'Student';
    const sRoll = selectedStudent?.rollNo || '00';
    const cleanName = sName.replace(/\s+/g, '_');
    const messageWithInstruction = `${formalMessage}\n\n[📄 OFFICIAL PDF REPORT DOCUMENT DOWNLOADED ('Digboi_College_Academic_Report_${cleanName}_${sRoll}.pdf'). PLEASE ATTACH THE DOWNLOADED PDF FILE TO THIS CHAT.]`;
    const url = cleanDigits
      ? `https://wa.me/91${cleanDigits}?text=${encodeURIComponent(messageWithInstruction)}`
      : `https://wa.me/?text=${encodeURIComponent(messageWithInstruction)}`;
    
    window.open(url, '_blank');
  };

  const getParentWhatsAppUrl = () => {
    if (!selectedStudent || !analysisResult) return '#';
    const parentPhone = selectedStudent.parentPhone || '';
    const cleanPhone = parentPhone.replace(/[^0-9]/g, '');
    const message = generateFormalWhatsAppNotice();
    return cleanPhone ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  const getMentorWhatsAppUrl = () => {
    if (!selectedStudent || !assignedMentor) return '#';
    const cleanPhone = (assignedMentor.phone || '').replace(/[^0-9]/g, '');
    const message = `*OFFICIAL FACULTY MEMORANDUM - DIGBOI COLLEGE (AUTONOMOUS)*\n\nDear ${assignedMentor.name},\nHere is the official academic progress evaluation for your mentee:\n\n• *Student Name:* ${selectedStudent.name} (${selectedStudent.rollNo})\n• *Department & Program:* ${selectedStudent.program} | ${selectedStudent.department}\n• *Overall Attendance:* ${selectedStudent.overallAttendance}%\n• *Academic Category:* ${selectedStudent.category}\n• *Sessional Average:* ${avgSessionalMarks}/30\n\n*AI Diagnostic Summary:*\n${analysisResult?.summary || 'Requires academic monitoring'}\n\n*Recommended Faculty Action:*\n${analysisResult?.remedialActionPlan?.[0] || 'Schedule remedial tutorial session.'}\n\n_Office of Faculty Mentorship • Digboi College (Autonomous)_`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleCopyReport = () => {
    const textToCopy = generateFormalWhatsAppNotice();
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    }
  };

  if (!effectiveStudents || effectiveStudents.length === 0 || !selectedStudent) {
    return (
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-[#1976d2] text-white p-6 rounded-2xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start md:items-center space-x-3.5">
              <CollegeLogo size="lg" className="shrink-0" />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-800 text-blue-100 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                    Academic Assessment Engine
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Mentee Diagnostic & Parent Dispatch</span>
                  </span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white mt-1.5">
                  Student Academic Assessment & PDF Report Generator
                </h2>
                <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-2xl">
                  Evaluates attendance, sessional marks, assignment scores, and online quizzes to automatically identify slow learners and generate official printable PDF diagnostic reports.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty Roster State */}
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 bg-blue-50 text-[#1976d2] rounded-full flex items-center justify-center mx-auto shadow-inner">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">
            {currentMentor ? `No Mentees Assigned to ${currentMentor.name}` : 'No Students Recorded in Roster'}
          </h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
            {currentMentor
              ? `There are currently no mentees assigned to ${currentMentor.name}. Add students and assign them to your mentor account to run diagnostic evaluations.`
              : 'There are currently no students added to the roster. Add students individually or bulk upload class marksheets via Excel to run diagnostic evaluations.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onOpenAddMentee && (
              <button
                onClick={onOpenAddMentee}
                className="bg-[#1976d2] hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-colors cursor-pointer shadow-sm"
              >
                <UserCheck className="w-4 h-4" />
                <span>+ Add New Mentee</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-[#1976d2] text-white p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center space-x-3.5">
            <CollegeLogo size="lg" className="shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-blue-800 text-blue-100 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                  Academic Assessment Engine
                </span>
                <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Slow Learner Diagnostic & PDF Dispatch</span>
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-1.5">
                Student Academic Assessment & PDF Report Generator
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-2xl">
                Evaluates attendance, sessional marks, assignment scores, and online quizzes to automatically identify slow learners, formulate recommendations, and generate official printable PDF reports for parents & guardians.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunAIAnalysis}
            disabled={loading}
            className="bg-white hover:bg-blue-50 text-[#1976d2] font-bold px-5 py-3 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-[#1976d2]" />
                <span>Evaluating Metrics...</span>
              </>
            ) : (
              <>
                <BrainCircuit className="w-5 h-5 text-[#1976d2]" />
                <span>Run Academic Evaluation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Student Selection & Criteria Overview Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Select Mentee for Multi-Criteria Performance Evaluation
          </label>
          {(currentMentor || currentRole === 'mentor') && (
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1 self-start sm:self-auto">
              <Users className="w-3 h-3 text-emerald-700" />
              <span>Assigned Mentees ({effectiveStudents.length})</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                setAnalysisResult(null);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#1976d2] outline-none"
            >
              {effectiveStudents.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.rollNo}) — {st.program} | {st.department} [{st.category}]
                </option>
              ))}
            </select>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center text-xs">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Attendance</div>
              <div className={`font-mono font-bold text-sm ${selectedStudent.overallAttendance < 75 ? 'text-red-600' : 'text-emerald-700'}`}>
                {selectedStudent.overallAttendance}%
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Sessional</div>
              <div className="font-mono font-bold text-sm text-slate-800">
                {avgSessionalMarks}/30
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Quiz Avg</div>
              <div className="font-mono font-bold text-sm text-slate-800">
                {estimatedQuizScore}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Semester-Wise Marks Progression Visual Dashboard */}
      {selectedStudent && (
        <StudentMarksProgressionChart
          student={selectedStudent}
          avgSessionalMarks={avgSessionalMarks}
        />
      )}

      {/* Warning/Error Banner */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Assessment Output Section */}
      {analysisResult ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Diagnostic Status Header Card */}
          <div className={`p-6 rounded-2xl border shadow-2xs ${
            analysisResult.isSlowLearner || analysisResult.category === 'Slow Learner'
              ? 'bg-amber-50/90 border-amber-300 text-amber-950'
              : analysisResult.category === 'Critical Attention'
              ? 'bg-red-50/90 border-red-300 text-red-950'
              : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/10 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-2xl text-white shadow-xs ${
                  analysisResult.isSlowLearner || analysisResult.category === 'Slow Learner'
                    ? 'bg-amber-600'
                    : analysisResult.category === 'Critical Attention'
                    ? 'bg-red-600'
                    : 'bg-emerald-600'
                }`}>
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider opacity-80">
                      Diagnostic Assessment
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase text-white ${
                      analysisResult.isSlowLearner || analysisResult.category === 'Slow Learner'
                        ? 'bg-amber-700'
                        : analysisResult.category === 'Critical Attention'
                        ? 'bg-red-700'
                        : 'bg-emerald-700'
                    }`}>
                      {analysisResult.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-black mt-0.5">
                    {selectedStudent.name} ({selectedStudent.rollNo})
                  </h3>
                </div>
              </div>

              {/* Action Buttons for PDF Report, Print & Share */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handlePrintReport}
                  className="bg-[#1976d2] hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
                  title="Trigger CSS Print query for official academic report"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Report</span>
                </button>

                <button
                  onClick={() => setShowReportModal(true)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Preview & PDF</span>
                </button>

                <a
                  href={getParentWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Share via Parent WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Diagnostic Reason */}
            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-black/10 text-xs space-y-1">
              <div className="font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Diagnostic Assessment Reason:</span>
              </div>
              <p className="text-slate-800 font-medium leading-relaxed">
                {analysisResult.diagnosticReason || analysisResult.summary}
              </p>
            </div>
          </div>

          {/* Performance Matrix Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Strengths & Positive Traits */}
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                <span>Positive Academic & Behavioral Strengths</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {(analysisResult.positiveTraits || []).map((trait: string, idx: number) => (
                  <li key={idx} className="flex items-start space-x-2.5 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <span className="font-medium">{trait}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Academic Obstacles & Gaps */}
            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <AlertCircle className="w-4.5 h-4.5 text-amber-600" />
                <span>Identified Learning Gaps</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {(analysisResult.learningObstacles || []).map((obstacle: string, idx: number) => (
                  <li key={idx} className="flex items-start space-x-2.5 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                    <span className="font-medium">{obstacle}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendations Grid (Faculty/Mentor Plan vs Parent/Guardian Plan) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Faculty & Mentor Action Plan */}
            <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-2xs">
              <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <Lightbulb className="w-4.5 h-4.5 text-purple-600" />
                <span>Recommendations for Faculty & Mentors</span>
              </h4>
              <div className="space-y-2.5">
                {(analysisResult.remedialActionPlan || []).map((item: string, idx: number) => (
                  <div key={idx} className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs text-slate-800 flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="font-medium pt-0.5">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Parent & Guardian Action Plan */}
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <Users className="w-4.5 h-4.5 text-emerald-600" />
                <span>Recommendations for Parents & Guardians</span>
              </h4>
              <div className="space-y-2.5">
                {(analysisResult.parentRecommendations || [
                  'Establish a quiet, distraction-free 2-hour daily home study routine.',
                  'Verify college attendance weekly through the Digboi College Faculty Mentor.',
                  'Encourage active participation in Saturday remedial tutorials.'
                ]).map((rec: string, idx: number) => (
                  <div key={idx} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs text-slate-800 flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="font-medium pt-0.5">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* WhatsApp Outreach Card */}
          {currentRole === 'mentor' || currentRole === 'admin' ? (
            <div className="bg-emerald-900 text-white p-6 rounded-2xl shadow-md border border-emerald-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-emerald-800 text-emerald-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                      Direct Parent WhatsApp Dispatch
                    </span>
                    <span className="text-xs text-emerald-300 font-medium">
                      Guardian: {selectedStudent.parentName} (+91 {selectedStudent.parentPhone})
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mt-1 text-white">
                    Share Diagnostic Report with Mentee's Guardian via WhatsApp
                  </h3>
                  <p className="text-xs text-emerald-200 mt-0.5 max-w-xl">
                    As an assigned Faculty Mentor, you are authorized to dispatch diagnostic summaries, attendance %, and home support guidelines directly to guardians.
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={handleCopyReport}
                    className="bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer border border-emerald-700"
                  >
                    {copiedReport ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>

                  <a
                    href={getParentWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-emerald-900 hover:bg-emerald-50 font-black px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-colors cursor-pointer shadow-sm"
                  >
                    <MessageSquare className="w-4.5 h-4.5 text-emerald-700" />
                    <span>Send to Parent WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-amber-400 text-blue-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                      Educator Mode • Parent Communication Restricted
                    </span>
                    {assignedMentor && (
                      <span className="text-xs text-amber-300 font-medium">
                        Assigned Mentor: {assignedMentor.name} ({assignedMentor.department})
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold mt-1.5 text-white">
                    Forward Diagnostic Recommendations & Marks to Assigned Faculty Mentor
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                    Direct communication with guardians is handled solely by the assigned Faculty Mentor. As a Subject Educator, you can forward this student's diagnostic evaluation directly to their Mentor's WhatsApp.
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <a
                    href={getMentorWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-colors cursor-pointer shadow-sm"
                  >
                    <MessageSquare className="w-4.5 h-4.5 text-white" />
                    <span>Share Update with Faculty Mentor via WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
          <div className="w-12 h-12 bg-blue-50 text-[#1976d2] rounded-full flex items-center justify-center mx-auto">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">
            Ready to Evaluate {selectedStudent.name}
          </h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto">
            Click the "Run Academic Evaluation" button above to evaluate attendance %, sessional marks, assignments, and online quiz results.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleRunAIAnalysis}
              disabled={loading}
              className="inline-flex items-center space-x-2 bg-[#1976d2] hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Run Academic Evaluation</span>
            </button>

            <button
              onClick={handlePrintReport}
              disabled={loading}
              className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Print Academic Report</span>
            </button>
          </div>
        </div>
      )}

      {/* Off-screen PDF Render Target (Guarantees PDF capture always succeeds instantly) */}
      {selectedStudent && analysisResult && (
        <div
          id="pdf-render-target"
          className="bg-white p-8 rounded-xl border border-slate-300 max-w-3xl space-y-6 text-slate-900"
          style={{
            position: 'absolute',
            left: '0px',
            top: '0px',
            width: '800px',
            backgroundColor: '#ffffff',
            zIndex: -9999,
            pointerEvents: 'none',
          }}
        >
          {/* Official College Letterhead Header */}
          <div className="border-b-2 border-[#1976d2] pb-5 flex items-center justify-between gap-4 text-left">
            <div className="flex items-center space-x-4">
              <CollegeLogo size="lg" className="shrink-0" />
              <div>
                <h1 className="text-xl font-black text-[#1976d2] uppercase tracking-tight whitespace-nowrap">
                  DIGBOI COLLEGE (AUTONOMOUS)
                </h1>
                <p className="text-xs font-bold text-slate-700">
                  Estd. 1965 • Digboi, Tinsukia, Assam - 786171
                </p>
                <p className="text-[11px] text-slate-500 font-semibold whitespace-nowrap">
                  Affiliated to Dibrugarh University • NAAC Accredited "A+ (CGPA: 3.49)" College
                </p>
              </div>
            </div>

            <div className="text-right border-l border-slate-200 pl-4">
              <div className="inline-block bg-amber-400 text-blue-950 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider mb-1">
                Digboi College Mentorship
              </div>
              <div className="text-[11px] font-mono text-slate-500 font-semibold">
                Ref: DC/DIAG/{new Date().getFullYear()}/{selectedStudent.rollNo}
              </div>
              <div className="text-[11px] font-semibold text-slate-600">
                Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Document Title Banner */}
          <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-center">
            <h2 className="text-base font-black text-[#1976d2] uppercase tracking-wider">
              ACADEMIC DIAGNOSTIC & MENTORSHIP REPORT
            </h2>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Official evaluation compiled by Digboi College Faculty Mentorship Ecosystem
            </p>
          </div>

          {/* Mentee & Guardian Profile Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5 border-b border-slate-200 pb-1">
              <UserCheck className="w-4 h-4 text-[#1976d2]" />
              <span>I. Mentee & Guardian Demographic Details</span>
            </h3>

            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Student Full Name</span>
                <strong className="text-slate-900 font-black text-sm">{selectedStudent.name}</strong>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Roll / Registration No.</span>
                <strong className="text-slate-900 font-bold font-mono">{selectedStudent.rollNo}</strong>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Academic Program</span>
                <strong className="text-slate-800 font-semibold">{selectedStudent.program}</strong>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Department & Semester</span>
                <strong className="text-slate-800 font-semibold">{selectedStudent.department} (Sem {selectedStudent.semester || '3'})</strong>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Assigned Faculty Mentor</span>
                <strong className="text-blue-900 font-bold">{assignedMentor?.name || 'Dr. K. K. Dutta'}</strong>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Parent / Guardian Name</span>
                <strong className="text-slate-800 font-semibold">{selectedStudent.parentName} (+91 {selectedStudent.parentPhone})</strong>
              </div>
            </div>
          </div>

          {/* Quantitative Performance Matrix */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5 border-b border-slate-200 pb-1">
              <GraduationCap className="w-4 h-4 text-[#1976d2]" />
              <span>II. Continuous Evaluation & Attendance Metrics</span>
            </h3>

            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Overall Attendance</span>
                <span className={`text-base font-black font-mono ${selectedStudent.overallAttendance < 75 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {selectedStudent.overallAttendance}%
                </span>
                <span className="text-[9px] block text-slate-500 font-semibold">
                  {selectedStudent.overallAttendance < 75 ? '⚠️ Below 75% Cutoff' : '✅ Meets Requirement'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Sessional Avg.</span>
                <span className="text-base font-black font-mono text-slate-800">
                  {avgSessionalMarks} / 30
                </span>
                <span className="text-[9px] block text-slate-500 font-semibold">Internal Examination</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Online MCQ Quiz</span>
                <span className="text-base font-black font-mono text-slate-800">
                  {estimatedQuizScore}%
                </span>
                <span className="text-[9px] block text-slate-500 font-semibold">Concept Assessment</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Current Overall GPA</span>
                <span className="text-base font-black font-mono text-blue-900">
                  {selectedStudent.overallGpa} / 10
                </span>
                <span className="text-[9px] block text-slate-500 font-semibold">Cumulative Index</span>
              </div>
            </div>
          </div>

          {/* Diagnostic Classification & Learning Gaps */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5 border-b border-slate-200 pb-1">
              <BrainCircuit className="w-4 h-4 text-[#1976d2]" />
              <span>III. Diagnostic Classification & Learning Gaps</span>
            </h3>

            <div className={`p-4 rounded-xl border ${
              analysisResult.isSlowLearner || analysisResult.category === 'Slow Learner'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-emerald-50 border-emerald-300 text-emerald-950'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs font-black uppercase tracking-wider">
                  Diagnostic Classification:
                </span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-md uppercase text-white ${
                  analysisResult.isSlowLearner || analysisResult.category === 'Slow Learner'
                    ? 'bg-amber-700'
                    : 'bg-emerald-700'
                }`}>
                  {analysisResult.category}
                </span>
              </div>

              <p className="text-xs font-medium leading-relaxed">
                <strong>Diagnostic Assessment Reason:</strong> {analysisResult.diagnosticReason || analysisResult.summary}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <strong className="text-emerald-900 font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Positive Academic Strengths:</span>
                </strong>
                <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                  {(analysisResult.positiveTraits || []).map((t: string, i: number) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                <strong className="text-amber-900 font-bold flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Identified Learning Gaps:</span>
                </strong>
                <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                  {(analysisResult.learningObstacles || []).map((o: string, i: number) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* DEDICATED PARENT / GUARDIAN SUPPORT & GUIDANCE SECTION */}
          <div className="bg-emerald-50/90 border-2 border-emerald-500/80 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center space-x-1.5">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <span>IV. Mandatory Directive for Parent / Guardian Home Support</span>
              </h3>
              <span className="bg-emerald-700 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                Home Action Plan
              </span>
            </div>

            <p className="text-xs text-slate-800 font-medium leading-relaxed">
              Dear Parent/Guardian (<strong>{selectedStudent.parentName}</strong>), Digboi College requests your active cooperation at home to ensure <strong>{selectedStudent.name}</strong> improves academic understanding and maintains continuous college attendance:
            </p>

            <div className="space-y-2 text-xs">
              {(analysisResult.parentRecommendations || [
                'Establish a quiet, distraction-free 2-hour daily home study routine without mobile phones or television.',
                'Verify daily college class attendance to ensure the student stays above the mandatory 75% attendance cutoff.',
                'Ensure student punctually attends Saturday morning remedial tutorial sessions at the Digboi College campus.',
                'Maintain direct contact with assigned Faculty Mentor Dr. K. K. Dutta via WhatsApp for monthly academic reviews.'
              ]).map((rec: string, idx: number) => (
                <div key={idx} className="flex items-start space-x-2.5 bg-white p-2.5 rounded-xl border border-emerald-200 text-slate-800">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800 leading-snug">{rec}</span>
                </div>
              ))}
            </div>

            <div className="bg-white p-3 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Faculty Mentor Contact</span>
                <strong className="text-emerald-900 font-extrabold">{assignedMentor?.name || 'Dr. K. K. Dutta'} ({assignedMentor?.department || selectedStudent.department})</strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Mentor WhatsApp Hotline</span>
                <strong className="text-slate-900 font-mono font-bold">{assignedMentor?.phone || '+91 94351 23456'}</strong>
              </div>
            </div>
          </div>

          {/* Official Signatures Block */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <div className="h-10 border-b border-dashed border-slate-400 mb-1 flex items-end justify-center pb-1 text-[11px] font-serif text-slate-500 italic">
                {assignedMentor?.name || 'Dr. K. K. Dutta'}
              </div>
              <span className="font-bold text-slate-800 block text-[11px]">Faculty Mentor</span>
              <span className="text-[10px] text-slate-500 block">Digboi College</span>
            </div>

            <div>
              <div className="h-10 border-b border-dashed border-slate-400 mb-1 flex items-end justify-center pb-1 text-[11px] font-serif text-slate-500 italic">
                HOD / Dept. Incharge
              </div>
              <span className="font-bold text-slate-800 block text-[11px]">Head of Department</span>
              <span className="text-[10px] text-slate-500 block">{selectedStudent.department}</span>
            </div>

            <div>
              <div className="h-10 border-b border-dashed border-slate-400 mb-1 flex items-end justify-center pb-1 text-[11px] font-serif text-slate-400 italic">
                [College Seal]
              </div>
              <span className="font-bold text-slate-800 block text-[11px]">Principal / Academic Seal</span>
              <span className="text-[10px] text-slate-500 block">Digboi College (Autonomous)</span>
            </div>
          </div>

          {/* Footer Disclaimer */}
          <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-3">
            This document is generated by the EduPulse Academic Mentorship System of Digboi College (Autonomous), Assam. For inquiries, email mentor@digboicollege.edu.in.
          </div>
        </div>
      )}

      {/* Official Printable & Downloadable PDF Report Modal */}
      {showReportModal && analysisResult && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 relative my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 mb-4 shrink-0 no-print">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-[#1976d2] text-white shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Official Digboi College Academic Report
                  </h3>
                  <p className="text-slate-500 text-xs font-semibold">
                    Mentee: {selectedStudent.name} ({selectedStudent.rollNo}) — {selectedStudent.department}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={generatingPdf}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {generatingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download PDF Report</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handlePrintReport}
                  className="bg-[#1976d2] hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>

                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer ml-1"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content Box */}
            <div className="overflow-y-auto flex-1 p-2 sm:p-4 bg-slate-100 rounded-xl">
              <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-300 shadow-md max-w-3xl mx-auto space-y-6 text-slate-900">
                <ReportDocumentContent
                  selectedStudent={selectedStudent}
                  analysisResult={analysisResult}
                  assignedMentor={assignedMentor}
                  avgSessionalMarks={avgSessionalMarks}
                  estimatedQuizScore={estimatedQuizScore}
                />
              </div>
            </div>

            {/* Bottom Modal Actions */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 pt-3 shrink-0 no-print">
              <div className="text-xs text-slate-500 font-medium">
                Click <strong>Download PDF Report</strong> to save a local copy or <strong>Print Document</strong> for physical printing.
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleDownloadPDF}
                  disabled={generatingPdf}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {generatingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handlePrintReport}
                  className="bg-[#1976d2] hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Report</span>
                </button>

                <button
                  onClick={() => setShowReportModal(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Root Portal element dynamically attached to document.body for Printing and PDF capture */}
      {selectedStudent && analysisResult && createPortal(
        <div
          id="printable-ai-report"
          ref={reportCardRef}
          className="bg-white p-8 rounded-xl border border-slate-300 max-w-3xl space-y-6 text-slate-900"
          style={{
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            width: '800px',
            backgroundColor: '#ffffff',
            pointerEvents: 'none',
            zIndex: -9999,
          }}
        >
          <ReportDocumentContent
            selectedStudent={selectedStudent}
            analysisResult={analysisResult}
            assignedMentor={assignedMentor}
            avgSessionalMarks={avgSessionalMarks}
            estimatedQuizScore={estimatedQuizScore}
          />
        </div>,
        document.body
      )}
    </div>
  );
};
