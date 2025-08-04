// src/lib/mock-data.ts

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  image?: string;  // Optional image property
  class?: string; 
   status?: 'active' | 'processing';  // Optional class property
  // Add any other properties you need
}

export const mockUsers = {
  students: [
    { id: 'stu123', email: 'student1@example.com', password: 'pass123', name: 'Student One', class: 'Form 4 Science', image: '/avatars/student1.jpg' },
    { id: 'stu456', email: 'student2@example.com', password: 'pass456', name: 'Student Two', class: 'Form 4 Science', image: '/avatars/student2.jpg' },
  ] as User[],

  teachers: [
    { id: 'teach123', email: 'teacher1@example.com', password: 'teach123', name: 'Teacher One' },
    { id: 'teach456', email: 'teacher2@example.com', password: 'teach456', name: 'Teacher Two' },
  ] as User[],

  admins: [
    { email: 'admin@example.com', password: 'admin123', name: 'Admin User' },
  ] as User[],
};
export const mockCourses = [
  {
    id: 'MATH101',
    name: 'Mathematics',
    code: 'MATH 101',
    instructor: 'Dr. Smith',
    credits: 4,
    status: 'Active'
  },
  {
    id: 'SCI202',
    name: 'Advanced Science',
    code: 'SCI 202',
    instructor: 'Prof. Johnson',
    credits: 3,
    status: 'Active'
  },
  // Add more courses as needed
];
// In your mock-data.ts
export const mockAssignments = [
  {
    id: 'ASG001',
    course: 'Mathematics',
    title: 'Algebra Problems',
    dueDate: '2023-11-20',
    status: 'Pending'
  },
  {
    id: 'ASG002',
    course: 'Science',
    title: 'Lab Report',
    dueDate: '2023-11-22',
    status: 'Completed'
  },
];

// ... rest of your mock data
// Add this to your existing mockUsers export
  // ... rest of your mock data
;
// Add this to your existing mockUsers export