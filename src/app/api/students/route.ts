import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: students, error } = await supabase
      .from('school_students')
      .select('*')
      .order('full_name');

    if (error) {
      console.error('Error fetching students:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ students: students || [] });
  } catch (err: unknown) {
    console.error('Unexpected error fetching students:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
