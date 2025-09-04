import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { requireAdmin } from '@/lib/authz';

// Normalize term names to canonical short ordinals used in DB: '1st', '2nd', '3rd'
const normalizeTerm = (raw: string | null) => {
  const v = (raw ?? '').trim().toLowerCase();
  if (/\b(1st|first)\b/.test(v)) return '1st';
  if (/\b(2nd|second)\b/.test(v)) return '2nd';
  if (/\b(3rd|third)\b/.test(v)) return '3rd';
  return raw ?? '';
};

// Build an OR filter for PostgREST to match historical term variants
const buildTermOrFilter = (normalized: string) => {
  if (normalized === '1st') return 'term.ilike.%1st%,term.ilike.first%';
  if (normalized === '2nd') return 'term.ilike.%2nd%,term.ilike.second%';
  if (normalized === '3rd') return 'term.ilike.%3rd%,term.ilike.third%';
  // fallback to exact
  return `term.eq.${normalized}`;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');
    const session = searchParams.get('session');
    
    if (!term || !session) {
      return NextResponse.json({ error: 'term and session are required' }, { status: 400 });
    }

    // Get session and term IDs
    const { data: sessionData } = await supabase
      .from('academic_sessions')
      .select('id')
      .eq('name', session)
      .maybeSingle();

    const { data: termData } = await supabase
      .from('academic_terms')
      .select('id')
      .eq('name', term)
      .eq('session_id', sessionData?.id)
      .maybeSingle();

    if (!sessionData?.id || !termData?.id) {
      return NextResponse.json({ error: 'Session or term not found' }, { status: 404 });
    }

    // Normalize term to align with DB
    const normalizedTerm = normalizeTerm(term);

    // Pull payment ledger entries for this period for robust live totals
    const termOr = buildTermOrFilter(normalizedTerm);
    const { data: ledgerRows, error: ledgerErr } = await supabase
      .from('payment_ledgers')
      .select('student_id, entry_type, amount')
      .or(termOr)
      .eq('session', session);
    if (ledgerErr) {
      return NextResponse.json({ error: ledgerErr.message }, { status: 500 });
    }

    const studentGroups = (ledgerRows || []).reduce((acc, row: any) => {
      const sid = row.student_id;
      if (!acc[sid]) {
        acc[sid] = { totalBilled: 0, totalPaid: 0 };
      }
      const amt = Number(row.amount || 0);
      if (row.entry_type === 'Payment') acc[sid].totalPaid += amt;
      if (row.entry_type === 'Bill' || row.entry_type === 'CarryForward') acc[sid].totalBilled += amt;
      return acc;
    }, {} as Record<string, { totalBilled: number; totalPaid: number }>);

    // Fetch all students for the period (ensures default Pending for new students)
    const { data: allStudents, error: studentsError } = await supabase
      .from('school_students')
      .select('student_id, full_name, class_level, stream');
    if (studentsError) {
      return NextResponse.json({ error: studentsError.message }, { status: 500 });
    }

    // Fetch fee structures for this term/session to determine expected amounts
    const { data: feeRows, error: feesError } = await supabase
      .from('fee_structures')
      .select('class_level, stream, term, session, total_fee')
      .eq('session', session)
      .or(termOr);
    if (feesError) {
      return NextResponse.json({ error: feesError.message }, { status: 500 });
    }

    const normalize = (v: any) => (v ?? '').toString().trim().toLowerCase();
    const feeMap = new Map<string, number>();
    (feeRows || []).forEach((r: any) => {
      const cls = normalize(r.class_level);
      const str = normalize(r.stream);
      const amount = Number(r.total_fee || 0);
      const key = `${cls}|${str}`;
      const keyNoStream = `${cls}|`;
      feeMap.set(key, amount);
      // Also keep class-only fallback if not set
      if (!feeMap.has(keyNoStream)) feeMap.set(keyNoStream, amount);
      // Add simple singular/plural alternates
      if (str && str.endsWith('s')) {
        feeMap.set(`${cls}|${str.slice(0, -1)}`, amount);
      } else if (str) {
        feeMap.set(`${cls}|${str + 's'}`, amount);
      }
    });

    // Transform to expected format
    // Build payments list for all students (merge recorded groups with fee_structures defaults)
    const payments = (allStudents || []).map((student) => {
      const group = studentGroups[student.student_id];
      if (group) {
        // Use recorded aggregates
        const billed = Number(group.totalBilled || 0);
        const paidTotal = Number(group.totalPaid || 0);
        const outstandingCalc = Math.max(0, billed - paidTotal);
        const status: 'Paid' | 'Pending' | 'Outstanding' = paidTotal === 0
          ? 'Pending'
          : (paidTotal >= billed ? 'Paid' : 'Outstanding');
        return {
          id: `${student.student_id}-${normalizedTerm}-${session}`,
          studentId: student.student_id,
          studentName: student.full_name,
          classLabel: student.stream ? `${student.class_level} ${student.stream}` : student.class_level,
          amount: paidTotal,
          description: `School fees for ${normalizedTerm}`,
          date: new Date().toISOString().split('T')[0],
          status,
          term: normalizedTerm,
          session,
          billed: billed,
          paid: paidTotal,
          outstanding: outstandingCalc
        };
      }

      // No records yet → default Pending using fee_structures total_fee
      const cls = normalize(student.class_level);
      const str = normalize(student.stream);
      const feeKey = `${cls}|${str}`;
      const expected = feeMap.get(feeKey)
        ?? feeMap.get(`${cls}|`)
        ?? (str && str.endsWith('s') ? feeMap.get(`${cls}|${str.slice(0, -1)}`) : undefined)
        ?? (str ? feeMap.get(`${cls}|${str + 's'}`) : undefined)
        ?? 0;
      return {
        id: `${student.student_id}-${normalizedTerm}-${session}`,
        studentId: student.student_id,
        studentName: student.full_name,
        classLabel: student.stream ? `${student.class_level} ${student.stream}` : student.class_level,
        amount: expected,
        description: `School fees for ${normalizedTerm}`,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending' as const,
        term: normalizedTerm,
        session,
        billed: expected,
        paid: 0,
        outstanding: expected
      };
    });

    return NextResponse.json({ payments });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const gate = requireAdmin(request);
    if (!gate.ok) return gate.error as Response;

    const schema = z.object({
      studentId: z.string(),
      term: z.string(),
      session: z.string(),
      amount: z.number().positive(),
      method: z.enum(['Cash', 'Transfer', 'POS', 'Online']).default('Cash'),
      description: z.string().optional(),
      recordedBy: z.string().uuid().nullable().optional()
    });

    const { studentId, term, session, amount, method, description, recordedBy } = schema.parse(await request.json());
    const normalizedTerm = normalizeTerm(term);

    // Ensure a Bill exists for this period; if none, seed bills (idempotent)
    try {
      const { data: anyLedger } = await supabase
        .from('payment_ledgers')
        .select('id')
        .eq('student_id', studentId)
        .eq('term', normalizedTerm)
        .eq('session', session)
        .limit(1);
      if (!anyLedger || anyLedger.length === 0) {
        await supabase.rpc('open_term_seed_bills', { p_term: normalizedTerm, p_session: session });
      }
    } catch (seedErr) {
      // Non-fatal: continue; outstanding computation below will still guard application
      console.warn('Bill seed attempt skipped/failed:', seedErr);
    }

    // Fetch current outstanding using DB function (ensures we don't over-apply)
    console.log('Checking balance for student:', { studentId, term: normalizedTerm, session });
    const { data: balanceVal, error: balErr } = await supabase.rpc('get_student_balance', {
      p_student_id: studentId,
      p_term: normalizedTerm,
      p_session: session
    });
    if (balErr) {
      console.error('Balance check error:', balErr);
      return NextResponse.json({ error: balErr.message }, { status: 500 });
    }
    const outstanding = Math.max(0, Number(Array.isArray(balanceVal) ? balanceVal?.[0] : balanceVal) || 0);
    console.log('Student outstanding balance:', outstanding);
    if (outstanding <= 0) {
      console.log('No outstanding balance - payment not applied');
      return NextResponse.json({ success: true, result: { success: true, amount_applied: 0, remaining_amount: Number(amount) }, note: 'No outstanding. Payment not applied.' });
    }

    const amountToApply = Math.min(Number(amount), outstanding);

    // Record payment into the ledger (and receipt) with capped amount
    console.log('Recording payment:', { studentId, term: normalizedTerm, session, amountToApply, method });
    let rpcError: any = null;
    let rpcData: any = null;
    try {
      const { data, error } = await supabase.rpc('record_payment', {
        p_student_id: studentId,
        p_term: normalizedTerm,
        p_session: session,
        p_amount: amountToApply,
        p_method: method,
        p_recorded_by: recordedBy || null,
        p_description: description || 'Payment received'
      });
      rpcError = error;
      rpcData = data;
      console.log('RPC result:', { data, error });
    } catch (e: any) {
      console.error('RPC exception:', e);
      rpcError = e;
    }

    if (rpcError) {
      console.log('RPC failed, using fallback. Error:', rpcError);
      // Fallback: write directly to payment_ledgers and create receipt
      const insertRes = await supabase
        .from('payment_ledgers')
        .insert({
          student_id: studentId,
          term: normalizedTerm,
          session,
          entry_type: 'Payment',
          amount: amountToApply,
          method: method,
          description: description || 'Payment received',
          recorded_by: recordedBy || null
        })
        .select('id')
        .maybeSingle();
      console.log('Fallback insert result:', insertRes);
      if (insertRes.error) {
        return NextResponse.json({ error: insertRes.error.message }, { status: 500 });
      }
      const ledgerId = insertRes.data?.id;

      // Update balance_after
      const { data: newBal, error: balErr2 } = await supabase.rpc('get_student_balance', {
        p_student_id: studentId,
        p_term: normalizedTerm,
        p_session: session
      });
      const computedBalance = balErr2 ? null : (Array.isArray(newBal) ? Number(newBal?.[0]) : Number(newBal));
      if (ledgerId && computedBalance !== null && !Number.isNaN(computedBalance)) {
        await supabase
          .from('payment_ledgers')
          .update({ balance_after: computedBalance })
          .eq('id', ledgerId);
      }

      // Create receipt if helper exists
      try {
        const { data: recNo } = await supabase.rpc('generate_receipt_no');
        const receiptNo = Array.isArray(recNo) ? recNo?.[0] : recNo;
        if (receiptNo) {
          await supabase.from('receipts').insert({
            receipt_no: receiptNo,
            student_id: studentId,
            payment_ledger_id: ledgerId,
            amount: amountToApply,
            method: method,
            created_by: recordedBy || null
          });
        }
      } catch {}

      const capped = amountToApply < Number(amount);
      return NextResponse.json({ success: true, result: { ledger_id: ledgerId, balance_after: computedBalance }, capped, applied_amount: amountToApply, original_amount: Number(amount) });
    }

    const capped = amountToApply < Number(amount);
    return NextResponse.json({ success: true, result: rpcData, capped, applied_amount: amountToApply, original_amount: Number(amount) });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}

// Create payment records for all students when a new session/term is activated
export async function PUT(request: Request) {
  try {
    const gate = requireAdmin(request);
    if (!gate.ok) return gate.error as Response;

    const schema = z.object({
      term: z.string(),
      session: z.string(),
      autoCreateRecords: z.boolean().default(true)
    });

    const { term, session, autoCreateRecords } = schema.parse(await request.json());

    if (autoCreateRecords) {
      // Seed bills for all active students for this period using existing RPC
      const normalizedTerm = normalizeTerm(term);
      const { data, error } = await supabase.rpc('open_term_seed_bills', {
        p_term: normalizedTerm,
        p_session: session
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: `Seeded bills for ${normalizedTerm} ${session}`,
        data 
      });
    }

    return NextResponse.json({ success: true, message: 'No action taken' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
