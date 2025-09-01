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
import { BookOpen, Loader2, AlertCircle } from 'lucide-react';
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
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available courses for the student's class level
  useEffect(() => {
    if (isOpen && currentContext) {
      fetchAvailableCourses();
    }
  }, [isOpen, currentContext, userClassLevel, userStream]);

  const fetchAvailableCourses = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        class_level: userClassLevel,
        ...(userStream && { stream: userStream }),
        session_id: currentContext!.session_id,
        term_id: currentContext!.term_id,
        page: '1',
        limit: '100'
      });

      const response = await fetch(`/api/courses?${params}`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      console.error('Failed to load available courses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !currentContext) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/courses/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: selectedCourse,
          class_level: userClassLevel,
          stream: userStream,
          term: currentContext.term_name,
          session: currentContext.session_name,
          student_id: studentId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to register for course');
      }

      console.log('Course registration submitted successfully!');
      onSuccess();
      onClose();
      setSelectedCourse('');
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
      setSelectedCourse('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Register for Course
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course">Select Course</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Loading courses..." : "Choose a course"} />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{course.name}</span>
                      <span className="text-sm text-gray-500">{course.code}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {courses.length === 0 && !isLoading && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                No courses available for your class level
              </div>
            )}
          </div>

          {selectedCourse && (
            <Card className="p-3">
              <CardDescription className="text-sm">
                <strong>Course Details:</strong>
                <br />
                {courses.find(c => c.id === selectedCourse)?.description || 'No description available'}
              </CardDescription>
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-4">
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
              disabled={!selectedCourse || isSubmitting || courses.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Register for Course'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
