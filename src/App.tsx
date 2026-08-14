import React, { useState, useEffect } from 'react';
import { GraduationCap, Loader2, CheckCircle } from 'lucide-react';
import { Role, Student, Mentor, TeacherUpdateLog, Department, MenteeLog } from './types';
import { INITIAL_STUDENTS, INITIAL_MENTORS } from './data/mockData';

const INITIAL_TEACHER_UPDATES: TeacherUpdateLog[] = [];
import { Header } from './components/Header';
import { WalkthroughModal } from './components/WalkthroughModal';
import { AddNewMenteeModal } from './components/AddNewMenteeModal';
import { EditMenteeModal } from './components/EditMenteeModal';
import { EditMentorProfileModal } from './components/EditMentorProfileModal';
import { EducatorHome } from './components/EducatorHome';
import { MentorCommandCenter } from './components/MentorCommandCenter';
import { AIStudentAnalysis } from './components/AIStudentAnalysis';
import { AssessmentCenter } from './components/AssessmentCenter';
import { EarlyWarningSystem } from './components/EarlyWarningSystem';
import { WhatsAppSuite } from './components/WhatsAppSuite';
import { ResourceLibrary } from './components/ResourceLibrary';
import { QuizEngine } from './components/QuizEngine';
import { StandalonePublicQuiz } from './components/StandalonePublicQuiz';
import { OfficialNoticeGenerator } from './components/OfficialNoticeGenerator';
import { AdminSuite } from './components/AdminSuite';
import { OfflineBackupSyncToast } from './components/OfflineBackupSyncToast';
import {
  subscribeStudents,
  subscribeMentors,
  subscribeTeacherUpdates,
  subscribeMenteeLogs,
  subscribeBlockedLogins,
  subscribeLoginRegistry,
  subscribeAdminList,
  saveAdminListToCloud,
  saveStudentToCloud,
  saveStudentsBatchToCloud,
  deleteStudentFromCloud,
  saveMentorToCloud,
  saveMentorsBatchToCloud,
  deleteMentorFromCloud,
  saveTeacherUpdateToCloud,
  markTeacherUpdateReadInCloud,
  saveMenteeLogToCloud,
  saveMenteeLogsBatchToCloud,
  deleteMenteeLogFromCloud,
  seedInitialCloudDataIfEmpty,
  verifyAndSyncCloudData,
  reconcileStudentRecords,
  reconcileMentorRecords,
} from './lib/firebase';
import { isStudentOfMentor } from './utils/ownership';

