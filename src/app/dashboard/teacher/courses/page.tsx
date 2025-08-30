'use client';

import { CourseDashboard } from '@/components/courses/CourseDashboard';
import { CourseRegistrationManager } from '@/components/courses/CourseRegistrationManager';

export default function TeacherCoursesPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Course Registration Management Section */}
      <CourseRegistrationManager 
        userRole="teacher"
        className="max-w-none"
      />
      
      {/* Course Viewing Section */}
      <CourseDashboard 
        userRole="teacher"
        className="max-w-none"
      />
    </div>
  );
}
