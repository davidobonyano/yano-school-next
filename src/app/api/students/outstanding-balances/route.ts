import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getRequesterStudentId } from '@/lib/authz';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    
    // For students, ensure they can only access their own data
    const requesterStudentId = getRequesterStudentId(request);
    if (requesterStudentId && requesterStudentId !== studentId) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Get outstanding balances from previous terms/sessions
    const { data: balances, error } = await supabase
      .from('payment_ledgers')
      .select(`
        term,
        session,
        entry_type,
        amount,
        description
      `)
      .eq('student_id', studentId)
      .in('entry_type', ['Bill', 'Payment', 'CarryForward'])
      .order('session', { ascending: false })
      .order('term', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by session and term to calculate outstanding balances
    const termBalances: Record<string, {
      session: string;
      term: string;
      billed: number;
      paid: number;
      outstanding: number;
    }> = {};

    balances?.forEach(entry => {
      const key = `${entry.session}-${entry.term}`;
      if (!termBalances[key]) {
        termBalances[key] = {
          session: entry.session,
          term: entry.term,
          billed: 0,
          paid: 0,
          outstanding: 0
        };
      }

      if (entry.entry_type === 'Bill' || entry.entry_type === 'CarryForward') {
        termBalances[key].billed += Number(entry.amount);
      } else if (entry.entry_type === 'Payment') {
        termBalances[key].paid += Number(entry.amount);
      }
    });

    // Calculate outstanding for each term
    Object.values(termBalances).forEach(term => {
      term.outstanding = Math.max(0, term.billed - term.paid);
    });

    // Filter to only include terms with outstanding balances
    const outstandingBalances = Object.values(termBalances)
      .filter(term => term.outstanding > 0)
      .map(term => ({
        session: term.session,
        term: term.term,
        amount: term.outstanding,
        fee_type: 'General' // We can enhance this later to break down by fee type
      }));

    return NextResponse.json({ 
      balances: outstandingBalances
    });

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}





