import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/settings/academic-context - Get current academic context
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'current':
        return await getCurrentContext();
      case 'sessions':
        return await getAllSessions();
      case 'terms':
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          return NextResponse.json(
            { error: 'Session ID is required for terms' },
            { status: 400 }
          );
        }
        return await getTermsForSession(sessionId);
      default:
        return await getCurrentContext();
    }

  } catch (error) {
    console.error('Error in academic context GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/settings/academic-context - Manage academic context
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, session_id, term_id } = body;

    switch (action) {
      case 'activate_session':
        if (!session_id) {
          return NextResponse.json(
            { error: 'Session ID is required' },
            { status: 400 }
          );
        }
        return await activateSession(session_id);

      case 'activate_term':
        if (!term_id) {
          return NextResponse.json(
            { error: 'Term ID is required' },
            { status: 400 }
          );
        }
        return await activateTerm(term_id);

      case 'create_session':
        const { name, start_date, end_date } = body;
        if (!name || !start_date || !end_date) {
          return NextResponse.json(
            { error: 'Name, start_date, and end_date are required' },
            { status: 400 }
          );
        }
        return await createSession({ name, start_date, end_date });

      case 'create_term':
        const { session_id: term_session_id, name: term_name, start_date: term_start, end_date: term_end } = body;
        if (!term_session_id || !term_name || !term_start || !term_end) {
          return NextResponse.json(
            { error: 'Session ID, name, start_date, and end_date are required' },
            { status: 400 }
          );
        }
        return await createTerm({ session_id: term_session_id, name: term_name, start_date: term_start, end_date: term_end });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: activate_session, activate_term, create_session, create_term' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in academic context POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get current academic context
async function getCurrentContext() {
  const { data, error } = await supabase.rpc('get_current_academic_context');

  if (error) {
    console.error('Error getting current context:', error);
    return NextResponse.json(
      { error: 'Failed to get current academic context' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    current: data?.[0] || null
  });
}

// Get all academic sessions
async function getAllSessions() {
  const { data, error } = await supabase.rpc('get_all_academic_sessions');

  if (error) {
    console.error('Error getting sessions:', error);
    return NextResponse.json(
      { error: 'Failed to get academic sessions' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    sessions: data || []
  });
}

// Get terms for a specific session
async function getTermsForSession(sessionId: string) {
  const { data, error } = await supabase.rpc('get_terms_for_session', {
    p_session_id: sessionId
  });

  if (error) {
    console.error('Error getting terms:', error);
    return NextResponse.json(
      { error: 'Failed to get terms for session' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    terms: data || []
  });
}

// Activate a session
async function activateSession(sessionId: string) {
  const { error } = await supabase.rpc('activate_academic_session', {
    p_session_id: sessionId
  });

  if (error) {
    console.error('Error activating session:', error);
    return NextResponse.json(
      { error: 'Failed to activate session' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: 'Session activated successfully'
  });
}

// Activate a term
async function activateTerm(termId: string) {
  const { error } = await supabase.rpc('activate_academic_term', {
    p_term_id: termId
  });

  if (error) {
    console.error('Error activating term:', error);
    return NextResponse.json(
      { error: 'Failed to activate term' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: 'Term activated successfully'
  });
}

// Create a new session
async function createSession(sessionData: { name: string; start_date: string; end_date: string }) {
  const { data, error } = await supabase
    .from('academic_sessions')
    .insert(sessionData)
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: 'Session created successfully',
    session: data
  }, { status: 201 });
}

// Create a new term
async function createTerm(termData: { session_id: string; name: string; start_date: string; end_date: string }) {
  const { data, error } = await supabase
    .from('academic_terms')
    .insert(termData)
    .select()
    .single();

  if (error) {
    console.error('Error creating term:', error);
    return NextResponse.json(
      { error: 'Failed to create term' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: 'Term created successfully',
    term: data
  }, { status: 201 });
}

