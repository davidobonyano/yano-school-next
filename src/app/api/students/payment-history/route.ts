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

    // Get payment history grouped by session and term
    const { data: history, error } = await supabase
      .from('payment_ledgers')
      .select(`
        term,
        session,
        entry_type,
        amount
      `)
      .eq('student_id', studentId)
      .order('session', { ascending: false })
      .order('term', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by session and term
    const groupedHistory: Record<string, {
      session: string;
      term: string;
      billed: number;
      paid: number;
      outstanding: number;
      status: 'Paid' | 'Partial' | 'Outstanding' | 'Pending';
    }> = {};

    history?.forEach(entry => {
      const key = `${entry.session}-${entry.term}`;
      if (!groupedHistory[key]) {
        groupedHistory[key] = {
          session: entry.session,
          term: entry.term,
          billed: 0,
          paid: 0,
          outstanding: 0,
          status: 'Pending'
        };
      }

      if (entry.entry_type === 'Bill' || entry.entry_type === 'CarryForward') {
        groupedHistory[key].billed += Number(entry.amount);
      } else if (entry.entry_type === 'Payment') {
        groupedHistory[key].paid += Number(entry.amount);
      }
    });

    // Calculate outstanding and status for each term
    Object.values(groupedHistory).forEach(term => {
      term.outstanding = Math.max(0, term.billed - term.paid);
      
      if (term.outstanding === 0 && term.billed > 0) {
        term.status = 'Paid';
      } else if (term.paid > 0 && term.outstanding > 0) {
        term.status = 'Partial';
      } else if (term.outstanding > 0) {
        term.status = 'Outstanding';
      } else {
        term.status = 'Pending';
      }
    });

    return NextResponse.json({ 
      history: Object.values(groupedHistory).sort((a, b) => {
        // Sort by session and term
        if (a.session !== b.session) {
          return b.session.localeCompare(a.session);
        }
        return b.term.localeCompare(a.term);
      })
    });

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}





