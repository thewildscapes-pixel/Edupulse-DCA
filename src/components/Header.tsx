import React from 'react';
import { 
  GraduationCap, 
  LayoutDashboard, 
  UserCheck, 
  BrainCircuit, 
  ClipboardCheck, 
  AlertTriangle, 
  MessageSquare, 
  BookOpen, 
  HelpCircle, 
  Shield, 
  LogOut, 
  HelpCircle as HelpIcon,
  User,
  FileText,
  RefreshCw
} from 'lucide-react';
import { Role } from '../types';
import { CollegeLogo } from './CollegeLogo';

interface HeaderProps {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenWalkthrough: () => void;
  userEmail: string;
  userPhone: string;
  facultyName?: string;
  isAdmin?: boolean;
  onLogout: () => void;
  onOpenEditProfile?: () => void;
  onForceRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  setCurrentRole,
  activeTab,
  setActiveTab,
  onOpenWalkthrough,
  userEmail,
  userPhone,
  facultyName,
  isAdmin = false,
  onLogout,
  onOpenEditProfile,
  onForceRefresh,
  isRefreshing = false,
}) => {
  const allNavTabs = [
    { id: 'home', label: 'Educator Home', icon: LayoutDashboard, roles: ['educator', 'admin'] },
    { id: 'mentor', label: 'Mentor Command', icon: UserCheck, roles: ['mentor', 'admin'] },
    { id: 'ai-analysis', label: 'AI Analytics', icon: BrainCircuit, roles: ['mentor', 'admin'] },
    { id: 'notice-hub', label: 'Notice & Letters', icon: FileText, roles: ['mentor', 'educator', 'admin'] },
    { id: 'assessment', label: 'Assessments', icon: ClipboardCheck, roles: ['educator', 'admin'] },
    { id: 'early-warning', label: 'Early Warning', icon: AlertTriangle, roles: ['mentor', 'educator', 'admin'] },
    { id: 'whatsapp', label: 'WhatsApp Nudges', icon: MessageSquare, roles: ['mentor', 'educator', 'admin'] },
    { id: 'resources', label: 'Resources', icon: BookOpen, roles: ['mentor', 'educator', 'admin'] },
    { id: 'quiz', label: 'Quiz Engine', icon: HelpCircle, roles: ['mentor', 'educator', 'admin'] },
    { id: 'admin', label: 'Admin Suite', icon: Shield, roles: ['admin'] },
  ];

  // Restrict Admin Suite tab from nav tabs if user is not an authorized administrator
  const navTabs = allNavTabs.filter((t) => t.id !== 'admin' || isAdmin);

  const visibleTabs = navTabs.filter((tab) => tab.roles.includes(currentRole));

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand / Logo Section */}
          <div className="flex items-center space-x-3.5">
            <div className="shrink-0">
              <CollegeLogo size="md" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1">
                  <span className="text-[#1976d2]">Edu</span>
                  <span className="text-emerald-600">Pulse</span>
                  <span className="text-slate-800 text-lg font-extrabold ml-1">Digboi</span>
                </h1>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                  Autonomous
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium tracking-wide">
                Digboi College Mentorship & Academic Support Portal
              </p>
            </div>
          </div>

          {/* User & Role Controls */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            {/* Force Refresh Data Button */}
            {onForceRefresh && (
              <button
                onClick={onForceRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-60 shadow-2xs"
                title="Purge Local Storage Cache & Force Atomic Sync from Firestore Cloud"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#1976d2] ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Syncing...' : 'Force Refresh Data'}</span>
              </button>
            )}

            {/* Walkthrough Button */}
            <button
              onClick={onOpenWalkthrough}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              title="System Walkthrough & User Manual"
            >
              <HelpIcon className="w-3.5 h-3.5 text-[#1976d2]" />
              <span>Guide & Roles</span>
            </button>

            {/* Role Switcher Pills */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => {
                  setCurrentRole('educator');
                  if (activeTab === 'mentor' || activeTab === 'ai-analysis' || activeTab === 'admin') {
                    setActiveTab('home');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  currentRole === 'educator'
                    ? 'bg-white text-[#1976d2] shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Educator
              </button>
              <button
                onClick={() => {
                  setCurrentRole('mentor');
                  if (activeTab === 'home' || activeTab === 'assessment' || activeTab === 'admin') {
                    setActiveTab('mentor');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  currentRole === 'mentor'
                    ? 'bg-white text-[#1976d2] shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mentor
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    setCurrentRole('admin');
                    setActiveTab('admin');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    currentRole === 'admin'
                      ? 'bg-white text-[#1976d2] shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Admin
                </button>
              )}
            </div>

            {/* Logged in User info & Logout */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div 
                onClick={onOpenEditProfile}
                className={`text-right hidden sm:block ${onOpenEditProfile ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                title={onOpenEditProfile ? 'Click to Edit Faculty Profile' : undefined}
              >
                <p className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                  {facultyName || userEmail || 'Faculty Member'}
                </p>
                <p className="text-[10px] text-slate-500 capitalize flex items-center justify-end space-x-1">
                  <span>{currentRole} Portal</span>
                  {onOpenEditProfile && <span className="text-[#1976d2] font-semibold underline text-[9px]">Edit</span>}
                </p>
              </div>
              {onOpenEditProfile && (
                <button
                  onClick={onOpenEditProfile}
                  className="p-1.5 text-slate-500 hover:text-[#1976d2] hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Faculty Profile Details"
                >
                  <User className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout / Change Faculty Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 mt-3 pt-2 border-t border-slate-100 overflow-x-auto scrollbar-none">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#1976d2] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
