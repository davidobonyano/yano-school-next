'use client';

import { useState, useEffect } from 'react';
import { Course, CourseCreate, CourseUpdate } from '@/types/courses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Save, X, AlertCircle } from 'lucide-react';
import { COURSE_CATEGORIES, COURSE_TERMS, CLASS_LEVELS, ACADEMIC_STREAMS, SUBJECT_TYPES } from '@/types/courses';
import { validateCourse } from '@/lib/courseUtils';

interface CourseFormProps {
  course?: Course;
  mode: 'create' | 'edit';
  onSubmit: (course: CourseCreate | CourseUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

export function CourseForm({ 
  course, 
  mode, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  className = ''
}: CourseFormProps) {
  const [formData, setFormData] = useState<CourseCreate>({
    code: '',
    name: '',
    description: '',
    class_level: '',
    term: '',
    category: '',
    stream: null,
    subject_type: null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (course && mode === 'edit') {
      setFormData({
        code: course.code,
        name: course.name,
        description: course.description,
        class_level: course.class_level,
        term: course.term,
        category: course.category,
        stream: course.stream,
        subject_type: course.subject_type
      });
    }
  }, [course, mode]);

  const handleInputChange = (field: keyof CourseCreate, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const validation = validateCourse(formData);
    if (!validation.isValid) {
      const newErrors: Record<string, string> = {};
      validation.errors.forEach(error => {
        // Map error messages to form fields
        if (error.includes('name')) newErrors.name = error;
        else if (error.includes('code')) newErrors.code = error;
        else if (error.includes('class level')) newErrors.class_level = error;
        else if (error.includes('term')) newErrors.term = error;
        else if (error.includes('category')) newErrors.category = error;
        else if (error.includes('stream')) newErrors.stream = error;
        else if (error.includes('subject type')) newErrors.subject_type = error;
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (mode === 'edit' && course) {
      const updateData: CourseUpdate = {
        id: course.id,
        ...formData
      };
      onSubmit(updateData);
    } else {
      onSubmit(formData);
    }
  };

  const isStreamRequired = ['SS1', 'SS2', 'SS3'].includes(formData.class_level);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <div>
            <CardTitle>
              {mode === 'create' ? 'Create New Course' : 'Edit Course'}
            </CardTitle>
            <CardDescription>
              {mode === 'create' 
                ? 'Add a new course to the curriculum' 
                : 'Update course information'
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Course Code */}
              <div className="space-y-2">
                <Label htmlFor="code">Course Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="e.g., MTH101"
                  className={errors.code ? 'border-red-500' : ''}
                />
                {errors.code && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.code}
                  </div>
                )}
              </div>

              {/* Course Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Course Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Mathematics"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.name}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter course description..."
                rows={3}
              />
            </div>
          </div>

          {/* Academic Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Academic Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Class Level */}
              <div className="space-y-2">
                <Label htmlFor="class_level">Class Level *</Label>
                <Select
                  value={formData.class_level}
                  onValueChange={(value) => handleInputChange('class_level', value)}
                >
                  <SelectTrigger className={errors.class_level ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select class level" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.class_level && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.class_level}
                  </div>
                )}
              </div>

              {/* Term */}
              <div className="space-y-2">
                <Label htmlFor="term">Term *</Label>
                <Select
                  value={formData.term}
                  onValueChange={(value) => handleInputChange('term', value)}
                >
                  <SelectTrigger className={errors.term ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {COURSE_TERMS.map((term) => (
                      <SelectItem key={term} value={term}>
                        {term} Term
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.term && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.term}
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {COURSE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.category}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Advanced Options</h3>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </Button>
            </div>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                {/* Stream */}
                <div className="space-y-2">
                  <Label htmlFor="stream">
                    Academic Stream
                    {isStreamRequired && <Badge variant="outline" className="ml-2">Required</Badge>}
                  </Label>
                  <Select
                    value={formData.stream || 'General'}
                    onValueChange={(value) => handleInputChange('stream', value === 'General' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stream" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General (No Stream)</SelectItem>
                      {ACADEMIC_STREAMS.map((stream) => (
                        <SelectItem key={stream} value={stream}>
                          {stream}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isStreamRequired && !formData.stream && (
                    <div className="text-sm text-amber-600">
                      Stream is required for Senior Secondary classes
                    </div>
                  )}
                </div>

                {/* Subject Type */}
                <div className="space-y-2">
                  <Label htmlFor="subject_type">Subject Type</Label>
                  <Select
                    value={formData.subject_type || 'NotSpecified'}
                    onValueChange={(value) => handleInputChange('subject_type', value === 'NotSpecified' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NotSpecified">Not Specified</SelectItem>
                      {SUBJECT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : mode === 'create' ? 'Create Course' : 'Update Course'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}




