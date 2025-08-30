import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { requireAdmin } from '@/lib/authz';

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

    // Get payment records with student details
    const { data: paymentRecords, error: paymentError } = await supabase
      .from('payment_records')
      .select(`
        *,
        school_students!inner(student_id, full_name, class_level, stream)
      `)
      .eq('session_id', sessionData.id)
      .eq('term_id', termData.id);

    if (paymentError) {
      return NextResponse.json({ error: paymentError.message }, { status: 500 });
    }

    // Group by student and calculate totals
    const studentGroups = (paymentRecords || []).reduce((acc, record) => {
      const studentId = record.student_id;
      if (!acc[studentId]) {
        acc[studentId] = {
          student: record.school_students,
          records: [],
          totalExpected: 0,
          totalPaid: 0,
          totalOutstanding: 0
        };
      }
      acc[studentId].records.push(record);
      acc[studentId].totalExpected += Number(record.expected_amount);
      acc[studentId].totalPaid += Number(record.paid_amount);
      acc[studentId].totalOutstanding += Number(record.balance);
      return acc;
    }, {} as Record<string, any>);

    // Transform to expected format
    const payments = Object.values(studentGroups).map((group: any) => {
      const student = group.student;
      let status: 'Paid' | 'Pending' | 'Outstanding';
      
      if (group.totalPaid === 0) {
        status = 'Pending';
      } else if (group.totalPaid >= group.totalExpected) {
        status = 'Paid';
      } else {
        status = 'Outstanding';
      }

      return {
        id: `${student.student_id}-${term}-${session}`,
        studentId: student.student_id,
        studentName: student.full_name,
        classLabel: student.stream ? `${student.class_level} ${student.stream}` : student.class_level,
        amount: group.totalExpected,
        description: `School fees for ${term}`,
        date: new Date().toISOString().split('T')[0],
        status,
        term,
        session,
        billed: group.totalExpected,
        paid: group.totalPaid,
        outstanding: group.totalOutstanding
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

    // Record payment using the improved database function
    const { data, error } = await supabase.rpc('record_student_payment', {
      p_student_id: studentId,
      p_term: term,
      p_session: session,
      p_amount: Number(amount),
      p_method: method,
      p_recorded_by: recordedBy || null,
      p_description: description || 'Payment received'
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: data });
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
      // Automatically create payment records for all active students
      const { data, error } = await supabase.rpc('create_payment_records_for_period', {
        p_term: term,
        p_session: session
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: `Created payment records for ${data?.records_created || 0} students`,
        data 
      });
    }

    return NextResponse.json({ success: true, message: 'Period updated without creating records' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
