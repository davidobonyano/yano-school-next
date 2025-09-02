import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';

export async function PUT(request: NextRequest) {
  try {
    const { session } = await request.json();
    const supabase = supabaseService;

    if (!session) {
      return NextResponse.json({ error: 'Session is required' }, { status: 400 });
    }

    // Get the session ID
    const { data: sessionData, error: sessionError } = await supabase
      .from('academic_sessions')
      .select('id, name')
      .eq('name', session)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Find existing current academic context row (singleton)
    const { data: existingContext, error: existingError } = await supabase
      .from('current_academic_context')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error('Error reading academic context:', existingError);
      return NextResponse.json({ error: 'Failed to read academic context' }, { status: 500 });
    }

    let contextData;
    let contextError;

    if (existingContext?.id) {
      // Update the existing row by id (required filter for updates)
      ({ data: contextData, error: contextError } = await supabase
        .from('current_academic_context')
        .update({
          session_id: sessionData.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingContext.id)
        .select(`
          *,
          academic_sessions!inner(name as session_name),
          academic_terms!inner(name as term_name)
        `)
        .single());
    } else {
      // Insert a new context row if none exists
      ({ data: contextData, error: contextError } = await supabase
        .from('current_academic_context')
        .insert({
          session_id: sessionData.id,
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          academic_sessions!inner(name as session_name),
          academic_terms!inner(name as term_name)
        `)
        .single());
    }

    if (contextError) {
      console.error('Error updating academic context:', contextError);
      return NextResponse.json({ error: 'Failed to update academic context' }, { status: 500 });
    }

    return NextResponse.json({
      session_id: sessionData.id,
      session_name: sessionData.name,
      message: 'Session updated successfully'
    });
  } catch (error) {
    console.error('Error in session update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
