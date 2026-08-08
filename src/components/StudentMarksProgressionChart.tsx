import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Student } from '../types';

interface StudentMarksProgressionChartProps {
  student: Student;
  avgSessionalMarks: number;
}

export const StudentMarksProgressionChart: React.FC<StudentMarksProgressionChartProps> = ({
  student,
  avgSessionalMarks,
}) => {
  const chartData = (student.subjects || []).map((sub) => ({
    subject: sub.subjectName,
    Internal: sub.internalMarks || 0,
    Semester: sub.semesterMarks || 0,
    Attendance: sub.attendancePercent || student.overallAttendance || 0,
  }));

  if (chartData.length === 0) {
    chartData.push({
      subject: 'Overall Average',
      Internal: avgSessionalMarks,
      Semester: Math.round(student.overallGpa * 8),
      Attendance: student.overallAttendance,
    });
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Subject-Wise Marks & Attendance Progression
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Internal evaluation (Out of 30), Semester marks (Out of 80) & Attendance percentage
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#cbd5e1',
                borderRadius: '0.75rem',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            <Bar dataKey="Internal" fill="#1976d2" radius={[4, 4, 0, 0]} name="Internal Marks (/30)" />
            <Bar dataKey="Semester" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Semester Marks (/80)" />
            <Bar dataKey="Attendance" fill="#10b981" radius={[4, 4, 0, 0]} name="Attendance %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
