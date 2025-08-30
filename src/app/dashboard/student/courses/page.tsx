import { CourseDashboard } from '@/components/courses/CourseDashboard';
import { CourseRegistrationManager } from '@/components/courses/CourseRegistrationManager';

export default function StudentCoursesPage() {
  // In a real app, these would come from user authentication/context
  const mockStudentClass = 'JSS2'; // This would be dynamic based on logged-in student
  const mockStudentStream = undefined; // For JSS2, no stream yet
  const mockStudentId = 'mock-student-id'; // This would come from auth context

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Course Registration Section */}
      <CourseRegistrationManager 
        userRole="student"
        userId={mockStudentId}
        userClassLevel={mockStudentClass}
        userStream={mockStudentStream}
        className="max-w-none"
      />
      
      {/* Course Viewing Section */}
      <CourseDashboard 
        userRole="student"
        userClassLevel={mockStudentClass}
        userStream={mockStudentStream}
        className="max-w-none"
      />
    </div>
  );
}