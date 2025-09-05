import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { readAdminSession } from '@/lib/admin-session';

// GET: list payment records by filters
export async function GET(request: Request) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const sessionId = searchParams.get('sessionId');
  const termId = searchParams.get('termId');
  const purpose = searchParams.get('purpose');
  
  let query = supabase
    .from('payment_records')
    .select(`
      *,
      school_students!inner(student_id, full_name),
      academic_sessions!inner(name),
      academic_terms!inner(name)
    `);
  if (studentId) query = query.eq('student_id', studentId);
  if (sessionId) query = query.eq('session_id', sessionId);
  if (termId) query = query.eq('term_id', termId);
  if (purpose) query = query.eq('purpose', purpose);
  
  const { data, error } = await query.order('paid_on', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Flatten the response to include student, session, and term info
  const flattenedData = (data ?? []).map(record => ({
    ...record,
    student_name: record.school_students?.full_name || '',
    student_code: record.school_students?.student_id || '',
    session_name: record.academic_sessions?.name || '',
    term_name: record.academic_terms?.name || ''
  }));
  
  return NextResponse.json({ items: flattenedData });
}

// POST: add a new payment record
export async function POST(request: Request) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const { studentId, sessionId, termId, purpose, amount, paidOn, reference } = body || {};
  if (!studentId || !sessionId || !termId || !purpose || typeof amount !== 'number') {
    return NextResponse.json({ error: 'studentId, sessionId, termId, purpose, amount required' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('payment_records')
    .insert({ student_id: studentId, session_id: sessionId, term_id: termId, purpose, amount, paid_on: paidOn ?? null, reference, created_by: session.adminId })
    .select('*')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

// PUT: update a payment record by id
export async function PUT(request: Request) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const { id, amount, paidOn, reference, purpose } = body || {};
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const updates: any = {};
  if (typeof amount === 'number') updates.amount = amount;
  if (paidOn) updates.paid_on = paidOn;
  if (reference !== undefined) updates.reference = reference;
  if (purpose) updates.purpose = purpose;
  const { data, error } = await supabase
    .from('payment_records')
    .update(updates)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

// DELETE: delete a payment record by id
export async function DELETE(request: Request) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { error } = await supabase.from('payment_records').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}





