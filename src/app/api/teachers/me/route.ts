import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { readTeacherSession } from '@/lib/teacher-session';

export async function GET(request: Request) {
  try {
    // First try to get session from cookie (new method)
    const session = await readTeacherSession();
    
    if (session) {
      // Get teacher profile from the teachers table using session data
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', session.teacherId)
        .maybeSingle();

      if (teacherError) {
        console.error('Error fetching teacher profile:', teacherError);
        return NextResponse.json({ error: 'Failed to fetch teacher profile' }, { status: 500 });
      }

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }

      return NextResponse.json({ 
        success: true, 
        teacher: {
          id: teacher.id,
          full_name: teacher.full_name,
          email: teacher.email,
          school_name: teacher.school_name,
          is_active: teacher.is_active
        }
      });
    }

    // Fallback: Get the authorization header (old method for backward compatibility)
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    let teacherEmail = null;
    
    // Try to verify the token with Supabase first
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && user) {
        teacherEmail = user.email;
      }
    } catch (err) {
      // Supabase auth failed, try local token
      console.log('Supabase auth failed, trying local token');
    }
    
    // If Supabase auth failed, try to decode local token
    if (!teacherEmail) {
      try {
        const localToken = JSON.parse(atob(token));
        if (localToken.email && localToken.timestamp) {
          // Check if token is not too old (24 hours)
          const tokenAge = Date.now() - localToken.timestamp;
          if (tokenAge < 24 * 60 * 60 * 1000) {
            teacherEmail = localToken.email;
          }
        }
      } catch (err) {
        console.log('Failed to decode local token');
      }
    }
    
    if (!teacherEmail) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Get teacher profile from the teachers table
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('*')
      .eq('email', teacherEmail)
      .maybeSingle();

    if (teacherError) {
      console.error('Error fetching teacher profile:', teacherError);
      return NextResponse.json({ error: 'Failed to fetch teacher profile' }, { status: 500 });
    }

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      teacher: {
        id: teacher.id,
        name: teacher.full_name,
        email: teacher.email,
        schoolName: teacher.school_name,
        isActive: teacher.is_active
      }
    });

  } catch (err: any) {
    console.error('Error in /api/teachers/me:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
} 