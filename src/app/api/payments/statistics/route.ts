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

    // Calculate statistics from payment records
    const { data: paymentRecords, error: recordsError } = await supabase
      .from('payment_records')
      .select(`
        *,
        school_students!inner(full_name, class_level, stream)
      `)
      .eq('session_id', sessionData.id)
      .eq('term_id', termData.id);

    if (recordsError) {
      return NextResponse.json({ error: recordsError.message }, { status: 500 });
    }

    // Calculate comprehensive statistics
    const totalStudents = new Set((paymentRecords || []).map(r => r.student_id)).size;
    const totalExpected = (paymentRecords || []).reduce((sum, r) => sum + Number(r.expected_amount), 0);
    const totalCollected = (paymentRecords || []).reduce((sum, r) => sum + Number(r.paid_amount), 0);
    
    // Group by student and calculate status
    const studentGroups = (paymentRecords || []).reduce((acc, record) => {
      if (!acc[record.student_id]) {
        acc[record.student_id] = {
          expected: 0,
          paid: 0,
          records: []
        };
      }
      acc[record.student_id].expected += Number(record.expected_amount);
      acc[record.student_id].paid += Number(record.paid_amount);
      acc[record.student_id].records.push(record);
      return acc;
    }, {} as Record<string, { expected: number; paid: number; records: any[] }>);

    let pendingCount = 0, outstandingCount = 0, paidCount = 0;
    let pendingAmount = 0, outstandingAmount = 0;

    Object.values(studentGroups).forEach((student: any) => {
      if (student.paid === 0) {
        pendingCount++;
        pendingAmount += student.expected;
      } else if (student.paid < student.expected) {
        outstandingCount++;
        outstandingAmount += (student.expected - student.paid);
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
