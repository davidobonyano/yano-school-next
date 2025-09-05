import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { readAdminSession } from '@/lib/admin-session';

// GET: list fees for class/session/term
export async function GET(request: Request) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const termId = searchParams.get('termId');
  const classLevel = searchParams.get('classLevel');
  const stream = searchParams.get('stream');

  let query = supabase.from('fee_structures').select('*');
  if (sessionId) query = query.eq('session_id', sessionId);
  if (termId) query = query.eq('term_id', termId);
  if (classLevel) query = query.eq('class_level', classLevel);
  if (stream === null) {
    // no filter on stream
  } else if (stream === 'null') {
    query = query.is('stream', null);
  } else if (stream) {
    query = query.eq('stream', stream);
  }

  const { data, error } = await query.order('class_level', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

// POST: upsert a fee for class/session/term/purpose
export async function POST(request: Request) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const { classLevel, sessionId, termId, purpose, amount, isActive, stream } = body || {};
  if (!classLevel || !sessionId || !termId || !purpose || typeof amount !== 'number') {
    return NextResponse.json({ error: 'classLevel, sessionId, termId, purpose, amount required' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('fee_structures')
    .upsert({ class_level: classLevel, stream: stream ?? null, session_id: sessionId, term_id: termId, purpose, amount, is_active: isActive ?? true }, {
      onConflict: 'class_level,stream,session_id,term_id,purpose'
    })
    .select('*')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

// DELETE: delete a specific fee
export async function DELETE(request: Request) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const classLevel = searchParams.get('classLevel');
  const sessionId = searchParams.get('sessionId');
  const termId = searchParams.get('termId');
  const purpose = searchParams.get('purpose');
  const stream = searchParams.get('stream');
  if (!classLevel || !sessionId || !termId || !purpose) {
    return NextResponse.json({ error: 'classLevel, sessionId, termId, purpose required' }, { status: 400 });
  }
  const { error } = await supabase
    .from('fee_structures')
    .delete()
    .match({ class_level: classLevel, session_id: sessionId, term_id: termId, purpose, stream: stream === 'null' ? null : stream ?? undefined });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}


