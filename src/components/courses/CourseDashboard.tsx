'use client';

import { useState, useEffect } from 'react';
import { Course, CourseCreate, CourseUpdate, CourseFilters } from '@/types/courses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, BookOpen, Users, Calendar, BarChart3, Download, Upload, Trash2, Edit, Eye } from 'lucide-react';
import { CourseTable } from './CourseTable';
import { CourseFiltersComponent } from './CourseFilters';
import { CourseForm } from './CourseForm';
import { exportCoursesToCSV, parseCSVToCourses } from '@/lib/courseUtils';

interface CourseDashboardProps {
  userRole: 'admin' | 'teacher' | 'student';
  userClassLevel?: string;
  userStream?: string;
  className?: string;
}

export function CourseDashboard({ 
  userRole, 
  userClassLevel, 
  userStream, 
  className = '' 
}: CourseDashboardProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [filters, setFilters] = useState<CourseFilters>({
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  
  const [stats, setStats] = useState({
    total: 0,
    byClassLevel: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    byTerm: {} as Record<string, number>
  });

  // Fetch courses based on user role and filters
  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      let url = '/api/courses?';
      
      // Add filters to URL
      Object.entries(filters).forEach(([key, value]) => {
        if (value) url += `${key}=${encodeURIComponent(value)}&`;
      });

      // For students, filter by their class level and stream
      if (userRole === 'student' && userClassLevel) {
        console.log('Student filtering by class level:', userClassLevel, 'stream:', userStream);
        url += `class_level=${userClassLevel}&`;
        if (userStream) {
          url += `stream=${userStream}&`;
        }
      }

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        const receivedCourses = data.courses || [];
        console.log('Received courses:', receivedCourses.length, 'Class levels:', 
          receivedCourses.map((c: Course) => c.class_level).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
        );
        setCourses(receivedCourses);
        setFilteredCourses(receivedCourses);
        setPagination(data.pagination || pagination);
      } else {
        console.error('Failed to fetch courses:', data.error);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch course statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/courses/management?action=curriculum_overview');
      const data = await response.json();
      
      if (response.ok) {
        setStats({
          total: data.total_courses || 0,
          byClassLevel: data.by_class_level || {},
          byCategory: data.by_category || {},
          byTerm: data.by_term || {}
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [filters, userRole, userClassLevel, userStream]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Handle course creation
  const handleCreateCourse = async (courseData: CourseCreate) => {
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData)
      });

      if (response.ok) {
        setShowCreateForm(false);
        fetchCourses();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Failed to create course: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course');
    }
  };

  // Handle course update
  const handleUpdateCourse = async (courseData: CourseUpdate) => {
    try {
      const response = await fetch('/api/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData)
      });

      if (response.ok) {
        setEditingCourse(null);
        fetchCourses();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Failed to update course: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Failed to update course');
    }
  };

  // Handle course deletion
  const handleDeleteCourse = async () => {
    if (!deletingCourse) return;

    try {
      const response = await fetch(`/api/courses?id=${deletingCourse.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setDeletingCourse(null);
        fetchCourses();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Failed to delete course: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course');
    }
  };

  // Handle export
  const handleExport = () => {
    const csvContent = exportCoursesToCSV(filteredCourses);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'courses.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handle import
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        const courses = parseCSVToCourses(text);
        
        try {
          const response = await fetch('/api/courses/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courses, operation: 'create' })
          });

          if (response.ok) {
            fetchCourses();
            fetchStats();
            alert(`Successfully imported ${courses.length} courses`);
          } else {
            const error = await response.json();
            alert(`Failed to import courses: ${error.error}`);
          }
        } catch (error) {
          console.error('Error importing courses:', error);
          alert('Failed to import courses');
        }
      }
    };
    input.click();
  };

  const canManageCourses = userRole === 'admin';
  const canViewAllCourses = userRole === 'admin' || userRole === 'teacher';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-600 mt-1">
            {userRole === 'admin' && 'Manage the complete curriculum and course catalog'}
            {userRole === 'teacher' && 'View and reference all available courses'}
            {userRole === 'student' && `View courses for ${userClassLevel}${userStream ? ` ${userStream}` : ''}`}
          </p>
        </div>
        
        {canManageCourses && (
          <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Course
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      {canViewAllCourses && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Class Levels</p>
                  <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.byClassLevel).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Terms</p>
                  <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.byTerm).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.byCategory).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <CourseFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        onExport={canManageCourses ? handleExport : undefined}
        onImport={canManageCourses ? handleImport : undefined}
        showAdvancedFilters={canViewAllCourses}
        studentMode={userRole === 'student'}
      />

      {/* Courses Table */}
      <CourseTable
        courses={filteredCourses}
        isLoading={isLoading}
        userRole={userRole}
        onEdit={(course) => setEditingCourse(course)}
        onDelete={(course) => setDeletingCourse(course)}
        onView={(course) => setViewingCourse(course)}
        filters={filters}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page! - 1 }))}
            disabled={pagination.page <= 1}
          >
            Previous
          </Button>
          
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page! + 1 }))}
            disabled={pagination.page >= pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create Course Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
          </DialogHeader>
          <CourseForm
            mode="create"
            onSubmit={(courseData) => {
              if ('id' in courseData) {
                handleUpdateCourse(courseData);
              } else {
                handleCreateCourse(courseData);
              }
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={!!editingCourse} onOpenChange={() => setEditingCourse(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          {editingCourse && (
            <CourseForm
              course={editingCourse}
              mode="edit"
              onSubmit={(courseData) => {
                if ('id' in courseData) {
                  handleUpdateCourse(courseData);
                } else {
                  handleCreateCourse(courseData);
                }
              }}
              onCancel={() => setEditingCourse(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Course Dialog */}
      <Dialog open={!!viewingCourse} onOpenChange={() => setViewingCourse(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Course Details</DialogTitle>
          </DialogHeader>
          {viewingCourse && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Course Code</label>
                  <p className="text-lg font-mono">{viewingCourse.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Course Name</label>
                  <p className="text-lg">{viewingCourse.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Class Level</label>
                  <p className="text-lg">{viewingCourse.class_level}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Term</label>
                  <p className="text-lg">{viewingCourse.term} Term</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <Badge variant="secondary">{viewingCourse.category}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Stream</label>
                  <p className="text-lg">{viewingCourse.stream || 'General'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-700 mt-1">{viewingCourse.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCourse} onOpenChange={() => setDeletingCourse(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCourse?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCourse} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
