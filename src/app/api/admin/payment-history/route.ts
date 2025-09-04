import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/authz';

export async function GET(request: Request) {
  try {
    const gate = requireAdmin(request);
    if (!gate.ok) return gate.error as Response;

    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');
    const session = searchParams.get('session');

    if (!term || !session) {
      return NextResponse.json({ error: 'Term and session are required' }, { status: 400 });
    }

    // Get payment history for all students in the specified term/session
    const { data: history, error } = await supabase
      .from('payment_ledgers')
      .select(`
        student_id,
        term,
        session,
        entry_type,
        amount,
        created_at
      `)
      .eq('term', term)
      .eq('session', session)
      .order('student_id')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get student information
    const studentIds = [...new Set(history?.map(h => h.student_id) || [])];

    // If there are no student IDs for the given term/session, return empty history
    if (!studentIds.length) {
      return NextResponse.json({ history: [] });
    }
    const { data: students, error: studentsError } = await supabase
      .from('school_students')
      .select('student_id, first_name, last_name, class_level, stream')
      .in('student_id', studentIds);

    if (studentsError) {
      return NextResponse.json({ error: studentsError.message }, { status: 500 });
    }

    // Create student lookup map
    const studentMap = new Map(students?.map(s => [s.student_id, s]) || []);

    // Group by student and calculate totals
    const studentHistory: Record<string, {
      studentId: string;
      studentName: string;
      classLabel: string;
      session: string;
      term: string;
      billed: number;
      paid: number;
      outstanding: number;
      status: 'Paid' | 'Partial' | 'Outstanding' | 'Pending';
      lastPaymentDate?: string;
    }> = {};

    history?.forEach(entry => {
      const student = studentMap.get(entry.student_id);
      if (!student) return;

      const key = entry.student_id;
      if (!studentHistory[key]) {
        studentHistory[key] = {
          studentId: entry.student_id,
          studentName: `${student.first_name} ${student.last_name}`,
          classLabel: `${student.class_level}${student.stream ? ` ${student.stream}` : ''}`,
          session: entry.session,
          term: entry.term,
          billed: 0,
          paid: 0,
          outstanding: 0,
          status: 'Pending'
        };
      }

      if (entry.entry_type === 'Bill' || entry.entry_type === 'CarryForward') {
        studentHistory[key].billed += Number(entry.amount);
      } else if (entry.entry_type === 'Payment') {
        studentHistory[key].paid += Number(entry.amount);
        if (!studentHistory[key].lastPaymentDate || entry.created_at > studentHistory[key].lastPaymentDate!) {
          studentHistory[key].lastPaymentDate = entry.created_at;
        }
      }
    });

    // Calculate outstanding and status for each student
    Object.values(studentHistory).forEach(student => {
      student.outstanding = Math.max(0, student.billed - student.paid);
      
      if (student.outstanding === 0 && student.billed > 0) {
        student.status = 'Paid';
      } else if (student.paid > 0 && student.outstanding > 0) {
        student.status = 'Partial';
      } else if (student.outstanding > 0) {
        student.status = 'Outstanding';
      } else {
        student.status = 'Pending';
      }
    });

    return NextResponse.json({ 
      history: Object.values(studentHistory).sort((a, b) => {
        // Sort by class, then by name
        if (a.classLabel !== b.classLabel) {
          return a.classLabel.localeCompare(b.classLabel);
        }
        return a.studentName.localeCompare(b.studentName);
      })
    });

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}



