import { 
  Course, 
  CourseCreate, 
  CourseUpdate, 
  CourseFilters,
  COURSE_CATEGORIES,
  COURSE_TERMS,
  CLASS_LEVELS,
  ACADEMIC_STREAMS,
  SUBJECT_TYPES
} from '@/types/courses';

// Course validation utilities
export function validateCourse(course: CourseCreate): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!course.name?.trim()) {
    errors.push('Course name is required');
  }

  if (!course.code?.trim()) {
    errors.push('Course code is required');
  } else if (!/^[A-Z]{3}[0-9]{3}$/.test(course.code)) {
    errors.push('Course code must follow format: XXX000 (3 letters + 3 numbers)');
  }

  if (!course.class_level) {
    errors.push('Class level is required');
  } else if (!CLASS_LEVELS.includes(course.class_level as any)) {
    errors.push(`Invalid class level. Must be one of: ${CLASS_LEVELS.join(', ')}`);
  }

  if (!course.term) {
    errors.push('Term is required');
  } else if (!COURSE_TERMS.includes(course.term as any)) {
    errors.push(`Invalid term. Must be one of: ${COURSE_TERMS.join(', ')}`);
  }

  if (!course.category) {
    errors.push('Category is required');
  } else if (!COURSE_CATEGORIES.includes(course.category as any)) {
    errors.push(`Invalid category. Must be one of: ${COURSE_CATEGORIES.join(', ')}`);
  }

  if (course.stream && !ACADEMIC_STREAMS.includes(course.stream as any)) {
    errors.push(`Invalid stream. Must be one of: ${ACADEMIC_STREAMS.join(', ')}`);
  }

  if (course.subject_type && !SUBJECT_TYPES.includes(course.subject_type as any)) {
    errors.push(`Invalid subject type. Must be one of: ${SUBJECT_TYPES.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Course filtering utilities
export function filterCourses(courses: Course[], filters: CourseFilters): Course[] {
  return courses.filter(course => {
    if (filters.class_level && course.class_level !== filters.class_level) {
      return false;
    }
    if (filters.term && course.term !== filters.term) {
      return false;
    }
    if (filters.category && course.category !== filters.category) {
      return false;
    }
    if (filters.stream && course.stream !== filters.stream) {
      return false;
    }
    if (filters.subject_type && course.subject_type !== filters.subject_type) {
      return false;
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        course.name.toLowerCase().includes(searchLower) ||
        course.code.toLowerCase().includes(searchLower) ||
        course.description.toLowerCase().includes(searchLower);
      if (!matchesSearch) {
        return false;
      }
    }
    return true;
  });
}

// Course sorting utilities
export function sortCourses(courses: Course[], sortBy: keyof Course = 'name', order: 'asc' | 'desc' = 'asc'): Course[] {
  return [...courses].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle null/undefined values
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';

    // Convert to string for comparison
    const aStr = String(aValue);
    const bStr = String(bValue);

    if (order === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });
}

// Course grouping utilities
export function groupCoursesByClass(courses: Course[]): Record<string, Course[]> {
  return courses.reduce((groups, course) => {
    const level = course.class_level;
    if (!groups[level]) {
      groups[level] = [];
    }
    groups[level].push(course);
    return groups;
  }, {} as Record<string, Course[]>);
}

export function groupCoursesByTerm(courses: Course[]): Record<string, Course[]> {
  return courses.reduce((groups, course) => {
    const term = course.term;
    if (!groups[term]) {
      groups[term] = [];
    }
    groups[term].push(course);
    return groups;
  }, {} as Record<string, Course[]>);
}

export function groupCoursesByCategory(courses: Course[]): Record<string, Course[]> {
  return courses.reduce((groups, course) => {
    const category = course.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(course);
    return groups;
  }, {} as Record<string, Course[]>);
}

export function groupCoursesByStream(courses: Course[]): Record<string, Course[]> {
  return courses.reduce((groups, course) => {
    const stream = course.stream || 'General';
    if (!groups[stream]) {
      groups[stream] = [];
    }
    groups[stream].push(course);
    return groups;
  }, {} as Record<string, Course[]>);
}

// Course statistics utilities
export function getCourseStatistics(courses: Course[]) {
  const stats = {
    total: courses.length,
    byClassLevel: {} as Record<string, number>,
    byTerm: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    byStream: {} as Record<string, number>,
    bySubjectType: {} as Record<string, number>
  };

  courses.forEach(course => {
    // Count by class level
    stats.byClassLevel[course.class_level] = (stats.byClassLevel[course.class_level] || 0) + 1;
    
    // Count by term
    stats.byTerm[course.term] = (stats.byTerm[course.term] || 0) + 1;
    
    // Count by category
    stats.byCategory[course.category] = (stats.byCategory[course.category] || 0) + 1;
    
    // Count by stream
    const stream = course.stream || 'General';
    stats.byStream[stream] = (stats.byStream[stream] || 0) + 1;
    
    // Count by subject type
    if (course.subject_type) {
      stats.bySubjectType[course.subject_type] = (stats.bySubjectType[course.subject_type] || 0) + 1;
    }
  });

  return stats;
}

// Course code generation utilities
export function generateCourseCode(subject: string, classLevel: string, term: string): string {
  // Extract first 3 letters from subject
  const subjectCode = subject.substring(0, 3).toUpperCase();
  
  // Map class levels to numbers
  const classLevelMap: Record<string, string> = {
    'NUR1': '00', 'NUR2': '00',
    'KG1': '01', 'KG2': '02',
    'PRI1': '11', 'PRI2': '12', 'PRI3': '13', 'PRI4': '14', 'PRI5': '15', 'PRI6': '16',
    'JSS1': '21', 'JSS2': '22', 'JSS3': '23',
    'SS1': '31', 'SS2': '32', 'SS3': '33'
  };
  
  // Map terms to numbers
  const termMap: Record<string, string> = {
    '1st': '1', '2nd': '2', '3rd': '3'
  };
  
  const classCode = classLevelMap[classLevel] || '00';
  const termCode = termMap[term] || '0';
  
  return `${subjectCode}${classCode}${termCode}`;
}

// Course search utilities
export function searchCourses(courses: Course[], searchTerm: string): Course[] {
  if (!searchTerm.trim()) return courses;
  
  const term = searchTerm.toLowerCase();
  return courses.filter(course => 
    course.name.toLowerCase().includes(term) ||
    course.code.toLowerCase().includes(term) ||
    course.description.toLowerCase().includes(term) ||
    course.class_level.toLowerCase().includes(term) ||
    course.term.toLowerCase().includes(term) ||
    course.category.toLowerCase().includes(term) ||
    (course.stream && course.stream.toLowerCase().includes(term)) ||
    (course.subject_type && course.subject_type.toLowerCase().includes(term))
  );
}

// Course export utilities
export function exportCoursesToCSV(courses: Course[]): string {
  const headers = ['Code', 'Name', 'Description', 'Class Level', 'Term', 'Category', 'Stream', 'Subject Type'];
  const rows = courses.map(course => [
    course.code,
    course.name,
    course.description,
    course.class_level,
    course.term,
    course.category,
    course.stream || '',
    course.subject_type || ''
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
  
  return csvContent;
}

// Course import utilities
export function parseCSVToCourses(csvContent: string): CourseCreate[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  const courses: CourseCreate[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
    const course: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index] || '';
      switch (header.toLowerCase()) {
        case 'code':
          course.code = value;
          break;
        case 'name':
          course.name = value;
          break;
        case 'description':
          course.description = value;
          break;
        case 'class level':
          course.class_level = value;
          break;
        case 'term':
          course.term = value;
          break;
        case 'category':
          course.category = value;
          break;
        case 'stream':
          course.stream = value || null;
          break;
        case 'subject type':
          course.subject_type = value || null;
          break;
      }
    });
    
    if (course.code && course.name && course.class_level && course.term && course.category) {
      courses.push(course as CourseCreate);
    }
  }
  
  return courses;
}




