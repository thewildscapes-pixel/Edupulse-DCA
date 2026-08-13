import { Student, Role, Mentor, TeacherUpdateLog } from '../types';

export interface OwnershipCheckResult {
  allowed: boolean;
  reason?: string;
  creatorName?: string;
}

/**
 * Robust cross-device student matching utility.
 * Matches student records to a logged-in faculty member regardless of whether they logged in on Laptop or Mobile,
 * using email, phone number (last 10 digits), mentor ID, mentor/creator name, assigned mentee list, or subject entries.
 */
export function isStudentOfMentor(
  student: Student,
  mentor?: Partial<Mentor> | null,
  userEmail?: string,
  userPhone?: string,
  allMentors?: Mentor[]
): boolean {
  if (!student) return false;

  const normEmail = (userEmail || mentor?.email || '').trim().toLowerCase();
  const normPhone = (userPhone || mentor?.phone || '').replace(/\D/g, '').slice(-10);
  const normName = (mentor?.name || '').trim().toLowerCase();

  // Admin Master Access Override
  if (normEmail === 'thewildscapes@gmail.com' || normPhone.endsWith('9706375001')) {
    return true;
  }

  // 1. Direct Mentor ID or assigned list
  if (mentor?.id && student.mentorId === mentor.id) return true;
  if (mentor?.assignedMenteeIds && mentor.assignedMenteeIds.includes(student.id)) return true;

  // 2. Cross-mentor profile matching using allMentors registry
  if (allMentors && allMentors.length > 0) {
    const matchingMentors = allMentors.filter((m) => {
      const mEmail = (m.email || '').trim().toLowerCase();
      const mPhone = (m.phone || '').replace(/\D/g, '').slice(-10);
      return (
        (normEmail && mEmail && (mEmail === normEmail || mEmail.includes(normEmail) || normEmail.includes(mEmail))) ||
        (normPhone && mPhone && mPhone === normPhone) ||
        (mentor?.id && m.id === mentor.id)
      );
    });

    for (const m of matchingMentors) {
      if (student.mentorId === m.id) return true;
      if (m.assignedMenteeIds && m.assignedMenteeIds.includes(student.id)) return true;
      const mEmail = (m.email || '').trim().toLowerCase();
      const creatorEmail = (student.creatorEmail || '').trim().toLowerCase();
      if (mEmail && creatorEmail && (creatorEmail === mEmail || creatorEmail.includes(mEmail) || mEmail.includes(creatorEmail))) {
        return true;
      }
    }
  }

  // 3. Creator Email match (exact or partial string match)
  const creatorEmail = (student.creatorEmail || '').trim().toLowerCase();
  if (normEmail && creatorEmail) {
    if (creatorEmail === normEmail) return true;
    if (creatorEmail.includes(normEmail) || normEmail.includes(creatorEmail)) return true;
  }

  // 4. Creator Name or Mentor Name match
  const createdBy = (student.createdBy || '').trim().toLowerCase();
  const mentorName = (student.mentorName || '').trim().toLowerCase();
  if (normName && normName.length > 2) {
    if (createdBy === normName || mentorName === normName) return true;

    // Compare name keywords (e.g. "Deborshee" or "Gogoi") avoiding generic titles
    const cleanTokens = normName
      .replace(/\b(dr|prof|mr|mrs|ms|assistant|professor|associate)\b/g, '')
      .split(/\s+/)
      .filter((p) => p.length > 2);

    if (cleanTokens.some((token) => createdBy.includes(token) || mentorName.includes(token))) {
      return true;
    }
  }

  // 5. Phone match (last 10 digits)
  if (normPhone) {
    if (student.mentorId && student.mentorId.includes(normPhone)) return true;
    if (student.creatorEmail) {
      const creatorPhoneDigits = student.creatorEmail.replace(/\D/g, '').slice(-10);
      if (creatorPhoneDigits && creatorPhoneDigits === normPhone) return true;
    }
    if (student.guardianPhone) {
      const gPhone = student.guardianPhone.replace(/\D/g, '').slice(-10);
      if (gPhone && gPhone === normPhone) return true;
    }
  }

  // 6. Subject teacher match
  if (student.subjects && student.subjects.length > 0) {
    const isSubjectTeacher = student.subjects.some((sub) => {
      const subEmail = (sub.teacherEmail || '').trim().toLowerCase();
      const subEntered = (sub.enteredBy || '').trim().toLowerCase();
      return (
        (normEmail && subEmail && (subEmail === normEmail || subEmail.includes(normEmail) || normEmail.includes(subEmail))) ||
        (normName && subEntered && subEntered.includes(normName)) ||
        (normPhone && subEmail && subEmail.replace(/\D/g, '').slice(-10) === normPhone)
      );
    });
    if (isSubjectTeacher) return true;
  }

  return false;
}

/**
 * Checks if a student belongs to the logged-in Educator's subject roster.
 * Rule: Educator views only those students whose marks he/she has entered under various subjects,
 * or students created/managed by this educator across devices.
 */
export function isEducatorSubjectStudent(
  student: Student,
  userEmail: string,
  mentorName: string,
  teacherUpdates: TeacherUpdateLog[] = [],
  userPhone?: string,
  mentorObj?: Partial<Mentor> | null,
  allMentors?: Mentor[]
): boolean {
  if (mentorObj && isStudentOfMentor(student, mentorObj, userEmail, userPhone, allMentors)) {
    return true;
  }

  if (isStudentOfMentor(student, { name: mentorName, email: userEmail, phone: userPhone }, userEmail, userPhone, allMentors)) {
    return true;
  }

  const normEmail = (userEmail || '').trim().toLowerCase();
  const normName = (mentorName || '').trim().toLowerCase();

  // Logged in teacher updates by this educator for this student
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
 * 2. Faculty member can edit/delete records created by them or assigned as their mentee across devices.
 * 3. Records created by other faculty members cannot be edited or deleted by non-admin faculty.
 */
export function canEditStudent(
  student: Student,
  userEmail: string,
  userRole: Role,
  currentMentorId?: string,
  currentMentorObj?: Partial<Mentor> | null,
  userPhone?: string
): OwnershipCheckResult {
  // Admin has universal override privileges
  if (userRole === 'admin') {
    return { allowed: true, reason: 'Admin Privilege' };
  }

  if (currentMentorObj && isStudentOfMentor(student, currentMentorObj, userEmail, userPhone)) {
    return { allowed: true, reason: 'Assigned Mentee / Creator' };
  }

  const normalizedUserEmail = (userEmail || '').trim().toLowerCase();
  const creator = (student.creatorEmail || student.createdBy || '').trim().toLowerCase();

  // If student record was created by this faculty member
  if (creator && normalizedUserEmail && (creator === normalizedUserEmail || creator.includes(normalizedUserEmail))) {
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

