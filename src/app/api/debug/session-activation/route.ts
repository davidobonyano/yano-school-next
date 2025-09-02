import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      sessionId: sessionId || 'not provided'
    };

    // 1. Check if sessions exist
    const { data: sessions, error: sessionsError } = await supabase
      .from('academic_sessions')
      .select('id, name, is_active, start_date, end_date')
      .order('start_date', { ascending: false });

    debugInfo.sessions = {
      count: sessions?.length || 0,
      data: sessions,
      error: sessionsError?.message
    };

    // 2. Check if terms exist
    const { data: terms, error: termsError } = await supabase
      .from('academic_terms')
      .select(`
        id, 
        name, 
        is_active, 
        session_id,
        academic_sessions!inner(name)
      `)
      .order('start_date', { ascending: true });

    debugInfo.terms = {
      count: terms?.length || 0,
      data: terms,
      error: termsError?.message
    };

    // 3. Check current academic context
    const { data: currentContext, error: contextError } = await supabase
      .from('current_academic_context')
      .select('*');

    debugInfo.currentContext = {
      data: currentContext,
      error: contextError?.message
    };

    // 4. Check if the function exists
    const { data: functions, error: functionsError } = await supabase
      .rpc('get_all_academic_sessions'); // This will fail if function doesn't exist

    debugInfo.functions = {
      get_all_academic_sessions: functionsError ? 'FAILED' : 'EXISTS',
      error: functionsError?.message
    };

    // 5. If sessionId provided, test activation
    if (sessionId) {
      try {
        const { error: activationError } = await supabase.rpc('activate_academic_session', {
          p_session_id: sessionId
        });

        debugInfo.activationTest = {
          success: !activationError,
          error: activationError?.message,
          details: activationError?.details,
          hint: activationError?.hint
        };
      } catch (error: any) {
        debugInfo.activationTest = {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo
    });

  } catch (error: any) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, test_activation = false } = body;

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      session_id,
      test_activation
    };

    if (test_activation && session_id) {
      // Test the activation function directly
      const { error } = await supabase.rpc('activate_academic_session', {
        p_session_id: session_id
      });

      debugInfo.activationResult = {
        success: !error,
        error: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      };

      // Check the result
      const { data: updatedSessions } = await supabase
        .from('academic_sessions')
        .select('id, name, is_active')
        .eq('id', session_id);

      debugInfo.updatedSession = updatedSessions?.[0];

      // Check current context
      const { data: currentContext } = await supabase
        .from('current_academic_context')
        .select('*');

      debugInfo.updatedContext = currentContext;
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo
    });

  } catch (error: any) {
    console.error('Debug POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}



