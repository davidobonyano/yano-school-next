import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    // Get comprehensive payment statistics using the database function
    const { data: stats, error: statsError } = await supabase.rpc('get_payment_statistics', {
      p_session_id: sessionData.id,
      p_term_id: termData.id
    });

    // If the function doesn't exist yet, fall back to manual calculation
    if (statsError && statsError.message?.includes('function')) {
      console.log('Using fallback statistics calculation');
    } else if (statsError) {
      console.error('Statistics error:', statsError);
      return NextResponse.json({ error: statsError.message }, { status: 500 });
    }

    // Calculate statistics from payment ledgers
    const { data: ledgerEntries, error: ledgerError } = await supabase
      .from('payment_ledgers')
      .select('student_id, entry_type, amount')
      .eq('term', term)
      .eq('session', session);

    if (ledgerError) {
      return NextResponse.json({ error: ledgerError.message }, { status: 500 });
    }

    // Group ledger entries by student
    const studentGroups = (ledgerEntries || []).reduce((acc, entry) => {
      if (!acc[entry.student_id]) {
        acc[entry.student_id] = {
          billed: 0,
          paid: 0
        };
      }
      const amount = Number(entry.amount || 0);
      if (entry.entry_type === 'Bill' || entry.entry_type === 'CarryForward') {
        acc[entry.student_id].billed += amount;
      } else if (entry.entry_type === 'Payment') {
        acc[entry.student_id].paid += amount;
      }
      return acc;
    }, {} as Record<string, { billed: number; paid: number }>);

    // Fetch all students and fee structures to include students without records
    const { data: allStudents, error: studentsError } = await supabase
      .from('school_students')
      .select('student_id, class_level, stream');
    if (studentsError) {
      return NextResponse.json({ error: studentsError.message }, { status: 500 });
    }

    const { data: feeRows, error: feesError } = await supabase
      .from('fee_structures')
      .select('class_level, stream, term, session, total_fee')
      .eq('session', session)
      .eq('term', term);
    if (feesError) {
      return NextResponse.json({ error: feesError.message }, { status: 500 });
    }

    const normalize = (v: any) => (v ?? '').toString().trim().toLowerCase();
    const feeMap = new Map<string, number>();
    (feeRows || []).forEach((r: any) => {
      const cls = normalize(r.class_level);
      const str = normalize(r.stream);
      const amt = Number(r.total_fee || 0);
      const key = `${cls}|${str}`;
      const keyNoStream = `${cls}|`;
      feeMap.set(key, amt);
      if (!feeMap.has(keyNoStream)) feeMap.set(keyNoStream, amt);
      if (str && str.endsWith('s')) feeMap.set(`${cls}|${str.slice(0, -1)}`, amt); else if (str) feeMap.set(`${cls}|${str + 's'}`, amt);
    });

    let totalStudents = (allStudents || []).length;
    let totalExpected = 0;
    let totalCollected = 0;
    let pendingCount = 0, outstandingCount = 0, paidCount = 0;
    let pendingAmount = 0, outstandingAmount = 0;

    (allStudents || []).forEach((s) => {
      const cls = normalize(s.class_level);
      const str = normalize(s.stream);
      const key = `${cls}|${str}`;
      const expected = feeMap.get(key)
        ?? feeMap.get(`${cls}|`)
        ?? (str && str.endsWith('s') ? feeMap.get(`${cls}|${str.slice(0, -1)}`) : undefined)
        ?? (str ? feeMap.get(`${cls}|${str + 's'}`) : undefined)
        ?? 0;
      const grp = studentGroups[s.student_id];
      const paid = grp ? grp.paid : 0;
      const billed = grp ? grp.billed : expected;
      
      totalExpected += expected; // Use fee structure amount for expected
      totalCollected += paid;
      
      if (paid === 0) { 
        pendingCount++; 
        pendingAmount += expected; 
      } else if (paid < expected) { 
        outstandingCount++; 
        outstandingAmount += (expected - paid); 
      } else { 
        paidCount++; 
      }
    });

    const statistics = {
      totalStudents,
      totalExpected,
      totalCollected,
      pendingCount,
      outstandingCount,
      paidCount,
      pendingAmount,
      outstandingAmount,
      totalOutstanding: outstandingAmount,
      collectionRate: totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0,
      paymentCompletionRate: totalStudents > 0 ? (paidCount / totalStudents) * 100 : 0,
      statusSummary: {
        pending: { count: pendingCount, amount: pendingAmount },
        outstanding: { count: outstandingCount, amount: outstandingAmount },
        paid: { count: paidCount, amount: totalCollected }
      }
    };

    return NextResponse.json({ statistics });
  } catch (err: any) {
    console.error('Payment statistics error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
