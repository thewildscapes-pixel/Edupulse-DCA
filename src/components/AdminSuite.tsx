import React, { useState, useEffect } from 'react';
import { Student, Mentor } from '../types';
import { CollegeLogo } from './CollegeLogo';
import { subscribeLoginRegistry, saveLoginRegistryToCloud } from '../lib/firebase';
import jsPDF from 'jspdf';
import { 
  Settings, 
  Download, 
  Users, 
  ShieldCheck, 
  Key, 
  CheckCircle2, 
  Building2, 
  Database,
  FileSpreadsheet,
  Edit3,
  Trash2,
  Search,
  BookOpen,
  Lock,
  UserCheck,
  Phone,
  Mail,
  AlertCircle,
  MessageSquare,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  KeyRound,
  Unlock,
  Sliders,
  History,
  FileJson,
  Upload,
  RotateCcw,
  Send,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';

interface AdminSuiteProps {
  students: Student[];
  mentors: Mentor[];
  currentMentor?: Mentor;
  userEmail?: string;
  userPhone?: string;
  adminList?: string[];
  onUpdateAdminList?: (newList: string[]) => void;
  onEditStudent?: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
  onEditMentor?: (mentor: Mentor) => void;
  onAddMentor?: () => void;
  onDeleteMentor?: (mentorId: string) => void;
}

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  type: 'security' | 'database' | 'system' | 'broadcast';
}

