// Course Management Types

export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  class_level: string;
  term: string;
  category: string;
  stream?: string | null;
  subject_type?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseCreate {
  code: string;
  name: string;
  description: string;
  class_level: string;
  term: string;
  category: string;
  stream?: string | null;
  subject_type?: string | null;
}

export interface CourseUpdate {
  id: string;
  code?: string;
  name?: string;
  description?: string;
  class_level?: string;
  term?: string;
  category?: string;
  stream?: string | null;
  subject_type?: string | null;
}

export interface CourseFilters {
  class_level?: string;
  term?: string;
  category?: string;
  stream?: string;
  subject_type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CourseResponse {
  courses: Course[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BulkCourseOperation {
  courses: CourseCreate[] | CourseUpdate[];
  operation: 'create' | 'update';
}

export interface BulkCourseResponse {
  message: string;
  courses?: Course[];
  updated?: Course[];
  errors?: Array<{
    course: CourseCreate | CourseUpdate;
    error: string;
  }>;
}

export interface CourseManagementQuery {
  action: 'by_class_stream' | 'curriculum_overview' | 'subject_types' | 'class_levels' | 'terms' | 'categories';
  class_level?: string;
  stream?: string;
  term?: string;
}

export interface CourseByClassStream {
  class_level: string;
  stream?: string | null;
  term?: string | null;
  courses: Course[];
  count: number;
}

export interface CurriculumOverview {
  total_courses: number;
  by_class_level: Record<string, number>;
  by_category: Record<string, number>;
  by_subject_type: Record<string, number>;
  by_stream: Record<string, number>;
}

export interface CourseManagementAction {
  action: 'regenerate_codes' | 'assign_streams' | 'update_subject_types';
  data: any;
}

// Constants for course management
export const COURSE_CATEGORIES = [
  'Core',
  'Elective',
  'Trade',
  'Language'
] as const;

export const COURSE_TERMS = [
  '1st',
  '2nd',
  '3rd'
] as const;

export const CLASS_LEVELS = [
  'KG1',
  'KG2',
  'NUR1',
  'NUR2',
  'PRI1',
  'PRI2',
  'PRI3',
  'PRI4',
  'PRI5',
  'PRI6',
  'JSS1',
  'JSS2',
  'JSS3',
  'SS1',
  'SS2',
  'SS3'
] as const;

export const ACADEMIC_STREAMS = [
  'Science',
  'Arts',
  'Commercial'
] as const;

export const SUBJECT_TYPES = [
  'Language',
  'Mathematics',
  'Science',
  'Social Studies',
  'Arts',
  'Physical Education',
  'Agriculture',
  'Trade',
  'Reasoning',
  'Technology'
] as const;

// Type guards
export function isValidCourseCategory(category: string): category is typeof COURSE_CATEGORIES[number] {
  return COURSE_CATEGORIES.includes(category as any);
}

export function isValidCourseTerm(term: string): term is typeof COURSE_TERMS[number] {
  return COURSE_TERMS.includes(term as any);
}

export function isValidClassLevel(level: string): level is typeof CLASS_LEVELS[number] {
  return CLASS_LEVELS.includes(level as any);
}

export function isValidAcademicStream(stream: string): stream is typeof ACADEMIC_STREAMS[number] {
  return ACADEMIC_STREAMS.includes(stream as any);
}

export function isValidSubjectType(type: string): type is typeof SUBJECT_TYPES[number] {
  return SUBJECT_TYPES.includes(type as any);
}

// Student Course Registration Types
export interface StudentCourseRegistration {
  id: string;
  student_id: string;
  course_id: string;
  class_level: string;
  stream?: string | null;
  term: string;
  session: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  registered_at: string;
  updated_at: string;
  
  // Joined fields from related tables
  student_name?: string;
  course_name?: string;
  course_code?: string;
  teacher_name?: string;
}

export interface CourseRegistrationCreate {
  course_id: string;
  class_level: string;
  stream?: string | null;
  term: string;
  session: string;
}

export interface CourseRegistrationUpdate {
  id?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
}

export interface CourseRegistrationFilters {
  student_id?: string;
  course_id?: string;
  class_level?: string;
  stream?: string;
  term?: string;
  session?: string;
  status?: 'pending' | 'approved' | 'rejected';
  page?: number;
  limit?: number;
}

export interface CourseRegistrationResponse {
  registrations: StudentCourseRegistration[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BulkRegistrationOperation {
  registrations: CourseRegistrationCreate[];
  operation: 'create' | 'update';
}

export interface BulkRegistrationResponse {
  message: string;
  registrations?: StudentCourseRegistration[];
  updated?: StudentCourseRegistration[];
  errors?: Array<{
    registration: CourseRegistrationCreate;
    error: string;
  }>;
}




