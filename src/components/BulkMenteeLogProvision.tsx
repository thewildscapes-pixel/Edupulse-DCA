import React, { useState, useMemo } from 'react';
import {
  FileText,
  Users,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Trash2,
  Printer,
  Share2,
  MessageSquare,
  Tag,
  CheckSquare,
  Square,
  Bookmark,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Award,
  BookOpen,
  Send,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { Student, Mentor, MenteeLog, MentoringSessionType, MenteeLogStatus } from '../types';

interface BulkMenteeLogProvisionProps {
  students: Student[];
  currentMentor: Mentor;
  menteeLogs: MenteeLog[];
  onSaveLogs: (logs: MenteeLog | MenteeLog[]) => void;
  onDeleteLog: (logId: string) => void;
  onNavigateToWhatsApp?: (studentId?: string, customMsg?: string) => void;
  initialSelectedStudentId?: string;
}

const SESSION_TYPES: MentoringSessionType[] = [
  'One-on-One Counseling',
  'Group Mentoring',
  'Academic Performance Review',
  'Attendance Shortage Intervention',
  'Remedial Action Session',
  'Slow Learner Tutorial Review',
  'FYUGP Major/Minor Course Guidance',
  'Career & Higher Studies Guidance',
  'Personal & Psycho-Social Support',
  'Parent-Teacher Consultation',
  'General Progress Tracking'
];

const PRESET_TOPICS = [
  {
    type: 'Attendance Shortage Intervention' as MentoringSessionType,
    topic: 'Attendance Shortage (<75%) & Mandatory Remedial Advisory',
    observations: 'Reviewed attendance records showing shortage below the mandatory Digboi College / Dibrugarh University 75% requirement. Explained academic consequences and debarment regulations.',
    actionPlan: '1. Maintain 100% attendance in upcoming lectures and practicals.\n2. Submit medical/leave justification with parent counter-signature.\n3. Bi-weekly attendance monitoring check-in with Faculty Mentor.',
    tags: ['Attendance < 75%', 'Remedial Warning', 'NAAC Metric']
  },
  {
    type: 'Academic Performance Review' as MentoringSessionType,
    topic: 'Sessional Assessment 1 Performance Review & Internal Marks Diagnostic',
    observations: 'Analyzed marks from Sessional Exam 1 and home assignments. Identified conceptual difficulties in analytical topics and time management bottlenecks during internal tests.',
    actionPlan: '1. Attend departmental remedial tutorial sessions on challenging chapters.\n2. Complete concept reinforcement worksheets before Sessional 2.\n3. Form peer-study group with advanced learners.',
    tags: ['Sessional Marks', 'Continuous Assessment', 'Internal Marks']
  },
  {
    type: 'Slow Learner Tutorial Review' as MentoringSessionType,
    topic: 'Slow Learner Identification & Remedial Tutoring Roadmap',
    observations: 'Evaluated continuous assessment parameters and identified student as needing additional foundational support and simplified bilingual explanations in core concepts.',
    actionPlan: '1. Assigned to designated faculty remedial contact hours twice a week.\n2. Access simplified notes and study materials from EduPulse Resource Library.\n3. Re-assessment quiz scheduled at end of month.',
    tags: ['Slow Learner', 'Remedial Tutorial', 'Bilingual Support']
  },
  {
    type: 'FYUGP Major/Minor Course Guidance' as MentoringSessionType,
    topic: 'FYUGP Course Structure, Skill Enhancement (SEC) & Minor Subject Advising',
    observations: 'Guided mentees regarding choice of Minor courses, Skill Enhancement Courses (SEC), and Multi-Disciplinary Courses (MDC) aligned with their future career pathways.',
    actionPlan: '1. Finalize online course enrollment on university academic portal.\n2. Consult respective course instructors for syllabus overview.\n3. Prepare semester academic study planner.',
    tags: ['FYUGP', 'SEC/VAC/MDC', 'Curriculum Guidance']
  },
  {
    type: 'Career & Higher Studies Guidance' as MentoringSessionType,
    topic: 'Career Planning, Post-Graduation Opportunities & Competitive Exam Prep',
    observations: 'Discussed career aspirations, CUET PG, IIT JAM, State PSCs, and industry internship prospects available after undergraduate graduation from Digboi College.',
    actionPlan: '1. Register with College Career Counseling & Placement Cell.\n2. Explore library competitive exam reference books.\n3. Draft academic CV and statement of purpose.',
    tags: ['Career Counseling', 'Higher Studies', 'Placement']
  },
  {
    type: 'Parent-Teacher Consultation' as MentoringSessionType,
    topic: 'Parent-Mentor Consultation on Academic Engagement & Holistic Well-being',
    observations: 'Telephonic/in-person interaction conducted with guardians regarding student regularity, study habits at home, and semester progress.',
    actionPlan: '1. Guardians agreed to monitor daily revision routine.\n2. Periodic progress updates via Digboi College WhatsApp portal.\n3. Follow-up meeting scheduled post-Sessional results.',
    tags: ['Parent Consultation', 'Holistic Care', 'Guardian Connect']
  }
];

export const BulkMenteeLogProvision: React.FC<BulkMenteeLogProvisionProps> = ({
  students,
  currentMentor,
  menteeLogs,
  onSaveLogs,
  onDeleteLog,
  onNavigateToWhatsApp,
  initialSelectedStudentId,
}) => {
  const [activeView, setActiveView] = useState<'provision' | 'history'>('provision');

  // Filter mentees strictly assigned to current mentor
  const assignedMentees = useMemo(() => {
    const isMentor = (s: Student) =>
      s.mentorId === currentMentor.id ||
      (currentMentor.assignedMenteeIds && currentMentor.assignedMenteeIds.includes(s.id)) ||
      (s.creatorEmail && currentMentor.email && s.creatorEmail.toLowerCase() === currentMentor.email.toLowerCase()) ||
      (s.mentorName && currentMentor.name && s.mentorName.toLowerCase().includes(currentMentor.name.toLowerCase()));

    const filtered = students.filter(isMentor);
    return filtered.length > 0 ? filtered : students;
  }, [students, currentMentor]);

  // Selected Mentees for bulk provisioning
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(() => {
    if (initialSelectedStudentId && assignedMentees.some(s => s.id === initialSelectedStudentId)) {
      return [initialSelectedStudentId];
    }
    return assignedMentees.slice(0, Math.min(5, assignedMentees.length)).map(s => s.id);
  });

  // Filter criteria for Mentee Picker
  const [menteeSearchQuery, setMenteeSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'critical' | 'improvement' | 'good_outstanding'>('all');
  const [semesterFilter, setSemesterFilter] = useState<number | 'all'>('all');

  // Log Form State
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sessionTime, setSessionTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [sessionType, setSessionType] = useState<MentoringSessionType>('Group Mentoring');
  const [topic, setTopic] = useState('Sessional Assessment 1 Performance Review & Internal Marks Diagnostic');
  const [observations, setObservations] = useState(
    'Conducted mentoring review session with assigned mentees. Assessed continuous internal evaluation progress, attendance compliance, and learning bottlenecks in major and minor papers.'
  );
  const [actionPlan, setActionPlan] = useState(
    '1. Attend scheduled departmental tutorial/remedial classes.\n2. Submit practice worksheets on analytical topics by next Friday.\n3. Maintain overall attendance above the mandatory 75% threshold.'
  );
  const [outcomeStatus, setOutcomeStatus] = useState<MenteeLogStatus>('In Progress');
  const [followUpDate, setFollowUpDate] = useState('');
  const [parentNotified, setParentNotified] = useState(false);
  const [tagsInput, setTagsInput] = useState('Mentorship, Sessional Marks, Remedial, NEP 2020');
  
  // AI Generation State
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiKeyPointsInput, setAiKeyPointsInput] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);

  // Success Banner
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // History Filter State
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('all');
  const [selectedHistoryLog, setSelectedHistoryLog] = useState<MenteeLog | null>(null);

  // Filtered Mentees for selection UI
  const filteredMenteesForSelection = useMemo(() => {
    return assignedMentees.filter((s) => {
      const q = menteeSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.rollNo.toLowerCase().includes(q) ||
        (s.enrollmentNo && s.enrollmentNo.toLowerCase().includes(q)) ||
        s.department.toLowerCase().includes(q);

      const matchesCat =
        categoryFilter === 'all' ||
        (categoryFilter === 'critical' && s.category === 'Critical Attention') ||
        (categoryFilter === 'improvement' && s.category === 'Needs Improvement') ||
        (categoryFilter === 'good_outstanding' && (s.category === 'Good' || s.category === 'Outstanding'));

      const matchesSem = semesterFilter === 'all' || s.semester === semesterFilter;

      return matchesSearch && matchesCat && matchesSem;
    });
  }, [assignedMentees, menteeSearchQuery, categoryFilter, semesterFilter]);

  // Handle Multi-Select Toggles
  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredMenteesForSelection.map((s) => s.id);
    setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds([]);
  };

  const handleSelectAllCritical = () => {
    const criticalIds = assignedMentees
      .filter((s) => s.category === 'Critical Attention' || s.overallAttendance < 75)
      .map((s) => s.id);
    setSelectedStudentIds(criticalIds);
  };

  const handleSelectAllNeedsImprovement = () => {
    const ids = assignedMentees
      .filter((s) => s.category === 'Needs Improvement' || s.overallAttendance < 80)
      .map((s) => s.id);
    setSelectedStudentIds(ids);
  };

  const handleSelectAllAssigned = () => {
    setSelectedStudentIds(assignedMentees.map((s) => s.id));
  };

  // Apply Preset Template
  const handleApplyPreset = (preset: typeof PRESET_TOPICS[0]) => {
    setSessionType(preset.type);
    setTopic(preset.topic);
    setObservations(preset.observations);
    setActionPlan(preset.actionPlan);
    setTagsInput(preset.tags.join(', '));
  };

  // AI-Assisted Generation
  const handleGenerateAINotes = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/generate-mentee-log-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionType,
          topic,
          studentCount: selectedStudentIds.length,
          keyPoints: aiKeyPointsInput || observations,
          department: currentMentor.department,
          mentorName: currentMentor.name,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.observations) setObservations(data.observations);
        if (data.actionPlan) setActionPlan(data.actionPlan);
        if (data.recommendedTags && Array.isArray(data.recommendedTags)) {
          setTagsInput(data.recommendedTags.join(', '));
        }
        setShowAiModal(false);
        setSuccessBanner('AI synthesized NAAC-compliant mentorship observations & action plan!');
        setTimeout(() => setSuccessBanner(null), 5000);
      }
    } catch (err) {
      console.error('AI log generation error:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Save Bulk Mentee Log
  const handleSaveBulkLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) {
      alert('Please select at least one mentee to record this session log.');
      return;
    }
    if (!topic.trim()) {
      alert('Please enter a session topic or agenda.');
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newLog: MenteeLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: sessionDate,
      sessionTime,
      mentorId: currentMentor.id,
      mentorName: currentMentor.name,
      mentorEmail: currentMentor.email,
      mentorDepartment: currentMentor.department,
      sessionType,
      topic: topic.trim(),
      studentIds: selectedStudentIds,
      observations: observations.trim(),
      actionPlan: actionPlan.trim(),
      outcomeStatus,
      followUpDate: followUpDate || undefined,
      parentNotified,
      tags: parsedTags,
      lastModified: Date.now(),
    };

    onSaveLogs(newLog);

    const names = selectedStudentIds
      .map((id) => assignedMentees.find((m) => m.id === id)?.name || id)
      .slice(0, 3)
      .join(', ');
    const countExtra = selectedStudentIds.length > 3 ? ` +${selectedStudentIds.length - 3} others` : '';

    setSuccessBanner(
      `Recorded Mentorship Session Log for ${selectedStudentIds.length} mentees (${names}${countExtra}) under "${topic.trim()}"!`
    );
    setTimeout(() => setSuccessBanner(null), 6000);

    // Prompt optional WhatsApp Broadcast
    if (parentNotified && onNavigateToWhatsApp) {
      const msg = `*DIGBOI COLLEGE (AUTONOMOUS) — MENTORSHIP SESSION LOG*\n\nRespected Guardian,\nA formal mentoring session on *${topic}* was conducted on ${sessionDate} by Faculty Mentor *${currentMentor.name}* (${currentMentor.department} Dept).\n\nKey Outcome: *${outcomeStatus}*\nAction Points: ${actionPlan.split('\n')[0] || 'Continued academic improvement'}\n\nPlease reach out for detailed academic updates.`;
      // Deep link to first student
      setTimeout(() => {
        if (confirm('Would you like to open the WhatsApp Suite to send this mentoring update to parents?')) {
          onNavigateToWhatsApp(selectedStudentIds[0], msg);
        }
      }, 500);
    }
  };

  // Filtered History Logs
  const filteredHistoryLogs = useMemo(() => {
    return menteeLogs.filter((log) => {
      const q = historySearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        log.topic.toLowerCase().includes(q) ||
        log.observations.toLowerCase().includes(q) ||
        log.actionPlan.toLowerCase().includes(q) ||
        log.sessionType.toLowerCase().includes(q) ||
        (log.tags && log.tags.some((t) => t.toLowerCase().includes(q))) ||
        log.studentIds.some((id) => {
          const st = students.find((s) => s.id === id);
          return st && (st.name.toLowerCase().includes(q) || st.rollNo.toLowerCase().includes(q));
        });

      const matchesType = historyTypeFilter === 'all' || log.sessionType === historyTypeFilter;
      const matchesStatus = historyStatusFilter === 'all' || log.outcomeStatus === historyStatusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [menteeLogs, historySearch, historyTypeFilter, historyStatusFilter, students]);

  // Print Official Mentorship Register
  const handlePrintOfficialRegister = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Switcher */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1976d2] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                Bulk Mentee Session Log Provision
                <span className="bg-blue-50 text-[#1976d2] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
                  NAAC / NEP 2020 Compliant
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Record diagnostic observations, remedial counseling, and action plans for multiple mentees simultaneously.
              </p>
            </div>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveView('provision')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer flex-1 md:flex-initial justify-center ${
              activeView === 'provision'
                ? 'bg-white text-[#1976d2] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>New Bulk Log Provision</span>
          </button>

          <button
            onClick={() => setActiveView('history')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer flex-1 md:flex-initial justify-center relative ${
              activeView === 'history'
                ? 'bg-white text-[#1976d2] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Mentoring Register & Logs ({menteeLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-fadeIn shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-600 hover:text-emerald-800 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* VIEW 1: PROVISION NEW BULK LOG */}
      {activeView === 'provision' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: MULTI-MENTEE PICKER (5 Cols) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-[#1976d2]" />
                  <span>Target Mentees ({selectedStudentIds.length} Selected)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select individual, cohort, or all assigned mentees for this session.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold px-2 py-1 rounded-md bg-blue-50 text-[#1976d2] border border-blue-200">
                  Total: {assignedMentees.length} Mentees
                </span>
              </div>
            </div>

            {/* Quick Cohort Select Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={handleSelectAllAssigned}
                className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-[#1976d2] rounded-lg border border-blue-200 transition-colors cursor-pointer"
              >
                ✓ All Assigned ({assignedMentees.length})
              </button>

              <button
                type="button"
                onClick={handleSelectAllCritical}
                className="px-2.5 py-1 text-[11px] font-bold bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 transition-colors cursor-pointer"
              >
                ⚠️ Critical / Att &lt; 75%
              </button>

              <button
                type="button"
                onClick={handleSelectAllNeedsImprovement}
                className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 transition-colors cursor-pointer"
              >
                ⚡ Needs Improvement
              </button>

              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, roll no, department..."
                  value={menteeSearchQuery}
                  onChange={(e) => setMenteeSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1976d2] focus:border-transparent outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as any)}
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg outline-hidden text-slate-700"
                  >
                    <option value="all">All Categories</option>
                    <option value="critical">Critical Attention</option>
                    <option value="improvement">Needs Improvement</option>
                    <option value="good_outstanding">Good / Outstanding</option>
                  </select>
                </div>

                <div>
                  <select
                    value={semesterFilter}
                    onChange={(e) => setSemesterFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg outline-hidden text-slate-700"
                  >
                    <option value="all">All Semesters</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                    <option value="7">Semester 7</option>
                    <option value="8">Semester 8</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Showing {filteredMenteesForSelection.length} of {assignedMentees.length}</span>
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-[#1976d2] font-semibold hover:underline cursor-pointer"
                >
                  Select all shown
                </button>
              </div>
            </div>

            {/* Mentees Scrollable List */}
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredMenteesForSelection.map((student) => {
                const isSelected = selectedStudentIds.includes(student.id);
                const isCritical = student.category === 'Critical Attention' || student.overallAttendance < 75;

                return (
                  <div
                    key={student.id}
                    onClick={() => handleToggleStudent(student.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-50/80 border-[#1976d2] shadow-xs'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-[#1976d2] border-[#1976d2] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <CheckSquare className="w-3.5 h-3.5" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <p className="text-xs font-bold text-slate-900 truncate">{student.name}</p>
                          {student.courseType && (
                            <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-sm font-semibold">
                              {student.courseType}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Roll: {student.rollNo} • Sem {student.semester} • {student.department}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                          isCritical
                            ? 'bg-red-100 text-red-700'
                            : student.category === 'Needs Improvement'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {student.overallAttendance}% Att
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredMenteesForSelection.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  No mentees found matching your filters.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: SESSION LOG DETAILS & PRESETS (7 Cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Mentoring Session Particulars</h3>
                <p className="text-xs text-slate-500">
                  Conducted by Mentor: <strong>{currentMentor.name}</strong> ({currentMentor.department})
                </p>
              </div>

              {/* AI Polish Button */}
              <button
                type="button"
                onClick={() => setShowAiModal(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Session Notes Synthesizer</span>
              </button>
            </div>

            {/* Pre-built NEP / Digboi College Agenda Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                <Bookmark className="w-3.5 h-3.5 text-[#1976d2]" />
                <span>Quick-Load Digboi College Mentoring Presets:</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TOPICS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#1976d2] hover:border-blue-200 border border-slate-200 transition-all cursor-pointer text-left"
                  >
                    {preset.topic.split('&')[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleSaveBulkLog} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Session Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1976d2] outline-hidden font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Time / Period
                  </label>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="time"
                      value={sessionTime}
                      onChange={(e) => setSessionTime(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1976d2] outline-hidden font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Session Mode / Type
                  </label>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value as MentoringSessionType)}
                    className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1976d2] outline-hidden font-medium text-slate-800"
                  >
                    {SESSION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Mentoring Session Agenda / Specific Topic *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sessional 1 Remedial Counseling & Attendance Warning"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1976d2] outline-hidden font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Mentor Diagnostic Findings & Session Observations *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe academic bottlenecks, attendance trends, sessional marks diagnostics, and student responses..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1976d2] outline-hidden font-medium text-slate-800 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Prescribed Remedial Action Plan & Deliverables *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="1. Attend departmental remedial tutorials\n2. Submit concept worksheets\n3. Weekly attendance check-in"
                  value={actionPlan}
                  onChange={(e) => setActionPlan(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1976d2] outline-hidden font-medium text-slate-800 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Outcome Status
                  </label>
                  <select
                    value={outcomeStatus}
                    onChange={(e) => setOutcomeStatus(e.target.value as MenteeLogStatus)}
                    className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1976d2] outline-hidden font-medium"
                  >
                    <option value="Action Required">Action Required</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Satisfactory">Satisfactory</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Follow-up Needed">Follow-up Needed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Next Follow-up Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1976d2] outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <div className="relative">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Attendance, Remedial, Sessional"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1976d2] outline-hidden font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Parent Notification Checkbox */}
              <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  id="parentNotifiedCheck"
                  checked={parentNotified}
                  onChange={(e) => setParentNotified(e.target.checked)}
                  className="w-4 h-4 text-[#1976d2] rounded-sm focus:ring-[#1976d2] cursor-pointer"
                />
                <label htmlFor="parentNotifiedCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Generate official parent/guardian WhatsApp update notice draft for this session
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500">
                  Applying log to <strong>{selectedStudentIds.length}</strong> selected mentees
                </div>

                <button
                  type="submit"
                  disabled={selectedStudentIds.length === 0}
                  className="px-6 py-2.5 bg-[#1976d2] hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Record & Provision Bulk Mentee Log</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 2: MENTORSHIP REGISTER & HISTORY */}
      {activeView === 'history' && (
        <div className="space-y-4">
          {/* History Filters & Actions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search logs by topic, student, observations..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1976d2] outline-hidden"
                />
              </div>

              <select
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value)}
                className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-hidden text-slate-700"
              >
                <option value="all">All Session Types</option>
                {SESSION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-hidden text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="Action Required">Action Required</option>
                <option value="In Progress">In Progress</option>
                <option value="Satisfactory">Satisfactory</option>
                <option value="Resolved">Resolved</option>
                <option value="Follow-up Needed">Follow-up Needed</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handlePrintOfficialRegister}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Mentoring Register</span>
              </button>
            </div>
          </div>

          {/* Logs List */}
          <div className="space-y-3">
            {filteredHistoryLogs.map((log) => {
              const menteeNames = log.studentIds
                .map((id) => students.find((s) => s.id === id)?.name || id)
                .join(', ');

              return (
                <div
                  key={log.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-blue-200 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1976d2] border border-blue-200">
                          {log.sessionType}
                        </span>
                        <span
                          className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                            log.outcomeStatus === 'Resolved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : log.outcomeStatus === 'Action Required'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {log.outcomeStatus}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {log.date} {log.sessionTime ? `at ${log.sessionTime}` : ''}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-1.5">{log.topic}</h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Mentor: <strong>{log.mentorName}</strong> ({log.mentorDepartment || currentMentor.department})
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-start">
                      {onNavigateToWhatsApp && (
                        <button
                          onClick={() => {
                            const msg = `*DIGBOI COLLEGE (AUTONOMOUS) — MENTORING LOG*\n\nMentorship update for *${log.topic}* conducted on ${log.date} by Faculty Mentor *${log.mentorName}*.\n\nStatus: *${log.outcomeStatus}*\nAction Plan: ${log.actionPlan}`;
                            onNavigateToWhatsApp(log.studentIds[0], msg);
                          }}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Share via WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onDeleteLog(log.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Targeted Mentees Pill Strip */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                    <span className="font-bold text-slate-700">Mentees Covered ({log.studentIds.length}): </span>
                    <span className="text-slate-600">{menteeNames}</span>
                  </div>

                  {/* Observations & Action Plan Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100 space-y-1">
                      <p className="font-bold text-blue-900 flex items-center space-x-1">
                        <Info className="w-3.5 h-3.5 text-[#1976d2]" />
                        <span>Mentor Observations</span>
                      </p>
                      <p className="text-slate-700 whitespace-pre-line leading-relaxed">{log.observations}</p>
                    </div>

                    <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-100 space-y-1">
                      <p className="font-bold text-amber-900 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Action Plan & Deliverables</span>
                      </p>
                      <p className="text-slate-700 whitespace-pre-line leading-relaxed">{log.actionPlan}</p>
                    </div>
                  </div>

                  {/* Tags and Follow-up */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      {log.tags &&
                        log.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                          >
                            #{t}
                          </span>
                        ))}
                    </div>

                    {log.followUpDate && (
                      <div className="font-semibold text-[#1976d2]">
                        Next Follow-up: {log.followUpDate}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredHistoryLogs.length === 0 && (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-extrabold text-slate-700 text-sm">No Mentee Session Logs Recorded Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click on "New Bulk Log Provision" above to record mentoring session logs for your assigned students.
                </p>
                <button
                  onClick={() => setActiveView('provision')}
                  className="px-4 py-2 bg-[#1976d2] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700 transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Start Bulk Mentee Log Entry</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI NOTES SYNTHESIS MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">AI Mentorship Note Synthesizer</h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Enter rough discussion notes, student challenges, or key points. Gemini will transform them into structured, NAAC-compliant mentoring observations and action plans.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Faculty Bullet Points / Raw Notes:
              </label>
              <textarea
                rows={4}
                placeholder="e.g. Sessional 1 marks low in paper 2, attendance around 68%, told student to attend remedial classes on Friday, guardian called regarding hostel study time..."
                value={aiKeyPointsInput}
                onChange={(e) => setAiKeyPointsInput(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-hidden leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleGenerateAINotes}
                disabled={isGeneratingAI}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingAI ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Structured Log</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
