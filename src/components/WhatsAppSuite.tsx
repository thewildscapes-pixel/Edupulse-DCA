import React, { useState, useEffect } from 'react';
import { Student, WhatsAppTemplate, Mentor } from '../types';
import { WHATSAPP_TEMPLATES } from '../data/mockData';
import { CollegeLogo } from './CollegeLogo';
import { 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  ExternalLink, 
  Phone, 
  UserCheck, 
  FileText,
  Sparkles,
  Loader2
} from 'lucide-react';

interface WhatsAppSuiteProps {
  students: Student[];
  currentMentor?: Mentor;
  initialStudentId?: string;
  customDraft?: string;
}

export const WhatsAppSuite: React.FC<WhatsAppSuiteProps> = ({
  students,
  currentMentor,
  initialStudentId,
  customDraft,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || (students && students.length > 0 ? students[0].id : '')
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('wt0');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [customRemark, setCustomRemark] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isAiComposing, setIsAiComposing] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (initialStudentId && students.some((s) => s.id === initialStudentId)) {
      setSelectedStudentId(initialStudentId);
    } else if (students.length > 0 && (!selectedStudentId || !students.some((s) => s.id === selectedStudentId))) {
      setSelectedStudentId(students[0].id);
    }
  }, [initialStudentId, students, selectedStudentId]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || (students.length > 0 ? students[0] : null);
  const selectedTemplate = WHATSAPP_TEMPLATES.find((t) => t.id === selectedTemplateId) || WHATSAPP_TEMPLATES[0];

  useEffect(() => {
    if (customDraft) {
      setCustomMessage(customDraft);
    } else if (selectedStudent && selectedTemplate) {
      let body = selectedTemplate.messageBody || selectedTemplate.templateText || '';
      body = body.replace(/({{STUDENT_NAME}}|{studentName})/gi, selectedStudent.name || '');
      body = body.replace(/({{ROLL_NO}}|{rollNo})/gi, selectedStudent.rollNo || '');
      body = body.replace(/({{PROGRAM}}|{program})/gi, selectedStudent.program || '');
      body = body.replace(/({{ATTENDANCE}}|{attendance})/gi, String(selectedStudent.overallAttendance ?? 0));
      body = body.replace(/({{GPA}}|{gpa})/gi, String(selectedStudent.overallGpa ?? 0));
      body = body.replace(/({{SUBJECT}}|{subject})/gi, selectedStudent.subjects?.[0]?.subjectName || 'Core Subjects');
      body = body.replace(/({{SCHEDULE}}|{schedule})/gi, 'Saturdays 08:30 AM - 10:00 AM');
      body = body.replace(/({{MENTOR_NAME}}|{mentorName})/gi, currentMentor?.name || selectedStudent?.mentorName || 'Faculty Mentor');
      body = body.replace(/({{MENTOR_PHONE}}|{mentorPhone})/gi, currentMentor?.phone || '+919435123456');
      setCustomMessage(body);
    }
  }, [selectedStudent, selectedTemplate, customDraft, currentMentor]);

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getWhatsAppUrl = () => {
    if (!selectedStudent) return '#';
    const cleanPhone = (selectedStudent.parentPhone || '').replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(customMessage);
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  };

  const handleAiCompose = async () => {
    if (!selectedStudent) return;
    setIsAiComposing(true);
    setAiError(null);

    const sessionalAvg = selectedStudent.subjects && selectedStudent.subjects.length > 0
      ? Math.round(selectedStudent.subjects.reduce((acc, curr) => acc + (curr.internalMarks || 0), 0) / selectedStudent.subjects.length)
      : 18;

    try {
      const response = await fetch('/api/generate-whatsapp-msg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: selectedStudent.name,
          rollNo: selectedStudent.rollNo,
          department: selectedStudent.department,
          attendance: selectedStudent.overallAttendance,
          sessionalAvg,
          customNote: customRemark || 'General academic review & attendance check-in',
          mentorName: currentMentor?.name || 'Faculty Mentor'
        })
      });

      const data = await response.json();
      if (!response.ok || !data.message) {
        throw new Error(data.error || 'Failed to compose message with AI');
      }

      setCustomMessage(data.message);
    } catch (err: any) {
      console.error('AI Compose error:', err);
      setAiError(err.message || 'Gemini API not available. Used standard template.');
    } finally {
      setIsAiComposing(false);
    }
  };

  if (!students || students.length === 0 || !selectedStudent) {
    return (
      <div className="space-y-6">
        <div className="bg-[#128c7e] text-white p-6 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-3.5">
            <CollegeLogo size="lg" className="shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-800 text-emerald-100 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                  Parent Communication Hub
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-1.5">
                Official WhatsApp Outreach Center
              </h2>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-2xl">
                Dispatch personalized attendance warnings, slow learner remediation invites, and term marksheets directly to guardians.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-3 shadow-2xs">
          <MessageSquare className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-lg">No Students Available for Messaging</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Add students to the roster to generate personalized WhatsApp alerts for parents and guardians.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-emerald-700 text-white p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <CollegeLogo size="lg" className="shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-900/60 text-emerald-100 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                  Direct Guardian Communication
                </span>
                <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Messaging Engine</span>
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-1.5">
                WhatsApp Communication Suite
              </h2>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
                Send personalized attendance nudges, slow learner remedial invitations, and academic milestones directly to guardians via WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column (1 Col) */}
        <div className="space-y-4">
          {/* Student Selector */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              1. Select Student & Guardian
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-600"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.rollNo}) — Guardian: {s.parentName}
                </option>
              ))}
            </select>

            <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-600">
              <div><strong className="text-slate-800">Parent Name:</strong> {selectedStudent?.parentName}</div>
              <div><strong className="text-slate-800">Phone (WhatsApp):</strong> {selectedStudent?.parentPhone}</div>
              <div><strong className="text-slate-800">Attendance:</strong> <span className={selectedStudent?.overallAttendance! < 75 ? 'text-red-600 font-bold' : 'text-emerald-700 font-bold'}>{selectedStudent?.overallAttendance}%</span></div>
            </div>
          </div>

          {/* AI Custom Remark Composer */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200 shadow-2xs space-y-3">
            <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Gemini AI Custom Composer</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Add specific teacher remarks to compose a personalized message with Gemini 2.5:
            </p>
            <input
              type="text"
              value={customRemark}
              onChange={(e) => setCustomRemark(e.target.value)}
              placeholder="e.g. Missed Friday's laboratory, needs parent conference"
              className="w-full bg-white border border-emerald-300 rounded-lg p-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <button
              onClick={handleAiCompose}
              disabled={isAiComposing}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isAiComposing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Composing with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>AI Compose Message</span>
                </>
              )}
            </button>
            {aiError && <p className="text-[10px] text-red-600 font-semibold">{aiError}</p>}
          </div>

          {/* Template Selector */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              2. Or Choose Standard Template
            </label>
            <div className="space-y-2">
              {WHATSAPP_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplateId(t.id)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all cursor-pointer ${
                    selectedTemplateId === t.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span>{t.title}</span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-md text-slate-500 font-normal border border-slate-200">
                      {t.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Message Composer & Preview Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Live WhatsApp Message Editor</span>
              </h3>
              <span className="text-xs text-slate-500">
                To: <strong className="text-slate-800">{selectedStudent?.parentPhone}</strong>
              </span>
            </div>

            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={7}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs font-mono text-slate-800 leading-relaxed outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />

            {/* Simulated WhatsApp Phone Bubble Preview */}
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Simulated WhatsApp Chat Preview
              </div>
              <div className="bg-[#dcf8c6] p-3.5 rounded-lg max-w-lg text-xs text-slate-800 shadow-2xs relative font-sans leading-relaxed">
                <p className="whitespace-pre-wrap">{customMessage}</p>
                <div className="text-[10px] text-emerald-800 text-right mt-2 font-medium">
                  Sent from Digboi College Faculty Portal • Just now ✓✓
                </div>
              </div>
            </div>

            {/* Send Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={handleCopy}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-600" />
                    <span>Copy Message Text</span>
                  </>
                )}
              </button>

              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>Open in WhatsApp & Send Direct</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
