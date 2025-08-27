import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: teachers, error } = await supabase
      .from('teachers')
      .select('*')
      .order('full_name');

    if (error) {
      console.error('Error fetching teachers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ teachers: teachers || [] });
  } catch (err: any) {
    console.error('Unexpected error fetching teachers:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
