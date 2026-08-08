import React, { useState, useEffect } from 'react';
import { Role, Student, Department, Mentor, ALL_DEPARTMENTS } from '../types';
import { AddNewMenteeModal } from './AddNewMenteeModal';
import { saveLoginRegistryToCloud } from '../lib/firebase';
import { 
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  X,
  ArrowRight,
  AtSign,
  CheckCircle2,
  Users,
  FileSpreadsheet,
  ShieldCheck,
  Check,
  UserCheck,
  Phone,
  Building2,
  Award,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  LogOut,
  KeyRound
} from 'lucide-react';

const DEPARTMENTS: Department[] = ALL_DEPARTMENTS;

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (
    role: Role, 
    defaultTab: string, 
    userEmail?: string,
    userPhone?: string,
    mentorProfile?: {
      name: string;
      designation: string;
      department: Department;
      phone: string;
    }
  ) => void;
  onLogout?: () => void;
  onAddStudent?: (student: Student) => void;
  currentMentor?: Mentor;
  mentors?: Mentor[];
  userEmail?: string;
  userPhone?: string;
}

export const WalkthroughModal: React.FC<WalkthroughModalProps> = ({
  isOpen,
  onClose,
  onSelectRole,
  onLogout,
  onAddStudent,
  currentMentor,
  mentors,
  userEmail = '',
  userPhone = '',
}) => {
  const savedFacultyEmail = userEmail || localStorage.getItem('edupulse_faculty_email') || '';
  const savedFacultyPhone = userPhone || localStorage.getItem('edupulse_faculty_phone') || '';

  const [step, setStep] = useState<1 | 1.5 | 2 | 3>(() => {
    if (savedFacultyEmail.trim().length > 0) {
      return 2; // Directly land on Role Selection if logged in
    }
    return 1;
  });

  // Email and WhatsApp Phone inputs
  const [activeEmail, setActiveEmail] = useState(() => savedFacultyEmail);
  const [activePhone, setActivePhone] = useState(() => savedFacultyPhone);

  // Validation & OTP state
  const [validationError, setValidationError] = useState<string | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<Role>('educator');

  useEffect(() => {
    const currentEmail = userEmail || localStorage.getItem('edupulse_faculty_email') || '';
    const currentPhone = userPhone || localStorage.getItem('edupulse_faculty_phone') || '';
    
    if (currentEmail) {
      setActiveEmail(currentEmail);
    }
    if (currentPhone) {
      setActivePhone(currentPhone);
    }

    if (isOpen && currentEmail.trim().length > 0) {
      setStep(2); // Auto jump to role selection when modal is opened while logged in
    }
  }, [isOpen, userEmail, userPhone]);

  useEffect(() => {
    let timer: any;
    if (step === 1.5 && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  if (!isOpen) return null;

  // Validation helpers for genuine faculty details
  const isValidEmail = (emailStr: string) => {
    const trimmed = emailStr.trim().toLowerCase();
    return trimmed.length > 5 && trimmed.includes('@') && trimmed.includes('.');
  };

  const checkGenuineWhatsAppPhone = (phoneStr: string): { valid: boolean; reason?: string; cleanDigits: string } => {
    const digitsOnly = phoneStr.replace(/\D/g, '');
    let tenDigits = digitsOnly;
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      tenDigits = digitsOnly.slice(2);
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
      tenDigits = digitsOnly.slice(1);
    }

    if (tenDigits.length !== 10) {
      return {
        valid: false,
        reason: 'Please enter a genuine 10-digit WhatsApp registered mobile number (e.g. 9706375001 or +91 94350 12345).',
        cleanDigits: tenDigits,
      };
    }

    // Check genuine Indian mobile prefix (starts with 6, 7, 8, 9)
    const firstDigit = tenDigits.charAt(0);
    if (!['6', '7', '8', '9'].includes(firstDigit)) {
      return {
        valid: false,
        reason: `Invalid mobile number prefix '${firstDigit}'. Genuine Indian mobile numbers start with 6, 7, 8, or 9.`,
        cleanDigits: tenDigits,
      };
    }

    // Check repetitive test numbers (0000000000, 1111111111, 9999999999, etc.)
    if (/^(\d)\1{9}$/.test(tenDigits)) {
      return {
        valid: false,
        reason: 'Invalid test number detected. Please enter a genuine active faculty WhatsApp number.',
        cleanDigits: tenDigits,
      };
    }

    // Check sequential test numbers
    if (tenDigits === '1234567890' || tenDigits === '0123456789' || tenDigits === '9876543210') {
      return {
        valid: false,
        reason: 'Fake sequential mobile number detected. Please enter your genuine faculty WhatsApp number.',
        cleanDigits: tenDigits,
      };
    }

    return { valid: true, cleanDigits: tenDigits };
  };

  // Trigger WhatsApp OTP
  const handleSendWhatsAppOtp = () => {
    setValidationError(null);
    setOtpError(null);

    const phoneToTest = activePhone.trim();
    const phoneDigits = phoneToTest.replace(/\D/g, '');
    const isDevPhone = phoneDigits.endsWith('9706375001');

    let emailToTest = activeEmail.trim().toLowerCase();

    // If logging in via developer phone 9706375001, allow empty email and set default masked admin email
    if (isDevPhone) {
      if (!emailToTest) {
        emailToTest = 'admin.dev@digboicollege.edu.in';
        setActiveEmail('admin.dev@digboicollege.edu.in');
      }
    } else {
      if (!isValidEmail(emailToTest)) {
        setValidationError('Please enter a valid active Faculty Email ID (e.g. prof.name@digboicollege.edu.in).');
        return;
      }
    }

    const phoneCheck = checkGenuineWhatsAppPhone(phoneToTest);
    if (!phoneCheck.valid) {
      setValidationError(phoneCheck.reason || 'Invalid WhatsApp Phone Number.');
      return;
    }

    const cleanDigits = phoneCheck.cleanDigits;

    // Check if Email or Phone is on the Admin Restriction / Blacklist
    const blockedLogins: string[] = JSON.parse(localStorage.getItem('edupulse_blocked_logins') || '[]');
    const isEmailBlocked = blockedLogins.includes(emailToTest);
    const isPhoneBlocked = blockedLogins.includes(cleanDigits) || blockedLogins.includes(`+91${cleanDigits}`);

    if (isEmailBlocked || isPhoneBlocked) {
      setValidationError('Access Denied: This WhatsApp number or email address has been restricted by Digboi College Admin.');
      return;
    }

    // Check Strict Pre-Approval Whitelist Policy if enabled by Admin
    const strictWhitelistEnabled = localStorage.getItem('edupulse_strict_whitelist') === 'true';
    if (strictWhitelistEnabled && !isDevPhone) {
      const authorizedLogins: string[] = JSON.parse(localStorage.getItem('edupulse_authorized_logins') || '[]');
      const preloadedEmails = ['principal@digboicollege.edu.in', 'viceprincipal@digboicollege.edu.in'];
      const isAuthorized = 
        authorizedLogins.includes(emailToTest) || 
        authorizedLogins.includes(cleanDigits) || 
        authorizedLogins.includes(`+91${cleanDigits}`) ||
        preloadedEmails.includes(emailToTest);

      if (!isAuthorized) {
        setValidationError('Unauthorized Access: Strict Faculty Whitelist Policy is active. Your WhatsApp number or email is not pre-approved on Digboi College Admin Roster.');
        return;
      }
    }

    // Generate random 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setIsOtpSent(true);
    setResendTimer(30);
    setEnteredOtp('');
    setStep(1.5); // Move to OTP verification view
  };

  const handleVerifyOtp = () => {
    setOtpError(null);
    if (enteredOtp.trim() === generatedOtp) {
      const cleanDigits = activePhone.replace(/\D/g, '').slice(-10);
      const emailNorm = activeEmail.trim().toLowerCase() || 'admin.dev@digboicollege.edu.in';
      const isDevPhone = cleanDigits.endsWith('9706375001');

      if (isDevPhone) {
        localStorage.setItem('edupulse_developer_verified', 'true');
        setSelectedRole('admin');
      }

      // Save verified credentials to localStorage
      localStorage.setItem('edupulse_faculty_email', emailNorm);
      localStorage.setItem('edupulse_faculty_phone', `+91 ${cleanDigits}`);

      // Record in Admin Login Registry
      try {
        const existingLogs = JSON.parse(localStorage.getItem('edupulse_login_registry') || '[]');
        const newEntry = {
          id: `login_${Date.now()}`,
          email: isDevPhone ? 'admin.dev@digboicollege.edu.in' : emailNorm,
          phone: cleanDigits,
          role: isDevPhone ? 'admin' : selectedRole,
          timestamp: new Date().toLocaleString(),
          status: 'Authorized',
        };
        const updatedLogs = [newEntry, ...existingLogs.filter((l: any) => l.phone !== cleanDigits)].slice(0, 50);
        localStorage.setItem('edupulse_login_registry', JSON.stringify(updatedLogs));
        saveLoginRegistryToCloud(updatedLogs);
      } catch (e) {}

      setStep(2); // Proceed to role selection
    } else {
      setOtpError('Incorrect 6-digit OTP code. Please check your WhatsApp message or click Auto-fill.');
    }
  };

  return (
    <>
      {step === 3 ? (
        <AddNewMenteeModal
          isOpen={true}
          onClose={() => {
            onSelectRole('mentor', 'mentor', activeEmail, activePhone);
            onClose();
          }}
          onAddMentee={(student) => {
            if (onAddStudent) {
              onAddStudent(student);
            }
            onSelectRole('mentor', 'mentor', activeEmail, activePhone);
            onClose();
          }}
          onBackToLogin={() => setStep(2)}
        />
      ) : (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {step === 1 ? (
            /* STEP 1: Landing Page - Active Email & WhatsApp Mobile Verification */
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col items-center text-center relative animate-fade-in my-auto">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Centered Prominent Logo Box */}
              <div className="bg-white rounded-3xl p-3.5 shadow-xl border-4 border-amber-400/90 ring-4 ring-blue-500/20 w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center mb-4 mt-1 transition-transform hover:scale-105">
                <img
                  src="/edupulse_logo.jpg"
                  alt="EduPulse Digboi College Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (img.src.includes('edupulse_logo.jpg')) {
                      img.src = '/digboi_college_logo.jpg';
                    } else if (img.src.includes('digboi_college_logo.jpg')) {
                      img.src = '/digboi_college_logo.svg';
                    }
                  }}
                />
              </div>

              {/* Title & NAAC Accreditation */}
              <h2 className="text-3xl sm:text-4xl font-black text-[#1976d2] tracking-tight">
                EduPulse
              </h2>
              <p className="text-sm sm:text-base font-extrabold text-slate-800 tracking-wide mt-0.5 whitespace-nowrap">
                Digboi College (Autonomous)
              </p>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                <span className="inline-block bg-amber-400 border border-amber-300 text-blue-950 text-[11px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                  Estd. 1965
                </span>
                <span className="inline-block bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md whitespace-nowrap shadow-xs">
                  NAAC Accredited "A+ (CGPA: 3.49)"
                </span>
              </div>

              <p className="mt-3 text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
                Welcome to Digboi College Educator Hub. Manage student rosters, record marks &amp; attendance, view AI performance diagnostics, and trigger parent interventions.
              </p>

              {/* Active Logged-in Faculty Notice & Logout Option */}
              {userEmail && (
                <div className="w-full mt-3 p-2.5 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between text-left text-xs">
                  <div>
                    <span className="text-slate-500 font-medium block text-[10px] uppercase tracking-wider">
                      Active Signed-In Faculty
                    </span>
                    <strong className="text-blue-900 truncate block max-w-[200px]" title={userEmail}>
                      {userEmail}
                    </strong>
                    {userPhone && <span className="text-[10px] text-slate-600 block">{userPhone}</span>}
                  </div>
                  {onLogout && (
                    <button
                      type="button"
                      onClick={onLogout}
                      className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold px-3 py-1.5 rounded-xl transition-colors cursor-pointer text-xs flex items-center space-x-1 shrink-0 shadow-xs"
                      title="Logout from Faculty Account"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  )}
                </div>
              )}

              {/* Main Faculty Credentials Verification Form */}
              <div className="w-full mt-4 space-y-3.5 text-left">
                <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-2.5 flex items-start space-x-2 text-amber-900 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-tight font-semibold">
                    Faculty access requires an <strong>Active Email ID</strong> &amp; <strong>WhatsApp Number</strong> for security OTP verification.
                  </p>
                </div>

                {/* Validation Error Alert */}
                {validationError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-start space-x-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Email Input */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Faculty Email ID <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={activeEmail}
                      onChange={(e) => setActiveEmail(e.target.value)}
                      placeholder="e.g. prof.deborshee@digboicollege.edu.in"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#1976d2] font-semibold transition-all"
                    />
                  </div>
                </div>

                {/* WhatsApp Phone Number Input */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Registered WhatsApp Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={activePhone}
                      onChange={(e) => setActivePhone(e.target.value)}
                      placeholder="+91 94350 12345"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">
                    A 6-digit verification OTP will be sent directly to this WhatsApp number.
                  </p>
                </div>

                {/* Send WhatsApp OTP Action Button */}
                <button
                  type="button"
                  onClick={handleSendWhatsAppOtp}
                  className="w-full bg-[#1976d2] hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold py-3 px-5 rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all text-xs cursor-pointer group mt-2"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Request WhatsApp Verification OTP</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Copyright Notice */}
                <div className="pt-4 text-center border-t border-slate-100 mt-4">
                  <p className="text-xs font-bold text-slate-700">
                    Copyright Dr. Deborshee Gogoi
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Digboi College (Autonomous) • Internal Academic Portal
                  </p>
                </div>
              </div>
            </div>
          ) : step === 1.5 ? (
            /* STEP 1.5: WhatsApp 6-Digit OTP Verification Screen */
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col items-center relative animate-fade-in my-auto text-left">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* SIMULATED WHATSAPP NOTIFICATION TOAST AT TOP */}
              <div className="w-full bg-emerald-600 text-white p-3.5 rounded-2xl shadow-lg border border-emerald-500 mb-4 text-xs font-semibold flex items-start space-x-2.5 animate-bounce-once">
                <MessageSquare className="w-5 h-5 shrink-0 mt-0.5 text-amber-300" />
                <div className="flex-1">
                  <div className="font-extrabold text-amber-200 uppercase tracking-wider text-[10px]">
                    WhatsApp Security Notification
                  </div>
                  <div className="mt-0.5 text-xs font-bold">
                    EduPulse Digboi College OTP Code: <span className="bg-white text-emerald-950 px-2 py-0.5 rounded-md font-mono text-sm font-black tracking-widest">{generatedOtp}</span>
                  </div>
                  <p className="text-[10px] text-emerald-100 mt-1">
                    Sent to registered WhatsApp number <strong>{activePhone}</strong>.
                  </p>
                </div>
              </div>

              {/* Header EduPulse Logo */}
              <div className="bg-white rounded-2xl p-2.5 shadow-md border-2 border-amber-400 ring-2 ring-emerald-500/20 w-20 h-20 flex items-center justify-center mb-3 mx-auto transition-transform hover:scale-105">
                <img
                  src="/edupulse_logo.jpg"
                  alt="EduPulse Digboi College Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (img.src.includes('edupulse_logo.jpg')) {
                      img.src = '/digboi_college_logo.jpg';
                    } else if (img.src.includes('digboi_college_logo.jpg')) {
                      img.src = '/digboi_college_logo.svg';
                    }
                  }}
                />
              </div>

              <h2 className="text-xl font-black text-slate-900 tracking-tight text-center">
                Verify WhatsApp Security OTP
              </h2>
              <p className="text-xs text-slate-500 font-medium text-center mt-1">
                Enter the 6-digit verification code sent to your registered WhatsApp number <strong className="text-slate-800 font-bold">{activePhone}</strong>.
              </p>

              {/* OTP Input Form */}
              <div className="w-full mt-4 space-y-3">
                {/* Auto-fill Helper Button */}
                <button
                  type="button"
                  onClick={() => {
                    setEnteredOtp(generatedOtp);
                    setOtpError(null);
                  }}
                  className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-extrabold py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <span>⚡ Click to Auto-Fill Test OTP ({generatedOtp})</span>
                </button>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    6-Digit Security OTP *
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

                {/* Verify OTP Button */}
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="w-full bg-[#1976d2] hover:bg-blue-700 active:bg-blue-800 text-white font-black py-3 px-5 rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all text-xs cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify OTP &amp; Proceed to Role Selection</span>
                </button>

                {/* Resend & Change Number Actions */}
                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    disabled={resendTimer > 0}
                    onClick={handleSendWhatsAppOtp}
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
                    ← Edit Phone / Email
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: Role Selection & Access Confirmation Screen */
            <FacultyRoleLoginStep
              initialEmail={activeEmail}
              initialPhone={activePhone}
              selectedRole={selectedRole}
              onRoleChange={setSelectedRole}
              onClose={onClose}
              onLogout={onLogout}
              currentMentor={currentMentor}
              mentors={mentors}
              onLoginEducator={(email, phone, facultyProfile) => {
                setActiveEmail(email);
                setActivePhone(phone);
                onSelectRole('educator', 'home', email, phone, facultyProfile);
                onClose();
              }}
              onLoginMentor={(email, phone, action, mentorProfile) => {
                setActiveEmail(email);
                setActivePhone(phone);
                if (action === 'add-mentee') {
                  setStep(3);
                } else {
                  onSelectRole('mentor', 'mentor', email, phone, mentorProfile);
                  onClose();
                }
              }}
              onBack={() => setStep(1)}
            />
          )}
        </div>
      )}
    </>
  );
};

