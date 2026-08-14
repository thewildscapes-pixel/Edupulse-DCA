import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { Student, Mentor, TeacherUpdateLog, FacultyLoginRecord, MenteeLog } from '../types';

// Firebase configuration from environment or fallback
const metaEnv = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || 'AIzaSyPlaceholderKeyForDigboiCollegeDev',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || 'edupulse-digboi.firebaseapp.com',
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || 'ai-studio-edupulsedigboico-789b0e2f-ea2a-4f8b-916c-a496b1edf07f',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || 'edupulse-digboi.appspot.com',
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '298200574086',
  appId: metaEnv.VITE_FIREBASE_APP_ID || '1:298200574086:web:0000000000000000000000',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// Collection References
const STUDENTS_COL = 'students';
const MENTORS_COL = 'mentors';
const TEACHER_UPDATES_COL = 'teacher_updates';
const LOGIN_REGISTRY_COL = 'login_registry';
const SETTINGS_COL = 'settings';
const MENTEE_LOGS_COL = 'mentee_logs';

// Real-time Subscriptions
export function subscribeStudents(
  onUpdate: (students: Student[]) => void,
  onError?: (err: any) => void
) {
  try {
    return onSnapshot(
      collection(db, STUDENTS_COL),
      (snapshot) => {
        const studentsList: Student[] = snapshot.docs.map((d) => d.data() as Student);
        onUpdate(studentsList);
      },
      (error) => {
        console.warn('Firestore students subscription error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}

export function subscribeMentors(
  onUpdate: (mentors: Mentor[]) => void,
  onError?: (err: any) => void
) {
  try {
    return onSnapshot(
      collection(db, MENTORS_COL),
      (snapshot) => {
        const mentorsList: Mentor[] = snapshot.docs.map((d) => d.data() as Mentor);
        onUpdate(mentorsList);
      },
      (error) => {
        console.warn('Firestore mentors subscription error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}

export function subscribeTeacherUpdates(onUpdate: (updates: TeacherUpdateLog[]) => void) {
  try {
    return onSnapshot(
      collection(db, TEACHER_UPDATES_COL),
      (snapshot) => {
        const updatesList = snapshot.docs.map((d) => d.data() as TeacherUpdateLog);
        onUpdate(updatesList);
      },
      (error) => console.warn('Teacher updates snapshot error:', error)
    );
  } catch (e) {
    return () => {};
  }
}

export function subscribeBlockedLogins(onUpdate: (blockedList: string[]) => void) {
  try {
    return onSnapshot(
      doc(db, SETTINGS_COL, 'blocked_logins'),
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data().list || []);
        }
      },
      (error) => console.warn('Blocked logins snapshot error:', error)
    );
  } catch (e) {
    return () => {};
  }
}

export function subscribeLoginRegistry(onUpdate: (logs: FacultyLoginRecord[]) => void) {
  try {
    return onSnapshot(
      collection(db, LOGIN_REGISTRY_COL),
      (snapshot) => {
        const logs = snapshot.docs.map((d) => d.data() as FacultyLoginRecord);
        onUpdate(logs);
      },
      (error) => console.warn('Login registry snapshot error:', error)
    );
  } catch (e) {
    return () => {};
  }
}

export function subscribeAdminList(onUpdate: (adminList: string[]) => void) {
  try {
    return onSnapshot(
      doc(db, SETTINGS_COL, 'admin_list'),
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data().list || []);
        }
      },
      (error) => console.warn('Admin list snapshot error:', error)
    );
  } catch (e) {
    return () => {};
  }
}

export function subscribeMenteeLogs(
  onUpdate: (logs: MenteeLog[]) => void,
  onError?: (err: any) => void
) {
  try {
    return onSnapshot(
      collection(db, MENTEE_LOGS_COL),
      (snapshot) => {
        const logsList: MenteeLog[] = snapshot.docs.map((d) => d.data() as MenteeLog);
        onUpdate(logsList);
      },
      (error) => {
        console.warn('Firestore mentee logs subscription error:', error);
        if (onError) onError(error);
      }
    );
  } catch (e) {
    return () => {};
  }
}

export async function saveAdminListToCloud(adminList: string[]): Promise<void> {
  try {
    await setDoc(doc(db, SETTINGS_COL, 'admin_list'), { list: adminList });
  } catch (err) {
    console.error('Error saving admin list:', err);
  }
}

// Data Mutation API
export async function syncServerData(payload?: {
  students?: Student[];
  mentors?: Mentor[];
  teacherUpdates?: TeacherUpdateLog[];
  adminList?: string[];
  blockedLogins?: string[];
  menteeLogs?: MenteeLog[];
}) {
  try {
    if (payload) {
      const res = await fetch('/api/sync-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } else {
      const res = await fetch('/api/sync-data');
      return await res.json();
    }
  } catch (err) {
    console.warn('Server sync error:', err);
    return null;
  }
}

export async function saveStudentToCloud(student: Student): Promise<void> {
  try {
    const studentWithTimestamp: Student = {
      ...student,
      lastModified: student.lastModified || Date.now(),
    };
    await syncServerData({ students: [studentWithTimestamp] });
    await setDoc(doc(db, STUDENTS_COL, studentWithTimestamp.id), studentWithTimestamp, { merge: true });
  } catch (err) {
    console.error('Error saving student to cloud:', err);
  }
}

export async function saveStudentsBatchToCloud(students: Student[]): Promise<void> {
  try {
    const studentsWithTs = students.map(s => ({ ...s, lastModified: s.lastModified || Date.now() }));
    await syncServerData({ students: studentsWithTs });
    const batch = writeBatch(db);
    studentsWithTs.forEach((s) => {
      const ref = doc(db, STUDENTS_COL, s.id);
      batch.set(ref, s, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.error('Batch saving students failed:', err);
  }
}

export async function deleteStudentFromCloud(studentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, STUDENTS_COL, studentId));
  } catch (err) {
    console.error('Error deleting student from cloud:', err);
  }
}

export async function saveMentorToCloud(mentor: Mentor): Promise<void> {
  try {
    await syncServerData({ mentors: [mentor] });
    await setDoc(doc(db, MENTORS_COL, mentor.id), mentor, { merge: true });
  } catch (err) {
    console.error('Error saving mentor to cloud:', err);
  }
}

export async function saveMentorsBatchToCloud(mentors: Mentor[]): Promise<void> {
  try {
    await syncServerData({ mentors });
    const batch = writeBatch(db);
    mentors.forEach((m) => {
      const ref = doc(db, MENTORS_COL, m.id);
      batch.set(ref, m, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.error('Batch saving mentors failed:', err);
  }
}

export async function deleteMentorFromCloud(mentorId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, MENTORS_COL, mentorId));
  } catch (err) {
    console.error('Error deleting mentor from cloud:', err);
  }
}

export async function saveTeacherUpdateToCloud(updateLog: TeacherUpdateLog): Promise<void> {
  try {
    await setDoc(doc(db, TEACHER_UPDATES_COL, updateLog.id), updateLog);
  } catch (err) {
    console.error('Error saving teacher update to cloud:', err);
  }
}

export async function markTeacherUpdateReadInCloud(updateId: string): Promise<void> {
  try {
    await setDoc(doc(db, TEACHER_UPDATES_COL, updateId), { isRead: true }, { merge: true });
  } catch (err) {
    console.error('Error marking update as read:', err);
  }
}

export async function saveLoginRegistryToCloud(record: FacultyLoginRecord | FacultyLoginRecord[]): Promise<void> {
  try {
    if (Array.isArray(record)) {
      const batch = writeBatch(db);
      record.forEach((r) => batch.set(doc(db, LOGIN_REGISTRY_COL, r.id), r, { merge: true }));
      await batch.commit();
    } else {
      await setDoc(doc(db, LOGIN_REGISTRY_COL, record.id), record, { merge: true });
    }
  } catch (err) {
    console.error('Error saving login record to cloud:', err);
  }
}

export async function saveBlockedLoginsToCloud(blockedList: string[]): Promise<void> {
  try {
    await setDoc(doc(db, SETTINGS_COL, 'blocked_logins'), { list: blockedList });
  } catch (err) {
    console.error('Error saving blocked logins:', err);
  }
}

export async function saveMenteeLogToCloud(log: MenteeLog): Promise<void> {
  try {
    const logWithTs = {
      ...log,
      lastModified: log.lastModified || Date.now(),
    };
    await syncServerData({ menteeLogs: [logWithTs] });
    await setDoc(doc(db, MENTEE_LOGS_COL, logWithTs.id), logWithTs, { merge: true });
  } catch (err) {
    console.error('Error saving mentee log to cloud:', err);
  }
}

export async function saveMenteeLogsBatchToCloud(logs: MenteeLog[]): Promise<void> {
  try {
    const logsWithTs = logs.map(l => ({ ...l, lastModified: l.lastModified || Date.now() }));
    await syncServerData({ menteeLogs: logsWithTs });
    const batch = writeBatch(db);
    logsWithTs.forEach((l) => {
      batch.set(doc(db, MENTEE_LOGS_COL, l.id), l, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.error('Error saving mentee logs batch to cloud:', err);
  }
}

export async function deleteMenteeLogFromCloud(logId: string): Promise<void> {
  try {
    await fetch(`/api/mentee-logs/${logId}`, { method: 'DELETE' });
    await deleteDoc(doc(db, MENTEE_LOGS_COL, logId));
  } catch (err) {
    console.error('Error deleting mentee log from cloud:', err);
  }
}

// Fixed Seeding Function: Ensures app seeds cloud data ONLY ONCE, and doesn't re-seed deleted items
export async function seedInitialCloudDataIfEmpty(
  initialStudents: Student[],
  initialMentors: Mentor[]
): Promise<void> {
  try {
    const isSeeded = localStorage.getItem('edupulse_cloud_seeded');
    if (isSeeded === 'true') {
      return; // Already seeded once. Do NOT override user deletions!
    }

    const studentsSnap = await getDocs(collection(db, STUDENTS_COL));
    const mentorsSnap = await getDocs(collection(db, MENTORS_COL));

    if (studentsSnap.empty && initialStudents.length > 0) {
      const batch = writeBatch(db);
      initialStudents.forEach((s) => batch.set(doc(db, STUDENTS_COL, s.id), s));
      await batch.commit();
    }

    if (mentorsSnap.empty && initialMentors.length > 0) {
      const batch = writeBatch(db);
      initialMentors.forEach((m) => batch.set(doc(db, MENTORS_COL, m.id), m));
      await batch.commit();
    }

    localStorage.setItem('edupulse_cloud_seeded', 'true');
  } catch (err) {
    console.warn('Seeding check warning:', err);
    localStorage.setItem('edupulse_cloud_seeded', 'true');
  }
}

/**
 * Dedicated reconciliation check that compares the lastModified timestamp of student records
 * between local storage and Firestore to ensure the most recent version always takes precedence
 * during real-time updates and cross-device sync.
 */
export function reconcileStudentRecords(
  localStudents: Student[],
  cloudStudents: Student[]
): Student[] {
  let deletedStudentIds: string[] = [];
  try {
    deletedStudentIds = JSON.parse(localStorage.getItem('edupulse_deleted_students') || '[]');
  } catch (e) {}

  const studentMap = new Map<string, Student>();

  // 1. Base map from cloud source of truth
  (cloudStudents || []).forEach((cloud) => {
    if (cloud && cloud.id && !deletedStudentIds.includes(cloud.id)) {
      studentMap.set(cloud.id, cloud);
    }
  });

  // 2. Safely merge local storage entries without dropping ANY user-entered student
  (localStudents || []).forEach((local) => {
    if (!local || !local.id || deletedStudentIds.includes(local.id)) return;

    const cloud = studentMap.get(local.id);
    if (cloud) {
      // If local version has equal or strictly newer modification timestamp, prefer local
      const localTime = local.lastModified || 0;
      const cloudTime = cloud.lastModified || 0;
      if (localTime >= cloudTime) {
        studentMap.set(local.id, local);
      }
    } else {
      // Local student not yet reflected in cloud: PRESERVE ALWAYS
      studentMap.set(local.id, local);
    }
  });

  return Array.from(studentMap.values());
}

export function reconcileMentorRecords(
  localMentors: Mentor[],
  cloudMentors: Mentor[]
): Mentor[] {
  let deletedMentorIds: string[] = [];
  try {
    deletedMentorIds = JSON.parse(localStorage.getItem('edupulse_deleted_mentors') || '[]');
  } catch (e) {}

  const mentorMap = new Map<string, Mentor>();

  const getMentorKey = (m: Mentor) => {
    const normE = (m.email || '').trim().toLowerCase();
    if (normE) return `email:${normE}`;
    const normP = (m.phone || '').replace(/\D/g, '').slice(-10);
    if (normP) return `phone:${normP}`;
    return `id:${m.id}`;
  };

  const isGeneric = (name?: string) => {
    if (!name) return true;
    const lower = name.toLowerCase();
    return lower.includes('faculty member') || lower.startsWith('prof. faculty') || lower.startsWith('faculty');
  };

  (cloudMentors || []).forEach((cloud) => {
    if (cloud && cloud.id && !deletedMentorIds.includes(cloud.id)) {
      const key = getMentorKey(cloud);
      mentorMap.set(key, cloud);
    }
  });

  (localMentors || []).forEach((local) => {
    if (!local || !local.id || deletedMentorIds.includes(local.id)) return;
    const key = getMentorKey(local);
    const cloud = mentorMap.get(key);

    if (cloud) {
      const localTime = local.lastModified || 0;
      const cloudTime = cloud.lastModified || 0;

      const localGeneric = isGeneric(local.name);
      const cloudGeneric = isGeneric(cloud.name);

      let bestName = local.name || cloud.name;
      if (localGeneric && !cloudGeneric) {
        bestName = cloud.name;
      } else if (!localGeneric && cloudGeneric) {
        bestName = local.name;
      } else if (localTime > cloudTime) {
        bestName = local.name || cloud.name;
      } else {
        bestName = cloud.name || local.name;
      }

      let bestDept = localTime >= cloudTime ? (local.department || cloud.department || 'Physics') : (cloud.department || local.department || 'Physics');
      let bestDesig = localTime >= cloudTime ? (local.designation || cloud.designation || 'Assistant Professor') : (cloud.designation || local.designation || 'Assistant Professor');

      const mergedMentees = Array.from(
        new Set([...(cloud.assignedMenteeIds || []), ...(local.assignedMenteeIds || [])])
      );

      const merged: Mentor = {
        ...cloud,
        ...local,
        id: local.id || cloud.id,
        name: bestName,
        designation: bestDesig,
        department: bestDept,
        email: local.email || cloud.email,
        phone: local.phone || cloud.phone,
        assignedMenteeIds: mergedMentees,
        lastModified: Math.max(localTime, cloudTime, Date.now()),
      };

      mentorMap.set(key, merged);
    } else {
      mentorMap.set(key, local);
    }
  });

  return Array.from(mentorMap.values());
}

// Sync Verification Utility: Checks cloud state vs local storage, re-fetching missing cloud data and prioritizing cloud over stale local storage
export interface SyncVerificationResult {
  students: Student[];
  mentors: Mentor[];
  teacherUpdates: TeacherUpdateLog[];
  menteeLogs?: MenteeLog[];
  syncedFromCloud: boolean;
}

export async function verifyAndSyncCloudData(): Promise<SyncVerificationResult> {
  try {
    // 1. Fetch server-side synced data
    const serverSync = await syncServerData();
    const serverStudents: Student[] = serverSync?.students || [];
    const serverMentors: Mentor[] = serverSync?.mentors || [];
    const serverUpdates: TeacherUpdateLog[] = serverSync?.teacherUpdates || [];
    const serverMenteeLogs: MenteeLog[] = serverSync?.menteeLogs || [];

    // 2. Fetch Firestore data (if available)
    let cloudStudents: Student[] = [];
    let cloudMentors: Mentor[] = [];
    let cloudUpdates: TeacherUpdateLog[] = [];
    let cloudMenteeLogs: MenteeLog[] = [];
    try {
      const studentsSnap = await getDocs(collection(db, STUDENTS_COL));
      const mentorsSnap = await getDocs(collection(db, MENTORS_COL));
      const updatesSnap = await getDocs(collection(db, TEACHER_UPDATES_COL));
      const menteeLogsSnap = await getDocs(collection(db, MENTEE_LOGS_COL));

      cloudStudents = studentsSnap.docs.map((d) => d.data() as Student);
      cloudMentors = mentorsSnap.docs.map((d) => d.data() as Mentor);
      cloudUpdates = updatesSnap.docs.map((d) => d.data() as TeacherUpdateLog);
      cloudMenteeLogs = menteeLogsSnap.docs.map((d) => d.data() as MenteeLog);
    } catch (e) {
      console.warn('Firestore fetch fallback to server API:', e);
    }

    // Merge cloud and server pools
    const combinedStudentsMap = new Map<string, Student>();
    serverStudents.forEach((s) => combinedStudentsMap.set(s.id, s));
    cloudStudents.forEach((s) => {
      const existing = combinedStudentsMap.get(s.id);
      if (!existing || (s.lastModified || 0) >= (existing.lastModified || 0)) {
        combinedStudentsMap.set(s.id, s);
      }
    });
    const combinedCloudStudents = Array.from(combinedStudentsMap.values());

    const combinedMentorsMap = new Map<string, Mentor>();
    const getMentorKey = (m: Mentor) => {
      const normE = (m.email || '').trim().toLowerCase();
      if (normE) return `email:${normE}`;
      const normP = (m.phone || '').replace(/\D/g, '').slice(-10);
      if (normP) return `phone:${normP}`;
      return `id:${m.id}`;
    };

    [...serverMentors, ...cloudMentors].forEach((m) => {
      const key = getMentorKey(m);
      const existing = combinedMentorsMap.get(key);
      if (existing) {
        const isExistingGeneric = !existing.name || existing.name.includes('Faculty Member') || existing.name.startsWith('Prof. Faculty');
        const isNewGeneric = !m.name || m.name.includes('Faculty Member') || m.name.startsWith('Prof. Faculty');

        let bestName = existing.name;
        if (isExistingGeneric && !isNewGeneric) {
          bestName = m.name;
        } else if (m.name && !isNewGeneric) {
          bestName = m.name;
        }

        combinedMentorsMap.set(key, {
          ...existing,
          ...m,
          id: existing.id || m.id,
          name: bestName,
          designation: (m.designation && m.designation !== 'Assistant Professor') ? m.designation : (existing.designation || m.designation || 'Assistant Professor'),
          department: m.department || existing.department || 'Physics',
          email: m.email || existing.email,
          phone: m.phone || existing.phone,
          assignedMenteeIds: Array.from(new Set([...(existing.assignedMenteeIds || []), ...(m.assignedMenteeIds || [])])),
        });
      } else {
        combinedMentorsMap.set(key, m);
      }
    });
    const combinedCloudMentors = Array.from(combinedMentorsMap.values());

    const combinedUpdatesMap = new Map<string, TeacherUpdateLog>();
    serverUpdates.forEach((u) => combinedUpdatesMap.set(u.id, u));
    cloudUpdates.forEach((u) => combinedUpdatesMap.set(u.id, u));
    const combinedCloudUpdates = Array.from(combinedUpdatesMap.values());

    const combinedLogsMap = new Map<string, MenteeLog>();
    serverMenteeLogs.forEach((l) => combinedLogsMap.set(l.id, l));
    cloudMenteeLogs.forEach((l) => combinedLogsMap.set(l.id, l));
    const combinedCloudMenteeLogs = Array.from(combinedLogsMap.values());

    let localStudents: Student[] = [];
    try {
      const saved = localStorage.getItem('edupulse_students');
      if (saved) localStudents = JSON.parse(saved);
    } catch (e) {}

    let localMentors: Mentor[] = [];
    try {
      const savedM = localStorage.getItem('edupulse_mentors');
      if (savedM) localMentors = JSON.parse(savedM);
    } catch (e) {}

    let localMenteeLogs: MenteeLog[] = [];
    try {
      const savedLogs = localStorage.getItem('edupulse_mentee_logs');
      if (savedLogs) localMenteeLogs = JSON.parse(savedLogs);
    } catch (e) {}

    const reconciledStudents = reconcileStudentRecords(localStudents, combinedCloudStudents);
    const reconciledMentors = reconcileMentorRecords(localMentors, combinedCloudMentors);

    // Merge local & cloud mentee logs
    localMenteeLogs.forEach((l) => {
      if (l && l.id && !combinedLogsMap.has(l.id)) {
        combinedLogsMap.set(l.id, l);
      }
    });
    const reconciledMenteeLogs = Array.from(combinedLogsMap.values()).sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));

    // Save server source of truth to localStorage
    localStorage.setItem('edupulse_students', JSON.stringify(reconciledStudents));
    if (reconciledMentors.length > 0) {
      localStorage.setItem('edupulse_mentors', JSON.stringify(reconciledMentors));
    }
    if (combinedCloudUpdates.length > 0) {
      localStorage.setItem('edupulse_teacher_updates', JSON.stringify(combinedCloudUpdates));
    }
    if (reconciledMenteeLogs.length > 0) {
      localStorage.setItem('edupulse_mentee_logs', JSON.stringify(reconciledMenteeLogs));
    }

    // If local has students that cloud is missing, automatically back them up to server/cloud
    const missingInCloudStudents = reconciledStudents.filter(
      (s) => !combinedCloudStudents.some((c) => c.id === s.id)
    );
    if (missingInCloudStudents.length > 0) {
      saveStudentsBatchToCloud(missingInCloudStudents);
    }

    return {
      students: reconciledStudents,
      mentors: reconciledMentors,
      teacherUpdates: combinedCloudUpdates,
      menteeLogs: reconciledMenteeLogs,
      syncedFromCloud: reconciledStudents.length > 0 || reconciledMentors.length > 0,
    };
  } catch (err) {
    console.warn('Sync Verification Warning:', err);
    return {
      students: [],
      mentors: [],
      teacherUpdates: [],
      menteeLogs: [],
      syncedFromCloud: false,
    };
  }
}
