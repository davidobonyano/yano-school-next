'use client';

import { useState, useEffect } from 'react';
import { Course } from '@/types/courses';
import { useAcademicContext } from '@/lib/academic-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Loader2, AlertCircle, Undo2 } from 'lucide-react';
import { useNotifications } from '@/components/ui/notifications';
// import { toast } from 'sonner';

interface CourseRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userClassLevel: string;
  userStream?: string;
  studentId?: string;
}

export function CourseRegistrationForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  userClassLevel, 
  userStream,
  studentId
}: CourseRegistrationFormProps) {
  const { currentContext } = useAcademicContext();
  const { showErrorToast, showSuccessToast } = useNotifications();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredCourseIdToRegistrationId, setRegisteredCourseIdToRegistrationId] = useState<Record<string, string>>({});
  const [isDeregisteringId, setIsDeregisteringId] = useState<string | null>(null);

  // Fetch available courses for the student's class level
  useEffect(() => {
    if (isOpen && currentContext) {
      fetchAvailableCourses();
    }
  }, [isOpen, currentContext, userClassLevel, userStream]);

  const fetchAvailableCourses = async () => {
    setIsLoading(true);
    try {
      // First attempt: include term if available
      const paramsWithTerm = new URLSearchParams();
      paramsWithTerm.append('class_level', userClassLevel);
      if (userStream) paramsWithTerm.append('stream', userStream);
      if (currentContext?.term_name) paramsWithTerm.append('term', currentContext.term_name);
      paramsWithTerm.append('page', '1');
      paramsWithTerm.append('limit', '100');

      let response = await fetch(`/api/courses?${paramsWithTerm}`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      let data = await response.json();

      // Fallback: if empty and term was applied, retry without term filter
      if ((data.courses?.length ?? 0) === 0 && currentContext?.term_name) {
        const paramsNoTerm = new URLSearchParams();
        paramsNoTerm.append('class_level', userClassLevel);
        if (userStream) paramsNoTerm.append('stream', userStream);
        paramsNoTerm.append('page', '1');
        paramsNoTerm.append('limit', '100');

        response = await fetch(`/api/courses?${paramsNoTerm}`);
        if (!response.ok) throw new Error('Failed to fetch courses');
        data = await response.json();
      }

      setCourses(data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      console.error('Failed to load available courses');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch student's existing registrations for current term/session
  const fetchExistingRegistrations = async () => {
    if (!studentId || !currentContext) return;
    try {
      const params = new URLSearchParams();
      params.append('student_id', studentId);
      params.append('term', currentContext.term_name);
      params.append('session', currentContext.session_name);
      // Fetch all registrations (pending, approved, rejected) to show proper state
      const resp = await fetch(`/api/courses/registrations?${params}`);
      if (!resp.ok) return;
      const data = await resp.json();
      const map: Record<string, string> = {};
      (data.registrations || []).forEach((r: any) => {
        // Only show as "registered" if pending or approved (not rejected)
        if (r.course_id && r.id && (r.status === 'pending' || r.status === 'approved')) {
          map[r.course_id as string] = r.id as string;
        }
      });
      setRegisteredCourseIdToRegistrationId(map);
    } catch (e) {
      console.error('Failed to fetch existing registrations', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchExistingRegistrations();
    }
  }, [isOpen, studentId, currentContext?.term_name, currentContext?.session_name]);

  const handleDeregister = async (courseId: string) => {
    const registrationId = registeredCourseIdToRegistrationId[courseId];
    if (!registrationId) return;
    setIsDeregisteringId(registrationId);
    try {
      const resp = await fetch(`/api/courses/registrations?id=${registrationId}`, { method: 'DELETE' });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        showErrorToast(data.error || 'Failed to deregister');
        return;
      }
      // Refresh both lists
      await Promise.all([fetchExistingRegistrations(), fetchAvailableCourses()]);
      // Remove from current selection if present
      setSelectedCourseIds(prev => prev.filter(id => id !== courseId));
    } catch (e) {
      console.error('Error deregistering course', e);
    } finally {
      setIsDeregisteringId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCourseIds.length === 0 || !currentContext) return;
    if (!studentId) {
      showErrorToast('Unable to submit registration: missing student ID. Please sign in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const results = await Promise.all(
        selectedCourseIds.map(async (courseId) => {
          const response = await fetch('/api/courses/registrations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              course_id: courseId,
              class_level: userClassLevel,
              stream: userStream,
              term: currentContext.term_name,
              session: currentContext.session_name,
              student_id: studentId
            })
          });
          const ok = response.ok;
          const data = await response.json().catch(() => ({ error: 'Unknown error' }));
          return { ok, data, courseId };
        })
      );

      const successes = results.filter(r => r.ok).length;
      const failures = results.filter(r => !r.ok);

      if (failures.length > 0) {
        console.warn('Some registrations failed:', failures);
        const failedDetails = failures.map(f => {
          const course = courses.find(c => c.id === f.courseId);
          const errorMessage = f?.data?.error || 'Failed';
          return `${course?.code || f.courseId}: ${errorMessage}`;
        }).join('\n');
        showErrorToast(`Some registrations failed:\n${failedDetails}`);
      }

      if (successes > 0) {
        console.log(`Successfully registered ${successes} course(s).`);
        showSuccessToast(`Successfully registered ${successes} course(s).`);
      }

      onSuccess();
      onClose();
      setSelectedCourseIds([]);
    } catch (error) {
      console.error('Error registering for course:', error);
      console.error(error instanceof Error ? error.message : 'Failed to register for course');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setSelectedCourseIds([]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Register for Course
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Courses</CardTitle>
              <CardDescription>Select one or more courses below and click Register</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading courses...
                </div>
              ) : courses.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertCircle className="h-4 w-4" /> No courses available for your class level
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto border rounded-md">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-3 w-10">
                          <input
                            type="checkbox"
                            aria-label="Select all"
                            checked={selectedCourseIds.length > 0 && selectedCourseIds.length === courses.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCourseIds(courses.map(c => c.id));
                              } else {
                                setSelectedCourseIds([]);
                              }
                            }}
                          />
                        </th>
                        <th className="p-3">Code</th>
                        <th className="p-3">Course Name</th>
                        <th className="p-3">Term</th>
                        <th className="p-3">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => {
                        const checked = selectedCourseIds.includes(course.id);
                        const isRegistered = Boolean(registeredCourseIdToRegistrationId[course.id]);
                        return (
                          <tr key={course.id} className={`border-t hover:bg-gray-50 ${isRegistered ? 'bg-green-50' : ''}`}>
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={isRegistered}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCourseIds(prev => Array.from(new Set([...prev, course.id])));
                                  } else {
                                    setSelectedCourseIds(prev => prev.filter(id => id !== course.id));
                                  }
                                }}
                              />
                            </td>
                            <td className="p-3 font-mono text-xs">{course.code}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className={isRegistered ? 'text-green-700 font-medium' : ''}>{course.name}</span>
                                {isRegistered && (
                                  <>
                                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                                      Registered
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleDeregister(course.id)}
                                      className="inline-flex items-center px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50"
                                      disabled={isDeregisteringId === registeredCourseIdToRegistrationId[course.id] || isSubmitting}
                                      title="Deregister from this course"
                                    >
                                      <Undo2 className="h-3 w-3 mr-1" /> Deregister
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="p-3">{course.term}</td>
                            <td className="p-3">{course.category}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between items-center gap-2 pt-2">
            <div className="text-sm text-gray-600">
              {selectedCourseIds.length} selected
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={selectedCourseIds.length === 0 || isSubmitting || courses.length === 0 || !studentId}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Register Selected'
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
