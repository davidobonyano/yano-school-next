import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = searchParams.get('session');
    const term = searchParams.get('term');
    const classLevel = searchParams.get('class_level');
    const search = searchParams.get('search');

    const supabase = supabaseService;

    // Resolve session/term IDs if filtering by names
    let sessionId: string | null = null;
    let termId: string | null = null;

    if (session && session !== 'all') {
      const { data: s } = await supabase
        .from('academic_sessions')
        .select('id')
        .eq('name', session)
        .maybeSingle();
      sessionId = s?.id || null;
    }

    if (term && term !== 'all') {
      // If sessionId present, scope term lookup by it; otherwise lookup by name only
      let termQuery = supabase.from('academic_terms').select('id');
      termQuery = termQuery.eq('name', term);
      if (sessionId) termQuery = termQuery.eq('session_id', sessionId);
      const { data: t } = await termQuery.maybeSingle();
      termId = t?.id || null;
    }

    let query = supabase
      .from('fee_structures')
      .select('*');

    // Apply filters with fallback to legacy text columns when IDs are unavailable
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    } else if (session && session !== 'all') {
      query = query.eq('session', session);
    }
    if (termId) {
      query = query.eq('term_id', termId);
    } else if (term && term !== 'all') {
      query = query.eq('term', term);
    }
    if (classLevel && classLevel !== 'all') query = query.eq('class_level', classLevel);
    if (search) query = query.or(`description.ilike.%${search}%,fee_type.ilike.%${search}%`);

    const { data: feeStructures, error } = await query.order('class_level', { ascending: true });

    if (error) {
      console.error('Error fetching fee structures:', error);
      return NextResponse.json({ error: 'Failed to fetch fee structures' }, { status: 500 });
    }

    return NextResponse.json({ feeStructures });
  } catch (error) {
    console.error('Error in fee structures API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
