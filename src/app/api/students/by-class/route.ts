import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classLevel = searchParams.get('class_level');
    const stream = searchParams.get('stream');

    let query = supabase
      .from('school_students')
      .select('student_id, full_name, class_level, stream, is_active')
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (classLevel && classLevel !== 'All') {
      query = query.eq('class_level', classLevel);
    }

    if (stream && stream !== 'All') {
      query = query.eq('stream', stream);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ students: data || [] });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}



