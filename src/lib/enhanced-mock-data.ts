// Enhanced mock data for student dashboard functionality

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  image?: string;
  class?: string; 
  status?: 'active' | 'processing';
}

export interface Course {
  id: string;
  name: string;
  code: string;
  instructor: string;
  credits: number;
  status: 'Active' | 'Inactive';
  description?: string;
  semester: string;
}

export interface Grade {
  id: string;
  studentId: string;
  courseId: string;
  courseName: string;
  term: string;
  session: string;
  assignment?: number;
  test?: number;
  exam?: number;
  total: number;
  grade: string;
  position?: number;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  description: string;
  date: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  term: string;
  session: string;
}

export interface ScheduleItem {
  id: string;
  day: string;
  time: string;
  subject: string;
  teacher: string;
  room: string;
}

export interface Exam {
  id: string;
  courseId: string;
  courseName: string;
  date: string;
  time: string;
  duration: number;
  venue: string;
  status: 'Upcoming' | 'Active' | 'Completed';
}

// Mock Users
export const mockUsers = {
  students: [
    { id: 'stu123', email: 'student1@example.com', password: 'pass123', name: 'Student One', class: 'Form 4 Science', image: '/avatars/student1.jpg' },
    { id: 'stu456', email: 'student2@example.com', password: 'pass456', name: 'Student Two', class: 'Form 4 Science', image: '/avatars/student2.jpg' },
  ] as User[],

  teachers: [
    { id: 'teach123', email: 'teacher1@example.com', password: 'teachpass', name: 'Teacher One' },
    { id: 'teach456', email: 'teacher2@example.com', password: 'teachpass', name: 'Teacher Two' },
  ] as User[],

  admins: [
    { id: 'admin123', email: 'admin@example.com', password: 'adminpass', name: 'Admin User' },
  ] as User[],
};

// Mock Courses
export const mockCourses: Course[] = [
  {
    id: 'MATH101',
    name: 'Mathematics',
    code: 'MATH 101',
    instructor: 'Dr. Smith',
    credits: 4,
    status: 'Active',
    description: 'Advanced mathematics covering algebra, calculus, and geometry',
    semester: '2023/2024 First Term'
  },
  {
    id: 'ENG101',
    name: 'English Language',
    code: 'ENG 101',
    instructor: 'Mrs. Johnson',
    credits: 3,
    status: 'Active',
    description: 'Comprehensive English language and literature course',
    semester: '2023/2024 First Term'
  },
  {
    id: 'PHY101',
    name: 'Physics',
    code: 'PHY 101',
    instructor: 'Dr. Brown',
    credits: 4,
    status: 'Active',
    description: 'Introduction to physics principles and applications',
    semester: '2023/2024 First Term'
  },
  {
    id: 'CHEM101',
    name: 'Chemistry',
    code: 'CHEM 101',
    instructor: 'Prof. Wilson',
    credits: 4,
    status: 'Active',
    description: 'Basic chemistry concepts and laboratory work',
    semester: '2023/2024 First Term'
  },
  {
    id: 'BIO101',
    name: 'Biology',
    code: 'BIO 101',
    instructor: 'Dr. Davis',
    credits: 3,
    status: 'Active',
    description: 'Introduction to biological sciences',
    semester: '2023/2024 First Term'
  }
];

// Mock Grades
export const mockGrades: Grade[] = [
  {
    id: 'grade1',
    studentId: 'stu123',
    courseId: 'MATH101',
    courseName: 'Mathematics',
    term: 'First Term',
    session: '2023/2024',
    assignment: 18,
    test: 28,
    exam: 65,
    total: 89,
    grade: 'A',
    position: 2
  },
  {
    id: 'grade2',
    studentId: 'stu123',
    courseId: 'ENG101',
    courseName: 'English Language',
    term: 'First Term',
    session: '2023/2024',
    assignment: 16,
    test: 24,
    exam: 58,
    total: 82,
    grade: 'B+',
    position: 5
  },
  {
    id: 'grade3',
    studentId: 'stu123',
    courseId: 'PHY101',
    courseName: 'Physics',
    term: 'First Term',
    session: '2023/2024',
    assignment: 19,
    test: 27,
    exam: 68,
    total: 92,
    grade: 'A+',
    position: 1
  },
  {
    id: 'grade4',
    studentId: 'stu123',
    courseId: 'CHEM101',
    courseName: 'Chemistry',
    term: 'First Term',
    session: '2023/2024',
    assignment: 17,
    test: 25,
    exam: 62,
    total: 85,
    grade: 'A-',
    position: 3
  },
  {
    id: 'grade5',
    studentId: 'stu123',
    courseId: 'BIO101',
    courseName: 'Biology',
    term: 'First Term',
    session: '2023/2024',
    assignment: 15,
    test: 23,
    exam: 59,
    total: 79,
    grade: 'B+',
    position: 4
  }
];

