import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/authz';

export async function GET(request: Request) {
  try {
    // Check admin authorization
    const authCheck = requireAdmin(request);
    if (!authCheck.ok) {
      return authCheck.error!;
    }

    const { searchParams } = new URL(request.url);
    const session = searchParams.get('session');
    const term = searchParams.get('term');

    // Build the query for payment transactions
    let query = supabase
      .from('payment_transactions')
      .select(`
        id,
        payment_transactions.student_id,
        amount,
        payment_method,
        description,
        transaction_date,
        recorded_by,
        created_at,
        session_id,
        term_id,
        school_students!inner(full_name),
        academic_sessions!inner(name),
        academic_terms!inner(name)
      `)
      .order('transaction_date', { ascending: false });

    // Apply filters
    if (session) {
      query = query.eq('academic_sessions.name', session);
    }
    if (term) {
      query = query.eq('academic_terms.name', term);
    }

    const { data: transactions, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to include student, session, and term names
    const transformedPayments = (transactions || []).map((payment: any) => ({
      id: payment.id,
      student_name: payment.school_students?.full_name || 'Unknown',
      student_id: payment.student_id,
      amount: payment.amount,
      payment_method: payment.payment_method,
      description: payment.description,
      transaction_date: payment.transaction_date,
      session: payment.academic_sessions?.name || 'Unknown',
      term: payment.academic_terms?.name || 'Unknown',
      recorded_by: payment.recorded_by || 'Unknown'
    }));

    return NextResponse.json({ 
      payments: transformedPayments,
      total: transformedPayments.length,
      filters: { session, term }
    });

  } catch (err: any) {
    console.error('Error fetching payment history:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
