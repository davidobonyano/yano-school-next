"use client";
import { CourseDashboard } from '@/components/courses/CourseDashboard';
import { CourseRegistrationManager } from '@/components/courses/CourseRegistrationManager';
import { useEffect, useState } from 'react';
import { getStudentSession } from '@/lib/student-session';

export default function StudentCoursesPage() {
  const [studentId, setStudentId] = useState<string | undefined>(undefined);
  const [studentClassLevel, setStudentClassLevel] = useState<string | undefined>(undefined);
  const [studentStream, setStudentStream] = useState<string | undefined>(undefined);

  useEffect(() => {
    const s = getStudentSession();
    console.log('Student session data:', s);
    setStudentId(s?.student_id);
    setStudentClassLevel(s?.class_level || undefined);
    setStudentStream(s?.stream || undefined);
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
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