// Mock Payments
export const mockPayments: Payment[] = [
  {
    id: 'pay1',
    studentId: 'stu123',
    amount: 150000,
    description: 'School Fees - First Term',
    date: '2023-09-15',
    status: 'Paid',
    term: 'First Term',
    session: '2023/2024'
  },
  {
    id: 'pay2',
    studentId: 'stu123',
    amount: 25000,
    description: 'Examination Fees',
    date: '2023-10-01',
    status: 'Paid',
    term: 'First Term',
    session: '2023/2024'
  },
  {
    id: 'pay3',
    studentId: 'stu123',
    amount: 15000,
    description: 'Laboratory Equipment Fee',
    date: '2023-09-20',
    status: 'Paid',
    term: 'First Term',
    session: '2023/2024'
  },
  {
    id: 'pay4',
    studentId: 'stu123',
    amount: 150000,
    description: 'School Fees - Second Term',
    date: '2024-01-15',
    status: 'Pending',
    term: 'Second Term',
    session: '2023/2024'
  }
];

// Mock Schedule
export const mockSchedule: ScheduleItem[] = [
  // Monday
  { id: 'sch1', day: 'Monday', time: '8:00-8:45', subject: 'Mathematics', teacher: 'Dr. Smith', room: 'Room 101' },
  { id: 'sch2', day: 'Monday', time: '8:45-9:30', subject: 'English Language', teacher: 'Mrs. Johnson', room: 'Room 102' },
  { id: 'sch3', day: 'Monday', time: '9:30-10:15', subject: 'Physics', teacher: 'Dr. Brown', room: 'Lab 1' },
  { id: 'sch4', day: 'Monday', time: '10:15-10:30', subject: 'Break', teacher: '-', room: '-' },
  { id: 'sch5', day: 'Monday', time: '10:30-11:15', subject: 'Chemistry', teacher: 'Prof. Wilson', room: 'Lab 2' },
  { id: 'sch6', day: 'Monday', time: '11:15-12:00', subject: 'Biology', teacher: 'Dr. Davis', room: 'Room 103' },

  // Tuesday
  { id: 'sch7', day: 'Tuesday', time: '8:00-8:45', subject: 'Physics', teacher: 'Dr. Brown', room: 'Lab 1' },
  { id: 'sch8', day: 'Tuesday', time: '8:45-9:30', subject: 'Mathematics', teacher: 'Dr. Smith', room: 'Room 101' },
  { id: 'sch9', day: 'Tuesday', time: '9:30-10:15', subject: 'Biology', teacher: 'Dr. Davis', room: 'Room 103' },
  { id: 'sch10', day: 'Tuesday', time: '10:15-10:30', subject: 'Break', teacher: '-', room: '-' },
  { id: 'sch11', day: 'Tuesday', time: '10:30-11:15', subject: 'English Language', teacher: 'Mrs. Johnson', room: 'Room 102' },
  { id: 'sch12', day: 'Tuesday', time: '11:15-12:00', subject: 'Chemistry', teacher: 'Prof. Wilson', room: 'Lab 2' },

  // Wednesday
  { id: 'sch13', day: 'Wednesday', time: '8:00-8:45', subject: 'Chemistry', teacher: 'Prof. Wilson', room: 'Lab 2' },
  { id: 'sch14', day: 'Wednesday', time: '8:45-9:30', subject: 'Biology', teacher: 'Dr. Davis', room: 'Room 103' },
  { id: 'sch15', day: 'Wednesday', time: '9:30-10:15', subject: 'Mathematics', teacher: 'Dr. Smith', room: 'Room 101' },
  { id: 'sch16', day: 'Wednesday', time: '10:15-10:30', subject: 'Break', teacher: '-', room: '-' },
  { id: 'sch17', day: 'Wednesday', time: '10:30-11:15', subject: 'Physics', teacher: 'Dr. Brown', room: 'Lab 1' },
  { id: 'sch18', day: 'Wednesday', time: '11:15-12:00', subject: 'English Language', teacher: 'Mrs. Johnson', room: 'Room 102' },

  // Thursday
  { id: 'sch19', day: 'Thursday', time: '8:00-8:45', subject: 'English Language', teacher: 'Mrs. Johnson', room: 'Room 102' },
  { id: 'sch20', day: 'Thursday', time: '8:45-9:30', subject: 'Physics', teacher: 'Dr. Brown', room: 'Lab 1' },
  { id: 'sch21', day: 'Thursday', time: '9:30-10:15', subject: 'Chemistry', teacher: 'Prof. Wilson', room: 'Lab 2' },
  { id: 'sch22', day: 'Thursday', time: '10:15-10:30', subject: 'Break', teacher: '-', room: '-' },
  { id: 'sch23', day: 'Thursday', time: '10:30-11:15', subject: 'Biology', teacher: 'Dr. Davis', room: 'Room 103' },
  { id: 'sch24', day: 'Thursday', time: '11:15-12:00', subject: 'Mathematics', teacher: 'Dr. Smith', room: 'Room 101' },

  // Friday
  { id: 'sch25', day: 'Friday', time: '8:00-8:45', subject: 'Biology', teacher: 'Dr. Davis', room: 'Room 103' },
  { id: 'sch26', day: 'Friday', time: '8:45-9:30', subject: 'Chemistry', teacher: 'Prof. Wilson', room: 'Lab 2' },
  { id: 'sch27', day: 'Friday', time: '9:30-10:15', subject: 'English Language', teacher: 'Mrs. Johnson', room: 'Room 102' },
  { id: 'sch28', day: 'Friday', time: '10:15-10:30', subject: 'Break', teacher: '-', room: '-' },
  { id: 'sch29', day: 'Friday', time: '10:30-11:15', subject: 'Mathematics', teacher: 'Dr. Smith', room: 'Room 101' },
  { id: 'sch30', day: 'Friday', time: '11:15-12:00', subject: 'Physics', teacher: 'Dr. Brown', room: 'Lab 1' }
];