export const AdminSuite: React.FC<AdminSuiteProps> = ({ 
  students, 
  mentors,
  currentMentor,
  userEmail = '',
  userPhone = '',
  adminList = ['thewildscapes@gmail.com', '9706375001'],
  onUpdateAdminList,
  onEditStudent,
  onDeleteStudent,
  onEditMentor,
  onAddMentor,
  onDeleteMentor
}) => {
  const isDevEmail = (emailStr: string) => emailStr.trim().toLowerCase() === 'thewildscapes@gmail.com';
  const isDevPhone = (phoneStr: string) => {
    const digits = phoneStr.replace(/\D/g, '');
    return digits.endsWith('9706375001');
  };

  const checkIsAdmin = (emailStr: string, phoneStr: string) => {
    const cleanE = emailStr.trim().toLowerCase();
    const cleanP = phoneStr.replace(/\D/g, '').slice(-10);

    if (isDevEmail(cleanE) || isDevPhone(cleanP)) return true;

    return adminList.some((adm) => {
      const cleanAdm = adm.trim().toLowerCase();
      const admDigits = cleanAdm.replace(/\D/g, '').slice(-10);
      return (
        (cleanE && cleanE === cleanAdm) ||
        (cleanP && admDigits && cleanP === admDigits)
      );
    });
  };

  // Check initial developer verification
  const [isVerified, setIsVerified] = useState<boolean>(() => {
    const devVerifiedFlag = localStorage.getItem('edupulse_developer_verified') === 'true';
    const currentE = userEmail || localStorage.getItem('edupulse_faculty_email') || '';
    const currentP = userPhone || localStorage.getItem('edupulse_faculty_phone') || '';
    return devVerifiedFlag || checkIsAdmin(currentE, currentP);
  });

  // Developer Login Gate Form State - Keep email and phone BLANK by default
  const [devEmail, setDevEmail] = useState('');
  const [devPhone, setDevPhone] = useState('');

  const [step, setStep] = useState<1 | 2>(1);
  const [accessDeniedMsg, setAccessDeniedMsg] = useState<string | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(30);

  // Admin Module Sub-Tab
  const [adminTab, setAdminTab] = useState<'registry' | 'access' | 'governance' | 'audit' | 'backup' | 'broadcast'>('registry');

  // Access Control & Login Restrictions State
  const [loginRegistry, setLoginRegistry] = useState<Array<{
    id: string;
    email: string;
    phone: string;
    role: string;
    timestamp: string;
    status: 'Authorized' | 'Blocked';
  }>>(() => {
    const saved = localStorage.getItem('edupulse_login_registry');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'reg_1',
        email: 'principal@digboicollege.edu.in',
        phone: '9435012345',
        role: 'educator',
        timestamp: new Date().toLocaleString(),
        status: 'Authorized',
      },
      {
        id: 'reg_2',
        email: 'thewildscapes@gmail.com',
        phone: '9706375001',
        role: 'admin',
        timestamp: new Date().toLocaleString(),
        status: 'Authorized',
      },
    ];
  });

  const [blockedLogins, setBlockedLogins] = useState<string[]>(() => {
    const saved = localStorage.getItem('edupulse_blocked_logins');
    return saved ? JSON.parse(saved) : [];
  });

  const [authorizedLogins, setAuthorizedLogins] = useState<string[]>(() => {
    const saved = localStorage.getItem('edupulse_authorized_logins');
    return saved ? JSON.parse(saved) : ['thewildscapes@gmail.com', 'principal@digboicollege.edu.in', '9706375001', '9435012345'];
  });

  const [strictWhitelist, setStrictWhitelist] = useState<boolean>(() => {
    return localStorage.getItem('edupulse_strict_whitelist') === 'true';
  });

  const [manualBlockInput, setManualBlockInput] = useState('');
  const [manualApproveInput, setManualApproveInput] = useState('');
  const [newAdminInput, setNewAdminInput] = useState('');

  const handleAssignAdminStatus = (inputVal: string) => {
    const clean = inputVal.trim().toLowerCase();
    if (!clean) return;

    if (!adminList.includes(clean)) {
      const updated = [...adminList, clean];
      if (onUpdateAdminList) {
        onUpdateAdminList(updated);
      }
    }
    setNewAdminInput('');
  };

  const handleRevokeAdminStatus = (itemToRemove: string) => {
    const updated = adminList.filter((a) => a.toLowerCase() !== itemToRemove.toLowerCase());
    if (onUpdateAdminList) {
      onUpdateAdminList(updated);
    }
  };

  useEffect(() => {
    localStorage.setItem('edupulse_login_registry', JSON.stringify(loginRegistry));
  }, [loginRegistry]);

  useEffect(() => {
    const unsub = subscribeLoginRegistry((cloudLogs) => {
      if (cloudLogs && cloudLogs.length > 0) {
        setLoginRegistry(cloudLogs);
        localStorage.setItem('edupulse_login_registry', JSON.stringify(cloudLogs));
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    localStorage.setItem('edupulse_blocked_logins', JSON.stringify(blockedLogins));
  }, [blockedLogins]);

  useEffect(() => {
    localStorage.setItem('edupulse_authorized_logins', JSON.stringify(authorizedLogins));
  }, [authorizedLogins]);

  useEffect(() => {
    localStorage.setItem('edupulse_strict_whitelist', strictWhitelist ? 'true' : 'false');
  }, [strictWhitelist]);

  const handleBlockUser = (emailOrPhone: string) => {
    const clean = emailOrPhone.trim().toLowerCase();
    const digits = clean.replace(/\D/g, '').slice(-10);
    const toBlock = digits.length === 10 ? digits : clean;

    if (!blockedLogins.includes(toBlock)) {
      const updated = [...blockedLogins, toBlock];
      setBlockedLogins(updated);
      localStorage.setItem('edupulse_blocked_logins', JSON.stringify(updated));
    }

    setLoginRegistry((prev) =>
      prev.map((item) =>
        item.email.toLowerCase() === clean || item.phone === digits || item.phone === clean
          ? { ...item, status: 'Blocked' }
          : item
      )
    );

    setAuditLogs((prev) => [
      {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        action: `Restricted Unauthorized Login Access for: ${emailOrPhone}`,
        user: 'thewildscapes@gmail.com',
        type: 'security',
      },
      ...prev,
    ]);
  };

  const handleAuthorizeUser = (emailOrPhone: string) => {
    const clean = emailOrPhone.trim().toLowerCase();
    const digits = clean.replace(/\D/g, '').slice(-10);
    const toAuth = digits.length === 10 ? digits : clean;

    const updatedBlocked = blockedLogins.filter((b) => b !== toAuth && b !== clean && b !== digits);
    setBlockedLogins(updatedBlocked);
    localStorage.setItem('edupulse_blocked_logins', JSON.stringify(updatedBlocked));

    if (!authorizedLogins.includes(toAuth)) {
      const updatedAuth = [...authorizedLogins, toAuth];
      setAuthorizedLogins(updatedAuth);
      localStorage.setItem('edupulse_authorized_logins', JSON.stringify(updatedAuth));
    }

    setLoginRegistry((prev) =>
      prev.map((item) =>
        item.email.toLowerCase() === clean || item.phone === digits || item.phone === clean
          ? { ...item, status: 'Authorized' }
          : item
      )
    );

    setAuditLogs((prev) => [
      {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        action: `Authorized Faculty WhatsApp Login for: ${emailOrPhone}`,
        user: 'thewildscapes@gmail.com',
        type: 'security',
      },
      ...prev,
    ]);
  };

  const handleDeleteLoginRecord = (id: string) => {
    setLoginRegistry((prev) => prev.filter((item) => item.id !== id));
  };

  // Governance Settings State
  const [academicSession, setAcademicSession] = useState('2024-2028 (FYUGP)');
  const [minAttendanceThreshold, setMinAttendanceThreshold] = useState(75);
  const [passGpaThreshold, setPassGpaThreshold] = useState(4.0);
  const [terminologyRule, setTerminologyRule] = useState('Institution (Digboi College)');
  const [governanceSaved, setGovernanceSaved] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'log_1',
      timestamp: new Date(Date.now() - 3600000).toLocaleString(),
      action: 'Verified Developer WhatsApp Security OTP (+91 9706375001)',
      user: 'thewildscapes@gmail.com',
      type: 'security',
    },
    {
      id: 'log_2',
      timestamp: new Date(Date.now() - 7200000).toLocaleString(),
      action: 'System Boot & Gemini 2.5 Flash Proxy Connection Initialized',
      user: 'System Core',
      type: 'system',
    },
    {
      id: 'log_3',
      timestamp: new Date(Date.now() - 14400000).toLocaleString(),
      action: 'Digboi College FYUGP Academic Policy Settings Synchronized',
      user: 'thewildscapes@gmail.com',
      type: 'database',
    },
  ]);

  // Broadcast Message State
  const [broadcastSent, setBroadcastSent] = useState(false);

  useEffect(() => {
    let timer: any;
    if (step === 2 && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  const handleRequestDeveloperOtp = () => {
    setAccessDeniedMsg(null);
    setOtpError(null);

    const testE = devEmail.trim().toLowerCase();
    const testP = devPhone.trim();

    const authorized =
      checkIsAdmin(testE, testP) ||
      (userEmail && checkIsAdmin(userEmail, '')) ||
      (userPhone && checkIsAdmin('', userPhone));

    if (!authorized) {
      setAccessDeniedMsg(
        '⛔ Access Denied! The Admin Suite is restricted to lead administrators (thewildscapes@gmail.com / 9706375001) and assigned admin accounts.'
      );
      return;
    }

    // Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setResendTimer(30);
    setEnteredOtp('');
    setStep(2);
  };

  const handleVerifyDeveloperOtp = () => {
    setOtpError(null);
    if (enteredOtp.trim() === generatedOtp) {
      localStorage.setItem('edupulse_developer_verified', 'true');
      localStorage.setItem('edupulse_faculty_email', 'admin.dev@digboicollege.edu.in');
      localStorage.setItem('edupulse_faculty_phone', '+91 9706375001');
      localStorage.setItem('edupulse_faculty_role', 'admin');
      setIsVerified(true);

      // Add log
      setAuditLogs((prev) => [
        {
          id: `log_${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          action: 'Senior Admin Authenticated via Mobile OTP (+91 9706375001)',
          user: 'admin.dev@digboicollege.edu.in',
          type: 'security',
        },
        ...prev,
      ]);
    } else {
      setOtpError('Incorrect OTP code. Please check your WhatsApp notification or click Auto-fill.');
    }
  };

  const handleLockDeveloperAccess = () => {
    localStorage.removeItem('edupulse_developer_verified');
    setIsVerified(false);
    setStep(1);
  };

  const [adminSearch, setAdminSearch] = useState('');

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(adminSearch.toLowerCase()) ||
      s.department.toLowerCase().includes(adminSearch.toLowerCase()) ||
      s.program.toLowerCase().includes(adminSearch.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = 'ID,Name,RollNo,Program,Department,Semester,Attendance%,GPA,Category,ParentPhone\n';
    const rows = students
      .map(
        (s) =>
          `"${s.id}","${s.name}","${s.rollNo}","${s.program}","${s.department}",${s.semester},${s.overallAttendance},${s.overallGpa},"${s.category}","${s.parentPhone}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Digboi_College_EduPulse_Master_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleExportJSON = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      institution: 'Digboi College (Autonomous)',
      developer: 'thewildscapes@gmail.com',
      students,
      mentors,
      auditLogs,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Digboi_College_EduPulse_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleExportStudentPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const totalStudents = students.length;
    const avgAttendance = totalStudents > 0
      ? (students.reduce((acc, s) => acc + (s.overallAttendance || 0), 0) / totalStudents).toFixed(1)
      : '0.0';
    const avgGpa = totalStudents > 0
      ? (students.reduce((acc, s) => acc + (s.overallGpa || 0), 0) / totalStudents).toFixed(2)
      : '0.00';
    const advancedCount = students.filter((s) => s.category === 'Advanced Learner').length;
    const moderateCount = students.filter((s) => s.category === 'Moderate Performer').length;
    const criticalCount = students.filter((s) => s.category === 'Critical Attention').length;

    const reportDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const drawHeader = (pageNum: number) => {
      doc.setFillColor(25, 118, 210); // #1976d2
      doc.rect(0, 0, 210, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('DIGBOI COLLEGE (AUTONOMOUS)', 14, 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('NAAC Grade A+ (CGPA 3.49) • ESTD 1965 • Digboi, Tinsukia, Assam', 14, 16);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('OFFICIAL STUDENT ACADEMIC PERFORMANCE & MENTORSHIP SUMMARY REPORT', 14, 22);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`Date: ${reportDate}`, 196, 12, { align: 'right' });
      doc.text(`Total Mentees: ${totalStudents}`, 196, 18, { align: 'right' });
    };

    drawHeader(1);

    // Summary Metric Cards
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 30, 182, 22, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 30, 182, 22, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('AVG ATTENDANCE', 18, 36);
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${avgAttendance}%`, 18, 44);

    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('AVERAGE GPA', 58, 36);
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${avgGpa} / 10`, 58, 44);

    doc.setFontSize(7.5);
    doc.setTextColor(21, 128, 61);
    doc.text('ADVANCED LEARNERS', 98, 36);
    doc.setFontSize(11);
    doc.text(`${advancedCount}`, 98, 44);

    doc.setFontSize(7.5);
    doc.setTextColor(3, 105, 161);
    doc.text('MODERATE LEARNERS', 138, 36);
    doc.setFontSize(11);
    doc.text(`${moderateCount}`, 138, 44);

    doc.setFontSize(7.5);
    doc.setTextColor(185, 28, 28);
    doc.text('CRITICAL ATTN.', 172, 36);
    doc.setFontSize(11);
    doc.text(`${criticalCount}`, 172, 44);

    const startY = 58;
    let currentY = startY;

    const drawTableHeader = (y: number) => {
      doc.setFillColor(30, 41, 59);
      doc.rect(14, y, 182, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);

      doc.text('#', 17, y + 5.5);
      doc.text('Roll Number', 25, y + 5.5);
      doc.text('Student Name', 55, y + 5.5);
      doc.text('Dept / Sem', 105, y + 5.5);
      doc.text('Att. %', 135, y + 5.5);
      doc.text('GPA', 152, y + 5.5);
      doc.text('Academic Status', 168, y + 5.5);
    };

    drawTableHeader(currentY);
    currentY += 8;

    const dataStudents = filteredStudents.length > 0 ? filteredStudents : students;

    dataStudents.forEach((student, index) => {
      if (currentY > 268) {
        doc.addPage();
        drawHeader(doc.getNumberOfPages());
        currentY = 32;
        drawTableHeader(currentY);
        currentY += 8;
      }

      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, currentY, 182, 7.5, 'F');
      }

      doc.setDrawColor(226, 232, 240);
      doc.line(14, currentY + 7.5, 196, currentY + 7.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);

      doc.text(`${index + 1}`, 17, currentY + 5);

      doc.setFont('courier', 'bold');
      doc.text(student.rollNo || '-', 25, currentY + 5);
      doc.setFont('helvetica', 'normal');

      const truncatedName = student.name.length > 22 ? student.name.substring(0, 20) + '..' : student.name;
      doc.setFont('helvetica', 'bold');
      doc.text(truncatedName, 55, currentY + 5);
      doc.setFont('helvetica', 'normal');

      doc.text(`${student.department || 'Gen'} (S${student.semester || 1})`, 105, currentY + 5);

      doc.setFont('helvetica', 'bold');
      if (student.overallAttendance < 75) {
        doc.setTextColor(185, 28, 28);
      } else {
        doc.setTextColor(21, 128, 61);
      }
      doc.text(`${student.overallAttendance}%`, 135, currentY + 5);

      doc.setTextColor(15, 23, 42);
      doc.text(`${(student.overallGpa || 0).toFixed(1)}`, 152, currentY + 5);

      let catLabel = student.category || 'Moderate Performer';
      if (catLabel === 'Advanced Learner') {
        doc.setFillColor(220, 252, 231);
        doc.setTextColor(21, 128, 61);
      } else if (catLabel === 'Critical Attention') {
        doc.setFillColor(254, 226, 226);
        doc.setTextColor(185, 28, 28);
      } else {
        doc.setFillColor(224, 242, 254);
        doc.setTextColor(3, 105, 161);
      }

      doc.roundedRect(167, currentY + 1, 27, 5.5, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(catLabel === 'Critical Attention' ? 'Critical Attn' : (catLabel === 'Advanced Learner' ? 'Advanced' : 'Moderate'), 180.5, currentY + 4.8, { align: 'center' });

      currentY += 7.5;
    });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(203, 213, 225);
      doc.line(14, 282, 196, 282);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Digboi College EduPulse Governance Portal • Official Student Data Report', 14, 287);
      doc.text(`Page ${i} of ${totalPages}`, 196, 287, { align: 'right' });
    }

    const filename = `Digboi_College_Student_Academic_Summary_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    setAuditLogs((prev) => [
      {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        action: `Exported Student Data PDF Summary Report (${dataStudents.length} Records)`,
        user: userEmail || 'admin.dev@digboicollege.edu.in',
        type: 'system',
      },
      ...prev,
    ]);
  };

  const handleSaveGovernance = (e: React.FormEvent) => {
    e.preventDefault();
    setGovernanceSaved(true);
    setTimeout(() => setGovernanceSaved(false), 3000);

    setAuditLogs((prev) => [
      {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        action: `Updated Institutional Policy: Min Attendance (${minAttendanceThreshold}%), Pass GPA (${passGpaThreshold})`,
        user: 'thewildscapes@gmail.com',
        type: 'system',
      },
      ...prev,
    ]);
  };

  const handleSendWhatsAppBroadcast = () => {
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 4000);

    const criticalCount = students.filter((s) => s.category === 'Critical Attention').length;

    setAuditLogs((prev) => [
      {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        action: `Dispatched WhatsApp Parent Attendance Alerts to ${criticalCount} Critical Attention Mentees`,
        user: 'thewildscapes@gmail.com',
        type: 'broadcast',
      },
      ...prev,
    ]);
  };

  // IF NOT VERIFIED AS DEVELOPER, RENDER DEVELOPER ACCESS GATE
  if (!isVerified) {
    return (
      <div className="max-w-xl mx-auto my-6 p-6 sm:p-8 bg-white rounded-3xl shadow-xl border border-slate-200 animate-fade-in text-left">
        {/* Header Badge */}
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl border border-rose-200 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Restricted Access
              </span>
              <span className="text-xs text-slate-500 font-medium">Developer Verification</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Admin Suite Developer Gate
            </h2>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200">
            The Admin Suite contains core system governance, institution configurations, and master database edit privileges. <strong>Access is strictly restricted to the lead developer.</strong>
          </p>

          {/* Access Denied Warning */}
          {accessDeniedMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs font-semibold flex items-start space-x-2.5 animate-shake">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{accessDeniedMsg}</span>
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Administrator Email ID <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={devEmail}
                    onChange={(e) => setDevEmail(e.target.value)}
                    placeholder="admin@digboicollege.edu.in"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-slate-800 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Administrator Mobile No. <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={devPhone}
                    onChange={(e) => setDevPhone(e.target.value)}
                    placeholder="+91 94350 12345"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-slate-800 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleRequestDeveloperOtp}
                className="w-full bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-extrabold py-3 px-5 rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all text-xs cursor-pointer group mt-2"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Verify Credentials &amp; Send WhatsApp OTP</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ) : (
            /* STEP 2: OTP VERIFICATION */
            <div className="space-y-3.5 pt-2">
              {/* WhatsApp Notification Banner */}
              <div className="w-full bg-emerald-700 text-white p-3.5 rounded-2xl shadow-lg border border-emerald-600 text-xs font-semibold flex items-start space-x-2.5 animate-bounce-once">
                <MessageSquare className="w-5 h-5 shrink-0 text-amber-300 mt-0.5" />
                <div className="flex-1">
                  <div className="font-black text-amber-200 uppercase tracking-wider text-[10px]">
                    WhatsApp Security Notification
                  </div>
                  <div className="mt-0.5 text-xs font-bold">
                    Admin Verification Code: <span className="bg-white text-emerald-950 px-2 py-0.5 rounded-md font-mono text-sm font-black tracking-widest">{generatedOtp}</span>
                  </div>
                  <p className="text-[10px] text-emerald-100 mt-1">
                    Sent to registered administrator WhatsApp number <strong>+91 9706375001</strong>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEnteredOtp(generatedOtp);
                  setOtpError(null);
                }}
                className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-extrabold py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <span>⚡ Auto-Fill Developer Test OTP ({generatedOtp})</span>
              </button>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Enter 6-Digit WhatsApp Developer OTP *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit code"
                  className="w-full text-center tracking-[0.4em] font-mono font-black text-2xl py-3 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                />
              </div>

              {otpError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleVerifyDeveloperOtp}
                className="w-full bg-[#1976d2] hover:bg-blue-700 active:bg-blue-800 text-white font-black py-3 px-5 rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all text-xs cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Verify OTP &amp; Access Admin Suite</span>
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  disabled={resendTimer > 0}
                  onClick={handleRequestDeveloperOtp}
                  className={`font-semibold transition-colors cursor-pointer flex items-center space-x-1 ${
                    resendTimer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-emerald-700 hover:text-emerald-800'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resendTimer > 0 ? '' : 'animate-spin'}`} />
                  <span>{resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                >
                  ← Change Credentials
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ONCE VERIFIED AS DEVELOPER, RENDER FULL ADMIN SUITE DASHBOARD
  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Verified Developer Status Badge */}
      <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-2 shadow-sm text-xs">
        <div className="flex flex-wrap items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-extrabold text-emerald-300">Verified Administrator Access:</span>
          <span className="font-mono text-white font-bold">admin.dev@digboicollege.edu.in</span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="font-mono text-emerald-400 font-bold hidden sm:inline">+91 9706375001</span>
        </div>
        <button
          onClick={handleLockDeveloperAccess}
          className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 shrink-0"
        >
          <Lock className="w-3 h-3" />
          <span>Lock Developer Access</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <CollegeLogo size="lg" className="hidden sm:flex shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                  Admin-Exclusive Master Control
                </span>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Digboi College (Autonomous) • ESTD 1965</span>
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-2">
                Developer Admin Suite &amp; System Governance
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
                Restricted developer tools: Master Mentee Registry, Institutional Policy Controls, Real-Time Audit Trail, Database Backup/Restore, and Automated WhatsApp Parent Alerts.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleExportStudentPDF}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-md"
            >
              <FileText className="w-4 h-4 text-emerald-200" />
              <span>Export Student Data (PDF)</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="bg-[#1976d2] hover:bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Export Master Report (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ADMIN SUB-NAVIGATION TABS */}
      <div className="flex items-center space-x-2 bg-slate-200/80 p-1.5 rounded-2xl overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setAdminTab('registry')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'registry'
              ? 'bg-white text-[#1976d2] shadow-sm font-black'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4 text-[#1976d2]" />
          <span>1. Master Registry</span>
        </button>

        <button
          onClick={() => setAdminTab('access')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'access'
              ? 'bg-white text-rose-700 shadow-sm font-black'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>2. Access Control &amp; Restrictions</span>
        </button>

        <button
          onClick={() => setAdminTab('governance')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'governance'
              ? 'bg-white text-[#1976d2] shadow-sm font-black'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4 text-purple-600" />
          <span>3. Institutional Governance</span>
        </button>

        <button
          onClick={() => setAdminTab('audit')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'audit'
              ? 'bg-white text-[#1976d2] shadow-sm font-black'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4 text-amber-600" />
          <span>4. Audit Trail &amp; Logs</span>
        </button>

        <button
          onClick={() => setAdminTab('backup')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'backup'
              ? 'bg-white text-[#1976d2] shadow-sm font-black'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <FileJson className="w-4 h-4 text-emerald-600" />
          <span>5. Backup &amp; Reset</span>
        </button>

        <button
          onClick={() => setAdminTab('broadcast')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'broadcast'
              ? 'bg-white text-[#1976d2] shadow-sm font-black'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>6. WhatsApp Parent Alerts</span>
        </button>
      </div>

      {/* TAB 1: MASTER DATABASE REGISTRY */}
      {adminTab === 'registry' && (
        <div className="space-y-6">
          {/* Grid Settings Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Management Panel */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-[#1976d2]" />
                  <h3 className="font-bold text-slate-900 text-base">Faculty &amp; Mentor Registry</h3>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {mentors.length} Registered Mentors
                  </span>
                  {onAddMentor && (
                    <button
                      onClick={onAddMentor}
                      className="bg-[#1976d2] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 cursor-pointer shadow-xs"
                    >
                      <span>+ Add Faculty</span>
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Preloaded institutional mentors and custom faculty registered in the database.
              </p>

              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {mentors.map((m) => {
                  const isActiveUser = currentMentor?.email.toLowerCase() === m.email.toLowerCase();
                  return (
                    <div
                      key={m.id}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                        isActiveUser
                          ? 'bg-blue-50/90 border-blue-300 ring-1 ring-blue-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">{m.name}</span>
                          {isActiveUser && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              <span>Active</span>
                            </span>
                          )}
                          {m.isPreloaded && (
                            <span className="bg-amber-100 text-amber-800 border border-amber-300/60 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center space-x-1">
                              <Lock className="w-3 h-3 text-amber-700" />
                              <span>Preloaded</span>
                            </span>
                          )}
                        </div>
                        <div className="text-slate-600 font-medium">
                          Dept: {m.department} • {m.assignedMenteeIds.length} Mentees
                        </div>
                        <div className="text-slate-400 font-mono text-[11px]">{m.email}</div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <span className="bg-blue-100 text-[#1976d2] font-bold text-[10px] px-2.5 py-1 rounded-md uppercase">
                          Faculty
                        </span>
                        {onEditMentor && (
                          <button
                            onClick={() => onEditMentor(m)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit mentor profile"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {onDeleteMentor && (
                          <button
                            onClick={() => onDeleteMentor(m.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete mentor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Technical Integration Panel */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Key className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-base">Gemini AI &amp; Server Proxy Status</h3>
              </div>

              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-purple-900">
                  <span>Server-Side Gemini 2.5 Flash API</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Configured &amp; Active</span>
                  </span>
                </div>
                <p className="text-slate-600">
                  Automated student academic analysis, early warning triggers, and parent progress report draftings utilize server-side Gemini 2.5 Flash via proxy endpoint `/api/analyze-student`.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-800">Digboi College System Specifications</div>
                <div className="text-slate-600 space-y-1">
                  <div>Institution: <strong>Digboi College (Autonomous)</strong></div>
                  <div>Affiliation: <strong>Dibrugarh University</strong></div>
                  <div>Supported Framework: <strong>FYUGP (Four Year Undergraduate) &amp; PG</strong></div>
                  <div>Terminology Policy: <strong>"Institution" (Strictly enforced)</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Master Mentee Database Registry with Edit & Delete */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-[#1976d2]" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Master Mentee Database Registry</h3>
                  <p className="text-xs text-slate-500">Edit or remove any mentee record, subject lists, or internal marks.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportStudentPDF}
                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                  title="Export PDF Student Report"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export PDF</span>
                </button>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search mentee name or roll..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#1976d2] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Mentee Name</th>
                    <th className="p-3">Roll Number</th>
                    <th className="p-3">Program &amp; Dept</th>
                    <th className="p-3 text-center">Attendance</th>
                    <th className="p-3 text-center">GPA</th>
                    <th className="p-3 text-center">Classification</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-slate-500 italic">
                        No mentees match search query.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{s.name}</td>
                        <td className="p-3 font-mono font-semibold text-slate-700">{s.rollNo}</td>
                        <td className="p-3 text-slate-600">{s.program} ({s.department})</td>
                        <td className="p-3 text-center font-mono font-bold text-slate-800">{s.overallAttendance}%</td>
                        <td className="p-3 text-center font-mono text-slate-800">{s.overallGpa}</td>
                        <td className="p-3 text-center">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            s.category === 'Critical Attention'
                              ? 'bg-red-100 text-red-800'
                              : s.category === 'Slow Learner'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {s.category}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {onEditStudent && (
                              <button
                                type="button"
                                onClick={() => onEditStudent(s)}
                                className="px-2.5 py-1 bg-blue-50 text-[#1976d2] hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Record</span>
                              </button>
                            )}
                            {onDeleteStudent && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete ${s.name} (${s.rollNo})?`)) {
                                    onDeleteStudent(s.id);
                                  }
                                }}
                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer"
                                title="Delete Mentee"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACCESS CONTROL & UNAUTHORIZED LOGIN RESTRICTIONS */}
      {adminTab === 'access' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6 text-left animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-rose-100 text-rose-800 rounded-2xl shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Faculty Access Control &amp; Unauthorized Login Restrictions</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monitor verified WhatsApp faculty logins, restrict suspicious or unauthorized users, and enforce strict pre-approval rosters.
                </p>
              </div>
            </div>

            {/* Strict Whitelist Policy Switch */}
            <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center space-x-3 shrink-0">
              <div>
                <span className="block text-xs font-black text-amber-950">Strict Faculty Whitelist Policy</span>
                <span className="block text-[10px] text-amber-800 font-semibold">
                  {strictWhitelist ? 'Active: Only pre-approved faculty can log in' : 'Disabled: All genuine WhatsApp logins allowed'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStrictWhitelist(!strictWhitelist)}
                className={`w-12 h-6.5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  strictWhitelist ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
                title="Toggle Strict Faculty Pre-Approval Policy"
              >
                <span className="bg-white w-4.5 h-4.5 rounded-full shadow-md" />
              </button>
            </div>
          </div>

          {/* ADMIN PRIVILEGE & ACCESS ASSIGNMENT (LEAD ADMIN CONTROLS) */}
          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-200/60 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-[#1976d2] text-white rounded-xl shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Lead Administrator Privilege Assignment
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Assign full Admin Suite access to designated faculty emails or mobile numbers. Details remain strictly hidden from regular faculty members.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Enter Faculty Email ID or 10-digit Mobile Number (e.g., professor@digboicollege.edu.in or 9876543210)"
                  value={newAdminInput}
                  onChange={(e) => setNewAdminInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#1976d2]"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (newAdminInput.trim()) {
                    handleAssignAdminStatus(newAdminInput);
                  }
                }}
                className="w-full sm:w-auto px-5 py-2 bg-[#1976d2] hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Assign Admin Status</span>
              </button>
            </div>

            {/* List of Current Admins */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                Active System Administrators
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {/* Built-in Lead Admins */}
                <div className="p-2.5 bg-white border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block truncate max-w-[170px]">thewildscapes@gmail.com</span>
                    <span className="bg-blue-100 text-[#1976d2] text-[10px] font-extrabold px-2 py-0.5 rounded">Lead Admin • Built-in</span>
                  </div>
                  <Lock className="w-4 h-4 text-blue-500 shrink-0" />
                </div>

                <div className="p-2.5 bg-white border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block truncate">+91 9706375001</span>
                    <span className="bg-blue-100 text-[#1976d2] text-[10px] font-extrabold px-2 py-0.5 rounded">Lead Admin • Built-in</span>
                  </div>
                  <Lock className="w-4 h-4 text-blue-500 shrink-0" />
                </div>

                {/* Dynamically Assigned Admins */}
                {adminList
                  .filter((item) => item !== 'thewildscapes@gmail.com' && item !== '9706375001')
                  .map((adm) => (
                    <div key={adm} className="p-2.5 bg-white border border-emerald-200 rounded-xl flex items-center justify-between text-xs shadow-2xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block truncate max-w-[140px]">{adm}</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded">Assigned Admin</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRevokeAdminStatus(adm)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Revoke Admin Status"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Quick Blacklist / Whitelist Forms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2.5">
              <label className="font-extrabold text-rose-950 block flex items-center space-x-1.5">
                <Lock className="w-4 h-4 text-rose-600" />
                <span>🚫 Restrict WhatsApp Number or Email</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g. 9876543210 or unknown.user@gmail.com"
                  value={manualBlockInput}
                  onChange={(e) => setManualBlockInput(e.target.value)}
                  className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manualBlockInput.trim()) {
                      handleBlockUser(manualBlockInput);
                      setManualBlockInput('');
                    }
                  }}
                  className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold px-4 py-2.5 rounded-xl shrink-0 cursor-pointer text-xs shadow-xs"
                >
                  Block Access
                </button>
              </div>
              <p className="text-[10px] text-rose-800 italic">
                Blocked numbers/emails will be immediately denied access upon WhatsApp OTP request or active session.
              </p>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2.5">
              <label className="font-extrabold text-emerald-950 block flex items-center space-x-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>✅ Pre-Approve / Whitelist Faculty Member</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g. +91 94350 12345 or prof.name@digboicollege.edu.in"
                  value={manualApproveInput}
                  onChange={(e) => setManualApproveInput(e.target.value)}
                  className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manualApproveInput.trim()) {
                      handleAuthorizeUser(manualApproveInput);
                      setManualApproveInput('');
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold px-4 py-2.5 rounded-xl shrink-0 cursor-pointer text-xs shadow-xs"
                >
                  Pre-Approve
                </button>
              </div>
              <p className="text-[10px] text-emerald-800 italic">
                Whitelisted numbers/emails bypass strict registration locks and gain full faculty access.
              </p>
            </div>
          </div>

          {/* Recorded Faculty Logins Table */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-[#1976d2]" />
                <span className="font-extrabold text-slate-900 uppercase tracking-wider text-xs">
                  Logged-In / Registered WhatsApp Faculty Accounts
                </span>
              </div>
              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold text-[11px]">
                {loginRegistry.length} Sessions Logged
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Faculty Email</th>
                    <th className="p-3">Verified WhatsApp Mobile</th>
                    <th className="p-3">Assigned Role</th>
                    <th className="p-3">Login Timestamp</th>
                    <th className="p-3 text-center">Access Status</th>
                    <th className="p-3 text-center">Admin Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loginRegistry.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500 italic">
                        No login attempts or sessions logged in registry yet.
                      </td>
                    </tr>
                  ) : (
                    loginRegistry.map((item) => {
                      const cleanE = (item.email || '').toLowerCase();
                      const cleanP = (item.phone || '').replace(/\D/g, '').slice(-10);
                      const isBlocked = blockedLogins.includes(cleanE) || blockedLogins.includes(cleanP);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-bold text-slate-900">
                            <div className="flex items-center space-x-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span title={item.email}>{item.email}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-800">
                            <div className="flex items-center space-x-1.5">
                              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>+91 {cleanP}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="bg-blue-50 text-blue-800 border border-blue-200 uppercase text-[10px] font-black px-2 py-0.5 rounded-md">
                              {item.role}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-500">{item.timestamp}</td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center space-x-1 ${
                                isBlocked
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}
                            >
                              {isBlocked ? (
                                <>
                                  <Lock className="w-3 h-3 mr-1" />
                                  <span>Restricted / Blocked</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-3 h-3 mr-1" />
                                  <span>Authorized</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {isBlocked ? (
                                <button
                                  type="button"
                                  onClick={() => handleAuthorizeUser(item.email)}
                                  className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-[11px] font-black cursor-pointer transition-colors shadow-2xs"
                                >
                                  Unblock Access
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleBlockUser(item.email)}
                                  className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-lg text-[11px] font-black cursor-pointer transition-colors shadow-2xs"
                                >
                                  Block / Restrict
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteLoginRecord(item.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Login Record from Registry"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
        </div>
      )}

      {/* TAB 3: INSTITUTIONAL GOVERNANCE */}
      {adminTab === 'governance' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Institutional Governance &amp; System Parameters</h3>
                <p className="text-xs text-slate-500">Configure global academic thresholds, grading schemes, and term policies for Digboi College.</p>
              </div>
            </div>
            {governanceSaved && (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Policy Settings Saved Successfully!</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveGovernance} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Active Academic Session</label>
                <select
                  value={academicSession}
                  onChange={(e) => setAcademicSession(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
                >
                  <option value="2024-2028 (FYUGP)">2024-2028 (Four Year Undergraduate Program - FYUGP)</option>
                  <option value="2023-2027 (FYUGP)">2023-2027 (FYUGP Batch 1)</option>
                  <option value="2025-2027 (PG)">2025-2027 (Post Graduate Program - M.Sc / M.A.)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Early Warning Attendance Threshold (%)</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min={50}
                    max={90}
                    value={minAttendanceThreshold}
                    onChange={(e) => setMinAttendanceThreshold(Number(e.target.value))}
                    className="w-full accent-[#1976d2]"
                  />
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                    {minAttendanceThreshold}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Students falling below this threshold will automatically trigger "Critical Attention" alerts.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Pass Criteria CGPA Cutoff</label>
                <input
                  type="number"
                  step="0.1"
                  min={3.0}
                  max={6.0}
                  value={passGpaThreshold}
                  onChange={(e) => setPassGpaThreshold(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Mentees below this GPA are classified as "Slow Learners" requiring remedial intervention.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Mandatory Institutional Terminology</label>
                <input
                  type="text"
                  disabled
                  value={terminologyRule}
                  className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-xl font-bold text-slate-600 cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Strictly enforced across all portal pages as requested by Digboi College Administration.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="bg-[#1976d2] hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-colors cursor-pointer shadow-md"
              >
                <Sliders className="w-4 h-4" />
                <span>Save Governance Parameters</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL & LOGS */}
      {adminTab === 'audit' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Admin Security Audit Trail &amp; Activity Log</h3>
                <p className="text-xs text-slate-500">Live immutable ledger tracking system logins, developer verifications, and record modifications.</p>
              </div>
            </div>

            <button
              onClick={() => {
                const logTxt = auditLogs.map((l) => `[${l.timestamp}] (${l.user}) ${l.action}`).join('\n');
                const blob = new Blob([logTxt], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Digboi_Audit_Logs_${Date.now()}.txt`;
                a.click();
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Log File</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-start space-x-2.5">
                  <span
                    className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      log.type === 'security'
                        ? 'bg-rose-100 text-rose-800'
                        : log.type === 'broadcast'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {log.type}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900">{log.action}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Executed by: <strong className="text-slate-700">{log.user}</strong></div>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP & SYSTEM RESET */}
      {adminTab === 'backup' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <FileJson className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Database Backup &amp; Disaster Recovery</h3>
              <p className="text-xs text-slate-500">Export complete institutional data or perform disaster recovery restore.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Backup Export */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Export Complete JSON Database Backup</span>
              </div>
              <p className="text-slate-600">
                Downloads all mentee records, subject lists, internal assessment marks, faculty registers, and audit logs into a single structured JSON file.
              </p>
              <button
                onClick={handleExportJSON}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-2"
              >
                <FileJson className="w-4 h-4" />
                <span>Download Backup (.JSON)</span>
              </button>
            </div>

            {/* Emergency Reset */}
            <div className="p-5 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-3">
              <div className="font-bold text-rose-900 text-sm flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>Reset Local Data Storage</span>
              </div>
              <p className="text-slate-600">
                Clears cached faculty session tokens and resets system state back to default preloaded Digboi College institutional data.
              </p>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear stored session data and reload defaults?')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="w-full bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Session Storage &amp; Reload</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: WHATSAPP PARENT ALERTS BROADCAST */}
      {adminTab === 'broadcast' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">WhatsApp Parent Attendance Alert Dispatcher</h3>
              <p className="text-xs text-slate-500">Automated WhatsApp notification tool for parents of "Critical Attention" mentees with attendance &lt; 75%.</p>
            </div>
          </div>

          {broadcastSent && (
            <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-bounce-once">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>
                WhatsApp Parent Alerts dispatched successfully! Notification triggers sent to registered parent mobile numbers.
              </span>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center justify-between">
              <span>Target Mentees Identified</span>
              <span className="bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-mono font-black">
                {students.filter((s) => s.category === 'Critical Attention').length} Mentees Requiring Alert
              </span>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {students
                .filter((s) => s.category === 'Critical Attention')
                .map((s) => (
                  <div key={s.id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{s.name}</span> ({s.rollNo})
                      <div className="text-[11px] text-slate-500">Attendance: <strong className="text-rose-600">{s.overallAttendance}%</strong> • Parent: {s.parentPhone}</div>
                    </div>
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
                      <MessageSquare className="w-3 h-3 text-emerald-600" />
                      <span>Ready to Send</span>
                    </span>
                  </div>
                ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSendWhatsAppBroadcast}
                className="w-full bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold py-3 px-5 rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer text-xs"
              >
                <Send className="w-4 h-4" />
                <span>Dispatch WhatsApp Parent Attendance Alerts</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


