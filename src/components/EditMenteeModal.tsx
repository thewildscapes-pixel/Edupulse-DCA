import React, { useState, useEffect } from 'react';
import { X, Edit3, Trash2, CheckCircle2, Camera, Image as ImageIcon } from 'lucide-react';
import { Student, Department, PerformanceCategory, ALL_DEPARTMENTS } from '../types';

interface EditMenteeModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onSaveStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
}

export const EditMenteeModal: React.FC<EditMenteeModalProps> = ({
  isOpen,
  student,
  onClose,
  onSaveStudent,
  onDeleteStudent,
}) => {
  if (!isOpen || !student) return null;

  const [name, setName] = useState(student.name);
  const [enrollmentNo, setEnrollmentNo] = useState(student.enrollmentNo || '');
  const [rollNo, setRollNo] = useState(student.rollNo);
  const [department, setDepartment] = useState<Department>(student.department);
  const [program, setProgram] = useState(student.program);
  const [semester, setSemester] = useState(student.semester);
  const [courseType, setCourseType] = useState<'FYUGP' | 'PG' | 'Diploma'>(student.courseType || 'FYUGP');
  const [dob, setDob] = useState(student.dob || '');
  const [photoUrl, setPhotoUrl] = useState(student.photoUrl || '');
  const [guardianName, setGuardianName] = useState(student.guardianName || '');
  const [guardianPhone, setGuardianPhone] = useState(student.guardianPhone || '');
  const [email, setEmail] = useState(student.email || '');

  useEffect(() => {
    setName(student.name);
    setEnrollmentNo(student.enrollmentNo || '');
    setRollNo(student.rollNo);
    setDepartment(student.department);
    setProgram(student.program);
    setSemester(student.semester);
    setCourseType(student.courseType || 'FYUGP');
    setDob(student.dob || '');
    setPhotoUrl(student.photoUrl || '');
    setGuardianName(student.guardianName || '');
    setGuardianPhone(student.guardianPhone || '');
    setEmail(student.email || '');
  }, [student]);

  // Helper for auto-support category
  const getAutoSupportCategory = (att: number, gpa: number): PerformanceCategory => {
    if (att === 0 && gpa === 0) return student.category || 'Good';
    if (att < 75 || gpa < 5.0) return 'Critical Attention';
    if (att < 80 || gpa < 6.5) return 'Needs Improvement';
    if (gpa < 8.5) return 'Good';
    return 'Outstanding';
  };

  const computedCategory = getAutoSupportCategory(student.overallAttendance, student.overallGpa);

  // Photo File Change
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedStudent: Student = {
      ...student,
      name: name.trim(),
      enrollmentNo: enrollmentNo.trim() || student.enrollmentNo || `ENR${Math.floor(100000 + Math.random() * 900000)}`,
      rollNo: rollNo.trim(),
      department,
      courseType,
      program: program.trim(),
      semester,
      dob: dob || undefined,
      photoUrl: photoUrl || undefined,
      category: computedCategory,
      supportCategory: computedCategory,
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      email: email.trim(),
      lastModified: Date.now(),
    };
    onSaveStudent(updatedStudent);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to remove ${student.name} from the system?`)) {
      onDeleteStudent(student.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-blue-50 text-[#1976d2] rounded-xl flex items-center justify-center">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Edit Mentee Profile</h3>
              <p className="text-xs text-slate-500">Update academic records and guardian details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-medium">
          {/* Photo & Upload Options */}
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center shrink-0">
              {photoUrl ? (
                <img src={photoUrl} alt="Mentee Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-slate-400">{name ? name[0].toUpperCase() : 'M'}</span>
              )}
            </div>
            <div className="flex-1 space-y-1 text-center sm:text-left">
              <label className="block text-slate-800 font-bold">Mentee Photo Upload (Gallery / Camera)</label>
              <p className="text-[11px] text-slate-500">Select an image from device gallery or capture directly using camera.</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <label className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer flex items-center space-x-1 text-[11px]">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Choose Photo</span>
                  <input type="file" accept="image/*" onChange={handlePhotoFileChange} className="hidden" />
                </label>
                <label className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer flex items-center space-x-1 text-[11px]">
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Camera Capture</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handlePhotoFileChange} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Student Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Enrolment No. (College) *</label>
              <input
                type="text"
                required
                value={enrollmentNo}
                onChange={(e) => setEnrollmentNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Roll No. *</label>
              <input
                type="text"
                required
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {ALL_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Course Type</label>
              <select
                value={courseType}
                onChange={(e) => setCourseType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="FYUGP">FYUGP (4-Year UG)</option>
                <option value="PG">PG (Postgraduate M.Sc/M.A/M.Com)</option>
                <option value="Diploma">Diploma / Vocational</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Date of Birth (DOB)</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Academic Program Title</label>
              <input
                type="text"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Auto-Sync Summary & Support Category Status */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs font-semibold space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-emerald-900">⚡ Auto-Calculated Mentee Performance Overview</span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                computedCategory === 'Critical Attention' ? 'bg-red-200 text-red-900' :
                computedCategory === 'Needs Improvement' ? 'bg-amber-200 text-amber-900' :
                computedCategory === 'Good' ? 'bg-blue-200 text-blue-900' : 'bg-emerald-200 text-emerald-900'
              }`}>
                Category: {computedCategory}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-800 pt-1">
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                Current Attendance: <strong className="text-slate-900">{student.overallAttendance}%</strong>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                Current CGPA: <strong className="text-slate-900">{student.overallGpa} / 10</strong>
              </div>
            </div>
            <p className="text-[10px] text-emerald-700 font-normal">
              Attendance, GPA and Support Category are auto-computed from semester marks logs and cannot be manually overridden here.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Guardian Name</label>
              <input
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Guardian Phone / WhatsApp</label>
              <input
                type="text"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Student Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-semibold flex items-center space-x-1 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Student</span>
            </button>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-white bg-[#1976d2] hover:bg-blue-700 font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
