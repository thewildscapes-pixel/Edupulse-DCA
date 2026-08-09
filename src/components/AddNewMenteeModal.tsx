import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2, Camera, Image as ImageIcon } from 'lucide-react';
import { Student, Mentor, Department, PerformanceCategory, ALL_DEPARTMENTS, SubjectMarks } from '../types';

interface AddNewMenteeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMentor: Mentor;
  mentors: Mentor[];
  onAddMentee: (student: Student) => void;
}

export const AddNewMenteeModal: React.FC<AddNewMenteeModalProps> = ({
  isOpen,
  onClose,
  currentMentor,
  mentors,
  onAddMentee,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [department, setDepartment] = useState<Department>(currentMentor?.department || 'Physics');
  const [courseType, setCourseType] = useState<'FYUGP' | 'PG' | 'Diploma'>('FYUGP');
  const [program, setProgram] = useState('B.Sc. (Hons) FYUGP Major');
  const [semester, setSemester] = useState<number>(1);
  const [dob, setDob] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Course & Subject Specific Inputs
  const [majorSubject, setMajorSubject] = useState('');
  const [minorSubject, setMinorSubject] = useState('');
  const [coreSubject, setCoreSubject] = useState('');
  const [mdcSubject, setMdcSubject] = useState('');
  const [aecSubject, setAecSubject] = useState('');
  const [secSubject, setSecSubject] = useState('');
  const [vacSubject, setVacSubject] = useState('');
  const [vocationalSubject, setVocationalSubject] = useState('');
  const [internshipTopic, setInternshipTopic] = useState('');

  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [email, setEmail] = useState('');

  // Auto-calculated Category Helper
  const getAutoSupportCategory = (att: number, gpa: number): PerformanceCategory => {
    if (att === 0 && gpa === 0) return 'Good';
    if (att < 75 || gpa < 5.0) return 'Critical Attention';
    if (att < 80 || gpa < 6.5) return 'Needs Improvement';
    if (gpa < 8.5) return 'Good';
    return 'Outstanding';
  };

  // Photo Upload Handler (Gallery or Camera)
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

  const isInternshipRequired =
    (courseType === 'FYUGP' && semester === 5) ||
    (courseType === 'PG' && department === 'Commerce' && semester === 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rollNo.trim()) return;

    // Build initial subject list based on course type & semester requirements
    const initialSubjects: SubjectMarks[] = [];

    if (majorSubject.trim()) {
      initialSubjects.push({ subjectName: majorSubject.trim(), courseCategory: 'Major', semester });
    }
    if (minorSubject.trim()) {
      initialSubjects.push({ subjectName: minorSubject.trim(), courseCategory: 'Minor', semester });
    }

    if (courseType === 'PG') {
      if (coreSubject.trim()) {
        initialSubjects.push({ subjectName: coreSubject.trim(), courseCategory: 'Core', semester });
      }
      if (mdcSubject.trim()) {
        initialSubjects.push({ subjectName: mdcSubject.trim(), courseCategory: 'MDC', semester });
      }
      if (vocationalSubject.trim()) {
        initialSubjects.push({ subjectName: vocationalSubject.trim(), courseCategory: 'SEC', semester });
      }
    } else if (courseType === 'FYUGP') {
      if (semester <= 3) {
        if (mdcSubject.trim()) initialSubjects.push({ subjectName: mdcSubject.trim(), courseCategory: 'MDC', semester });
        if (aecSubject.trim()) initialSubjects.push({ subjectName: aecSubject.trim(), courseCategory: 'AEC', semester });
        if (secSubject.trim()) initialSubjects.push({ subjectName: secSubject.trim(), courseCategory: 'SEC', semester });
        if (vacSubject.trim()) initialSubjects.push({ subjectName: vacSubject.trim(), courseCategory: 'VAC', semester });
      }
    }

    if (isInternshipRequired) {
      initialSubjects.push({
        subjectName: internshipTopic.trim() ? `Compulsory Internship: ${internshipTopic.trim()}` : 'Compulsory Internship (4 Credits)',
        courseCategory: 'Core',
        semester,
      });
    }

    const autoCategory = getAutoSupportCategory(0, 0);

    const newStudent: Student = {
      id: `s_${Date.now()}`,
      name: name.trim(),
      enrollmentNo: enrollmentNo.trim() || `ENR${Math.floor(100000 + Math.random() * 900000)}`,
      rollNo: rollNo.trim(),
      department,
      courseType,
      program: program.trim() || `${department} ${courseType}`,
      semester,
      overallAttendance: 0,
      overallGpa: 0,
      category: autoCategory,
      supportCategory: autoCategory,
      dob: dob || undefined,
      photoUrl: photoUrl || undefined,
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      email: email.trim(),
      mentorId: currentMentor.id,
      mentorName: currentMentor.name,
      creatorEmail: currentMentor.email,
      createdBy: currentMentor.name,
      subjects: initialSubjects,
      lastModified: Date.now(),
    };

    onAddMentee(newStudent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-blue-50 text-[#1976d2] rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Add New Mentee</h3>
              <p className="text-xs text-slate-500">Register a student & structure academic subjects</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-medium">
          {/* Photo & Basic Details */}
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
                placeholder="e.g. Abhinav Saikia"
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
                placeholder="ENR2024015"
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
                placeholder="DIG-PHY-2024-099"
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
                  <option key={s} value={s}>Semester {s}</option>
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
                placeholder="e.g. B.Sc. (Hons) Major in Physics"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Subject Structure Section */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-blue-200 pb-2">
              <h4 className="font-bold text-blue-900 text-xs">
                📚 Subject Structure Registration ({courseType} - Semester {semester})
              </h4>
              <span className="text-[10px] text-blue-700 font-semibold">Digboi College Curriculum</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Major Paper *</label>
                <input
                  type="text"
                  value={majorSubject}
                  onChange={(e) => setMajorSubject(e.target.value)}
                  placeholder="e.g. Mechanics & Mathematical Physics"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Minor Paper</label>
                <input
                  type="text"
                  value={minorSubject}
                  onChange={(e) => setMinorSubject(e.target.value)}
                  placeholder="e.g. Mathematics Minor 1"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none"
                />
              </div>

              {courseType === 'PG' && (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Core Postgraduate Paper</label>
                    <input
                      type="text"
                      value={coreSubject}
                      onChange={(e) => setCoreSubject(e.target.value)}
                      placeholder="e.g. Quantum Mechanics I"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Vocational Course Paper</label>
                    <input
                      type="text"
                      value={vocationalSubject}
                      onChange={(e) => setVocationalSubject(e.target.value)}
                      placeholder="e.g. Applied Instrumentation"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none"
                    />
                  </div>
                </>
              )}

              {(courseType === 'FYUGP' || courseType === 'PG') && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">MDC (Multidisciplinary Course)</label>
                  <input
                    type="text"
                    value={mdcSubject}
                    onChange={(e) => setMdcSubject(e.target.value)}
                    placeholder={semester <= 3 || courseType === 'PG' ? "e.g. Environmental Science" : "Not applicable after 3rd Semester"}
                    disabled={courseType === 'FYUGP' && semester > 3}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              )}

              {courseType === 'FYUGP' && semester <= 3 && (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">AEC (Ability Enhancement Course)</label>
                    <input
                      type="text"
                      value={aecSubject}
                      onChange={(e) => setAecSubject(e.target.value)}
                      placeholder="e.g. English Communication / Assamese"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">SEC (Skill Enhancement Course)</label>
                    <input
                      type="text"
                      value={secSubject}
                      onChange={(e) => setSecSubject(e.target.value)}
                      placeholder="e.g. Digital Literacy & IT"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">VAC (Value Added Course)</label>
                    <input
                      type="text"
                      value={vacSubject}
                      onChange={(e) => setVacSubject(e.target.value)}
                      placeholder="e.g. Yoga Education / Environmental Values"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Compulsory Internship Notice */}
            {isInternshipRequired && (
              <div className="p-3 bg-amber-100/80 border border-amber-300 rounded-lg text-amber-950 font-medium text-[11px] space-y-1">
                <span className="font-extrabold uppercase tracking-wide text-amber-900 block">
                  📌 Compulsory Internship Module (4 Credits)
                </span>
                <p>This semester requires a mandatory 4-credit Internship. Please specify topic/organization below:</p>
                <input
                  type="text"
                  value={internshipTopic}
                  onChange={(e) => setInternshipTopic(e.target.value)}
                  placeholder="e.g. IOCL Digboi Refinery Summer Internship Project"
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-md outline-none text-xs"
                />
              </div>
            )}
          </div>

          {/* Read-Only Auto-Sync Notice */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center justify-between">
            <div>
              <span>⚡ Attendance, GPA & Support Category are <strong>Auto-Synced</strong></span>
              <p className="text-[11px] text-emerald-700 font-normal mt-0.5">
                Overall Attendance & GPA auto-populate directly when mentor enters marks in "Track Semester Marks".
              </p>
            </div>
            <span className="bg-emerald-200 text-emerald-900 font-extrabold px-2.5 py-1 rounded-md text-[10px]">
              Auto-Managed
            </span>
          </div>

          {/* Guardian & Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Guardian Name</label>
              <input
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="Guardian Full Name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Guardian Phone / WhatsApp</label>
              <input
                type="text"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                placeholder="+91 98640 00000"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Student Institutional Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@digboicollege.edu.in"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="pt-3 flex justify-end space-x-2">
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
              <span>Save Mentee</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
