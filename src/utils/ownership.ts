import { Student, Role, TeacherUpdateLog } from '../types';

export interface OwnershipCheckResult {
  allowed: boolean;
  reason?: string;
  creatorName?: string;
}

/**
 * Checks if a student belongs to the logged-in Educator's subject roster.
 * Rule: Educator views only those students whose marks he/she has entered under various subjects,
 * or students created/managed by this educator.
 */
export function isEducatorSubjectStudent(
  student: Student,
  userEmail: string,
  mentorName: string,
  teacherUpdates: TeacherUpdateLog[] = []
): boolean {
  const normEmail = (userEmail || '').trim().toLowerCase();
  const normName = (mentorName || '').trim().toLowerCase();

  // 1. Created by this educator
  const creatorEmail = (student.creatorEmail || '').trim().toLowerCase();
  const createdBy = (student.createdBy || '').trim().toLowerCase();
  if (normEmail && creatorEmail === normEmail) return true;
  if (normName && createdBy === normName) return true;

  // 2. Marks entered in subjects by this educator
  const hasSubjectMarks = (student.subjects || []).some((sub) => {
    const subEmail = (sub.teacherEmail || '').trim().toLowerCase();
    const subEntered = (sub.enteredBy || '').trim().toLowerCase();
    return (normEmail && subEmail && subEmail === normEmail) || (normName && subEntered && subEntered === normName);
  });
  if (hasSubjectMarks) return true;

  // 3. Logged in teacher updates by this educator for this student
  const hasUpdateLog = teacherUpdates.some((log) => {
    const tName = (log.teacherName || '').trim().toLowerCase();
    return normName && tName.includes(normName) && (log.studentIds || []).includes(student.id);
  });
  if (hasUpdateLog) return true;

  return false;
}

/**
 * Checks if the logged-in user has permission to edit or delete a student/mentee record.
 * Rules:
 * 1. Admin can edit/delete any record.
 * 2. Faculty member can edit/delete records created by them or assigned as their mentee.
 * 3. Records created by other faculty members cannot be edited or deleted by non-admin faculty.
 */
export function canEditStudent(
  student: Student,
  userEmail: string,
  userRole: Role,
  currentMentorId?: string
): OwnershipCheckResult {
  // Admin has universal override privileges
  if (userRole === 'admin') {
    return { allowed: true, reason: 'Admin Privilege' };
  }

  const normalizedUserEmail = (userEmail || '').trim().toLowerCase();
  const creator = (student.creatorEmail || student.createdBy || '').trim().toLowerCase();

  // If student record was created by this faculty member
  if (creator && creator === normalizedUserEmail) {
    return { allowed: true, reason: 'Record Creator' };
  }

  // If student is assigned to this mentor
  if (currentMentorId && student.mentorId === currentMentorId) {
    return { allowed: true, reason: 'Assigned Mentee' };
  }

  // If student record has no explicit creator email, default to allowing assigned mentor or creator
  if (!creator) {
    return { allowed: true, reason: 'Institutional Record' };
  }

  // Otherwise, another faculty created this record
  return {
    allowed: false,
    creatorName: student.createdBy || student.creatorEmail || 'another faculty member',
    reason: `Created by ${student.createdBy || student.creatorEmail}. Only the concerned faculty or Admin can modify this entry.`,
  };
}
