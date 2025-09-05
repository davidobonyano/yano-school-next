import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { data: terms, error } = await supabaseService
      .from('academic_terms')
      .select(`
        id, 
        name, 
        session_id,
        is_active, 
        start_date, 
        end_date,
        academic_sessions(name)
      `)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching terms:', error);
      return NextResponse.json({ error: 'Failed to fetch terms' }, { status: 500 });
    }

    return NextResponse.json({ terms });
  } catch (error) {
    console.error('Error in terms API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


