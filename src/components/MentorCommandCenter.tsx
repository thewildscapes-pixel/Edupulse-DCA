import React, { useState } from 'react';
import { 
  UserCheck, 
  Users, 
  AlertTriangle, 
  Bell, 
  CheckCircle2, 
  UserPlus, 
  Edit3, 
  BrainCircuit, 
  MessageSquare, 
  Phone, 
  Mail, 
  BookOpen, 
  Calendar,
  FileText,
  Shield,
  Layers,
  FileSpreadsheet,
  Plus,
  Save,
  Check,
  Award,
  Sparkles,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { Student, Mentor, TeacherUpdateLog, Role, CourseCategory, SubjectMarks } from '../types';

interface MentorCommandCenterProps {
  students: Student[];
  currentMentor: Mentor;
  mentors: Mentor[];
  teacherUpdates: TeacherUpdateLog[];
  userEmail: string;
  currentRole: Role;
  onMarkUpdateRead: (updateId: string) => void;
  onUpdateNotes?: (studentId: string, notes: string) => void;
  onBulkUpdateMarks?: (updatedStudents: Student[]) => void;
  onNavigate: (tab: string, studentId?: string) => void;
  onOpenAddMentee: () => void;
  onOpenEditProfile: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
}

const NEP_COURSE_CATEGORIES: CourseCategory[] = ['Major', 'Minor', 'Core', 'MDC', 'SEC', 'AEC', 'VAC'];

function recalculateStudentStats(student: Student): Student {
  const subs = student.subjects || [];
  if (subs.length === 0) return student;

  let totalInternalSum = 0;
  let totalAttSum = 0;
  let count = 0;

  subs.forEach((sub) => {
    const s1 = Number(sub.sessional1) || 0;
    const s2 = Number(sub.sessional2) || 0;
    const asg = Number(sub.assignmentSeminarOthers) || 0;
    const internal = typeof sub.internalMarks === 'number' ? sub.internalMarks : Math.min(40, s1 + s2 + asg);
    totalInternalSum += internal;
    totalAttSum += (sub.attendancePercent || student.overallAttendance || 80);
    count++;
  });

  const avgInternal = Math.round(totalInternalSum / count); // out of 40
  const avgAtt = Math.round(totalAttSum / count);
  const newGpa = Math.min(10, Math.round(((avgInternal / 40) * 10) * 10) / 10);

  const newCategory = (avgAtt < 75 || avgInternal < 20)
    ? 'Critical Attention'
    : (avgInternal < 26 ? 'Needs Improvement' : (newGpa >= 8.5 ? 'Outstanding' : 'Good'));

  return {
    ...student,
    overallAttendance: avgAtt,
    overallGpa: newGpa,
    category: newCategory,
    lastModified: Date.now(),
  };
}

export const MentorCommandCenter: React.FC<MentorCommandCenterProps> = ({
  students,
  currentMentor,
  mentors,
  teacherUpdates,
  userEmail,
  currentRole,
  onMarkUpdateRead,
  onUpdateNotes,
  onBulkUpdateMarks,
  onNavigate,
  onOpenAddMentee,
  onOpenEditProfile,
  onEditStudent,
  onDeleteStudent,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'mentees' | 'semester-marks' | 'bulk-marks' | 'updates'>('mentees');

  // Filter mentees strictly assigned to current mentor across devices
  const normEmail = currentMentor.email ? currentMentor.email.trim().toLowerCase() : '';
  const normPhone = currentMentor.phone ? currentMentor.phone.replace(/\D/g, '').slice(-10) : '';

  const mentees = students.filter((s) => {
    const isDirectMentorId = s.mentorId === currentMentor.id;
    const isAssigned = currentMentor.assignedMenteeIds && currentMentor.assignedMenteeIds.includes(s.id);
    const isCreatorEmail = Boolean(normEmail && s.creatorEmail && s.creatorEmail.trim().toLowerCase() === normEmail);
    const isCreatedBy = Boolean(normEmail && s.createdBy && s.createdBy.trim().toLowerCase() === normEmail);

    return isDirectMentorId || isAssigned || isCreatorEmail || isCreatedBy;
  });

  const displayMentees = mentees;
  const unreadUpdates = teacherUpdates.filter((u) => !u.isRead);

  // Single Mentee Semester Marks State
  const [selectedMenteeId, setSelectedMenteeId] = useState<string>(displayMentees[0]?.id || '');
  const [selectedSemester, setSelectedSemester] = useState<number>(1);

  // Single Course Mark Form State
  const [subjectNameInput, setSubjectNameInput] = useState<string>('Physics Major Paper 1');
  const [courseCategoryInput, setCourseCategoryInput] = useState<CourseCategory>('Major');
  const [sessional1Input, setSessional1Input] = useState<number | ''>(8);
  const [sessional2Input, setSessional2Input] = useState<number | ''>(8.5);
  const [assignmentInput, setAssignmentInput] = useState<number | ''>(17);
  const [semesterMarksInput, setSemesterMarksInput] = useState<number | ''>(68);
  const [attendanceInput, setAttendanceInput] = useState<number | ''>(88);
  const [singleSuccessBanner, setSingleSuccessBanner] = useState<string>('');

  // Bulk Marks Entry State
  const [bulkSemester, setBulkSemester] = useState<number>(1);
  const [bulkCategory, setBulkCategory] = useState<CourseCategory>('Major');
  const [bulkSubjectName, setBulkSubjectName] = useState<string>('Major Paper - Semester 1');
  const [bulkData, setBulkData] = useState<Record<string, { s1: number | ''; s2: number | ''; asg: number | ''; semMarks: number | ''; att: number | '' }>>({});
  const [bulkSuccessBanner, setBulkSuccessBanner] = useState<string>('');

  // Handle selected mentee change for single entry
  const selectedMentee = displayMentees.find((m) => m.id === selectedMenteeId) || displayMentees[0];

  // Filter subject marks for selected mentee and semester
  const selectedMenteeSubjects = (selectedMentee?.subjects || []).filter(
    (sub) => (sub.semester || selectedMentee?.semester || 1) === selectedSemester
  );

  // Single Course Mark Submission
  const handleAddSingleSubjectMarks = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentee) {
      alert('Please select a mentee.');
      return;
    }
    if (!subjectNameInput.trim()) {
      alert('Please enter a subject name.');
      return;
    }

    const s1 = Number(sessional1Input) || 0;
    const s2 = Number(sessional2Input) || 0;
    const asg = Number(assignmentInput) || 0;
    const totalInternal = Math.min(40, s1 + s2 + asg);

    const newSubjectEntry: SubjectMarks = {
      subjectName: subjectNameInput.trim(),
      courseCategory: courseCategoryInput,
      semester: selectedSemester,
      sessional1: s1,
      sessional2: s2,
      assignmentSeminarOthers: asg,
      internalMarks: totalInternal,
      semesterMarks: Number(semesterMarksInput) || undefined,
      attendancePercent: Number(attendanceInput) || 85,
      enteredBy: currentMentor.name,
      teacherEmail: userEmail,
      lastUpdated: Date.now(),
    };

    // Filter out existing subject with same name and semester
    const otherSubjects = (selectedMentee.subjects || []).filter(
      (sub) =>
        !(
          sub.subjectName.trim().toLowerCase() === subjectNameInput.trim().toLowerCase() &&
          (sub.semester || 1) === selectedSemester
        )
    );

    const updatedSubjects = [newSubjectEntry, ...otherSubjects];
    const updatedMentee = recalculateStudentStats({
      ...selectedMentee,
      subjects: updatedSubjects,
    });

    const allUpdated = students.map((s) => (s.id === updatedMentee.id ? updatedMentee : s));

    if (onBulkUpdateMarks) {
      onBulkUpdateMarks(allUpdated);
    }

    setSingleSuccessBanner(
      `Recorded ${subjectNameInput} (${courseCategoryInput}) marks for ${selectedMentee.name} [Sem ${selectedSemester}]!`
    );
    setTimeout(() => setSingleSuccessBanner(''), 5000);
  };

  // Delete Subject Mark for Single Mentee
  const handleDeleteSubjectMark = (subjName: string) => {
    if (!selectedMentee) return;
    const updatedSubjects = (selectedMentee.subjects || []).filter(
      (sub) =>
        !(
          sub.subjectName.trim().toLowerCase() === subjName.trim().toLowerCase() &&
          (sub.semester || 1) === selectedSemester
        )
    );
    const updatedMentee = recalculateStudentStats({
      ...selectedMentee,
      subjects: updatedSubjects,
    });
    const allUpdated = students.map((s) => (s.id === updatedMentee.id ? updatedMentee : s));
    if (onBulkUpdateMarks) {
      onBulkUpdateMarks(allUpdated);
    }
  };

  // Handle Bulk Marks Entry Change
  const handleBulkInputChange = (studentId: string, field: 's1' | 's2' | 'asg' | 'semMarks' | 'att', value: string) => {
    const num = value === '' ? '' : Number(value);
    setBulkData((prev) => ({
      ...prev,
      [studentId]: {
        s1: prev[studentId]?.s1 ?? 8,
        s2: prev[studentId]?.s2 ?? 8.5,
        asg: prev[studentId]?.asg ?? 16,
        semMarks: prev[studentId]?.semMarks ?? 65,
        att: prev[studentId]?.att ?? 85,
        [field]: num,
      },
    }));
  };

  // Save Bulk Mentee Marks
  const handleSaveBulkMarks = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayMentees.length === 0) {
      alert('No mentees assigned to perform bulk mark entry.');
      return;
    }
    if (!bulkSubjectName.trim()) {
      alert('Please specify a subject name for bulk mark entry.');
      return;
    }

    let updatedCount = 0;
    const updatedMenteesList = students.map((student) => {
      // Check if student is an assigned mentee
      const isMentee = student.mentorId === currentMentor.id || (currentMentor.assignedMenteeIds && currentMentor.assignedMenteeIds.includes(student.id));
      if (!isMentee) return student;

      const row = bulkData[student.id] || { s1: 8, s2: 8.5, asg: 16, semMarks: 65, att: 85 };
      const s1 = Number(row.s1) || 0;
      const s2 = Number(row.s2) || 0;
      const asg = Number(row.asg) || 0;
      const semM = Number(row.semMarks) || 0;
      const att = Number(row.att) || 85;
      const totalInternal = Math.min(40, s1 + s2 + asg);

      const newSubjectEntry: SubjectMarks = {
        subjectName: bulkSubjectName.trim(),
        courseCategory: bulkCategory,
        semester: bulkSemester,
        sessional1: s1,
        sessional2: s2,
        assignmentSeminarOthers: asg,
        internalMarks: totalInternal,
        semesterMarks: semM || undefined,
        attendancePercent: att,
        enteredBy: currentMentor.name,
        teacherEmail: userEmail,
        lastUpdated: Date.now(),
      };

      const otherSubjects = (student.subjects || []).filter(
        (sub) =>
          !(
            sub.subjectName.trim().toLowerCase() === bulkSubjectName.trim().toLowerCase() &&
            (sub.semester || 1) === bulkSemester
          )
      );

      updatedCount++;
      return recalculateStudentStats({
        ...student,
        subjects: [newSubjectEntry, ...otherSubjects],
      });
    });

    if (onBulkUpdateMarks) {
      onBulkUpdateMarks(updatedMenteesList);
    }

    setBulkSuccessBanner(
      `Successfully entered bulk marks for ${updatedCount} mentees under Semester ${bulkSemester} (${bulkCategory} - ${bulkSubjectName.trim()})!`
    );
    setTimeout(() => setBulkSuccessBanner(''), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Mentor Profile Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-blue-100 text-[#1976d2] rounded-2xl flex items-center justify-center font-bold text-xl border border-blue-200 shrink-0">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <h2 className="text-xl font-extrabold text-slate-900">{currentMentor.name}</h2>
              <span className="bg-blue-50 text-[#1976d2] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
                {currentMentor.department} Dept Mentor
              </span>
            </div>
            <div className="flex items-center space-x-4 text-xs text-slate-500 font-medium mt-1 flex-wrap gap-y-1">
              <span className="flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentMentor.email}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentMentor.phone}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <button
            onClick={onOpenEditProfile}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={onOpenAddMentee}
            className="px-4 py-2 bg-[#1976d2] hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Mentee</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('mentees')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'mentees'
              ? 'bg-[#1976d2] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Assigned Mentees ({displayMentees.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('semester-marks')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'semester-marks'
              ? 'bg-[#1976d2] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Mentee Semester Marks Tracker</span>
        </button>

        <button
          onClick={() => setActiveSubTab('bulk-marks')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'bulk-marks'
              ? 'bg-[#1976d2] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Bulk Mentee Marks Entry</span>
        </button>

        <button
          onClick={() => setActiveSubTab('updates')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 relative cursor-pointer ${
            activeSubTab === 'updates'
              ? 'bg-[#1976d2] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Teacher Feed & Updates</span>
          {unreadUpdates.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
              {unreadUpdates.length}
            </span>
          )}
        </button>
      </div>

      {/* SUB-TAB 1: ASSIGNED MENTEES */}
      {activeSubTab === 'mentees' && (
        <>
          {displayMentees.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
              <Shield className="w-10 h-10 text-[#1976d2] mx-auto" />
              <h3 className="font-extrabold text-slate-900 text-base">Mentee Secrecy & Privacy Policy Guard</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                No mentees are currently assigned to your mentor profile (<strong>{currentMentor.name}</strong>). Under Digboi College mentorship guidelines, student profiles and performance diagnostics are strictly restricted to the assigned mentor only.
              </p>
              <button
                onClick={onOpenAddMentee}
                className="px-4 py-2 bg-[#1976d2] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Register New Mentee</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayMentees.map((student) => {
                const isCritical = student.category === 'Critical Attention' || student.overallAttendance < 75;
                return (
                  <div
                    key={student.id}
                    className={`bg-white rounded-2xl border ${
                      isCritical ? 'border-red-200 shadow-xs' : 'border-slate-200'
                    } p-5 space-y-4 hover:shadow-md transition-all flex flex-col justify-between`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{student.name}</h3>
                          <p className="text-xs text-slate-500 font-mono">{student.rollNo}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{student.program}</p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isCritical ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {student.category}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">ATTENDANCE</span>
                          <span
                            className={`font-extrabold ${
                              student.overallAttendance < 75 ? 'text-red-600' : 'text-slate-800'
                            }`}
                          >
                            {student.overallAttendance}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">GPA / MARKS</span>
                          <span className="font-extrabold text-slate-800">{student.overallGpa} / 10</span>
                        </div>
                      </div>

                      {student.guardianPhone && (
                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          <p className="font-semibold text-slate-700">Guardian: {student.guardianName || 'N/A'}</p>
                          <p className="text-slate-500 font-mono">{student.guardianPhone}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <button
                        onClick={() => {
                          setSelectedMenteeId(student.id);
                          setActiveSubTab('semester-marks');
                        }}
                        className="w-full py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-[#1976d2] font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Enter / Track Semester Marks</span>
                      </button>

                      <div className="flex items-center justify-between gap-1">
                        <button
                          onClick={() => onEditStudent(student)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-[#1976d2]" />
                          <span>👤 View/Edit Profile</span>
                        </button>

                        <button
                          onClick={() => onNavigate('ai-analysis', student.id)}
                          className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#1976d2] hover:underline cursor-pointer"
                        >
                          <BrainCircuit className="w-3.5 h-3.5" />
                          <span>AI Diagnosis</span>
                        </button>

                        <div className="flex space-x-1">
                          <button
                            onClick={() => onNavigate('whatsapp', student.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Send WhatsApp Nudge"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditStudent(student)}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Student Record"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* SUB-TAB 2: MENTEE SEMESTER MARKS TRACKER */}
      {activeSubTab === 'semester-marks' && (
        <div className="space-y-6">
          {singleSuccessBanner && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{singleSuccessBanner}</span>
            </div>
          )}

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-[#1976d2]" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Mentee Semester & Course Category Marks Tracker</h3>
                  <p className="text-xs text-slate-500">Record and monitor performance across Core, Major, Minor, MDC, SEC, VAC, AEC for Semesters 1–8.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedMenteeId}
                  onChange={(e) => setSelectedMenteeId(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {displayMentees.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.rollNo})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(Number(e.target.value))}
                  className="px-3 py-1.5 border border-blue-200 rounded-xl text-xs font-extrabold text-[#1976d2] bg-blue-50 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedMentee ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Form to Enter / Edit Course Marks */}
                <form onSubmit={handleAddSingleSubjectMarks} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                      <Plus className="w-4 h-4 text-[#1976d2]" />
                      <span>Record Course Mark</span>
                    </h4>
                    <span className="text-[10px] font-extrabold bg-blue-100 text-[#1976d2] px-2 py-0.5 rounded-full">
                      Sem {selectedSemester}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Subject / Paper Name</label>
                      <input
                        type="text"
                        value={subjectNameInput}
                        onChange={(e) => setSubjectNameInput(e.target.value)}
                        placeholder="e.g. Mechanics & Relativity"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Course Category</label>
                        <select
                          value={courseCategoryInput}
                          onChange={(e) => setCourseCategoryInput(e.target.value as CourseCategory)}
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-[#1976d2]"
                        >
                          {NEP_COURSE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Semester</label>
                        <select
                          value={selectedSemester}
                          onChange={(e) => setSelectedSemester(Number(e.target.value))}
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                            <option key={sem} value={sem}>Sem {sem}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">1st Sess. (/10)</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="10"
                          value={sessional1Input}
                          onChange={(e) => setSessional1Input(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-center outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">2nd Sess. (/10)</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="10"
                          value={sessional2Input}
                          onChange={(e) => setSessional2Input(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-center outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Asg/Sem (/20)</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="20"
                          value={assignmentInput}
                          onChange={(e) => setAssignmentInput(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-center outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">End-Sem Exam Marks (/60)</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="60"
                          value={semesterMarksInput}
                          onChange={(e) => setSemesterMarksInput(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="Max 60"
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-center outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Attendance %</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={attendanceInput}
                          onChange={(e) => setAttendanceInput(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-center outline-none focus:ring-2 focus:ring-blue-500 font-bold text-emerald-700"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#1976d2] hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Course Marks</span>
                    </button>
                  </div>
                </form>

                {/* Right Column: Existing Course Marks Table & Summary for Selected Semester */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Mentee: </span>
                      <strong className="text-slate-900 font-bold">{selectedMentee.name}</strong>
                      <span className="text-slate-400 font-mono ml-2">({selectedMentee.rollNo})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Overall GPA: </span>
                      <strong className="text-[#1976d2] font-black">{selectedMentee.overallGpa} / 10</strong>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800">
                        Semester {selectedSemester} Registered Course Papers
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {selectedMenteeSubjects.length} courses recorded
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200">
                            <th className="p-2.5 pl-4">Category</th>
                            <th className="p-2.5">Subject Paper</th>
                            <th className="p-2.5 text-center">Sess 1 (/10)</th>
                            <th className="p-2.5 text-center">Sess 2 (/10)</th>
                            <th className="p-2.5 text-center">Asg (/20)</th>
                            <th className="p-2.5 text-center">Internal Total (/40)</th>
                            <th className="p-2.5 text-center">End-Sem (/80)</th>
                            <th className="p-2.5 pr-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedMenteeSubjects.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                                No course marks recorded for Semester {selectedSemester} yet. Use the form on the left to add paper marks under Core, Major, Minor, MDC, SEC, VAC, or AEC.
                              </td>
                            </tr>
                          ) : (
                            selectedMenteeSubjects.map((sub, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2.5 pl-4">
                                  <span className="px-2 py-0.5 rounded-full font-extrabold text-[10px] bg-blue-100 text-[#1976d2] border border-blue-200">
                                    {sub.courseCategory || 'Major'}
                                  </span>
                                </td>
                                <td className="p-2.5 font-bold text-slate-800">{sub.subjectName}</td>
                                <td className="p-2.5 text-center font-mono">{sub.sessional1 ?? '-'}</td>
                                <td className="p-2.5 text-center font-mono">{sub.sessional2 ?? '-'}</td>
                                <td className="p-2.5 text-center font-mono">{sub.assignmentSeminarOthers ?? '-'}</td>
                                <td className="p-2.5 text-center font-extrabold text-blue-700 font-mono">
                                  {sub.internalMarks ?? ((sub.sessional1 || 0) + (sub.sessional2 || 0) + (sub.assignmentSeminarOthers || 0))}
                                </td>
                                <td className="p-2.5 text-center font-mono font-bold text-slate-900">
                                  {sub.semesterMarks ?? '-'}
                                </td>
                                <td className="p-2.5 pr-4 text-right">
                                  <button
                                    onClick={() => handleDeleteSubjectMark(sub.subjectName)}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Course Mark"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                No mentees available. Please add mentees first.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: BULK MENTEE MARKS ENTRY */}
      {activeSubTab === 'bulk-marks' && (
        <div className="space-y-6">
          {bulkSuccessBanner && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{bulkSuccessBanner}</span>
            </div>
          )}

          <form onSubmit={handleSaveBulkMarks} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-[#1976d2]" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Bulk Mentee Marks Entry Panel</h3>
                  <p className="text-xs text-slate-500">
                    Batch-enter semester marks for all assigned mentees across Core, Major, Minor, MDC, SEC, VAC, AEC categories.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-[#1976d2] hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer w-full md:w-auto justify-center shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>Save Bulk Mentee Marks</span>
              </button>
            </div>

            {/* Bulk Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Semester</label>
                <select
                  value={bulkSemester}
                  onChange={(e) => setBulkSemester(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-[#1976d2] outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Category</label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value as CourseCategory)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-extrabold text-blue-800 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {NEP_COURSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject / Paper Name</label>
                <input
                  type="text"
                  value={bulkSubjectName}
                  onChange={(e) => setBulkSubjectName(e.target.value)}
                  placeholder="e.g. Major Paper 1 / Core Physics"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Bulk Table Grid */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-3 pl-4">Mentee Name & Roll No</th>
                      <th className="p-3 text-center">1st Sess. (/10)</th>
                      <th className="p-3 text-center">2nd Sess. (/10)</th>
                      <th className="p-3 text-center">Asg/Sem (/20)</th>
                      <th className="p-3 text-center">End-Sem Exam (/80)</th>
                      <th className="p-3 text-center">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayMentees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          No assigned mentees found to perform bulk mark entry.
                        </td>
                      </tr>
                    ) : (
                      displayMentees.map((m) => {
                        const row = bulkData[m.id] || { s1: 8, s2: 8.5, asg: 16, semMarks: 65, att: 85 };
                        return (
                          <tr key={m.id} className="hover:bg-slate-50">
                            <td className="p-3 pl-4 font-bold text-slate-900">
                              <div>{m.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono font-normal">{m.rollNo}</div>
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="10"
                                value={row.s1}
                                onChange={(e) => handleBulkInputChange(m.id, 's1', e.target.value)}
                                className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded-lg font-bold outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="10"
                                value={row.s2}
                                onChange={(e) => handleBulkInputChange(m.id, 's2', e.target.value)}
                                className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded-lg font-bold outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="20"
                                value={row.asg}
                                onChange={(e) => handleBulkInputChange(m.id, 'asg', e.target.value)}
                                className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded-lg font-bold outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                step="1"
                                min="0"
                                max="100"
                                value={row.semMarks}
                                onChange={(e) => handleBulkInputChange(m.id, 'semMarks', e.target.value)}
                                className="w-20 px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                step="1"
                                min="0"
                                max="100"
                                value={row.att}
                                onChange={(e) => handleBulkInputChange(m.id, 'att', e.target.value)}
                                className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded-lg font-bold text-emerald-700 outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 4: TEACHER FEED & UPDATES */}
      {activeSubTab === 'updates' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Teacher Log Entries & Sessional Updates</h3>
            <span className="text-xs text-slate-500 font-medium">{teacherUpdates.length} total entries</span>
          </div>

          {teacherUpdates.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No teacher updates logged yet. Teachers can publish sessional marks & attendance updates from the Assessment Center.
            </div>
          ) : (
            <div className="space-y-3">
              {teacherUpdates.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 rounded-xl border ${
                    log.isRead ? 'bg-slate-50/60 border-slate-200' : 'bg-blue-50/50 border-blue-200'
                  } space-y-2`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">
                      {log.teacherName} ({log.subject})
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">{log.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-700">{log.description}</p>
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-500">
                      Type: <strong className="capitalize">{log.updateType.replace('_', ' ')}</strong>
                    </span>
                    {!log.isRead && (
                      <button
                        onClick={() => onMarkUpdateRead(log.id)}
                        className="text-[#1976d2] font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Read</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
