import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface User {
  id: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  first_name?: string;
  last_name?: string;
  phone?: string;
  student_id?: string;
  grade?: string;
  section?: string;
  date_of_birth?: string;
  parent_name?: string;
  parent_phone?: string;
  address?: string;
  teacher_id?: string;
  department?: string;
  subjects?: string[];
  qualification?: string;
  experience?: number;
  is_admin?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  subject: string;
  duration: number;
  total_marks: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  max_score: number;
  time_taken: number;
  submitted_at: string;
}