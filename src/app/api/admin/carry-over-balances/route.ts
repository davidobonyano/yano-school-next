import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/authz';

export async function POST(request: Request) {
  try {
    const gate = requireAdmin(request);
    if (!gate.ok) return gate.error as Response;

    const { fromSession, fromTerm, toSession, toTerm, studentIds } = await request.json();

    if (!fromSession || !fromTerm || !toSession || !toTerm) {
      return NextResponse.json({ error: 'All session and term parameters are required' }, { status: 400 });
    }

    // Get outstanding balances for the specified students in the from term/session
    const { data: outstandingBalances, error: balanceError } = await supabase
      .from('payment_ledgers')
      .select(`
        student_id,
        entry_type,
        amount
      `)
      .eq('session', fromSession)
      .eq('term', fromTerm)
      .in('entry_type', ['Bill', 'Payment', 'CarryForward'])
      .in('student_id', studentIds || []);

    if (balanceError) {
      return NextResponse.json({ error: balanceError.message }, { status: 500 });
    }

    // Group by student and calculate outstanding amounts
    const studentOutstanding: Record<string, number> = {};
    
    outstandingBalances?.forEach(entry => {
      if (!studentOutstanding[entry.student_id]) {
        studentOutstanding[entry.student_id] = 0;
      }
      
      if (entry.entry_type === 'Bill' || entry.entry_type === 'CarryForward') {
        studentOutstanding[entry.student_id] += Number(entry.amount);
      } else if (entry.entry_type === 'Payment') {
        studentOutstanding[entry.student_id] -= Number(entry.amount);
      }
    });

    // Filter to only students with outstanding balances
    const studentsToCarryOver = Object.entries(studentOutstanding)
      .filter(([_, amount]) => amount > 0)
      .map(([studentId, amount]) => ({ studentId, amount }));

    if (studentsToCarryOver.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No outstanding balances to carry over',
        carriedOver: 0
      });
    }

    // Create carry-over entries in the new term/session
    const carryOverEntries = studentsToCarryOver.map(({ studentId, amount }) => ({
      student_id: studentId,
      term: toTerm,
      session: toSession,
      entry_type: 'CarryForward',
      amount: amount,
      description: `Carry-over from ${fromSession} ${fromTerm}`,
      balance_after: amount,
      recorded_by: null, // Admin action
      created_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabase
      .from('payment_ledgers')
      .insert(carryOverEntries);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully carried over ${studentsToCarryOver.length} outstanding balances`,
      carriedOver: studentsToCarryOver.length,
      totalAmount: studentsToCarryOver.reduce((sum, { amount }) => sum + amount, 0)
    });

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const gate = requireAdmin(request);
    if (!gate.ok) return gate.error as Response;

    const { searchParams } = new URL(request.url);
    const session = searchParams.get('session');
    const term = searchParams.get('term');

    if (!session || !term) {
      return NextResponse.json({ error: 'Session and term are required' }, { status: 400 });
    }

    // Get students with outstanding balances
    const { data: balances, error } = await supabase
      .from('payment_ledgers')
      .select(`
        student_id,
        entry_type,
        amount
      `)
      .eq('session', session)
      .eq('term', term)
      .in('entry_type', ['Bill', 'Payment', 'CarryForward']);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate outstanding balances
    const studentOutstanding: Record<string, number> = {};
    
    balances?.forEach(entry => {
      if (!studentOutstanding[entry.student_id]) {
        studentOutstanding[entry.student_id] = 0;
      }
      
      if (entry.entry_type === 'Bill' || entry.entry_type === 'CarryForward') {
        studentOutstanding[entry.student_id] += Number(entry.amount);
      } else if (entry.entry_type === 'Payment') {
        studentOutstanding[entry.student_id] -= Number(entry.amount);
      }
    });

    // Get student information for those with outstanding balances
    const studentsWithOutstanding = Object.entries(studentOutstanding)
      .filter(([_, amount]) => amount > 0)
      .map(([studentId, amount]) => ({ studentId, outstandingAmount: amount }));

    if (studentsWithOutstanding.length === 0) {
      return NextResponse.json({ 
        students: [],
        totalOutstanding: 0,
        count: 0
      });
    }

    const studentIds = studentsWithOutstanding.map(s => s.studentId);
    const { data: students, error: studentsError } = await supabase
      .from('school_students')
      .select('student_id, first_name, last_name, class_level, stream')
      .in('student_id', studentIds);

    if (studentsError) {
      return NextResponse.json({ error: studentsError.message }, { status: 500 });
    }

    // Combine student info with outstanding amounts
    const result = students?.map(student => {
      const outstanding = studentsWithOutstanding.find(s => s.studentId === student.student_id);
      return {
        studentId: student.student_id,
        studentName: `${student.first_name} ${student.last_name}`,
        classLabel: `${student.class_level}${student.stream ? ` ${student.stream}` : ''}`,
        outstandingAmount: outstanding?.outstandingAmount || 0
      };
    }) || [];

    const totalOutstanding = result.reduce((sum, student) => sum + student.outstandingAmount, 0);

    return NextResponse.json({
      students: result,
      totalOutstanding,
      count: result.length
    });

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}





