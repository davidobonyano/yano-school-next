import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { readAdminSession } from '@/lib/admin-session';

// GET: get consolidated payment summary for a student
export async function GET(request: Request) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const sessionId = searchParams.get('sessionId');
  const termId = searchParams.get('termId');
  
  if (!studentId || !sessionId || !termId) {
    return NextResponse.json({ error: 'studentId, sessionId, termId required' }, { status: 400 });
  }

  try {
    // Get student info
    const { data: student, error: studentError } = await supabase
      .from('school_students')
      .select('id, student_id, full_name, class_level, stream')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;

    // Get expected fees from fee structures
    const { data: feeStructures, error: feeError } = await supabase
      .from('fee_structures')
      .select('purpose, amount')
      .eq('session_id', sessionId)
      .eq('term_id', termId)
      .eq('class_level', student.class_level)
      .eq('is_active', true)
      .or(`stream.is.null,stream.eq.${student.stream}`);

    if (feeError) throw feeError;

    // Get total payments per purpose
    const { data: payments, error: paymentsError } = await supabase
      .from('payment_records')
      .select('purpose, amount')
      .eq('student_id', studentId)
      .eq('session_id', sessionId)
      .eq('term_id', termId);

    if (paymentsError) throw paymentsError;

    // Calculate summary
    const summary = feeStructures.map(fee => {
      const totalPaid = payments
        .filter(p => p.purpose === fee.purpose)
        .reduce((sum, p) => sum + Number(p.amount), 0);
      
      const expected = Number(fee.amount);
      const balance = expected - totalPaid;
      
      let status = 'Outstanding';
      if (totalPaid === 0) status = 'Outstanding';
      else if (balance === 0) status = 'Paid';
      else if (balance < 0) status = 'Overpaid';
      else if (totalPaid > 0 && balance > 0) status = 'Partial';

      return {
        purpose: fee.purpose,
        expected: expected,
        paid: totalPaid,
        balance: balance,
        status: status
      };
    });

    return NextResponse.json({
      student: {
        id: student.id,
        student_id: student.student_id,
        full_name: student.full_name,
        class_level: student.class_level,
        stream: student.stream
      },
      summary
    });

  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}


