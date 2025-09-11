"use client";
import { CourseDashboard } from '@/components/courses/CourseDashboard';
import { CourseRegistrationManager } from '@/components/courses/CourseRegistrationManager';
import { StudentRegistrationSummary } from '@/components/StudentRegistrationSummary';
import { useEffect, useState } from 'react';
import { getStudentSession } from '@/lib/student-session';

export default function StudentCoursesPage() {
  const [mounted, setMounted] = useState(false);
  const [studentId, setStudentId] = useState<string | undefined>(undefined);
  const [studentClassLevel, setStudentClassLevel] = useState<string | undefined>(undefined);
  const [studentStream, setStudentStream] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
    const s = getStudentSession();
    setStudentId(s?.student_id);
    setStudentClassLevel(s?.class_level || undefined);
    setStudentStream(s?.stream || undefined);
  }, []);

  if (!mounted) return null;

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Registration Summary */}
      <StudentRegistrationSummary
        studentId={studentId}
        className="max-w-none"
      />
      
      {/* Course Registration Section */}
      <CourseRegistrationManager 
        userRole="student"
        userId={studentId}
        userClassLevel={studentClassLevel}
        userStream={studentStream}
        className="max-w-none"
      />
      
      {/* Course Viewing Section */}
      <CourseDashboard 
        userRole="student"
        userClassLevel={studentClassLevel}
        userStream={studentStream}
        className="max-w-none"
      />
    </div>
  );
}