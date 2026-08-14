export type Role = 'educator' | 'mentor' | 'admin';

export type Department = 
  | 'Physics' 
  | 'Chemistry' 
  | 'Mathematics' 
  | 'Botany' 
  | 'Zoology' 
  | 'Computer Science' 
  | 'Commerce' 
  | 'English' 
  | 'Assamese' 
  | 'Economics' 
  | 'Political Science' 
  | 'Philosophy'
  | 'Bengali'
  | 'Education'
  | 'Electronic'
  | 'Geography'
  | 'Hindi'
  | 'History'
  | 'ITEP (Arts)'
  | 'ITEP (Science)'
  | 'Nepali'
  | 'Rural Development'
  | 'Tea Garden Management (TGM)'
  | 'Tourism and Hospitality Management (THM)';

export const ALL_DEPARTMENTS: Department[] = [
  'Assamese',
  'Bengali',
  'Botany',
  'Chemistry',
  'Commerce',
  'Computer Science',
  'Economics',
  'Education',
  'Electronic',
  'English',
  'Geography',
  'Hindi',
  'History',
  'ITEP (Arts)',
  'ITEP (Science)',
  'Mathematics',
  'Nepali',
  'Philosophy',
  'Physics',
  'Political Science',
  'Rural Development',
  'Tea Garden Management (TGM)',
  'Tourism and Hospitality Management (THM)',
  'Zoology',
];

export type CourseCategory = 'Core' | 'Major' | 'Minor' | 'MDC' | 'SEC' | 'AEC' | 'VAC';

export interface SubjectMarks {
  subjectName: string;
  courseCategory?: CourseCategory;
  semester?: number; // Semester 1 to 8
  sessional1?: number; // Out of 10
  sessional2?: number; // Out of 10
  assignmentSeminarOthers?: number; // Out of 20
  internalMarks?: number; // Total out of 40 (sessional1 + sessional2 + assignmentSeminarOthers)
  semesterMarks?: number; // Out of 80 or 100
  attendancePercent?: number;
  enteredBy?: string; // Educator or Mentor name
  teacherEmail?: string; // Educator or Mentor email
  lastUpdated?: number;
}

export type PerformanceCategory = 
  | 'Critical Attention' 
  | 'Needs Improvement' 
  | 'Good' 
  | 'Outstanding';

export interface Student {
  id: string;
  enrollmentNo?: string; // Unique enrolment no. assigned to student by college
  rollNo: string;
  name: string;
  department: Department;
  program: string;
  semester: number;
  overallAttendance: number;
  overallGpa: number;
  category: PerformanceCategory;
  subjects: SubjectMarks[];
  mentorId?: string;
  mentorName?: string;
  guardianName?: string;
  guardianPhone?: string;
  email?: string;
  creatorEmail?: string;
  createdBy?: string;
  parentName?: string;
  parentPhone?: string;
  dob?: string;
  photoUrl?: string;
  supportCategory?: string;
  courseType?: 'FYUGP' | 'PG' | 'Diploma';
  lastModified?: number; // Epoch timestamp in milliseconds for cross-device conflict resolution
}

export interface Mentor {
  id: string;
  name: string;
  department: Department;
  email: string;
  phone: string;
  assignedMenteeIds: string[];
  isPreloaded?: boolean;
  designation?: string;
  lastModified?: number;
}

export interface TeacherUpdateLog {
  id: string;
  timestamp: string;
  teacherName: string;
  subject: string;
  updateType: 'sessional_marks' | 'attendance' | 'assignment' | 'general';
  description: string;
  studentIds: string[];
  isRead?: boolean;
  readByMentor?: boolean;
}

export interface FacultyLoginRecord {
  id: string;
  email: string;
  phone: string;
  role: Role;
  timestamp: string;
  status: 'Authorized' | 'Pending' | 'Blocked';
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  studentName: string;
  rollNo: string;
  department: string;
  semester: number;
  score: number;
  totalMarks: number;
  percentage: number;
  submittedAt: string;
  answersDetail?: Record<string | number, { selectedOption: number; isCorrect: boolean; questionText: string }>;
}

export interface SavedQuiz {
  id: string;
  title: string;
  department: string;
  topic: string;
  difficulty: string;
  timeLimitMins: number;
  targetTotalMarks: number;
  questions: {
    id: string | number;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    marks: number;
  }[];
  createdBy: string;
  mentorEmail?: string;
  createdAt: string;
  submissions?: QuizSubmission[];
}

export interface WhatsAppTemplate {
  id: string;
  title: string;
  category: string;
  templateText: string;
  messageBody?: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  category: string;
  department: string;
  fileType: string;
  description: string;
  author: string;
  uploadedByMentorId: string;
  dateAdded: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
}

