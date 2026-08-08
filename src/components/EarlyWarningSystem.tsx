import React, { useState } from 'react';
import { Student } from '../types';
import { CollegeLogo } from './CollegeLogo';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Send, 
  MessageSquare, 
  BookOpen, 
  CheckCircle2, 
  Search,
  ChevronRight,
  TrendingDown
} from 'lucide-react';

interface EarlyWarningSystemProps {
  students: Student[];
  onNavigateToWhatsApp: (studentId: string) => void;
  onNavigateToResources: () => void;
}

export const EarlyWarningSystem: React.FC<EarlyWarningSystemProps> = ({
  students,
  onNavigateToWhatsApp,
  onNavigateToResources,
}) => {
  const [levelFilter, setLevelFilter] = useState<'all' | 'critical' | 'warning' | 'watchlist'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Flagged students calculation
  const flaggedList = students.map((s) => {
    let warningLevel: 'critical' | 'warning' | 'watchlist' | 'normal' = 'normal';
    let reasons: string[] = [];

    if (s.overallAttendance < 60) {
      warningLevel = 'critical';
      reasons.push(`Critical attendance shortage: ${s.overallAttendance}% (Required: 75%)`);
    } else if (s.overallAttendance < 70) {
      warningLevel = 'warning';
      reasons.push(`Low attendance: ${s.overallAttendance}%`);
    } else if (s.overallAttendance < 75) {
      warningLevel = 'watchlist';
      reasons.push(`Borderline attendance: ${s.overallAttendance}%`);
    }

    if (s.category === 'Critical Attention' || s.overallGpa < 5.0) {
      if (warningLevel !== 'critical') warningLevel = 'critical';
      reasons.push(`Low academic standing (GPA: ${s.overallGpa})`);
    } else if (s.category === 'Slow Learner') {
      if (warningLevel === 'normal') warningLevel = 'warning';
      reasons.push('Tagged as Slow Learner needing remedial support');
    }

    return { student: s, warningLevel, reasons };
  }).filter(item => item.warningLevel !== 'normal');

  const filteredFlagged = flaggedList.filter((item) => {
    const matchesLevel = levelFilter === 'all' || item.warningLevel === levelFilter;
    const matchesSearch = item.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.student.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const criticalCount = flaggedList.filter(f => f.warningLevel === 'critical').length;
  const warningCount = flaggedList.filter(f => f.warningLevel === 'warning').length;
  const watchlistCount = flaggedList.filter(f => f.warningLevel === 'watchlist').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-700 to-amber-700 text-white p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center space-x-3.5">
            <CollegeLogo size="lg" className="shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-black/30 text-red-100 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                  Automated Risk Triggers
                </span>
                <span className="bg-red-900/50 text-red-100 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Digboi College Academic Safety Net</span>
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-1.5">
                Early Warning & Intervention System
              </h2>
              <p className="text-red-100 text-xs sm:text-sm mt-1 max-w-2xl">
                Automated monitoring algorithms flag students experiencing sudden attendance drops (&lt;75%) or failing internal assessment marks (&lt;40%) before semester end exams.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold shrink-0">
            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/20 text-center">
              <div className="text-xl text-white">{criticalCount}</div>
              <div className="text-red-200 text-[10px] uppercase">Level 3 Critical</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/20 text-center">
              <div className="text-xl text-white">{warningCount}</div>
              <div className="text-amber-200 text-[10px] uppercase">Level 2 Warning</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs font-semibold w-full sm:w-auto">
          <button
            onClick={() => setLevelFilter('all')}
            className={`px-3 py-2 rounded-xl transition-colors cursor-pointer ${
              levelFilter === 'all'
                ? 'bg-[#1976d2] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Flagged ({flaggedList.length})
          </button>
          <button
            onClick={() => setLevelFilter('critical')}
            className={`px-3 py-2 rounded-xl transition-colors cursor-pointer ${
              levelFilter === 'critical'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            Level 3 Critical ({criticalCount})
          </button>
          <button
            onClick={() => setLevelFilter('warning')}
            className={`px-3 py-2 rounded-xl transition-colors cursor-pointer ${
              levelFilter === 'warning'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Level 2 Warning ({warningCount})
          </button>
          <button
            onClick={() => setLevelFilter('watchlist')}
            className={`px-3 py-2 rounded-xl transition-colors cursor-pointer ${
              levelFilter === 'watchlist'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            Level 1 Watchlist ({watchlistCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search flagged student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-[#1976d2] outline-none"
          />
        </div>
      </div>

      {/* Flagged Students Cards Grid */}
      <div className="space-y-3">
        {filteredFlagged.map(({ student, warningLevel, reasons }) => {
          const isCritical = warningLevel === 'critical';
          const isWarning = warningLevel === 'warning';

          return (
            <div
              key={student.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all ${
                isCritical
                  ? 'border-red-300 bg-red-50/20'
                  : isWarning
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-blue-200 bg-blue-50/20'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className={`w-12 h-12 rounded-full font-bold flex items-center justify-center text-sm shrink-0 ${
                    isCritical
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : isWarning
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {student.name.charAt(0)}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-slate-900 text-base">{student.name}</h3>
                      <span className="text-xs font-mono text-slate-500">({student.rollNo})</span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        isCritical
                          ? 'bg-red-600 text-white'
                          : isWarning
                          ? 'bg-amber-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}>
                        {warningLevel === 'critical' ? 'Level 3 Critical' : warningLevel === 'warning' ? 'Level 2 Warning' : 'Level 1 Watchlist'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3">
                      <span>{student.program} (Sem {student.semester})</span>
                      <span>•</span>
                      <span>Dept: {student.department}</span>
                      <span>•</span>
                      <span>Guardian: {student.parentName} ({student.parentPhone})</span>
                    </div>

                    {/* Triggers reasons */}
                    <div className="mt-3 space-y-1">
                      {reasons.map((r, i) => (
                        <div key={i} className="text-xs font-semibold text-red-700 flex items-center space-x-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 border-t md:border-0 pt-3 md:pt-0 w-full md:w-auto">
                  <button
                    onClick={() => onNavigateToWhatsApp(student.id)}
                    className="flex-1 md:flex-initial justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Nudge</span>
                  </button>

                  <button
                    onClick={onNavigateToResources}
                    className="flex-1 md:flex-initial justify-center bg-blue-50 hover:bg-blue-100 text-[#1976d2] font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 border border-blue-200 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Assign Handout</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
