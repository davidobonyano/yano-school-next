import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'email and password required' }, { status: 400 });
    }

    // Prefer authenticating against Exam portal Supabase Auth if configured
    const examUrl = process.env.EXAM_SUPABASE_URL as string | undefined;
    const examAnon = process.env.EXAM_SUPABASE_ANON_KEY as string | undefined;

    let authOk = false;
    if (examUrl && examAnon) {
      try {
        const examClient = createClient(examUrl, examAnon);
        const { data: authData, error: authErr } = await examClient.auth.signInWithPassword({ email, password });
        if (!authErr && authData?.user) {
          authOk = true;
        }
      } catch {
        authOk = false;
      }
    }

    // Fallback: local teacher_credentials verification
    if (!authOk) {
      const { data: teacherForCred, error: teacherErr2 } = await supabase
        .from('teachers')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (teacherErr2 || !teacherForCred) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      const { data: cred, error: credErr } = await supabase
        .from('teacher_credentials')
        .select('password_hash')
        .eq('teacher_id', teacherForCred.id)
        .maybeSingle();
      if (credErr || !cred) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      const ok = await bcrypt.compare(password, cred.password_hash);
      if (!ok) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
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

    return NextResponse.json({ success: true, teacher: { id: teacher.id, full_name: teacher.full_name, email: teacher.email } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}


