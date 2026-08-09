import React, { useState, useEffect } from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';
import { Role, Student, Mentor, TeacherUpdateLog, Department } from './types';
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
  seedInitialCloudDataIfEmpty,
  verifyAndSyncCloudData,
  reconcileStudentRecords,
} from './lib/firebase';

export default function App() {
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('edupulse_faculty_email') || '';
  });
  const [userPhone, setUserPhone] = useState<string>(() => {
    return localStorage.getItem('edupulse_faculty_phone') || '';
  });
  const [currentRole, setCurrentRole] = useState<Role>(() => {
    // Check if student opened a quiz link via WhatsApp / Google Form direct link
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const publicQuizId = urlParams?.get('quizId');

  if (publicQuizId) {
    return <StandalonePublicQuiz quizId={publicQuizId} />;
  }

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
    setUserEmail('');
    setUserPhone('');
    setIsWalkthroughOpen(true);
  };

  // Enforce Access Restriction for Blocked Logins
  useEffect(() => {
    if (userEmail || userPhone) {
      try {
        const blockedLogins: string[] = JSON.parse(localStorage.getItem('edupulse_blocked_logins') || '[]');
        const cleanEmail = userEmail.trim().toLowerCase();
        const cleanDigits = userPhone.replace(/\D/g, '').slice(-10);

        if (blockedLogins.includes(cleanEmail) || (cleanDigits && blockedLogins.includes(cleanDigits))) {
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

  // App-wide data state backed by Firestore cloud database & localStorage
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('edupulse_students');
    if (saved) {
      try {
        const parsed: Student[] = JSON.parse(saved);
        return parsed.filter((s) => !['s_101', 's_102', 's_103', 's_104', 's_105'].includes(s.id));
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
        return parsed.filter((m) => !['m_1', 'm_2', 'm_3', 'm_4'].includes(m.id));
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

  // Initialize Firestore seeding & real-time listeners for cross-device persistence with strict re-hydration gate
  useEffect(() => {
    let isMounted = true;

    async function initializeAppData() {
      try {
        // Step 1: Ensure initial cloud seed if empty
        await seedInitialCloudDataIfEmpty(INITIAL_STUDENTS, INITIAL_MENTORS);

        // Step 2: Fetch latest snapshot from Firestore to re-hydrate state & localStorage
        const syncResult = await verifyAndSyncCloudData();

        let deletedStudentIds: string[] = [];
        try {
          deletedStudentIds = JSON.parse(localStorage.getItem('edupulse_deleted_students') || '[]');
        } catch (e) {}

        let deletedMentorIds: string[] = [];
        try {
          deletedMentorIds = JSON.parse(localStorage.getItem('edupulse_deleted_mentors') || '[]');
        } catch (e) {}

        // Merge local students with cloud students using dedicated reconciliation check
        let localStudents: Student[] = [];
        try {
          const saved = localStorage.getItem('edupulse_students');
          if (saved) localStudents = JSON.parse(saved);
        } catch (e) {}

        const finalStudents = reconcileStudentRecords(localStudents, syncResult.students || []);

        // Merge local mentors with cloud mentors
        let localMentors: Mentor[] = [];
        try {
          const saved = localStorage.getItem('edupulse_mentors');
          if (saved) localMentors = JSON.parse(saved);
        } catch (e) {}

        const mentorMap = new Map<string, Mentor>();
        localMentors.forEach((m) => {
          if (!deletedMentorIds.includes(m.id)) mentorMap.set(m.id, m);
        });
        (syncResult.mentors || []).forEach((m) => {
          if (!deletedMentorIds.includes(m.id)) mentorMap.set(m.id, m);
        });
        const finalMentors = Array.from(mentorMap.values());

        // Merge teacher updates
        let localUpdates: TeacherUpdateLog[] = [];
        try {
          const saved = localStorage.getItem('edupulse_teacher_updates');
          if (saved) localUpdates = JSON.parse(saved);
        } catch (e) {}

        const updateMap = new Map<string, TeacherUpdateLog>();
        localUpdates.forEach((u) => updateMap.set(u.id, u));
        (syncResult.teacherUpdates || []).forEach((u) => updateMap.set(u.id, u));
        const finalUpdates = Array.from(updateMap.values());

        if (isMounted) {
          setStudents(finalStudents);
          setMentors(finalMentors);
          setTeacherUpdates(finalUpdates);
          localStorage.setItem('edupulse_students', JSON.stringify(finalStudents));
          localStorage.setItem('edupulse_mentors', JSON.stringify(finalMentors));
          localStorage.setItem('edupulse_teacher_updates', JSON.stringify(finalUpdates));

          // Background sync any local items not yet in Firestore
          const missingStudentsInCloud = finalStudents.filter(
            (s) => !(syncResult.students || []).some((cs) => cs.id === s.id)
          );
          if (missingStudentsInCloud.length > 0) {
            saveStudentsBatchToCloud(missingStudentsInCloud);
          }

          const missingMentorsInCloud = finalMentors.filter(
            (m) => !(syncResult.mentors || []).some((cm) => cm.id === m.id)
          );
          if (missingMentorsInCloud.length > 0) {
            saveMentorsBatchToCloud(missingMentorsInCloud);
          }
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

      let deletedMentorIds: string[] = [];
      try {
        deletedMentorIds = JSON.parse(localStorage.getItem('edupulse_deleted_mentors') || '[]');
      } catch (e) {}

      let currentLocal: Mentor[] = [];
      try {
        const saved = localStorage.getItem('edupulse_mentors');
        if (saved) currentLocal = JSON.parse(saved);
      } catch (e) {}

      const mentorMap = new Map<string, Mentor>();
      currentLocal.forEach((m) => {
        if (!deletedMentorIds.includes(m.id)) mentorMap.set(m.id, m);
      });
      cloudMentors.forEach((m) => {
        if (!deletedMentorIds.includes(m.id)) mentorMap.set(m.id, m);
      });

      const mergedMentors = Array.from(mentorMap.values());
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
        if (syncResult.students && syncResult.students.length > 0) {
          setStudents((prev) => {
            const merged = reconcileStudentRecords(prev, syncResult.students);
            localStorage.setItem('edupulse_students', JSON.stringify(merged));
            return merged;
          });
        }
        if (syncResult.mentors && syncResult.mentors.length > 0) {
          setMentors(syncResult.mentors);
          localStorage.setItem('edupulse_mentors', JSON.stringify(syncResult.mentors));
        }
        if (syncResult.teacherUpdates && syncResult.teacherUpdates.length > 0) {
          setTeacherUpdates(syncResult.teacherUpdates);
          localStorage.setItem('edupulse_teacher_updates', JSON.stringify(syncResult.teacherUpdates));
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

  // Derive active logged-in mentor from userEmail or userPhone
  const currentMentor: Mentor = React.useMemo(() => {
    const normEmail = userEmail.trim().toLowerCase();
    const normPhone = userPhone.replace(/\D/g, '').slice(-10);

    const existing = mentors.find(
      (m) =>
        (normEmail && m.email.toLowerCase() === normEmail) ||
        (normPhone && m.phone && m.phone.replace(/\D/g, '').slice(-10) === normPhone)
    );
    if (existing) return existing;

    const namePart = userEmail.split('@')[0] || 'Faculty';
    const formattedName = namePart
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const isDr = namePart.toLowerCase().includes('dr');
    const title = isDr ? 'Dr.' : 'Prof.';

    return {
      id: `m_${normEmail.replace(/[^a-z0-9]/g, '_') || Date.now()}`,
      name: `${title} ${formattedName}`,
      department: 'Physics',
      email: userEmail.trim(),
      phone: userPhone.trim() || '+91 94350 00000',
      assignedMenteeIds: [],
      isPreloaded: false,
    };
  }, [userEmail, userPhone, mentors]);

  // Ensure active logged-in faculty appears in faculty & mentor registry and Firestore
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

      saveMentorToCloud(currentMentor);
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
    }

    let savedMentorObj: Mentor | null = null;

    setMentors((prev) => {
      const targetId = profile.id;
      const normEmail = finalEmail.toLowerCase();
      const normPhone = finalPhone.replace(/\D/g, '').slice(-10);

      const idx = prev.findIndex(
        (m) =>
          (targetId && m.id === targetId) ||
          (normEmail && m.email.toLowerCase() === normEmail) ||
          (normPhone && m.phone && m.phone.replace(/\D/g, '').slice(-10) === normPhone)
      );

      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          name: profile.name,
          designation: profile.designation,
          department: profile.department,
          email: finalEmail,
          phone: finalPhone,
          assignedMenteeIds: profile.assignedMenteeIds || updated[idx].assignedMenteeIds || [],
        };
        savedMentorObj = updated[idx];
        localStorage.setItem('edupulse_mentors', JSON.stringify(updated));
        return updated;
      }

      const newMentor: Mentor = {
        id: profile.id || `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: profile.name,
        designation: profile.designation,
        department: profile.department,
        email: finalEmail,
        phone: finalPhone,
        assignedMenteeIds: profile.assignedMenteeIds || students.map((s) => s.id),
        isPreloaded: false,
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

  const handleSelectRoleFromWalkthrough = (
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
    const finalEmail = email?.trim() || userEmail || 'prof.deborshee@digboicollege.edu.in';
    const finalPhone = phone?.trim() || userPhone || '+91 94350 12345';
    setCurrentRole(role);
    setActiveTab(defaultTab);
    setUserEmail(finalEmail);
    setUserPhone(finalPhone);

    // Save session in localStorage
    localStorage.setItem('edupulse_faculty_email', finalEmail);
    localStorage.setItem('edupulse_faculty_phone', finalPhone);
    localStorage.setItem('edupulse_faculty_role', role);

    let updatedMentorToSync: Mentor | null = null;

    // Ensure mentor list includes or updates this faculty member in state & cloud
    setMentors((prev) => {
      const normEmail = finalEmail.toLowerCase();
      const normPhone = finalPhone.replace(/\D/g, '').slice(-10);

      const idx = prev.findIndex(
        (m) =>
          (normEmail && m.email.toLowerCase() === normEmail) ||
          (normPhone && m.phone && m.phone.replace(/\D/g, '').slice(-10) === normPhone)
      );

      if (idx !== -1) {
        const existing = prev[idx];
        const updated = [...prev];

        // CRITICAL: Preserve existing customized profile saved in database!
        const isDefaultName = !existing.name || existing.name === 'Dr. Faculty Member' || existing.name.startsWith('Prof. Faculty');
        const isDefaultDesig = !existing.designation;
        const isDefaultDept = !existing.department;

        updated[idx] = {
          ...existing,
          email: finalEmail || existing.email,
          phone: finalPhone || existing.phone,
          name: isDefaultName ? (mentorProfile?.name || existing.name || 'Dr. Deborshee Gogoi') : existing.name,
          designation: isDefaultDesig ? (mentorProfile?.designation || 'Assistant Professor') : existing.designation,
          department: isDefaultDept ? (mentorProfile?.department || 'Physics') : existing.department,
        };
        updatedMentorToSync = updated[idx];
        localStorage.setItem('edupulse_mentors', JSON.stringify(updated));
        return updated;
      }

      const newMentor: Mentor = {
        id: `m_${Date.now()}`,
        name: mentorProfile?.name || `Dr. Deborshee Gogoi`,
        designation: mentorProfile?.designation || 'Assistant Professor',
        department: mentorProfile?.department || 'Physics',
        email: finalEmail,
        phone: mentorProfile?.phone || finalPhone,
        assignedMenteeIds: students.map((s) => s.id),
        isPreloaded: false,
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
        isAdmin={isAdmin}
        onLogout={handleLogout}
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
            userEmail={userEmail}
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
            userEmail={userEmail}
            currentRole={currentRole}
            onMarkUpdateRead={handleMarkUpdateRead}
            onUpdateNotes={handleUpdateNotes}
            onBulkUpdateMarks={handleBulkUpdateMarks}
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
    </div>
  );
}
