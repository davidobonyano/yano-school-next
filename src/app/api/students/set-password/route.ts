import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/authz';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.error as Response;

    const { email, password, studentId } = await request.json();
    
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    if (!email && !studentId) {
      return NextResponse.json({ error: 'Either email or studentId is required' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update student password
    let updateQuery = supabase
      .from('school_students')
      .update({ password_hash: hashedPassword });

    if (email) {
      updateQuery = updateQuery.eq('email', email);
    } else {
      updateQuery = updateQuery.eq('student_id', studentId);
    }

    const { data, error } = await updateQuery
      .select('student_id, full_name, email')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Password updated successfully for ${data.full_name}`,
      student: data
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