interface FacultyRoleLoginStepProps {
  initialEmail?: string;
  initialPhone?: string;
  selectedRole: Role;
  onRoleChange: (role: Role) => void;
  onClose: () => void;
  onLogout?: () => void;
  currentMentor?: Mentor;
  mentors?: Mentor[];
  onLoginEducator: (
    email: string,
    phone: string,
    facultyProfile?: {
      name: string;
      designation: string;
      department: Department;
      phone: string;
    }
  ) => void;
  onLoginMentor: (
    email: string, 
    phone: string,
    action: 'dashboard' | 'add-mentee',
    mentorProfile?: {
      name: string;
      designation: string;
      department: Department;
      phone: string;
    }
  ) => void;
  onBack: () => void;
}

const FacultyRoleLoginStep: React.FC<FacultyRoleLoginStepProps> = ({
  initialEmail,
  initialPhone,
  selectedRole,
  onRoleChange,
  onClose,
  onLogout,
  currentMentor,
  mentors,
  onLoginEducator,
  onLoginMentor,
  onBack,
}) => {
  const [email, setEmail] = useState(() => {
    return initialEmail?.trim() || localStorage.getItem('edupulse_faculty_email') || 'prof.deborshee@digboicollege.edu.in';
  });

  const [phone, setPhone] = useState(() => {
    return initialPhone?.trim() || localStorage.getItem('edupulse_faculty_phone') || '+91 94350 12345';
  });

  // Look up existing saved mentor profile in database
  const matchedMentor = React.useMemo(() => {
    const normEmail = (email || initialEmail || '').trim().toLowerCase();
    const normPhone = (phone || initialPhone || '').replace(/\D/g, '').slice(-10);

    return (
      mentors?.find(
        (m) =>
          (normEmail && m.email.toLowerCase() === normEmail) ||
          (normPhone && m.phone && m.phone.replace(/\D/g, '').slice(-10) === normPhone)
      ) || currentMentor
    );
  }, [email, phone, initialEmail, initialPhone, mentors, currentMentor]);

  // Mentor profile fields initialized from matched mentor if present
  const [mentorName, setMentorName] = useState(() => {
    if (matchedMentor?.name) return matchedMentor.name;
    const namePart = (initialEmail || 'faculty').split('@')[0];
    const formatted = namePart.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const isDr = namePart.toLowerCase().includes('dr');
    return isDr ? `Dr. ${formatted}` : `Prof. ${formatted}`;
  });
  const [mentorDesignation, setMentorDesignation] = useState(matchedMentor?.designation || 'Assistant Professor');
  const [mentorDept, setMentorDept] = useState<Department>(matchedMentor?.department || 'Physics');

  React.useEffect(() => {
    if (initialEmail && initialEmail.trim()) {
      setEmail(initialEmail.trim());
    }
    if (initialPhone && initialPhone.trim()) {
      setPhone(initialPhone.trim());
    }
  }, [initialEmail, initialPhone]);

  // Keep form fields synced if matched mentor profile is loaded from Firestore / local storage
  React.useEffect(() => {
    if (matchedMentor && matchedMentor.name) {
      setMentorName(matchedMentor.name);
      if (matchedMentor.designation) {
        setMentorDesignation(matchedMentor.designation);
      }
      if (matchedMentor.department) {
        setMentorDept(matchedMentor.department);
      }
    }
  }, [matchedMentor]);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleEnterPortal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalEmail = email.trim() || 'prof.deborshee@digboicollege.edu.in';
    const finalPhone = phone.trim() || '+91 94350 12345';
    const profile = {
      name: mentorName.trim() || 'Dr. Deborshee Gogoi',
      designation: mentorDesignation,
      department: mentorDept,
      phone: finalPhone,
    };

    setFeedbackMsg(`Entering EduPulse as ${selectedRole.toUpperCase()}...`);
    setTimeout(() => {
      if (selectedRole === 'educator') {
        onLoginEducator(finalEmail, finalPhone, profile);
      } else {
        onLoginMentor(finalEmail, finalPhone, 'dashboard', profile);
      }
    }, 250);
  };

  return (
    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col items-center relative animate-fade-in my-auto text-left">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        title="Close"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header Prominent EduPulse Logo */}
      <div className="bg-white rounded-3xl p-3 shadow-xl border-4 border-amber-400/90 ring-4 ring-blue-500/20 w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center mb-3 mx-auto transition-transform hover:scale-105">
        <img
          src="/edupulse_logo.jpg"
          alt="EduPulse Digboi College Logo"
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (img.src.includes('edupulse_logo.jpg')) {
              img.src = '/digboi_college_logo.jpg';
            } else if (img.src.includes('digboi_college_logo.jpg')) {
              img.src = '/digboi_college_logo.svg';
            }
          }}
        />
      </div>

      {/* Title */}
      <div className="text-center w-full mb-3">
        <h2 className="text-xl font-extrabold text-[#1976d2] tracking-tight">
          Select Faculty Portal Role
        </h2>
        <div className="mt-1 flex flex-col items-center justify-center gap-1">
          <div className="inline-flex items-center space-x-1 bg-blue-50 border border-blue-200 text-blue-900 px-3 py-1 rounded-full text-xs font-bold">
            <UserCheck className="w-3.5 h-3.5 text-[#1976d2]" />
            <span className="truncate max-w-[220px]">{email}</span>
          </div>
          <div className="inline-flex items-center space-x-1 text-emerald-700 text-[11px] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified WhatsApp: {phone}</span>
          </div>
        </div>
      </div>

      {/* Role Selection Cards */}
      <div className="w-full space-y-2.5 mb-4">
        {/* Educator Role Option */}
        <button
          type="button"
          onClick={() => onRoleChange('educator')}
          className={`w-full p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-left border ${
            selectedRole === 'educator'
              ? 'bg-blue-50/90 border-[#1976d2] ring-2 ring-[#1976d2]/20 shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${selectedRole === 'educator' ? 'bg-[#1976d2] text-white' : 'bg-slate-200 text-slate-600'}`}>
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center space-x-1.5">
                <span>Educator</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                Class Rosters, Sessional Marks, Attendance &amp; Quizzes
              </p>
            </div>
          </div>
          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
            selectedRole === 'educator' ? 'bg-[#1976d2] border-[#1976d2] text-white' : 'border-slate-300'
          }`}>
            {selectedRole === 'educator' && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
        </button>

        {/* Mentor Role Option */}
        <button
          type="button"
          onClick={() => onRoleChange('mentor')}
          className={`w-full p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-left border ${
            selectedRole === 'mentor'
              ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${selectedRole === 'mentor' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center space-x-1.5">
                <span>Mentor</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                1-on-1 Mentoring, AI Parent Reports &amp; Mentee Roster
              </p>
            </div>
          </div>
          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
            selectedRole === 'mentor' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
          }`}>
            {selectedRole === 'mentor' && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
        </button>
      </div>

      {/* Faculty Profile Registration Form Fields */}
      {(selectedRole === 'educator' || selectedRole === 'mentor') && (
        <div className="w-full bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 mb-4 text-xs space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-blue-200 pb-1.5">
            <div className="flex items-center space-x-1.5 text-blue-900 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#1976d2]" />
              <span>Faculty Profile Details</span>
            </div>
            <span className="text-[10px] bg-blue-200/80 text-blue-900 font-extrabold px-1.5 py-0.5 rounded">
              Verified Session
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
              Faculty Name &amp; Title *
            </label>
            <input
              type="text"
              value={mentorName}
              onChange={(e) => setMentorName(e.target.value)}
              placeholder="e.g. Dr. Deborshee Gogoi"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#1976d2] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                Designation *
              </label>
              <select
                value={mentorDesignation}
                onChange={(e) => setMentorDesignation(e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#1976d2] outline-none"
              >
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Professor">Professor</option>
                <option value="HoD & Associate Professor">HoD &amp; Assoc. Prof</option>
                <option value="Vice Principal">Vice Principal</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                Department *
              </label>
              <select
                value={mentorDept}
                onChange={(e) => setMentorDept(e.target.value as Department)}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#1976d2] outline-none"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {feedbackMsg && (
        <div className="w-full mb-3 p-2 bg-blue-50 border border-blue-200 text-[#1976d2] text-xs font-semibold rounded-xl flex items-center justify-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Main Submit Action */}
      <button
        type="button"
        onClick={() => handleEnterPortal()}
        className={`w-full font-bold py-3 px-5 rounded-xl shadow-md transition-all text-xs cursor-pointer flex items-center justify-center space-x-2 text-white ${
          selectedRole === 'educator'
            ? 'bg-[#1976d2] hover:bg-blue-700 active:bg-blue-800'
            : 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900'
        }`}
      >
        <span>Enter EduPulse as {selectedRole === 'educator' ? 'Educator' : 'Mentor'}</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Logout / Switch Account Action Button */}
      {onLogout ? (
        <button
          type="button"
          onClick={() => {
            if (onLogout) onLogout();
            onBack();
          }}
          className="w-full mt-3 py-2 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5"
          title="Log out current session to log in with a different faculty email or WhatsApp number"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-600" />
          <span>Log Out / Sign In as Different Faculty</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-medium text-slate-400 hover:text-slate-600 mt-4 transition-colors cursor-pointer self-center"
        >
          ← Edit Email ID or WhatsApp Number
        </button>
      )}
    </div>
  );
};
