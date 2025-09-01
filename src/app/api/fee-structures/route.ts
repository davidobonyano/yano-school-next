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

    let query = supabase
      .from('fee_structures')
      .select(`
        *,
        academic_sessions(name as session_name),
        academic_terms(name as term_name)
      `);

    // Apply filters
    if (session && session !== 'all') {
      query = query.eq('academic_sessions.name', session);
    }
    if (term && term !== 'all') {
      query = query.eq('academic_terms.name', term);
    }
    if (classLevel && classLevel !== 'all') {
      query = query.eq('class_level', classLevel);
    }
    if (search) {
      query = query.or(`description.ilike.%${search}%,fee_type.ilike.%${search}%`);
    }

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
