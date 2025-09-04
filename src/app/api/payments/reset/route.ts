import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/authz';

export async function POST(request: Request) {
  try {
    const gate = requireAdmin(request);
    if (!gate.ok) return gate.error as Response;

    const { studentId, term, session } = await request.json();
    if (!studentId || !term || !session) {
      return NextResponse.json({ error: 'studentId, term, and session are required' }, { status: 400 });
    }

    // Resolve IDs
    const { data: sessionRow, error: sErr } = await supabase
      .from('academic_sessions')
      .select('id')
      .eq('name', session)
      .maybeSingle();
    if (sErr || !sessionRow?.id) return NextResponse.json({ error: sErr?.message || 'Session not found' }, { status: 404 });

    const { data: termRow, error: tErr } = await supabase
      .from('academic_terms')
      .select('id')
      .eq('name', term)
      .eq('session_id', sessionRow.id)
      .maybeSingle();
    if (tErr || !termRow?.id) return NextResponse.json({ error: tErr?.message || 'Term not found' }, { status: 404 });

    const { data: studentRow, error: stuErr } = await supabase
      .from('school_students')
      .select('id')
      .eq('student_id', studentId)
      .maybeSingle();
    if (stuErr || !studentRow?.id) return NextResponse.json({ error: stuErr?.message || 'Student not found' }, { status: 404 });

    // Collect payment ledger IDs for this student/period
    const { data: ledgers, error: lErr } = await supabase
      .from('payment_ledgers')
      .select('id')
      .eq('student_id', studentId)
      .eq('term', term)
      .eq('session', session)
      .eq('entry_type', 'Payment');
    if (lErr) return NextResponse.json({ error: lErr.message }, { status: 500 });

    const ledgerIds = (ledgers || []).map((r: any) => r.id);

    // Delete receipts tied to those payments
    if (ledgerIds.length > 0) {
      const { error: rDelErr } = await supabase
        .from('receipts')
        .delete()
        .in('payment_ledger_id', ledgerIds);
      if (rDelErr) return NextResponse.json({ error: rDelErr.message }, { status: 500 });

      // Delete payment ledger rows
      const { error: lDelErr } = await supabase
        .from('payment_ledgers')
        .delete()
        .in('id', ledgerIds);
      if (lDelErr) return NextResponse.json({ error: lDelErr.message }, { status: 500 });
    }

    // Reset payment_records aggregates
    const { error: prErr } = await supabase
      .from('payment_records')
      .update({ paid_amount: 0, balance: supabase.rpc as any }) // placeholder to satisfy type, will set explicitly below
      .eq('student_id', studentRow.id)
      .eq('session_id', sessionRow.id)
      .eq('term_id', termRow.id);
    // Because we can't do expressions easily here, perform two-step: fetch and compute balances
    if (prErr) {
      // Fallback: manual loop to reset records precisely
      const { data: prRows, error: prGetErr } = await supabase
        .from('payment_records')
        .select('id, expected_amount')
        .eq('student_id', studentRow.id)
        .eq('session_id', sessionRow.id)
        .eq('term_id', termRow.id);
      if (prGetErr) return NextResponse.json({ error: prGetErr.message }, { status: 500 });

      for (const rec of prRows || []) {
        const { error: updErr } = await supabase
          .from('payment_records')
          .update({ paid_amount: 0, balance: Number(rec.expected_amount || 0), status: 'unpaid' })
          .eq('id', rec.id);
        if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
      }
    } else {
      // After bulk zeroing paid_amount, recompute balances and status explicitly
      const { data: prRows2, error: prGetErr2 } = await supabase
        .from('payment_records')
        .select('id, expected_amount')
        .eq('student_id', studentRow.id)
        .eq('session_id', sessionRow.id)
        .eq('term_id', termRow.id);
      if (prGetErr2) return NextResponse.json({ error: prGetErr2.message }, { status: 500 });
      for (const rec of prRows2 || []) {
        const { error: updErr2 } = await supabase
          .from('payment_records')
          .update({ balance: Number(rec.expected_amount || 0), status: 'unpaid' })
          .eq('id', rec.id);
        if (updErr2) return NextResponse.json({ error: updErr2.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Payments reset to Pending for the selected period.' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}


