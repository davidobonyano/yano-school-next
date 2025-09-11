import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // Get distinct sessions from academic_sessions table
    const { data: sessionData, error: sessionError } = await supabase
      .from('academic_sessions')
      .select('name')
      .order('name', { ascending: false });

    if (sessionError) {
      console.error('Error fetching sessions:', sessionError);
    }

    // Get distinct terms from academic_terms table
    const { data: termData, error: termError } = await supabase
      .from('academic_terms')
      .select('name')
      .order('name', { ascending: true });

    if (termError) {
      console.error('Error fetching terms:', termError);
    }

    // Extract unique session and term names
    const sessions = [...new Set((sessionData || []).map(s => s.name))];
    const terms = [...new Set((termData || []).map(t => t.name))];

    return NextResponse.json({
      sessions,
      terms
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
