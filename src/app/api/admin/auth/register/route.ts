import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';
    const redirectTo = `${origin.replace(/\/$/, '')}/admin/reset`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'admin', name: name || '' },
        emailRedirectTo: redirectTo
      }
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({
      user: data.user,
      message: 'Registration initiated. Check email to confirm.'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}






