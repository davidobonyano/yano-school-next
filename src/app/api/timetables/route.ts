import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';

// Table name suggestion: timetables
// Columns: id (uuid), class (text), subject (text), teacher_name (text), day (text), period (text), session_id (uuid), term_id (uuid), created_at

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const session_id = searchParams.get('session_id');
    const term_id = searchParams.get('term_id');
    const klass = searchParams.get('class');

    if (!session_id || !term_id) {
      return NextResponse.json({ error: 'session_id and term_id are required' }, { status: 400 });
    }

    if (action === 'by_student') {
      // Expect student class to be resolved by auth/me endpoint in future; for now, allow class via param
      const studentClass = klass;
      const query = supabaseService
        .from('timetables')
        .select('id, class, subject, teacher_name, day, period')
        .eq('session_id', session_id)
        .eq('term_id', term_id)
        .order('day', { ascending: true })
        .order('period', { ascending: true });

      if (studentClass) query.eq('class', studentClass);

      const { data, error } = await query;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ items: data || [] });
    }

    if (action === 'by_class') {
      const query = supabaseService
        .from('timetables')
        .select('id, class, subject, teacher_name, day, period')
        .eq('session_id', session_id)
        .eq('term_id', term_id)
        .order('day', { ascending: true })
        .order('period', { ascending: true });
      if (klass) query.eq('class', klass);
      const { data, error } = await query;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ items: data || [] });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { class: klass, subject, teacher_name, day, period, session_id, term_id } = body || {};
    if (!klass || !subject || !teacher_name || !day || !period || !session_id || !term_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const { data, error } = await supabaseService.from('timetables').insert({
      class: klass,
      subject,
      teacher_name,
      day,
      period,
      session_id,
      term_id
    }).select('id, class, subject, teacher_name, day, period').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, class: klass, subject, teacher_name, day, period, session_id, term_id } = body || {};
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const { data, error } = await supabaseService.from('timetables').update({
      class: klass,
      subject,
      teacher_name,
      day,
      period,
      session_id,
      term_id
    }).eq('id', id).select('id, class, subject, teacher_name, day, period').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const { error } = await supabaseService.from('timetables').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 