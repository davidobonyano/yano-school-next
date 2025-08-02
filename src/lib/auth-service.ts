import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AuthUser {
  id: string;
  user_id: string;
  role: 'student' | 'teacher' | 'admin';
  name: string;
  email?: string;
  student_id?: string;
  teacher_id?: string;
  admin_id?: string;
}

export interface LoginCredentials {
  id: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export class AuthService {
  // Login function for all user types
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { id, password, role } = credentials;
      
      // First, authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: `${id}@yano.school`, // Using ID as email prefix
        password: password,
      });

      if (authError) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Get user profile from the appropriate table based on role
      let userData;
      let profileError;

      switch (role) {
        case 'student':
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('student_id', id)
            .single();
          userData = studentData;
          profileError = studentError;
          break;

        case 'teacher':
          const { data: teacherData, error: teacherError } = await supabase
            .from('teachers')
            .select('*')
            .eq('teacher_id', id)
            .single();
          userData = teacherData;
          profileError = teacherError;
          break;

        case 'admin':
          const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('admin_id', id)
            .single();
          userData = adminData;
          profileError = adminError;
          break;
      }

      if (profileError || !userData) {
        return {
          success: false,
          error: 'User profile not found'
        };
      }

      const user: AuthUser = {
        id: userData.id,
        user_id: authData.user!.id,
        role: role,
        name: userData.name || userData.full_name,
        email: userData.email,
        student_id: role === 'student' ? userData.student_id : undefined,
        teacher_id: role === 'teacher' ? userData.teacher_id : undefined,
        admin_id: role === 'admin' ? userData.admin_id : undefined,
      };

      return {
        success: true,
        user
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }

  // Forgot password function
  static async forgotPassword(id: string, role: 'student' | 'teacher' | 'admin'): Promise<AuthResponse> {
    try {
      const email = `${id}@yano.school`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return {
          success: false,
          error: 'Failed to send reset email'
        };
      }

      return {
        success: true
      };

    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }

  // Logout function
  static async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      // Check all tables for user profile
      const [studentResult, teacherResult, adminResult] = await Promise.all([
        supabase.from('students').select('*').eq('user_id', user.id).single(),
        supabase.from('teachers').select('*').eq('user_id', user.id).single(),
        supabase.from('admins').select('*').eq('user_id', user.id).single(),
      ]);

      let userData;
      let role: 'student' | 'teacher' | 'admin';

      if (studentResult.data) {
        userData = studentResult.data;
        role = 'student';
      } else if (teacherResult.data) {
        userData = teacherResult.data;
        role = 'teacher';
      } else if (adminResult.data) {
        userData = adminResult.data;
        role = 'admin';
      } else {
        return null;
      }

      return {
        id: userData.id,
        user_id: user.id,
        role,
        name: userData.name || userData.full_name,
        email: userData.email,
        student_id: role === 'student' ? userData.student_id : undefined,
        teacher_id: role === 'teacher' ? userData.teacher_id : undefined,
        admin_id: role === 'admin' ? userData.admin_id : undefined,
      };

    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Check if user has specific permission
  static hasPermission(user: AuthUser | null, permission: string): boolean {
    if (!user) return false;

    const permissions = {
      student: ['view_courses', 'view_grades', 'submit_assignments'],
      teacher: ['view_courses', 'grade_assignments', 'manage_students', 'view_grades'],
      admin: ['manage_users', 'manage_courses', 'view_all', 'manage_system']
    };

    return permissions[user.role]?.includes(permission) || false;
  }

  // Get user dashboard URL based on role
  static getDashboardUrl(user: AuthUser): string {
    switch (user.role) {
      case 'student':
        return '/dashboard/student';
      case 'teacher':
        return '/dashboard/teacher';
      case 'admin':
        return '/dashboard/admin';
      default:
        return '/dashboard';
    }
  }
} 