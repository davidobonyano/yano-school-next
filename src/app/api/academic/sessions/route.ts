import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { data: sessions, error } = await supabaseService
      .from('academic_sessions')
      .select('id, name, is_active, start_date, end_date')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error in sessions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}