export default function App() {
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('edupulse_faculty_email') || '';
  });
  const [userPhone, setUserPhone] = useState<string>(() => {
    return localStorage.getItem('edupulse_faculty_phone') || '';
  });
  const [currentRole, setCurrentRole] = useState<Role>(() => {
    return (localStorage.getItem('edupulse_faculty_role') as Role) || 'educator';
  });
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState<boolean>(() => {
    return !localStorage.getItem('edupulse_faculty_email');
  });

  const [adminList, setAdminList] = useState<string[]>(() => {
    const saved = localStorage.getItem('edupulse_admin_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return ['thewildscapes@gmail.com', '9706375001'];
  });

  const handleUpdateAdminList = (newList: string[]) => {
    setAdminList(newList);
    localStorage.setItem('edupulse_admin_list', JSON.stringify(newList));
    saveAdminListToCloud(newList);
  };

  const isAdmin = React.useMemo(() => {
    const normE = userEmail.trim().toLowerCase();
    const normP = userPhone.replace(/\D/g, '').slice(-10);

    if (normE === 'thewildscapes@gmail.com' || normP.endsWith('9706375001')) {
      return true;
    }

    return adminList.some((adm) => {
      const cleanAdm = adm.trim().toLowerCase();
      const admDigits = cleanAdm.replace(/\D/g, '').slice(-10);
      return (
        (normE && normE === cleanAdm) ||
        (normP && admDigits && normP === admDigits)
      );
    });
  }, [userEmail, userPhone, adminList]);

  const handleLogout = () => {
    localStorage.removeItem('edupulse_faculty_email');
    localStorage.removeItem('edupulse_faculty_phone');
    localStorage.removeItem('edupulse_faculty_role');
    localStorage.removeItem('edupulse_faculty_name');
    localStorage.removeItem('edupulse_faculty_designation');
    localStorage.removeItem('edupulse_faculty_department');
    setUserEmail('');
    setUserPhone('');
    setIsWalkthroughOpen(true);
  };

  // Enforce Access Restriction for Blocked Logins with strict non-empty validation
  useEffect(() => {
    if ((userEmail && userEmail.trim().length > 3) || (userPhone && userPhone.replace(/\D/g, '').length >= 10)) {
      try {
        const blockedLogins: string[] = JSON.parse(localStorage.getItem('edupulse_blocked_logins') || '[]');
        const cleanEmail = userEmail.trim().toLowerCase();
        const cleanDigits = userPhone.replace(/\D/g, '').slice(-10);

        const isBlocked = blockedLogins.some((b) => {
          if (!b || typeof b !== 'string' || b.trim().length === 0) return false;
          const bTrimmed = b.trim().toLowerCase();
          const bDigits = b.replace(/\D/g, '').slice(-10);
          return (
            (cleanEmail && cleanEmail === bTrimmed) ||
            (cleanDigits && cleanDigits.length === 10 && bDigits === cleanDigits)
          );
        });

        if (isBlocked) {
          alert('Access Revoked: Your account or WhatsApp phone number has been restricted by Digboi College Admin.');
          handleLogout();
        }
      } catch (e) {}
    }
  }, [userEmail, userPhone]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) return tabParam;
    }
    return 'home';
  });
  const [isAddMenteeOpen, setIsAddMenteeOpen] = useState<boolean>(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [editingMentor, setEditingMentor] = useState<Mentor | null>(null);
  const [isAddingMentor, setIsAddingMentor] = useState<boolean>(false);
  const [isForceRefreshing, setIsForceRefreshing] = useState<boolean>(false);
  const [refreshToastMessage, setRefreshToastMessage] = useState<string | null>(null);

  const handleForceRefresh = async () => {
    setIsForceRefreshing(true);
    try {
      // 1. Completely purge local storage caches and deleted trackers
      localStorage.removeItem('edupulse_students');
      localStorage.removeItem('edupulse_mentors');
      localStorage.removeItem('edupulse_teacher_updates');
      localStorage.removeItem('edupulse_mentee_logs');
      localStorage.removeItem('edupulse_deleted_students');
      localStorage.removeItem('edupulse_deleted_mentors');

      // 2. Perform hard, atomic re-fetch of all collections from Firestore cloud & server
      const syncResult = await verifyAndSyncCloudData();

      // 3. Atomically overwrite React state & re-populate local storage
      const freshStudents = syncResult.students || [];
      const freshMentors = syncResult.mentors || [];
      const freshUpdates = syncResult.teacherUpdates || [];
      const freshLogs = syncResult.menteeLogs || [];

      setStudents(freshStudents);
      setMentors(freshMentors);
      setTeacherUpdates(freshUpdates);
      setMenteeLogs(freshLogs);

      localStorage.setItem('edupulse_students', JSON.stringify(freshStudents));
      localStorage.setItem('edupulse_mentors', JSON.stringify(freshMentors));
      localStorage.setItem('edupulse_teacher_updates', JSON.stringify(freshUpdates));
      localStorage.setItem('edupulse_mentee_logs', JSON.stringify(freshLogs));

      setRefreshToastMessage(`Local cache purged & re-synced! ${freshStudents.length} student records & ${freshLogs.length} mentee logs loaded from Firestore.`);
      setTimeout(() => {
        setRefreshToastMessage(null);
      }, 4500);
    } catch (err) {
      console.error('Force refresh error:', err);
      setRefreshToastMessage('Error refreshing data from cloud. Please check network connection.');
      setTimeout(() => {
        setRefreshToastMessage(null);
      }, 4500);
    } finally {
      setIsForceRefreshing(false);
    }
  };

  // App-wide data state backed by Firestore cloud database & localStorage
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('edupulse_students');
    if (saved) {
      try {
        const parsed: Student[] = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [mentors, setMentors] = useState<Mentor[]>(() => {
    const saved = localStorage.getItem('edupulse_mentors');
    if (saved) {
      try {
        const parsed: Mentor[] = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [teacherUpdates, setTeacherUpdates] = useState<TeacherUpdateLog[]>(() => {
    try {
      const saved = localStorage.getItem('edupulse_teacher_updates');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_TEACHER_UPDATES;
  });

  const [menteeLogs, setMenteeLogs] = useState<MenteeLog[]>(() => {
    try {
      const saved = localStorage.getItem('edupulse_mentee_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Initialize Firestore seeding & real-time listeners for cross-device persistence with strict re-hydration gate
  useEffect(() => {
    let isMounted = true;

    async function initializeAppData() {
      try {
        // Step 1: Ensure initial cloud seed if empty
        await seedInitialCloudDataIfEmpty(INITIAL_STUDENTS, INITIAL_MENTORS);

        // Step 2: Fetch latest snapshot from Firestore / server API to re-hydrate state & localStorage
        const syncResult = await verifyAndSyncCloudData();

        if (isMounted) {
          const finalStudents = syncResult.students || [];
          const finalMentors = syncResult.mentors || [];
          const finalUpdates = syncResult.teacherUpdates || [];
          const finalLogs = syncResult.menteeLogs || [];

          setStudents(finalStudents);
          setMentors(finalMentors);
          setTeacherUpdates(finalUpdates);
          setMenteeLogs(finalLogs);
          localStorage.setItem('edupulse_students', JSON.stringify(finalStudents));
          localStorage.setItem('edupulse_mentors', JSON.stringify(finalMentors));
          localStorage.setItem('edupulse_teacher_updates', JSON.stringify(finalUpdates));
          localStorage.setItem('edupulse_mentee_logs', JSON.stringify(finalLogs));
        }
      } catch (err) {
        console.warn('Initialization sync warning:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false); // DEFINITIVE STATE VERIFICATION GATE: Unlocks UI rendering only after full re-hydration
        }
      }
    }

    initializeAppData();

    // 2. Real-time listeners for instant synchronization across devices
    const unsubStudents = subscribeStudents((cloudStudents) => {
      if (!cloudStudents) return;

      let currentLocal: Student[] = [];
      try {
        const saved = localStorage.getItem('edupulse_students');
        if (saved) currentLocal = JSON.parse(saved);
      } catch (e) {}

      const mergedStudents = reconcileStudentRecords(currentLocal, cloudStudents);
      setStudents(mergedStudents);
      localStorage.setItem('edupulse_students', JSON.stringify(mergedStudents));
    });

    const unsubMentors = subscribeMentors((cloudMentors) => {
      if (!cloudMentors) return;

      let currentLocal: Mentor[] = [];
      try {
        const saved = localStorage.getItem('edupulse_mentors');
        if (saved) currentLocal = JSON.parse(saved);
      } catch (e) {}

      const mergedMentors = reconcileMentorRecords(currentLocal, cloudMentors);
      setMentors(mergedMentors);
      localStorage.setItem('edupulse_mentors', JSON.stringify(mergedMentors));
    });

    const unsubUpdates = subscribeTeacherUpdates((cloudUpdates) => {
      if (cloudUpdates && cloudUpdates.length > 0) {
        let localUpdates: TeacherUpdateLog[] = [];
        try {
          const saved = localStorage.getItem('edupulse_teacher_updates');
          if (saved) localUpdates = JSON.parse(saved);
        } catch (e) {}

        const updateMap = new Map<string, TeacherUpdateLog>();
        localUpdates.forEach((u) => updateMap.set(u.id, u));
        cloudUpdates.forEach((u) => updateMap.set(u.id, u));

        const merged = Array.from(updateMap.values());
        setTeacherUpdates(merged);
        localStorage.setItem('edupulse_teacher_updates', JSON.stringify(merged));
      }
    });

    const unsubLogs = subscribeMenteeLogs((cloudLogs) => {
      if (cloudLogs) {
        setMenteeLogs(cloudLogs);
        localStorage.setItem('edupulse_mentee_logs', JSON.stringify(cloudLogs));
      }
    });

    const unsubBlocked = subscribeBlockedLogins((cloudBlocked) => {
      localStorage.setItem('edupulse_blocked_logins', JSON.stringify(cloudBlocked));
    });

    const unsubRegistry = subscribeLoginRegistry((cloudLogs) => {
      if (cloudLogs && cloudLogs.length > 0) {
        localStorage.setItem('edupulse_login_registry', JSON.stringify(cloudLogs));
      }
    });

    const unsubAdminList = subscribeAdminList((cloudAdminList) => {
      if (cloudAdminList && cloudAdminList.length > 0) {
        setAdminList(cloudAdminList);
        localStorage.setItem('edupulse_admin_list', JSON.stringify(cloudAdminList));
      }
    });

    // 3. Periodic background sync and window focus/visibility listeners for guaranteed cross-device sync
    const performCloudSync = async () => {
      try {
        const syncResult = await verifyAndSyncCloudData();
        if (syncResult.students) {
          setStudents(syncResult.students);
          localStorage.setItem('edupulse_students', JSON.stringify(syncResult.students));
        }
        if (syncResult.mentors && syncResult.mentors.length > 0) {
          setMentors(syncResult.mentors);
          localStorage.setItem('edupulse_mentors', JSON.stringify(syncResult.mentors));
        }
        if (syncResult.teacherUpdates && syncResult.teacherUpdates.length > 0) {
          setTeacherUpdates(syncResult.teacherUpdates);
          localStorage.setItem('edupulse_teacher_updates', JSON.stringify(syncResult.teacherUpdates));
        }
        if (syncResult.menteeLogs && syncResult.menteeLogs.length > 0) {
          setMenteeLogs(syncResult.menteeLogs);
          localStorage.setItem('edupulse_mentee_logs', JSON.stringify(syncResult.menteeLogs));
        }
      } catch (e) {}
    };

    const syncInterval = setInterval(performCloudSync, 3000);

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        performCloudSync();
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    return () => {
      isMounted = false;
      clearInterval(syncInterval);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      unsubStudents();
      unsubMentors();
      unsubUpdates();
      unsubLogs();
      unsubBlocked();
      unsubRegistry();
      unsubAdminList();
    };
  }, []);

  React.useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('edupulse_students', JSON.stringify(students));
    }
  }, [students, isLoading]);

  React.useEffect(() => {
    if (currentRole === 'educator' && activeTab === 'mentor') {
      setActiveTab('home');
    }
  }, [currentRole, activeTab]);

  React.useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('edupulse_mentors', JSON.stringify(mentors));
    }
  }, [mentors, isLoading]);

  // Helper for deterministic mentor ID based on normalized email or phone
  const getMentorId = (emailStr?: string, phoneStr?: string) => {
    const normE = (emailStr || '').trim().toLowerCase();
    if (normE) return `m_${normE.replace(/[^a-z0-9]/g, '_')}`;
    const normP = (phoneStr || '').replace(/\D/g, '').slice(-10);
    if (normP) return `m_ph_${normP}`;
    return `m_guest_${Date.now()}`;
  };

  // Derive active logged-in mentor from userEmail or userPhone
  const currentMentor: Mentor = React.useMemo(() => {
    const normEmail = userEmail.trim().toLowerCase();
    const normPhone = userPhone.replace(/\D/g, '').slice(-10);
    const targetId = getMentorId(userEmail, userPhone);

    const savedName = localStorage.getItem('edupulse_faculty_name');
    const savedDept = localStorage.getItem('edupulse_faculty_department') as Department | null;
    const savedDesig = localStorage.getItem('edupulse_faculty_designation');

    const existing = mentors.find(
      (m) =>
        m.id === targetId ||
        (normEmail && m.email && m.email.trim().toLowerCase() === normEmail) ||
        (normPhone && m.phone && m.phone.replace(/\D/g, '').slice(-10) === normPhone)
    );

    const isGenericName = (n?: string) =>
      !n || n.includes('Faculty Member') || n.startsWith('Prof. Faculty');

    const mentorForMatching = existing || {
      id: targetId,
      name: (savedName && !isGenericName(savedName)) ? savedName : (userEmail.split('@')[0] || 'Faculty'),
      email: userEmail.trim(),
      phone: userPhone.trim(),
    };

    // Auto-link all matching student IDs for this mentor across devices
    const matchedStudentIds = students
      .filter((s) => isStudentOfMentor(s, mentorForMatching, userEmail, userPhone, mentors))
      .map((s) => s.id);

    if (existing) {
      const mergedMenteeIds = Array.from(new Set([...(existing.assignedMenteeIds || []), ...matchedStudentIds]));
      return {
        ...existing,
        name: (savedName && !isGenericName(savedName)) ? savedName : (existing.name || 'Faculty Member'),
        department: savedDept || existing.department || 'Physics',
        designation: savedDesig || existing.designation || 'Assistant Professor',
        assignedMenteeIds: mergedMenteeIds,
      };
    }

    const namePart = userEmail.split('@')[0] || 'Faculty';
    const formattedName = namePart
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const isDr = namePart.toLowerCase().includes('dr');
    const title = isDr ? 'Dr.' : 'Prof.';

    return {
      id: targetId,
      name: (savedName && !isGenericName(savedName)) ? savedName : `${title} ${formattedName}`,
      designation: savedDesig || 'Assistant Professor',
      department: savedDept || 'Physics',
      email: userEmail.trim(),
      phone: userPhone.trim() || '+91 94350 00000',
      assignedMenteeIds: matchedStudentIds,
      isPreloaded: false,
    };
  }, [userEmail, userPhone, mentors, students]);

  // Ensure active logged-in faculty appears in local faculty registry safely without overriding custom cloud entries
  useEffect(() => {
    if (isLoading || !userEmail || !userEmail.trim()) return;

    const normEmail = userEmail.trim().toLowerCase();
    const normPhone = userPhone.replace(/\D/g, '').slice(-10);

    const exists = mentors.some(
      (m) =>
        (normEmail && m.email.toLowerCase() === normEmail) ||
        (normPhone && m.phone && m.phone.replace(/\D/g, '').slice(-10) === normPhone)
    );

    if (!exists) {
      setMentors((prev) => {
        if (
          prev.some(
            (m) =>
              (normEmail && m.email.toLowerCase() === normEmail) ||
              (normPhone && m.phone && m.phone.replace(/\D/g, '').slice(-10) === normPhone)
          )
        ) {
          return prev;
        }
        const updated = [currentMentor, ...prev];
        localStorage.setItem('edupulse_mentors', JSON.stringify(updated));
        return updated;
      });
    }
  }, [userEmail, userPhone, mentors, isLoading, currentMentor]);

  // Navigation payload state for context switching
  const [targetStudentId, setTargetStudentId] = useState<string | undefined>(undefined);
  const [whatsappDraft, setWhatsappDraft] = useState<string | undefined>(undefined);

  // Standalone Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const handleSaveStudent = (updatedStudent: Student) => {
    const studentWithTs = { ...updatedStudent, lastModified: Date.now() };
    setStudents((prev) => {
      const updated = prev.map((s) => (s.id === updatedStudent.id ? studentWithTs : s));
      localStorage.setItem('edupulse_students', JSON.stringify(updated));
      return updated;
    });
    saveStudentToCloud(studentWithTs);
  };

  const handleDeleteStudent = (studentId: string) => {
    let deleted: string[] = [];
    try {
      deleted = JSON.parse(localStorage.getItem('edupulse_deleted_students') || '[]');
    } catch (e) {}
    if (!deleted.includes(studentId)) {
      deleted.push(studentId);
      localStorage.setItem('edupulse_deleted_students', JSON.stringify(deleted));
    }

    setStudents((prev) => {
      const updated = prev.filter((s) => s.id !== studentId);
      localStorage.setItem('edupulse_students', JSON.stringify(updated));
      return updated;
    });
    deleteStudentFromCloud(studentId);
  };

  const handleDeleteMentor = (mentorId: string) => {
    let deleted: string[] = [];
    try {
      deleted = JSON.parse(localStorage.getItem('edupulse_deleted_mentors') || '[]');
    } catch (e) {}
    if (!deleted.includes(mentorId)) {
      deleted.push(mentorId);
      localStorage.setItem('edupulse_deleted_mentors', JSON.stringify(deleted));
    }

    setMentors((prev) => {
      const updated = prev.filter((m) => m.id !== mentorId);
      localStorage.setItem('edupulse_mentors', JSON.stringify(updated));
      return updated;
    });
    deleteMentorFromCloud(mentorId);
  };

  const handleAddTeacherUpdate = (update: Omit<TeacherUpdateLog, 'id' | 'timestamp' | 'readByMentor'>) => {
    const newLog: TeacherUpdateLog = {
      ...update,
      id: `tu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: 'Just now',
      readByMentor: false,
    };
    setTeacherUpdates((prev) => {
      const updated = [newLog, ...prev];
      localStorage.setItem('edupulse_teacher_updates', JSON.stringify(updated));
      return updated;
    });
    saveTeacherUpdateToCloud(newLog);
  };

  const handleMarkUpdateRead = (updateId: string) => {
    setTeacherUpdates((prev) =>
      prev.map((log) => (log.id === updateId ? { ...log, readByMentor: true } : log))
    );
    markTeacherUpdateReadInCloud(updateId);
  };

  const handleSaveMentorProfile = (profile: {
    id?: string;
    name: string;
    designation: string;
    department: Department;
    email: string;
    phone: string;
    assignedMenteeIds?: string[];
  }) => {
    const finalEmail = profile.email.trim();
    const finalPhone = profile.phone.trim();
    const targetId = profile.id || getMentorId(finalEmail, finalPhone);

    // Only update active session user email/phone if updating current user profile
    const isUpdatingSelf =
      !profile.id ||
      profile.id === currentMentor.id ||
      (userEmail && profile.email.toLowerCase() === userEmail.toLowerCase());

    if (isUpdatingSelf) {
      setUserEmail(finalEmail);
      setUserPhone(finalPhone);
      localStorage.setItem('edupulse_faculty_email', finalEmail);
      localStorage.setItem('edupulse_faculty_phone', finalPhone);
      localStorage.setItem('edupulse_faculty_name', profile.name);
      localStorage.setItem('edupulse_faculty_designation', profile.designation);
      localStorage.setItem('edupulse_faculty_department', profile.department);
    }

    let savedMentorObj: Mentor | null = null;

    setMentors((prev) => {
      const normEmail = finalEmail.toLowerCase();
      const normPhone = finalPhone.replace(/\D/g, '').slice(-10);

      const idx = prev.findIndex(
        (m) =>
          m.id === targetId ||
          (normEmail && m.email && m.email.toLowerCase() === normEmail) ||
          (normPhone && m.phone && m.phone.replace(/\D/g, '').slice(-10) === normPhone)
      );

      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          id: targetId,
          name: profile.name,
          designation: profile.designation,
          department: profile.department,
          email: finalEmail,
          phone: finalPhone,
          assignedMenteeIds: profile.assignedMenteeIds || updated[idx].assignedMenteeIds || [],
          lastModified: Date.now(),
        };
        savedMentorObj = updated[idx];
        localStorage.setItem('edupulse_mentors', JSON.stringify(updated));
        return updated;
      }

      const newMentor: Mentor = {
        id: targetId,
        name: profile.name,
        designation: profile.designation,
        department: profile.department,
        email: finalEmail,
        phone: finalPhone,
        assignedMenteeIds: profile.assignedMenteeIds || students.map((s) => s.id),
        isPreloaded: false,
        lastModified: Date.now(),
      };
      savedMentorObj = newMentor;
      const updated = [newMentor, ...prev];
      localStorage.setItem('edupulse_mentors', JSON.stringify(updated));
      return updated;
    });

    if (savedMentorObj) {
      saveMentorToCloud(savedMentorObj);
    }

    setEditingMentor(null);
    setIsAddingMentor(false);
    setIsEditProfileOpen(false);
  };

  const handleSelectRoleFromWalkthrough = async (
    role: Role, 
    defaultTab: string, 
    email?: string,
    phone?: string,
    mentorProfile?: {
      name: string;
      designation: string;
      department: Department;
      phone: string;
    }
  ) => {
    const finalEmail = email?.trim() || userEmail || localStorage.getItem('edupulse_faculty_email') || '';
    const finalPhone = phone?.trim() || userPhone || localStorage.getItem('edupulse_faculty_phone') || '';
    setCurrentRole(role);
    setActiveTab(defaultTab);
    setUserEmail(finalEmail);
    setUserPhone(finalPhone);

    // Save session in localStorage
    if (finalEmail) localStorage.setItem('edupulse_faculty_email', finalEmail);
    if (finalPhone) localStorage.setItem('edupulse_faculty_phone', finalPhone);
    localStorage.setItem('edupulse_faculty_role', role);

    if (mentorProfile) {
      if (mentorProfile.name) localStorage.setItem('edupulse_faculty_name', mentorProfile.name);
      if (mentorProfile.designation) localStorage.setItem('edupulse_faculty_designation', mentorProfile.designation);
      if (mentorProfile.department) localStorage.setItem('edupulse_faculty_department', mentorProfile.department);
    }

    // Clear stale deleted item trackers on login
    localStorage.removeItem('edupulse_deleted_students');
    localStorage.removeItem('edupulse_deleted_mentors');

    // Trigger full re-hydration from cloud source of truth upon login on this device
    try {
      const syncResult = await verifyAndSyncCloudData();
      if (syncResult.students) {
        setStudents(syncResult.students);
        localStorage.setItem('edupulse_students', JSON.stringify(syncResult.students));
      }
      if (syncResult.mentors && syncResult.mentors.length > 0) {
        setMentors(syncResult.mentors);
        localStorage.setItem('edupulse_mentors', JSON.stringify(syncResult.mentors));
      }
      if (syncResult.teacherUpdates && syncResult.teacherUpdates.length > 0) {
        setTeacherUpdates(syncResult.teacherUpdates);
        localStorage.setItem('edupulse_teacher_updates', JSON.stringify(syncResult.teacherUpdates));
      }
    } catch (e) {
      console.warn('Re-hydration on login warning:', e);
    }

    let updatedMentorToSync: Mentor | null = null;

    // Ensure mentor list includes or updates this faculty member in state & cloud
    setMentors((prev) => {
      const normEmail = finalEmail.toLowerCase();
      const normPhone = finalPhone.replace(/\D/g, '').slice(-10);
      const targetId = getMentorId(finalEmail, finalPhone);

      const idx = prev.findIndex(
        (m) =>
          m.id === targetId ||
          (normEmail && m.email && m.email.toLowerCase() === normEmail) ||
          (normPhone && m.phone && m.phone.replace(/\D/g, '').slice(-10) === normPhone)
      );

      if (idx !== -1) {
        const existing = prev[idx];
        const updated = [...prev];

        const resolvedName = mentorProfile?.name || localStorage.getItem('edupulse_faculty_name') || existing.name || (finalEmail ? finalEmail.split('@')[0] : 'Faculty');
        const resolvedDesig = mentorProfile?.designation || localStorage.getItem('edupulse_faculty_designation') || existing.designation || 'Assistant Professor';
        const resolvedDept = (mentorProfile?.department || localStorage.getItem('edupulse_faculty_department') || existing.department || 'Physics') as Department;

        updated[idx] = {
          ...existing,
          id: targetId,
          email: finalEmail || existing.email,
          phone: finalPhone || existing.phone,
          name: resolvedName,
          designation: resolvedDesig,
          department: resolvedDept,
          lastModified: Date.now(),
        };
        updatedMentorToSync = updated[idx];
        localStorage.setItem('edupulse_mentors', JSON.stringify(updated));
        return updated;
      }

      // Collect any students created by or associated with this email, phone, or mentor ID across devices
      const matchedStudentIds = students
        .filter((s) => isStudentOfMentor(s, { id: targetId, email: finalEmail, phone: finalPhone, name: mentorProfile?.name }, finalEmail, finalPhone, prev))
        .map((s) => s.id);

      const resolvedNewName = mentorProfile?.name || localStorage.getItem('edupulse_faculty_name') || (finalEmail ? finalEmail.split('@')[0] : 'Faculty Member');
      const resolvedNewDesig = mentorProfile?.designation || localStorage.getItem('edupulse_faculty_designation') || 'Assistant Professor';
      const resolvedNewDept = (mentorProfile?.department || localStorage.getItem('edupulse_faculty_department') || 'Physics') as Department;

      const newMentor: Mentor = {
        id: targetId,
        name: resolvedNewName,
        designation: resolvedNewDesig,
        department: resolvedNewDept,
        email: finalEmail,
        phone: mentorProfile?.phone || finalPhone,
        assignedMenteeIds: matchedStudentIds.length > 0 ? matchedStudentIds : students.map((s) => s.id),
        isPreloaded: false,
        lastModified: Date.now(),
      };
      updatedMentorToSync = newMentor;
      const updated = [newMentor, ...prev];
      localStorage.setItem('edupulse_mentors', JSON.stringify(updated));
      return updated;
    });

    if (updatedMentorToSync) {
      saveMentorToCloud(updatedMentorToSync);
    }
  };

  const handleSwitchUser = () => {
    setIsWalkthroughOpen(true);
  };

  const handleAddStudent = (newStudent: Student) => {
    const studentWithTs = { ...newStudent, lastModified: newStudent.lastModified || Date.now() };

    // Automatically link student to current mentor assigned list
    const activeMentorId = currentMentor.id;
    setMentors((prev) => {
      const updatedMentors = prev.map((m) => {
        if (m.id === activeMentorId || m.id === studentWithTs.mentorId) {
          const currentMentees = m.assignedMenteeIds || [];
          if (!currentMentees.includes(studentWithTs.id)) {
            const updatedM = { ...m, assignedMenteeIds: [...currentMentees, studentWithTs.id] };
            saveMentorToCloud(updatedM);
            return updatedM;
          }
        }
        return m;
      });
      localStorage.setItem('edupulse_mentors', JSON.stringify(updatedMentors));
      return updatedMentors;
    });

    setStudents((prev) => {
      const updated = [studentWithTs, ...prev];
      localStorage.setItem('edupulse_students', JSON.stringify(updated));
      return updated;
    });
    saveStudentToCloud(studentWithTs);
  };

  const handleNavigateWithStudent = (tab: string, studentId?: string, customDraft?: string) => {
    setTargetStudentId(studentId);
    setWhatsappDraft(customDraft);
    setActiveTab(tab);
  };

  const handleUpdateNotes = (studentId: string, notes: string) => {
    setStudents((prev) => {
      const updatedList = prev.map((s) => (s.id === studentId ? { ...s, notes, lastModified: Date.now() } : s));
      localStorage.setItem('edupulse_students', JSON.stringify(updatedList));
      const target = updatedList.find((s) => s.id === studentId);
      if (target) {
        saveStudentToCloud(target);
      }
      return updatedList;
    });
  };

  const handleBulkUpdateMarks = (updatedStudents: Student[]) => {
    const now = Date.now();
    const updatedWithTs = updatedStudents.map((s) => ({
      ...s,
      lastModified: now,
    }));

    setStudents((prev) => {
      const studentMap = new Map<string, Student>();
      prev.forEach((s) => studentMap.set(s.id, s));
      updatedWithTs.forEach((s) => studentMap.set(s.id, s));
      const mergedList = Array.from(studentMap.values());
      localStorage.setItem('edupulse_students', JSON.stringify(mergedList));
      return mergedList;
    });

    saveStudentsBatchToCloud(updatedWithTs);
  };

  const handleSaveMenteeLogs = (logs: MenteeLog | MenteeLog[]) => {
    const logsArray = Array.isArray(logs) ? logs : [logs];
    const now = Date.now();
    const logsWithTs = logsArray.map((l) => ({
      ...l,
      lastModified: l.lastModified || now,
    }));

    setMenteeLogs((prev) => {
      const logMap = new Map<string, MenteeLog>();
      prev.forEach((l) => logMap.set(l.id, l));
      logsWithTs.forEach((l) => logMap.set(l.id, l));
      const mergedList = Array.from(logMap.values()).sort(
        (a, b) => (b.lastModified || 0) - (a.lastModified || 0)
      );
      localStorage.setItem('edupulse_mentee_logs', JSON.stringify(mergedList));
      return mergedList;
    });

    saveMenteeLogsBatchToCloud(logsWithTs);
  };

  const handleDeleteMenteeLog = (logId: string) => {
    setMenteeLogs((prev) => {
      const filtered = prev.filter((l) => l.id !== logId);
      localStorage.setItem('edupulse_mentee_logs', JSON.stringify(filtered));
      return filtered;
    });
    deleteMenteeLogFromCloud(logId);
  };

  useEffect(() => {
    if (currentRole === 'educator' && (activeTab === 'mentor' || activeTab === 'ai-analysis')) {
      setActiveTab('home');
    } else if (currentRole === 'mentor' && (activeTab === 'home' || activeTab === 'assessment')) {
      setActiveTab('mentor');
    } else if (currentRole === 'admin' && activeTab === 'home') {
      setActiveTab('admin');
    }
  }, [currentRole, activeTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 relative">
              <GraduationCap className="w-8 h-8 text-[#1976d2] animate-bounce" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#1976d2]"></span>
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">EduPulse Digboi</h2>
            <p className="text-xs font-semibold text-[#1976d2] uppercase tracking-wider">
              Institutional Mentorship & Analytics
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-center space-x-2 text-slate-600 text-sm font-medium">
              <Loader2 className="w-4 h-4 text-[#1976d2] animate-spin" />
              <span>Connecting to Firestore Cloud...</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#1976d2] h-full rounded-full animate-pulse w-3/4"></div>
            </div>
            <p className="text-[11px] text-slate-400">
              Reconciling student database, faculty registry & mentorship logs
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if student opened a quiz link via WhatsApp / Google Form direct link
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const publicQuizId = urlParams?.get('quizId');

  if (publicQuizId) {
    return <StandalonePublicQuiz quizId={publicQuizId} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <Header
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
        userEmail={userEmail}
        userPhone={userPhone}
        facultyName={currentMentor.name}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onOpenEditProfile={() => {
          setEditingMentor(currentMentor);
          setIsEditProfileOpen(true);
        }}
        onForceRefresh={handleForceRefresh}
        isRefreshing={isForceRefreshing}
      />

      {/* Walkthrough & Role Selection Modal */}
      <WalkthroughModal
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
        onSelectRole={handleSelectRoleFromWalkthrough}
        onLogout={handleLogout}
        onAddStudent={handleAddStudent}
        currentMentor={currentMentor}
        mentors={mentors}
        userEmail={userEmail}
        userPhone={userPhone}
      />

      {/* Standalone Add New Mentee Modal */}
      <AddNewMenteeModal
        isOpen={isAddMenteeOpen}
        onClose={() => setIsAddMenteeOpen(false)}
        currentMentor={currentMentor}
        mentors={mentors}
        onAddMentee={(student) => {
          handleAddStudent(student);
          setActiveTab('mentor');
        }}
      />

      {/* Standalone Edit Mentee Modal */}
      <EditMenteeModal
        isOpen={!!editingStudent}
        student={editingStudent}
        onClose={() => setEditingStudent(null)}
        onSaveStudent={handleSaveStudent}
        onDeleteStudent={handleDeleteStudent}
      />

      {/* Edit Mentor Profile Modal */}
      <EditMentorProfileModal
        isOpen={isEditProfileOpen || !!editingMentor || isAddingMentor}
        currentMentor={
          editingMentor ||
          (isAddingMentor
            ? {
                id: '',
                name: '',
                designation: 'Assistant Professor',
                department: 'Physics',
                email: '',
                phone: '+91 94350 00000',
                assignedMenteeIds: [],
              }
            : currentMentor)
        }
        onClose={() => {
          setIsEditProfileOpen(false);
          setEditingMentor(null);
          setIsAddingMentor(false);
        }}
        onSaveProfile={handleSaveMentorProfile}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'home' && (
          <EducatorHome
            students={students}
            currentMentor={currentMentor}
            mentors={mentors}
            userEmail={userEmail}
            userPhone={userPhone}
            currentRole={currentRole}
            teacherUpdates={teacherUpdates}
            onNavigate={(tab, studentId) => handleNavigateWithStudent(tab, studentId)}
            onOpenAddMentee={() => setIsAddMenteeOpen(true)}
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
            onEditStudent={(s) => setEditingStudent(s)}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {activeTab === 'mentor' && (
          <MentorCommandCenter
            students={students}
            currentMentor={currentMentor}
            mentors={mentors}
            teacherUpdates={teacherUpdates}
            menteeLogs={menteeLogs}
            userEmail={userEmail}
            currentRole={currentRole}
            onMarkUpdateRead={handleMarkUpdateRead}
            onUpdateNotes={handleUpdateNotes}
            onBulkUpdateMarks={handleBulkUpdateMarks}
            onSaveMenteeLogs={handleSaveMenteeLogs}
            onDeleteMenteeLog={handleDeleteMenteeLog}
            onNavigate={(tab, studentId) => handleNavigateWithStudent(tab, studentId)}
            onOpenAddMentee={() => setIsAddMenteeOpen(true)}
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
            onEditStudent={(s) => setEditingStudent(s)}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {activeTab === 'ai-analysis' && (
          <AIStudentAnalysis
            students={students}
            currentRole={currentRole}
            currentMentor={currentMentor}
            mentors={mentors}
            initialStudentId={targetStudentId}
            onNavigateToWhatsApp={(studentId, customMsg) =>
              handleNavigateWithStudent('whatsapp', studentId, customMsg)
            }
            onOpenAddMentee={() => setIsAddMenteeOpen(true)}
            onNavigate={(tab) => setActiveTab(tab)}
            onAddTeacherUpdate={handleAddTeacherUpdate}
          />
        )}

        {activeTab === 'notice-hub' && (
          <OfficialNoticeGenerator students={students} currentMentor={currentMentor} />
        )}

        {activeTab === 'assessment' && (
          <AssessmentCenter
            students={students}
            currentMentor={currentMentor}
            mentors={mentors}
            userEmail={userEmail}
            currentRole={currentRole}
            onBulkUpdateMarks={handleBulkUpdateMarks}
            onBulkAddStudents={(newStudents) => {
              setStudents((prev) => [...newStudents, ...prev]);
              saveStudentsBatchToCloud(newStudents);
            }}
            onAddTeacherUpdate={handleAddTeacherUpdate}
            onEditStudent={(s) => setEditingStudent(s)}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {activeTab === 'early-warning' && (
          <EarlyWarningSystem
            students={students}
            onNavigateToWhatsApp={(studentId) =>
              handleNavigateWithStudent('whatsapp', studentId)
            }
            onNavigateToResources={() => setActiveTab('resources')}
          />
        )}

        {activeTab === 'whatsapp' && (
          <WhatsAppSuite
            students={students}
            currentMentor={currentMentor}
            initialStudentId={targetStudentId}
            customDraft={whatsappDraft}
          />
        )}

        {activeTab === 'resources' && <ResourceLibrary currentMentor={currentMentor} />}

        {activeTab === 'quiz' && <QuizEngine students={students} />}

        {activeTab === 'admin' && (
          <AdminSuite
            students={students}
            mentors={mentors}
            currentMentor={currentMentor}
            userEmail={userEmail}
            userPhone={userPhone}
            adminList={adminList}
            onUpdateAdminList={handleUpdateAdminList}
            onEditStudent={(s) => setEditingStudent(s)}
            onDeleteStudent={handleDeleteStudent}
            onEditMentor={(m) => setEditingMentor(m)}
            onAddMentor={() => setIsAddingMentor(true)}
            onDeleteMentor={handleDeleteMentor}
          />
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <strong className="text-slate-800 font-extrabold">EduPulse Digboi College (Autonomous)</strong> • Institutional Ecosystem for Slow Learner Support & Mentorship
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">Internal Academic Portal</span>
            <span className="text-slate-300">•</span>
            <span className="bg-amber-100 text-amber-950 border border-amber-300 font-extrabold px-3 py-1 rounded-lg text-xs shadow-2xs">
              Copyright Dr. Deborshee Gogoi
            </span>
          </div>
        </div>
      </footer>

      {/* App-Wide Toast Notification for Offline Usage & Backup/Sync Prompt */}
      <OfflineBackupSyncToast students={students} mentors={mentors} />

      {/* Force Refresh Notification Toast */}
      {refreshToastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{refreshToastMessage}</span>
        </div>
      )}
    </div>
  );
}
