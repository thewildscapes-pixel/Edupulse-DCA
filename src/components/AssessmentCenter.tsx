import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Upload, 
  FileSpreadsheet, 
  Save, 
  Plus, 
  CheckCircle2, 
  Edit3, 
  Trash2,
  AlertCircle,
  Download,
  Search,
  UserCheck,
  Send,
  Sparkles,
  BookOpen,
  Filter
} from 'lucide-react';
import { Student, Mentor, Role, TeacherUpdateLog, CourseCategory, Department, ALL_DEPARTMENTS, SubjectMarks } from '../types';

interface AssessmentCenterProps {
  students: Student[];
  currentMentor: Mentor;
  mentors: Mentor[];
  userEmail: string;
  currentRole: Role;
  onBulkUpdateMarks: (updatedStudents: Student[]) => void;
  onBulkAddStudents: (newStudents: Student[]) => void;
  onAddTeacherUpdate: (updateLog: Omit<TeacherUpdateLog, 'id' | 'timestamp' | 'readByMentor'>) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
}

const COURSE_CATEGORIES: CourseCategory[] = ['Major', 'Minor', 'Core', 'MDC', 'SEC', 'AEC', 'VAC'];

export const AssessmentCenter: React.FC<AssessmentCenterProps> = ({
  students,
  currentMentor,
  mentors,
  userEmail,
  currentRole,
  onBulkUpdateMarks,
  onBulkAddStudents,
  onAddTeacherUpdate,
  onEditStudent,
  onDeleteStudent,
}) => {
  const [activeMode, setActiveMode] = useState<'manual' | 'bulk' | 'sheet'>('manual');

  // Filter & search states for sheet view
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Manual Entry Form State
  const [enrollmentNoInput, setEnrollmentNoInput] = useState('');
  const [rollNoInput, setRollNoInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [departmentInput, setDepartmentInput] = useState<Department>(currentMentor?.department || 'Physics');
  const [subjectNameInput, setSubjectNameInput] = useState('Mechanics & Relativity');
  const [courseCategoryInput, setCourseCategoryInput] = useState<CourseCategory>('Major');
  const [sessional1Input, setSessional1Input] = useState<number | ''>(8);
  const [sessional2Input, setSessional2Input] = useState<number | ''>(8.5);
  const [assignmentInput, setAssignmentInput] = useState<number | ''>(17);
  const [manualNote, setManualNote] = useState('');

  // Bulk Load CSV text area state
  const [csvText, setCsvText] = useState('');
  const [bulkNote, setBulkNote] = useState('Uploaded continuous sessional marks via CSV batch upload.');
  const [isSuccessMsg, setIsSuccessMsg] = useState(false);
  const [successBannerText, setSuccessBannerText] = useState('');

  // When enrollment number is typed, auto-complete student if found
  const handleEnrollmentNoChange = (val: string) => {
    setEnrollmentNoInput(val);
    const matched = students.find(
      (s) =>
        (s.enrollmentNo && s.enrollmentNo.toLowerCase() === val.trim().toLowerCase()) ||
        (s.rollNo && s.rollNo.toLowerCase() === val.trim().toLowerCase())
    );
    if (matched) {
      setRollNoInput(matched.rollNo);
      setNameInput(matched.name);
      setDepartmentInput(matched.department);
    }
  };

  // Submit Manual Single Marks Entry
  const handleSingleMarksSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollmentNoInput.trim() || !rollNoInput.trim() || !nameInput.trim() || !subjectNameInput.trim()) {
      alert('Please fill in Enrollment No., Roll No., Student Name, and Subject Name.');
      return;
    }

    const s1 = Number(sessional1Input) || 0;
    const s2 = Number(sessional2Input) || 0;
    const asg = Number(assignmentInput) || 0;
    const totalInternal = Math.min(40, s1 + s2 + asg);

    // Look for existing student by Unique Enrollment No., Roll No., or Name (case-insensitive)
    const normEnr = enrollmentNoInput.trim().toLowerCase();
    const normRoll = rollNoInput.trim().toLowerCase();
    const normName = nameInput.trim().toLowerCase();

    const existingIndex = students.findIndex(
      (s) =>
        (normEnr && s.enrollmentNo && s.enrollmentNo.trim().toLowerCase() === normEnr) ||
        (normRoll && s.rollNo && s.rollNo.trim().toLowerCase() === normRoll) ||
        (normName && s.name && s.name.trim().toLowerCase() === normName)
    );

    let updatedStudents = [...students];
    let targetStudent: Student;

    const newSubjectEntry: SubjectMarks = {
      subjectName: subjectNameInput.trim(),
      courseCategory: courseCategoryInput,
      sessional1: s1,
      sessional2: s2,
      assignmentSeminarOthers: asg,
      internalMarks: totalInternal,
      attendancePercent: 85,
      enteredBy: currentMentor.name,
      teacherEmail: userEmail,
      lastUpdated: Date.now(),
    };

    if (existingIndex !== -1) {
      const existing = updatedStudents[existingIndex];
      const otherSubjects = (existing.subjects || []).filter(
        (sub) => sub.subjectName.trim().toLowerCase() !== subjectNameInput.trim().toLowerCase()
      );
      const allSubjects = [newSubjectEntry, ...otherSubjects];

      // Calculate new overall GPA across all subjects
      const avgInternal = Math.round(
        allSubjects.reduce((acc, sub) => {
          const tot = typeof sub.internalMarks === 'number'
            ? sub.internalMarks
            : ((sub.sessional1 || 0) + (sub.sessional2 || 0) + (sub.assignmentSeminarOthers || 0));
          return acc + tot;
        }, 0) / allSubjects.length
      );
      const newGpa = Math.min(10, Math.round(((avgInternal / 40) * 10) * 10) / 10);
      const newCategory = ((existing.overallAttendance ?? 80) < 75 || avgInternal < 20)
        ? 'Critical Attention'
        : (avgInternal < 26 ? 'Needs Improvement' : 'Good');

      targetStudent = {
        ...existing,
        name: nameInput.trim() || existing.name,
        enrollmentNo: enrollmentNoInput.trim() || existing.enrollmentNo,
        rollNo: rollNoInput.trim() || existing.rollNo,
        department: departmentInput || existing.department,
        subjects: allSubjects,
        overallGpa: newGpa,
        category: newCategory,
      };
      updatedStudents[existingIndex] = targetStudent;
    } else {
      targetStudent = {
        id: `s_${Date.now()}`,
        enrollmentNo: enrollmentNoInput.trim(),
        rollNo: rollNoInput.trim(),
        name: nameInput.trim(),
        department: departmentInput,
        program: 'B.Sc. FYUGP Major',
        semester: 1,
        overallAttendance: 80,
        overallGpa: Math.min(10, Math.round(((totalInternal / 40) * 10) * 10) / 10),
        category: totalInternal < 20 ? 'Critical Attention' : 'Good',
        mentorId: currentMentor.id,
        mentorName: currentMentor.name,
        creatorEmail: userEmail,
        createdBy: currentMentor.name,
        subjects: [newSubjectEntry],
      };
      updatedStudents = [targetStudent, ...updatedStudents];
    }

    onBulkUpdateMarks(updatedStudents);

    // Find assigned mentor
    const assignedMentor = mentors.find((m) => m.id === targetStudent.mentorId) || currentMentor;

    // Automatically send update log to Mentor
    const logDesc = manualNote.trim()
      ? manualNote.trim()
      : `Uploaded ${subjectNameInput} (${courseCategoryInput}) marks for ${targetStudent.name} [Enrolment: ${targetStudent.enrollmentNo}, Roll: ${targetStudent.rollNo}]: 1st Sessional (${s1}/10), 2nd Sessional (${s2}/10), Assignments/Presentations (${asg}/20). Total Internal: ${totalInternal}/40.`;

    onAddTeacherUpdate({
      teacherName: currentMentor.name || userEmail || 'Educator',
      subject: `${subjectNameInput} (${courseCategoryInput})`,
      updateType: 'sessional_marks',
      description: logDesc,
      studentIds: [targetStudent.id],
    });

    setSuccessBannerText(
      `Marks for ${targetStudent.name} (${targetStudent.enrollmentNo}) successfully recorded and automatically transmitted to Mentor ${assignedMentor.name}!`
    );
    setIsSuccessMsg(true);
    setTimeout(() => setIsSuccessMsg(false), 5000);

    // Reset inputs
    setEnrollmentNoInput('');
    setRollNoInput('');
    setNameInput('');
    setManualNote('');
  };

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const csvHeader = 'EnrollmentNo,RollNo,Name,Department,Subject,CourseCategory,Sessional1_Out10,Sessional2_Out10,Assignments_Out20\n';
    const csvRows = [
      'ENR2024001,DIG-PHY-001,Abhinav Saikia,Physics,Mechanics & Relativity,Major,8.5,9.0,18.0',
      'ENR2024002,DIG-CS-002,Priyanka Gogoi,Computer Science,Data Structures,Major,7.0,8.0,16.5',
      'ENR2024003,DIG-POL-003,Rahul Sarmah,Political Science,Indian Constitution,Core,9.0,9.5,19.0',
    ].join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Digboi_College_Marks_Upload_Template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Process Bulk CSV Upload
  const handleBulkCsvProcess = () => {
    if (!csvText.trim()) {
      alert('Please paste CSV content or upload a template file.');
      return;
    }

    const lines = csvText.trim().split('\n');
    let processedCount = 0;
    const newStudentEntries: Student[] = [];
    const updatedStudents = [...students];
    const affectedStudentIds: string[] = [];

    // Parse CSV lines
    lines.forEach((line, idx) => {
      // Skip header line if detected
      if (idx === 0 && line.toLowerCase().includes('enrollmentno')) return;

      const cols = line.split(',').map((c) => c.trim());
      if (cols.length < 5) return;

      const [enrNo, rollNo, stName, dept, subj, catStr, s1Str, s2Str, asgStr] = cols;

      const s1 = Number(s1Str) || 0;
      const s2 = Number(s2Str) || 0;
      const asg = Number(asgStr) || 0;
      const totalInt = Math.min(40, s1 + s2 + asg);

      const categoryVal: CourseCategory = COURSE_CATEGORIES.includes(catStr as CourseCategory)
        ? (catStr as CourseCategory)
        : 'Major';

      const departmentVal: Department = ALL_DEPARTMENTS.includes(dept as Department)
        ? (dept as Department)
        : currentMentor.department || 'Physics';

      const subjEntry = {
        subjectName: subj || 'General Subject',
        courseCategory: categoryVal,
        sessional1: s1,
        sessional2: s2,
        assignmentSeminarOthers: asg,
        internalMarks: totalInt,
        attendancePercent: 80,
      };

      // Match by enrollmentNo, rollNo, or student name (case-insensitive)
      const existingIdx = updatedStudents.findIndex(
        (s) =>
          (enrNo && s.enrollmentNo && s.enrollmentNo.trim().toLowerCase() === enrNo.toLowerCase()) ||
          (rollNo && s.rollNo && s.rollNo.trim().toLowerCase() === rollNo.toLowerCase()) ||
          (stName && s.name && s.name.trim().toLowerCase() === stName.toLowerCase())
      );

      if (existingIdx !== -1) {
        const existing = updatedStudents[existingIdx];
        const otherSubjects = (existing.subjects || []).filter(
          (sub) => sub.subjectName.trim().toLowerCase() !== (subj || '').trim().toLowerCase()
        );
        const allSubjects = [subjEntry, ...otherSubjects];
        const avgInternal = Math.round(
          allSubjects.reduce((acc, sub) => {
            const tot = typeof sub.internalMarks === 'number'
              ? sub.internalMarks
              : ((sub.sessional1 || 0) + (sub.sessional2 || 0) + (sub.assignmentSeminarOthers || 0));
            return acc + tot;
          }, 0) / allSubjects.length
        );
        const newGpa = Math.min(10, Math.round(((avgInternal / 40) * 10) * 10) / 10);
        const newCategory = ((existing.overallAttendance ?? 80) < 75 || avgInternal < 20)
          ? 'Critical Attention'
          : (avgInternal < 26 ? 'Needs Improvement' : 'Good');

        updatedStudents[existingIdx] = {
          ...existing,
          subjects: allSubjects,
          overallGpa: newGpa,
          category: newCategory,
        };
        affectedStudentIds.push(existing.id);
      } else {
        const newStud: Student = {
          id: `s_${Date.now()}_${idx}`,
          enrollmentNo: enrNo || `ENR${Math.floor(100000 + Math.random() * 900000)}`,
          rollNo: rollNo || `DIG-${idx + 100}`,
          name: stName || 'New Student',
          department: departmentVal,
          program: 'B.Sc. FYUGP Major',
          semester: 1,
          overallAttendance: 80,
          overallGpa: Math.min(10, Math.round(((totalInt / 40) * 10) * 10) / 10),
          category: totalInt < 20 ? 'Critical Attention' : 'Good',
          mentorId: currentMentor.id,
          mentorName: currentMentor.name,
          creatorEmail: userEmail,
          createdBy: currentMentor.name,
          subjects: [subjEntry],
        };
        updatedStudents.unshift(newStud);
        affectedStudentIds.push(newStud.id);
      }

      processedCount++;
    });

    if (processedCount === 0) {
      alert('Could not parse valid records. Ensure CSV format follows the downloaded template.');
      return;
    }

    onBulkUpdateMarks(updatedStudents);

    // Automatically trigger teacher update notification to mentors
    onAddTeacherUpdate({
      teacherName: currentMentor.name || userEmail || 'Faculty Educator',
      subject: 'Bulk Sessional Marks Upload',
      updateType: 'sessional_marks',
      description: `${bulkNote} Processed marks for ${processedCount} students across departments. Transmitted automatically to assigned mentors.`,
      studentIds: affectedStudentIds,
    });

    setSuccessBannerText(
      `Bulk Load Complete! Successfully updated marks for ${processedCount} students and automatically notified mentors.`
    );
    setIsSuccessMsg(true);
    setCsvText('');
    setTimeout(() => setIsSuccessMsg(false), 5000);
  };

  // Inline table edit change handlers
  const handleInlineMarkChange = (
    studentId: string,
    subjectName: string,
    field: 'sessional1' | 'sessional2' | 'assignmentSeminarOthers',
    value: number
  ) => {
    const updated = students.map((s) => {
      if (s.id !== studentId) return s;
      const subjects = (s.subjects || []).map((sub) => {
        if (sub.subjectName !== subjectName) return sub;
        const newSub = { ...sub, [field]: value };
        const s1 = newSub.sessional1 || 0;
        const s2 = newSub.sessional2 || 0;
        const asg = newSub.assignmentSeminarOthers || 0;
        newSub.internalMarks = Math.min(40, s1 + s2 + asg);
        return newSub;
      });
      return { ...s, subjects };
    });

    onBulkUpdateMarks(updated);
  };

  // Filter students for master sheet table
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.enrollmentNo && s.enrollmentNo.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept = filterDepartment === 'All' || s.department === filterDepartment;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ClipboardCheck className="w-6 h-6 text-[#1976d2]" />
            <h2 className="text-xl font-extrabold text-slate-900">Educator Marks Management Portal</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Upload sessional 1, sessional 2 & assignment/presentation marks. Auto-transmits to assigned Mentors instantly!
          </p>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveMode('manual')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'manual'
                ? 'bg-white text-[#1976d2] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manual Entry Form
          </button>
          <button
            onClick={() => setActiveMode('bulk')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'bulk'
                ? 'bg-white text-[#1976d2] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bulk Load (CSV)
          </button>
          <button
            onClick={() => setActiveMode('sheet')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'sheet'
                ? 'bg-white text-[#1976d2] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Master Marks Sheet
          </button>
        </div>
      </div>

      {isSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successBannerText}</span>
        </div>
      )}

      {/* MODE 1: MANUAL MARKS ENTRY FORM */}
      {activeMode === 'manual' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-[#1976d2]" />
                <span>Manual Student Marks Entry Form</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Particulars: Enrolment No., Roll No., Name, Subject, Category, Sessional 1 (10), Sessional 2 (10) & Assignments/Presentations (20).
              </p>
            </div>
            <span className="bg-blue-50 text-[#1976d2] font-bold text-xs px-3 py-1 rounded-full border border-blue-100">
              Auto-Calculated Total: Out of 40 Marks
            </span>
          </div>

          <form onSubmit={handleSingleMarksSubmit} className="space-y-5 text-xs font-medium">
            {/* Row 1: Identification */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Unique Enrolment No. (College ID) *
                </label>
                <input
                  type="text"
                  required
                  value={enrollmentNoInput}
                  onChange={(e) => handleEnrollmentNoChange(e.target.value)}
                  placeholder="e.g. ENR2024015"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Auto-completes student details if already registered
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Student Roll No. *</label>
                <input
                  type="text"
                  required
                  value={rollNoInput}
                  onChange={(e) => setRollNoInput(e.target.value)}
                  placeholder="e.g. DIG-PHY-2024-099"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Abhinav Saikia"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Row 2: Subject & Course Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Department</label>
                <select
                  value={departmentInput}
                  onChange={(e) => setDepartmentInput(e.target.value as Department)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {ALL_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={subjectNameInput}
                  onChange={(e) => setSubjectNameInput(e.target.value)}
                  placeholder="e.g. Mechanics & Relativity, Circuit Analysis"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Course Category *
                </label>
                <select
                  value={courseCategoryInput}
                  onChange={(e) => setCourseCategoryInput(e.target.value as CourseCategory)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-slate-800"
                >
                  {COURSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Particular Sessional Marks breakdown */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <h4 className="font-extrabold text-slate-800 text-xs flex items-center justify-between">
                <span>Particular Internal Assessment Marks Breakdown</span>
                <span className="text-blue-700 font-black text-sm">
                  Total Calculated: {(Number(sessional1Input) || 0) + (Number(sessional2Input) || 0) + (Number(assignmentInput) || 0)} / 40 Marks
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <label className="block text-slate-700 font-bold mb-1">1st Sessional Marks (Out of 10)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={sessional1Input}
                    onChange={(e) => setSessional1Input(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Max 10 Marks</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <label className="block text-slate-700 font-bold mb-1">2nd Sessional Marks (Out of 10)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={sessional2Input}
                    onChange={(e) => setSessional2Input(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Max 10 Marks</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <label className="block text-slate-700 font-bold mb-1">
                    Assignments / Seminar / Presentations / Others (Out of 20)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={assignmentInput}
                    onChange={(e) => setAssignmentInput(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Max 20 Marks</span>
                </div>
              </div>
            </div>

            {/* Teacher broadcast note */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Teacher Broadcast Note for Mentor (Optional)
              </label>
              <input
                type="text"
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                placeholder="e.g. Student performed well in Sessional 2 after initial academic warning."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-[#1976d2] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Save Marks & Auto-Transmit to Mentor</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODE 2: BULK LOAD (CSV / EXCEL COPY-PASTE) */}
      {activeMode === 'bulk' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>Bulk Load Student Marks (CSV / Excel Import)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Paste spreadsheet data or upload template. Matches existing students by Unique Enrolment No. or Roll No.
              </p>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Download CSV Template</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <span className="font-extrabold text-slate-800">CSV Column Structure:</span>
              <p className="font-mono text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 overflow-x-auto">
                EnrollmentNo, RollNo, Name, Department, Subject, CourseCategory, Sessional1_Out10, Sessional2_Out10, Assignments_Out20
              </p>
              <p className="text-[11px] text-slate-500">
                Course Category options: <strong>Core, Major, Minor, MDC, SEC, AEC, VAC</strong>
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-xs">
                Paste CSV Data Rows Below:
              </label>
              <textarea
                rows={8}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`ENR2024001,DIG-PHY-001,Abhinav Saikia,Physics,Mechanics & Relativity,Major,8.5,9.0,18.0\nENR2024002,DIG-CS-002,Priyanka Gogoi,Computer Science,Data Structures,Major,7.0,8.0,16.5`}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-xs">
                Broadcast Summary Note for Mentors
              </label>
              <input
                type="text"
                value={bulkNote}
                onChange={(e) => setBulkNote(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleBulkCsvProcess}
                disabled={!csvText.trim()}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Process & Publish Bulk Marks to Mentors</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: MASTER MARKS SHEET (INLINE EDIT & AUTO-SYNC VIEW) */}
      {activeMode === 'sheet' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Master Student Internal Marks Sheet</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Particulars: Sessional 1 (10) + Sessional 2 (10) + Assignments/Seminar/Presentations (20) = Total Internal (40)
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 text-xs">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Enrolment / Roll / Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 border border-slate-200 rounded-xl bg-white outline-none"
              >
                <option value="All">All Departments</option>
                {ALL_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3 pl-4">Enrolment & Roll No.</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Subject & Category</th>
                  <th className="p-3 text-center">1st Sessional (/10)</th>
                  <th className="p-3 text-center">2nd Sessional (/10)</th>
                  <th className="p-3 text-center">Assignments/Seminar (/20)</th>
                  <th className="p-3 text-center">Total Internal (/40)</th>
                  <th className="p-3 pr-4 text-right">Mentor Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                      No students match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const primarySub = s.subjects && s.subjects.length > 0
                      ? s.subjects[0]
                      : {
                          subjectName: 'Core Major Paper',
                          courseCategory: 'Major' as CourseCategory,
                          sessional1: 8,
                          sessional2: 8,
                          assignmentSeminarOthers: 16,
                          internalMarks: 32,
                        };

                    const s1 = primarySub.sessional1 || 0;
                    const s2 = primarySub.sessional2 || 0;
                    const asg = primarySub.assignmentSeminarOthers || 0;
                    const totalInt = primarySub.internalMarks || (s1 + s2 + asg);

                    const assignedMentor = mentors.find((m) => m.id === s.mentorId) || currentMentor;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 pl-4 font-mono text-[11px]">
                          <p className="font-extrabold text-[#1976d2]">{s.enrollmentNo || 'ENR2024001'}</p>
                          <p className="text-slate-500">{s.rollNo}</p>
                        </td>

                        <td className="p-3">
                          <p className="font-bold text-slate-900">{s.name}</p>
                          <p className="text-[10px] text-slate-400">Sem {s.semester}</p>
                        </td>

                        <td className="p-3 font-medium text-slate-800">{s.department}</td>

                        <td className="p-3">
                          <p className="font-bold text-slate-800">{primarySub.subjectName}</p>
                          <span className="inline-block mt-0.5 px-2 py-0.2 rounded-md bg-blue-50 text-[#1976d2] font-black text-[10px] border border-blue-200">
                            {primarySub.courseCategory || 'Major'}
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="10"
                            value={s1}
                            onChange={(e) =>
                              handleInlineMarkChange(s.id, primarySub.subjectName, 'sessional1', Number(e.target.value))
                            }
                            className="w-16 text-center px-1.5 py-1 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </td>

                        <td className="p-3 text-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="10"
                            value={s2}
                            onChange={(e) =>
                              handleInlineMarkChange(s.id, primarySub.subjectName, 'sessional2', Number(e.target.value))
                            }
                            className="w-16 text-center px-1.5 py-1 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </td>

                        <td className="p-3 text-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="20"
                            value={asg}
                            onChange={(e) =>
                              handleInlineMarkChange(
                                s.id,
                                primarySub.subjectName,
                                'assignmentSeminarOthers',
                                Number(e.target.value)
                              )
                            }
                            className="w-16 text-center px-1.5 py-1 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </td>

                        <td className="p-3 text-center">
                          <span className="font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            {totalInt} / 40
                          </span>
                        </td>

                        <td className="p-3 pr-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-[11px] font-bold text-slate-800">{assignedMentor.name}</span>
                            <span className="text-[10px] text-emerald-600 font-extrabold flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Auto-Synced to Mentor</span>
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
