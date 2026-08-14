import React, { useState } from 'react';
import { 
  Users, 
  AlertTriangle, 
  GraduationCap, 
  Award, 
  Search, 
  UserPlus, 
  Edit3, 
  Trash2, 
  BrainCircuit, 
  MessageSquare,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  BarChart2,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { Student, Mentor, Role, TeacherUpdateLog, ALL_DEPARTMENTS } from '../types';
import { isEducatorSubjectStudent } from '../utils/ownership';

interface EducatorHomeProps {
  students: Student[];
  currentMentor: Mentor;
  mentors?: Mentor[];
  userEmail: string;
  userPhone?: string;
  currentRole: Role;
  teacherUpdates?: TeacherUpdateLog[];
  onNavigate: (tab: string, studentId?: string) => void;
  onOpenAddMentee: () => void;
  onOpenEditProfile: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
}

export const EducatorHome: React.FC<EducatorHomeProps> = ({
  students,
  currentMentor,
  mentors = [],
  userEmail,
  userPhone,
  currentRole,
  teacherUpdates = [],
  onNavigate,
  onOpenAddMentee,
  onOpenEditProfile,
  onEditStudent,
  onDeleteStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [rosterScope, setRosterScope] = useState<'my_subjects' | 'all'>('my_subjects');
  const [chartViewMode, setChartViewMode] = useState<'mentees' | 'departments' | 'radar'>('mentees');

  // Filter students based on Educator subject roster scope
  const educatorSubjectStudents = students.filter((s) =>
    isEducatorSubjectStudent(s, userEmail, currentMentor?.name || '', teacherUpdates, userPhone || currentMentor?.phone, currentMentor, mentors)
  );

  // Apply roster scope preference, falling back to all students if my_subjects yields 0 (cross-device fallback)
  const rosterStudents = rosterScope === 'my_subjects' ? (educatorSubjectStudents.length > 0 ? educatorSubjectStudents : students) : students;

  const totalStudents = rosterStudents.length;
  const criticalStudents = rosterStudents.filter((s) => s.category === 'Critical Attention' || s.overallAttendance < 75);
  const topPerformers = rosterStudents.filter((s) => s.category === 'Outstanding' || s.overallGpa >= 8.5);
  const avgAttendance = totalStudents > 0 
    ? Math.round(rosterStudents.reduce((acc, s) => acc + s.overallAttendance, 0) / totalStudents) 
    : 0;

  const filteredStudents = rosterStudents.filter((s) => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDepartment === 'All' || s.department === filterDepartment;
    return matchesSearch && matchesDept;
  });

  // Recharts Data Mapping: Mentees Progression across Assessment Parameters
  const menteeChartData = filteredStudents.slice(0, 10).map((s) => {
    // calculate average internal marks across subjects if available
    const totalInternal = (s.subjects || []).reduce((acc, sub) => acc + (sub.internalMarks || 0), 0);
    const avgInternal = (s.subjects || []).length > 0 
      ? Math.round((totalInternal / (s.subjects.length * 30)) * 100) 
      : Math.round((s.overallGpa / 10) * 100);

    return {
      name: s.name.split(' ')[0] + ' (' + s.rollNo.slice(-3) + ')',
      fullName: s.name,
      id: s.id,
      Attendance: s.overallAttendance,
      InternalScore: avgInternal,
      GPA_Percentage: Math.round(s.overallGpa * 10),
      rawGpa: s.overallGpa,
    };
  });

  // Departmental Aggregates for Chart
  const deptMap: Record<string, { count: number; totalAtt: number; totalGpa: number; totalInternal: number }> = {};
  students.forEach((s) => {
    if (!deptMap[s.department]) {
      deptMap[s.department] = { count: 0, totalAtt: 0, totalGpa: 0, totalInternal: 0 };
    }
    deptMap[s.department].count += 1;
    deptMap[s.department].totalAtt += s.overallAttendance;
    deptMap[s.department].totalGpa += s.overallGpa;
    const sInternal = (s.subjects || []).reduce((acc, sub) => acc + (sub.internalMarks || 0), 0);
    const sAvgInt = (s.subjects || []).length > 0 ? (sInternal / (s.subjects.length * 30)) * 100 : (s.overallGpa / 10) * 100;
    deptMap[s.department].totalInternal += sAvgInt;
  });

  const departmentChartData = Object.keys(deptMap).map((dept) => ({
    department: dept,
    AvgAttendance: Math.round(deptMap[dept].totalAtt / deptMap[dept].count),
    AvgGpaPct: Math.round((deptMap[dept].totalGpa / deptMap[dept].count) * 10),
    AvgInternal: Math.round(deptMap[dept].totalInternal / deptMap[dept].count),
    studentCount: deptMap[dept].count,
  }));

  // Overall Assessment Radar Parameter Summary
  const radarData = [
    { parameter: 'Attendance Rate', value: avgAttendance, fullMark: 100 },
    { 
      parameter: 'GPA Index', 
      value: Math.round((students.reduce((a, b) => a + b.overallGpa, 0) / (students.length || 1)) * 10), 
      fullMark: 100 
    },
    { 
      parameter: 'Internal Evaluation', 
      value: Math.round(menteeChartData.reduce((a, b) => a + b.InternalScore, 0) / (menteeChartData.length || 1)), 
      fullMark: 100 
    },
    { 
      parameter: 'Outstanding Ratio', 
      value: Math.round((topPerformers.length / (totalStudents || 1)) * 100), 
      fullMark: 100 
    },
    { 
      parameter: 'Regularity Index', 
      value: Math.round(((totalStudents - criticalStudents.length) / (totalStudents || 1)) * 100), 
      fullMark: 100 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled</span>
            <div className="p-2 bg-blue-50 text-[#1976d2] rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{totalStudents}</p>
          <p className="text-xs text-slate-500 font-medium">Students across departments</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Critical Attention</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-600">{criticalStudents.length}</p>
          <p className="text-xs text-red-500 font-medium">&lt;75% attendance or low GPA</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Outstanding Performers</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700">{topPerformers.length}</p>
          <p className="text-xs text-emerald-600 font-medium">GPA ≥ 8.5 / Outstanding rank</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Attendance</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{avgAttendance}%</p>
          <p className="text-xs text-slate-500 font-medium">Institutional average</p>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 p-6 rounded-2xl text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <h2 className="text-lg font-bold">Institutional Academic Mentorship & Analytics Portal</h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Digboi College system for continuous student assessment, early academic intervention, and structured parent guidance.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenEditProfile}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Edit Faculty Name, Designation & Department"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={onOpenAddMentee}
            className="px-4 py-2 bg-[#1976d2] hover:bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
          <button
            onClick={() => onNavigate('assessment')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Mark Entry</span>
          </button>
        </div>
      </div>

      {/* RECHARTS VISUALIZATION: MENTEE PROGRESSION ACROSS ASSESSMENT PARAMETERS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 text-[#1976d2] rounded-xl">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Mentee Assessment & Multi-Parameter Progression
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Comparative evaluation across Attendance %, Internal Assessment, and Semester GPA (Out of 100%)
              </p>
            </div>
          </div>

          {/* Toggle View Modes */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setChartViewMode('mentees')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartViewMode === 'mentees'
                  ? 'bg-white text-[#1976d2] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Individual Mentees
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode('departments')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartViewMode === 'departments'
                  ? 'bg-white text-[#1976d2] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Department Averages
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode('radar')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartViewMode === 'radar'
                  ? 'bg-white text-[#1976d2] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Academic Radar
            </button>
          </div>
        </div>

        {/* Chart Render Area */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartViewMode === 'mentees' ? (
              <ComposedChart data={menteeChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(val: any, name: any) => [`${val}%`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Attendance" fill="#10b981" radius={[4, 4, 0, 0]} name="Attendance %" />
                <Bar dataKey="InternalScore" fill="#1976d2" radius={[4, 4, 0, 0]} name="Internal Marks %" />
                <Line type="monotone" dataKey="GPA_Percentage" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} name="GPA Equivalent %" />
              </ComposedChart>
            ) : chartViewMode === 'departments' ? (
              <ComposedChart data={departmentChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any) => [`${val}%`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="AvgAttendance" fill="#10b981" radius={[4, 4, 0, 0]} name="Avg Attendance %" />
                <Bar dataKey="AvgInternal" fill="#0284c7" radius={[4, 4, 0, 0]} name="Avg Internal Marks %" />
                <Line type="monotone" dataKey="AvgGpaPct" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} name="Avg GPA %" />
              </ComposedChart>
            ) : (
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="parameter" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Institutional Score" dataKey="value" stroke="#1976d2" fill="#1976d2" fillOpacity={0.4} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
              </RadarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Student Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <GraduationCap className="w-5 h-5 text-[#1976d2]" />
            <h3 className="font-bold text-slate-900 text-sm">Student Academic Roster</h3>
            <span className="text-xs text-slate-400 font-medium">({filteredStudents.length} records)</span>
          </div>

          <div className="flex flex-wrap items-center space-x-2 w-full sm:w-auto">
            <select
              value={rosterScope}
              onChange={(e) => setRosterScope(e.target.value as 'my_subjects' | 'all')}
              className="px-3 py-1.5 border border-blue-200 bg-blue-50 text-[#1976d2] font-semibold rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="my_subjects">My Subject Roster (Marks Entered)</option>
              <option value="all">All Institutional Students</option>
            </select>
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name or roll no..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
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
                <th className="p-3 pl-4">Student & Roll No</th>
                <th className="p-3">Dept & Program</th>
                <th className="p-3">Semester</th>
                <th className="p-3">Attendance</th>
                <th className="p-3">GPA</th>
                <th className="p-3">Category</th>
                <th className="p-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No students match the current filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const isCritical = s.category === 'Critical Attention' || s.overallAttendance < 75;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 pl-4">
                        <p className="font-bold text-slate-900">{s.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{s.rollNo}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-slate-800">{s.department}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{s.program}</p>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">Sem {s.semester}</td>
                      <td className="p-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                            s.overallAttendance < 75
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {s.overallAttendance}%
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{s.overallGpa}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                            s.category === 'Critical Attention'
                              ? 'bg-red-100 text-red-700'
                              : s.category === 'Needs Improvement'
                              ? 'bg-amber-100 text-amber-800'
                              : s.category === 'Outstanding'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {s.category}
                        </span>
                      </td>
                      <td className="p-3 pr-4 text-right space-x-1">
                        <button
                          onClick={() => onNavigate('ai-analysis', s.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="AI Performance Analysis"
                        >
                          <BrainCircuit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onNavigate('whatsapp', s.id)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="WhatsApp Nudge"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditStudent(s)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Student"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
