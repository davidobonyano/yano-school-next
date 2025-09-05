import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/authz';

export async function GET(request: Request) {
  try {
    // Check admin authorization
    const authCheck = await requireAdmin(request);
    if (!authCheck.ok) {
      return authCheck.error!;
    }

    // Fetch all academic sessions with their terms
    const { data: sessions, error: sessionsError } = await supabase
      .from('academic_sessions')
      .select(`
        id,
        name,
        start_date,
        end_date,
        is_active,
        created_at,
        updated_at
      `)
      .order('start_date', { ascending: false });

    if (sessionsError) {
      return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    }

    // Fetch terms for each session
    const sessionsWithTerms = await Promise.all(
      (sessions || []).map(async (session) => {
        const { data: terms, error: termsError } = await supabase
          .from('academic_terms')
          .select(`
            id,
            name,
            start_date,
            end_date,
            is_active
          `)
          .eq('session_id', session.id)
          .order('start_date', { ascending: true });

        if (termsError) {
          console.error('Error fetching terms for session:', session.id, termsError);
          return { ...session, terms: [] };
        }

        return { ...session, terms: terms || [] };
      })
    );

    return NextResponse.json({ 
      sessions: sessionsWithTerms,
      total: sessionsWithTerms.length 
    });

  } catch (err: any) {
    console.error('Error fetching historical sessions:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}