// Mock Exams
export const mockExams: Exam[] = [
  {
    id: 'exam1',
    courseId: 'MATH101',
    courseName: 'Mathematics',
    date: '2024-01-15',
    time: '9:00 AM',
    duration: 120,
    venue: 'Exam Hall A',
    status: 'Upcoming'
  },
  {
    id: 'exam2',
    courseId: 'ENG101',
    courseName: 'English Language',
    date: '2024-01-17',
    time: '9:00 AM',
    duration: 90,
    venue: 'Exam Hall B',
    status: 'Upcoming'
  },
  {
    id: 'exam3',
    courseId: 'PHY101',
    courseName: 'Physics',
    date: '2024-01-19',
    time: '9:00 AM',
    duration: 120,
    venue: 'Exam Hall A',
    status: 'Upcoming'
  },
  {
    id: 'exam4',
    courseId: 'CHEM101',
    courseName: 'Chemistry',
    date: '2024-01-22',
    time: '9:00 AM',
    duration: 120,
    venue: 'Exam Hall C',
    status: 'Upcoming'
  },
  {
    id: 'exam5',
    courseId: 'BIO101',
    courseName: 'Biology',
    date: '2024-01-24',
    time: '9:00 AM',
    duration: 90,
    venue: 'Exam Hall B',
    status: 'Upcoming'
  }
];

// Utility functions
export const getStudentCourses = () => {
  return mockCourses.filter(course => course.status === 'Active');
};

export const getStudentGrades = (studentId: string, term?: string, session?: string) => {
  let grades = mockGrades.filter(grade => grade.studentId === studentId);
  if (term) grades = grades.filter(grade => grade.term === term);
  if (session) grades = grades.filter(grade => grade.session === session);
  return grades;
};

export const getStudentPayments = (studentId: string) => {
  return mockPayments.filter(payment => payment.studentId === studentId);
};

export const getStudentSchedule = () => {
  return mockSchedule;
};

export const getUpcomingExams = () => {
  return mockExams.filter(exam => exam.status === 'Upcoming');
};

export const generateExamLink = (studentId: string, examId: string) => {
  return `/exam/start?studentId=${studentId}&examId=${examId}&sessionId=${Date.now()}`;
};
