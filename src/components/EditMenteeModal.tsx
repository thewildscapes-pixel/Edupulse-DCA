import React, { useState, useEffect } from 'react';
import { X, Edit3, Trash2, CheckCircle2 } from 'lucide-react';
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
  const [overallAttendance, setOverallAttendance] = useState<number | ''>(student.overallAttendance);
  const [overallGpa, setOverallGpa] = useState<number | ''>(student.overallGpa);
  const [category, setCategory] = useState<PerformanceCategory>(student.category);
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
    setOverallAttendance(student.overallAttendance);
    setOverallGpa(student.overallGpa);
    setCategory(student.category);
    setGuardianName(student.guardianName || '');
    setGuardianPhone(student.guardianPhone || '');
    setEmail(student.email || '');
  }, [student]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedStudent: Student = {
      ...student,
      name: name.trim(),
      enrollmentNo: enrollmentNo.trim() || student.enrollmentNo || `ENR${Math.floor(100000 + Math.random() * 900000)}`,
      rollNo: rollNo.trim(),
      department,
      program,
      semester,
      overallAttendance: overallAttendance === '' ? 0 : Number(overallAttendance),
      overallGpa: overallGpa === '' ? 0 : Number(overallGpa),
      category,
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      email: email.trim(),
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Academic Program</label>
            <input
              type="text"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Attendance %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={overallAttendance}
                onChange={(e) => setOverallAttendance(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Overall GPA</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={overallGpa}
                onChange={(e) => setOverallGpa(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Support Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PerformanceCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Critical Attention">Critical Attention</option>
                <option value="Needs Improvement">Needs Improvement</option>
                <option value="Good">Good</option>
                <option value="Outstanding">Outstanding</option>
              </select>
            </div>
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
