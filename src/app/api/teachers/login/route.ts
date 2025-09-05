import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createTeacherSessionToken, setTeacherSessionCookie } from '@/lib/teacher-session';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'email and password required' }, { status: 400 });
    }

    console.log('Attempting authentication for:', email);

    // Try to authenticate using the existing Supabase configuration
    // This will use the same Supabase instance that your exam portal uses
    let authOk = false;
    let authError = null;
    let supabaseToken = null;

    try {
      console.log('Attempting Supabase auth for:', email);
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      console.log('Supabase auth result:', { 
        success: !authErr, 
        error: authErr?.message,
        userId: authData?.user?.id 
      });
      if (!authErr && authData?.user && authData.session) {
        authOk = true;
        supabaseToken = authData.session.access_token;
        console.log('Supabase authentication successful for:', email);
      } else {
        authError = authErr?.message || 'Supabase authentication failed';
      }
    } catch (err: any) {
      console.log('Supabase auth exception:', err?.message);
      authError = err?.message || 'Supabase connection error';
      authOk = false;
    }
    
    console.log('Auth result:', { authOk, email, authError });

    // Fallback: local teacher_credentials verification
    if (!authOk) {
      console.log('Falling back to local credentials for:', email);
      const { data: teacherForCred, error: teacherErr2 } = await supabase
        .from('teachers')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (teacherErr2 || !teacherForCred) {
        console.log('Local teacher not found:', email);
        return NextResponse.json({ 
          error: 'Invalid credentials',
          details: 'Teacher not found in database. Please ensure you have an account.',
          suggestion: 'Contact your administrator to create an account.'
        }, { status: 401 });
      }
      
      const { data: cred, error: credErr } = await supabase
        .from('teacher_credentials')
        .select('password_hash')
        .eq('teacher_id', teacherForCred.id)
        .maybeSingle();
      if (credErr || !cred) {
        console.log('No local credentials found for:', email);
        return NextResponse.json({ 
          error: 'Invalid credentials',
          details: 'No password set for this teacher account.',
          suggestion: 'Use the set-password endpoint to set a password.',
          endpoint: '/api/teachers/set-password'
        }, { status: 401 });
      }
      
      const ok = await bcrypt.compare(password, cred.password_hash);
      if (!ok) {
        console.log('Local password mismatch for:', email);
        return NextResponse.json({ 
          error: 'Invalid credentials',
          details: 'Password does not match.',
          suggestion: 'Check your password or use the set-password endpoint to reset it.'
        }, { status: 401 });
      }
      console.log('Local auth successful for:', email);
      
      // For local auth, create a simple session token
      supabaseToken = btoa(JSON.stringify({ 
        teacherId: teacherForCred.id, 
        email, 
        timestamp: Date.now() 
      }));
    }

    // Ensure a teacher profile exists locally; create minimal one if missing
    let teacher = null as any;
    {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      teacher = data;
      if (!data) {
        console.log('Creating new teacher profile for:', email);
        const { data: inserted, error: insertErr } = await supabase
          .from('teachers')
          .insert({
            id: crypto.randomUUID(),
            full_name: email.split('@')[0],
            email,
            is_active: true,
          })
          .select('*')
          .maybeSingle();
        if (insertErr || !inserted) {
          return NextResponse.json({ error: 'Authenticated but failed to create profile' }, { status: 500 });
        }
        teacher = inserted;
      }
    }

    // Create session and set cookie
    const newSessionToken = await createTeacherSessionToken({ 
      teacherId: teacher.id, 
      email: teacher.email, 
      name: teacher.full_name 
    });
    await setTeacherSessionCookie(newSessionToken);

    return NextResponse.json({ 
      success: true, 
      teacher: { 
        id: teacher.id, 
        full_name: teacher.full_name, 
        email: teacher.email,
        school_name: teacher.school_name 
      },
      sessionToken: newSessionToken,
      authMethod: authOk ? 'supabase' : 'local'
    });
  } catch (err: any) {
    console.error('Teacher login error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}


