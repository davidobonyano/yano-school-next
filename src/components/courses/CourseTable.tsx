'use client';

import { useMemo, useState } from 'react';
import { Course } from '@/types/courses';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Edit, Eye, Trash2, MoreHorizontal } from 'lucide-react';
import { CourseForm } from './CourseForm';

interface CourseTableProps {
  courses: Course[];
  isLoading: boolean;
  userRole: 'admin' | 'teacher' | 'student';
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
  onView: (course: Course) => void;
  filters?: any;
  className?: string;
  onBulkDeleteComplete?: () => void;
}

export function CourseTable({ 
  courses, 
  isLoading, 
  userRole, 
  onEdit, 
  onDelete, 
  onView, 
  filters,
  className = '',
  onBulkDeleteComplete
}: CourseTableProps) {
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const canManageCourses = userRole === 'admin';

  // Group courses by class level for better organization
  const groupedCourses = courses.reduce((acc, course) => {
    const level = course.class_level;
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(course);
    return acc;
  }, {} as Record<string, Course[]>);

  // Sort class levels in logical order
  const sortedLevels = Object.keys(groupedCourses).sort((a, b) => {
    const levelOrder = ['KG1', 'KG2', 'NUR1', 'NUR2', 'PRI1', 'PRI2', 'PRI3', 'PRI4', 'PRI5', 'PRI6', 'JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
    return levelOrder.indexOf(a) - levelOrder.indexOf(b);
  });

  const handleEdit = (course: Course) => {
    if (canManageCourses) {
      setEditingCourse(course);
    }
  };

  const handleDelete = (course: Course) => {
    if (canManageCourses) {
      setDeletingCourse(course);
    }
  };

  const handleView = (course: Course) => {
    setViewingCourse(course);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Core': return 'bg-blue-100 text-blue-800';
      case 'Elective': return 'bg-green-100 text-green-800';
      case 'Trade': return 'bg-orange-100 text-orange-800';
      case 'Language': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTermColor = (term: string) => {
    switch (term) {
      case '1st': return 'bg-red-100 text-red-800';
      case '2nd': return 'bg-yellow-100 text-yellow-800';
      case '3rd': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const allCourseIds = useMemo(() => courses.map(c => c.id), [courses]);
  const allSelected = selectedIds.size > 0 && selectedIds.size === allCourseIds.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < allCourseIds.length;

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      if (prev.size === allCourseIds.length) return new Set();
      return new Set(allCourseIds);
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      const resp = await fetch('/api/courses/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseIds: ids })
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error((data as any).error || 'Failed to delete courses');
      }
      setSelectedIds(new Set());
      setConfirmBulkDelete(false);
      onBulkDeleteComplete?.();
    } catch (e) {
      console.error(e);
      setConfirmBulkDelete(false);
      // Optional: surface a toast if available
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading courses...</p>
      </div>
    );
  }

  if (courses.length === 0) {
    const hasActiveFilters = filters && Object.keys(filters).some(key => 
      key !== 'page' && key !== 'limit' && filters[key]
    );
    
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📚</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
        <p className="text-gray-600">
          {hasActiveFilters 
            ? 'Try adjusting your filters or search terms. The current filters might be too restrictive.'
            : 'No courses are available yet'
          }
        </p>
        {hasActiveFilters && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-blue-800">
              <strong>Current filters:</strong> {Object.entries(filters)
                .filter(([key, value]) => key !== 'page' && key !== 'limit' && value)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')
              }
            </p>
            <p className="text-sm text-blue-700 mt-2">
              Try removing some filters to see more results.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {canManageCourses && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              aria-label="Select all courses"
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = someSelected as any; }}
              onChange={toggleSelectAll}
            />
            <span className="text-sm text-gray-600">Select all</span>
          </div>
          <div>
            <Button
              variant="destructive"
              disabled={selectedIds.size === 0}
              onClick={() => setConfirmBulkDelete(true)}
            >
              Delete Selected ({selectedIds.size})
            </Button>
          </div>
        </div>
      )}
      {/* Summary Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Course Summary</h2>
            <p className="text-sm text-gray-600">Total: {courses.length} courses across {sortedLevels.length} class levels</p>
          </div>
          <div className="flex gap-4">
            {sortedLevels.slice(0, 4).map((level) => (
              <div key={level} className="text-center">
                <div className="text-lg font-bold text-blue-600">{groupedCourses[level].length}</div>
                <div className="text-xs text-gray-600">{level}</div>
              </div>
            ))}
            {sortedLevels.length > 4 && (
              <div className="text-center">
                <div className="text-lg font-bold text-gray-600">+{sortedLevels.length - 4}</div>
                <div className="text-xs text-gray-600">More</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tables grouped by class level */}
      <div className="space-y-6">
        {sortedLevels.map((level) => (
          <div key={level} className="border rounded-lg overflow-hidden">
            <div className="bg-blue-50 px-4 py-3 border-b">
              <h3 className="text-lg font-semibold text-blue-900">{level} - {groupedCourses[level].length} Courses</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  {canManageCourses && <TableHead className="font-semibold w-10"></TableHead>}
                  <TableHead className="font-semibold">Code</TableHead>
                  <TableHead className="font-semibold">Course Name</TableHead>
                  <TableHead className="font-semibold">Term</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Stream</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  {canManageCourses && <TableHead className="font-semibold text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedCourses[level].map((course) => (
                  <TableRow key={course.id} className="hover:bg-gray-50">
                    {canManageCourses && (
                      <TableCell className="w-10">
                        <input
                          type="checkbox"
                          aria-label={`Select ${course.name}`}
                          checked={selectedIds.has(course.id)}
                          onChange={() => toggleSelectOne(course.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-mono text-sm">
                      <Badge variant="outline" className="font-mono">
                        {course.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell>
                      <Badge className={getTermColor(course.term)}>
                        {course.term} Term
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(course.category)}>
                        {course.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {course.stream ? (
                        <Badge variant="outline">{course.stream}</Badge>
                      ) : (
                        <span className="text-gray-500 text-sm">General</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-gray-600 truncate" title={course.description}>
                        {course.description}
                      </p>
                    </TableCell>
                    {canManageCourses && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(course)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(course)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(course)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </div>

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
                  <Badge className={getCategoryColor(viewingCourse.category)}>
                    {viewingCourse.category}
                  </Badge>
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
                  onEdit(editingCourse);
                }
                setEditingCourse(null);
              }}
              onCancel={() => setEditingCourse(null)}
            />
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
            <AlertDialogAction 
              onClick={() => {
                if (deletingCourse) {
                  onDelete(deletingCourse);
                  setDeletingCourse(null);
                }
              }} 
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Courses</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} selected course(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 