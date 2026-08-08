import { Student, Mentor, WhatsAppTemplate } from '../types';

export const INITIAL_STUDENTS: Student[] = [];

export const INITIAL_MENTORS: Mentor[] = [];

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 't1',
    title: 'Low Attendance Alert (<75%)',
    category: 'Attendance Warning',
    templateText: 'Respected Parent/Guardian, This is an official notice from Digboi College. Your ward {studentName} ({rollNo}) has an attendance of {attendance}%, which is below the mandatory 75% cutoff. Kindly ensure regular class attendance. Contact Faculty Mentor: {mentorName} ({mentorPhone}).',
  },
  {
    id: 't2',
    title: 'Sessional Marks & Diagnostic Update',
    category: 'Academic Progress',
    templateText: 'Dear Parent/Guardian, The sessional examination results for {studentName} ({rollNo}) have been evaluated. Overall GPA: {gpa}/10. Please review the attached diagnostic report from Digboi College.',
  },
  {
    id: 't3',
    title: 'Saturday Remedial Class Invitation',
    category: 'Intervention Notice',
    templateText: 'Dear Parent/Guardian, {studentName} ({rollNo}) is invited for a special Saturday remedial tutorial session at Digboi College to strengthen conceptual understanding. Please ensure punctuality.',
  },
  {
    id: 't4',
    title: 'Praise & Outstanding Performance',
    category: 'Commendation',
    templateText: 'Dear Parent/Guardian, We are pleased to inform you that {studentName} ({rollNo}) has demonstrated outstanding academic performance with {attendance}% attendance and GPA {gpa}/10 in Digboi College.',
  },
];

