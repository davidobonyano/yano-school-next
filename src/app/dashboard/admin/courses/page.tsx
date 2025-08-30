import { CourseDashboard } from '@/components/courses/CourseDashboard';
import { CourseRegistrationManager } from '@/components/courses/CourseRegistrationManager';
import { AcademicContextDisplay } from '@/components/academic-context/AcademicContextDisplay';

export default function AdminCoursesPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Academic Context Management */}
      <AcademicContextDisplay 
        showControls={true}
        className="max-w-none"
      />
      
      
      
      {/* Course Registration Management Section */}
      <CourseRegistrationManager 
        userRole="admin"
        className="max-w-none"
      />
      
      {/* Course Management Section */}
      <CourseDashboard 
        userRole="admin"
        className="max-w-none"
      />
    </div>
  );
}




