import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Read-only: returns charges, payments, and balances for a student across session/term, including carried-over items
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawStudent = searchParams.get('studentId') || searchParams.get('studentCode');
  const sessionId = searchParams.get('sessionId') || undefined;
  const termId = searchParams.get('termId') || undefined;
  if (!rawStudent) return NextResponse.json({ error: 'studentId (uuid) or studentCode required' }, { status: 400 });

  // Accept either UUID or student code (e.g., YAN006). If not a UUID, resolve to uuid.
  let studentUuid = rawStudent;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(rawStudent)) {
    const { data: studentRec, error: stuErr } = await supabase
      .from('school_students')
      .select('id')
      .eq('student_id', rawStudent)
      .maybeSingle();
    if (stuErr) return NextResponse.json({ error: stuErr.message }, { status: 500 });
    if (!studentRec) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    studentUuid = studentRec.id as unknown as string;
  }

  // Get charges with term names
  let chargesQuery = supabase
    .from('student_charges')
    .select(`
      *,
      academic_terms!inner(name)
    `)
    .eq('student_id', studentUuid);
  if (sessionId) chargesQuery = chargesQuery.eq('session_id', sessionId);
  if (termId) chargesQuery = chargesQuery.eq('term_id', termId);
  const { data: charges, error: chargesErr } = await chargesQuery.order('created_at', { ascending: true });
  if (chargesErr) return NextResponse.json({ error: chargesErr.message }, { status: 500 });

  // Get payments with term names
  let paymentsQuery = supabase
    .from('payment_records')
    .select(`
      *,
      academic_terms!inner(name)
    `)
    .eq('student_id', studentUuid);
  if (sessionId) paymentsQuery = paymentsQuery.eq('session_id', sessionId);
  if (termId) paymentsQuery = paymentsQuery.eq('term_id', termId);
  const { data: payments, error: paymentsErr } = await paymentsQuery.order('paid_on', { ascending: true });
  if (paymentsErr) return NextResponse.json({ error: paymentsErr.message }, { status: 500 });

  // Aggregate balances by session/term/purpose on the fly (no dependency on materialized view)
  type Key = string;
  const makeKey = (s: string, t: string, p: string): Key => `${s}::${t}::${p}`;
  const parsedCharges = (charges ?? []) as Array<{ session_id: string; term_id: string; purpose: string; amount: number; academic_terms: { name: string } }>; 
  const parsedPayments = (payments ?? []) as Array<{ session_id: string; term_id: string; purpose: string; amount: number; academic_terms: { name: string } }>;
  const ledgerMap = new Map<Key, { student_id: string; session_id: string; term_id: string; purpose: string; term_name: string; total_charged: number; total_paid: number; }>();
  
  for (const c of parsedCharges) {
    const k = makeKey(c.session_id, c.term_id, c.purpose);
    const row = ledgerMap.get(k) || { 
      student_id: studentUuid, 
      session_id: c.session_id, 
      term_id: c.term_id, 
      purpose: c.purpose, 
      term_name: c.academic_terms?.name || '',
      total_charged: 0, 
      total_paid: 0 
    };
    row.total_charged += Number(c.amount || 0);
    ledgerMap.set(k, row);
  }
  
  for (const p of parsedPayments) {
    const k = makeKey(p.session_id, p.term_id, p.purpose);
    const row = ledgerMap.get(k) || { 
      student_id: studentUuid, 
      session_id: p.session_id, 
      term_id: p.term_id, 
      purpose: p.purpose, 
      term_name: p.academic_terms?.name || '',
      total_charged: 0, 
      total_paid: 0 
    };
    row.total_paid += Number(p.amount || 0);
    ledgerMap.set(k, row);
  }
  
  const computedLedger = Array.from(ledgerMap.values()).map(r => ({ ...r, balance: Math.max(0, r.total_charged - r.total_paid) }));

  // Flatten charges and payments to include term names
  const flattenedCharges = (charges ?? []).map(c => ({
    ...c,
    term_name: c.academic_terms?.name || ''
  }));
  
  const flattenedPayments = (payments ?? []).map(p => ({
    ...p,
    term_name: p.academic_terms?.name || ''
  }));

  return NextResponse.json({ 
    charges: flattenedCharges, 
    payments: flattenedPayments, 
    ledger: computedLedger 
  });
}

 