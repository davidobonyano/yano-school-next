import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/students/payment-history?studentId=<uuid>|&studentCode=<text>&sessionId=<uuid>&termId=<uuid>
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const studentIdParam = searchParams.get('studentId');
    const studentCodeParam = searchParams.get('studentCode');
    const sessionId = searchParams.get('sessionId');
    const termId = searchParams.get('termId');

    if (!studentIdParam && !studentCodeParam) {
      return NextResponse.json({ error: 'studentId or studentCode is required' }, { status: 400 });
    }

    // Resolve student UUID from either direct id or student code
    let studentUuid: string | null = studentIdParam;
    if (!studentUuid && studentCodeParam) {
      const { data: studentRow, error: studentErr } = await supabase
        .from('school_students')
        .select('id')
        .eq('student_id', studentCodeParam)
        .maybeSingle();
      if (studentErr) {
        return NextResponse.json({ error: studentErr.message }, { status: 500 });
      }
      if (!studentRow?.id) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }
      studentUuid = studentRow.id as string;
    }

    // Fetch student charges
    let chargesQuery = supabase
      .from('student_charges')
      .select('*')
      .eq('student_id', studentUuid as string);
    if (sessionId) chargesQuery = chargesQuery.eq('session_id', sessionId);
    if (termId) chargesQuery = chargesQuery.eq('term_id', termId);
    const { data: charges, error: chargesError } = await chargesQuery.order('created_at', { ascending: true });
    if (chargesError) {
      return NextResponse.json({ error: chargesError.message }, { status: 500 });
    }

    // Fetch payment records with enriched term/session names
    let paymentsQuery = supabase
      .from('payment_records')
      .select('*, academic_terms:term_id(name), academic_sessions:session_id(name)')
      .eq('student_id', studentUuid as string);
    if (sessionId) paymentsQuery = paymentsQuery.eq('session_id', sessionId);
    if (termId) paymentsQuery = paymentsQuery.eq('term_id', termId);
    const { data: rawPayments, error: paymentsError } = await paymentsQuery.order('paid_on', { ascending: false });
    if (paymentsError) {
      return NextResponse.json({ error: paymentsError.message }, { status: 500 });
    }
    type RawPayment = { academic_terms?: { name?: string | null } | null; academic_sessions?: { name?: string | null } | null } & Record<string, any>;
    const payments = ((rawPayments as RawPayment[] | null) || []).map((p) => ({
      ...p,
      term_name: p.academic_terms?.name || null,
      session_name: p.academic_sessions?.name || null
    }));

    // Compute ledger summary from charges and payments (no dependency on materialized view)
    type LedgerAccumulator = Record<string, {
      student_id: string;
      session_id: string;
      term_id: string;
      term_name?: string | null;
      purpose: string;
      total_charged: number;
      total_paid: number;
      balance: number;
    }>;

    const ledgerAccumulator: LedgerAccumulator = {};

    // Seed from charges
    type ChargeRow = { session_id: string; term_id: string; term_name?: string | null; purpose: string; amount: number } & Record<string, any>;
    ((charges as ChargeRow[] | null) || []).forEach((c) => {
      const key = `${c.session_id}|${c.term_id}|${c.purpose}`;
      if (!ledgerAccumulator[key]) {
        ledgerAccumulator[key] = {
          student_id: studentUuid as string,
          session_id: c.session_id,
          term_id: c.term_id,
          term_name: c.term_name ?? null,
          purpose: c.purpose,
          total_charged: 0,
          total_paid: 0,
          balance: 0,
        };
      }
      ledgerAccumulator[key].total_charged += Number(c.amount || 0);
    });

    // Add payments
    type PaymentRow = { session_id: string; term_id: string; purpose: string; amount: number } & Record<string, any>;
    (payments as unknown as PaymentRow[]).forEach((p) => {
      const key = `${p.session_id}|${p.term_id}|${p.purpose}`;
      if (!ledgerAccumulator[key]) {
        ledgerAccumulator[key] = {
          student_id: studentUuid as string,
          session_id: p.session_id,
          term_id: p.term_id,
          term_name: null,
          purpose: p.purpose,
          total_charged: 0,
          total_paid: 0,
          balance: 0,
        };
      }
      ledgerAccumulator[key].total_paid += Number(p.amount || 0);
    });

    // Finalize balance
    const computedLedger = Object.values(ledgerAccumulator).map(item => ({
      ...item,
      balance: Number(item.total_charged) - Number(item.total_paid)
    }));

    return NextResponse.json({
      charges: charges || [],
      payments: payments || [],
      ledger: computedLedger
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}

// Support HEAD to avoid 405s from HEAD requests
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

// Support OPTIONS for CORS/preflight and generic clients
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
