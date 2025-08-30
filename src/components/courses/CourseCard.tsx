'use client';

import { Course } from '@/types/courses';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Calendar, GraduationCap, Users, FileText } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  onEdit?: (course: Course) => void;
  onDelete?: (course: Course) => void;
  onView?: (course: Course) => void;
}

export function CourseCard({ 
  course, 
  variant = 'default', 
  showActions = false,
  onEdit,
  onDelete,
  onView
}: CourseCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Core': return 'bg-blue-100 text-blue-800';
      case 'Elective': return 'bg-green-100 text-green-800';
      case 'Trade': return 'bg-orange-100 text-orange-800';
      case 'Language': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStreamColor = (stream?: string | null) => {
    if (!stream) return 'bg-gray-100 text-gray-800';
    switch (stream) {
      case 'Science': return 'bg-red-100 text-red-800';
      case 'Arts': return 'bg-pink-100 text-pink-800';
      case 'Commercial': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (variant === 'compact') {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView?.(course)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">{course.code}</span>
              </div>
              <h3 className="font-semibold text-sm truncate">{course.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {course.class_level}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {course.term}
                </Badge>
              </div>
            </div>
            <Badge className={getCategoryColor(course.category)}>
              {course.category}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">{course.code}</CardTitle>
              </div>
              <CardTitle className="text-xl mb-2">{course.name}</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {course.description}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2">
              <Badge className={getCategoryColor(course.category)}>
                {course.category}
              </Badge>
              {course.stream && (
                <Badge className={getStreamColor(course.stream)}>
                  {course.stream}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">{course.class_level}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">{course.term} Term</span>
            </div>
            {course.subject_type && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{course.subject_type}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {course.stream || 'General'}
              </span>
            </div>
          </div>
          
          {showActions && (
            <div className="flex gap-2 pt-3 border-t">
              <button
                onClick={() => onView?.(course)}
                className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
              >
                View Details
              </button>
              {onEdit && (
                <button
                  onClick={() => onEdit(course)}
                  className="px-3 py-2 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(course)}
                  className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">{course.code}</span>
            </div>
            <CardTitle className="text-base mb-2">{course.name}</CardTitle>
            <CardDescription className="text-sm line-clamp-2">
              {course.description}
            </CardDescription>
          </div>
          <Badge className={getCategoryColor(course.category)}>
            {course.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span>{course.class_level}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{course.term}</span>
          </div>
        </div>
        
        {course.stream && (
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-gray-500" />
            <Badge variant="outline" className={getStreamColor(course.stream)}>
              {course.stream}
            </Badge>
          </div>
        )}
        
        {showActions && (
          <div className="flex gap-2 pt-3 border-t">
            <button
              onClick={() => onView?.(course)}
              className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
            >
              View
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(course)}
                className="px-3 py-2 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(course)}
                className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}




