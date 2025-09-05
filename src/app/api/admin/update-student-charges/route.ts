import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { readAdminSession } from '@/lib/admin-session';

// POST: Update student charges when fee structures change
export async function POST(request: Request) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { sessionId, termId } = await request.json();
  
  if (!sessionId || !termId) {
    return NextResponse.json({ error: 'sessionId and termId required' }, { status: 400 });
  }

  try {
    // Get all fee structures for this session/term
    const { data: feeStructures, error: feeError } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('session_id', sessionId)
      .eq('term_id', termId)
      .eq('is_active', true);

    if (feeError) throw feeError;

    let updatedCount = 0;

    // Update student charges for each fee structure
    for (const fee of feeStructures) {
      // First, get all students matching this fee structure
      const { data: students, error: studentsError } = await supabase
        .from('school_students')
        .select('id')
        .eq('class_level', fee.class_level)
        .or(`stream.is.null,stream.eq.${fee.stream || 'null'}`);

      if (studentsError) throw studentsError;

      if (students && students.length > 0) {
        const studentIds = students.map(s => s.id);
        
        // Update student charges for these students
        const { error: updateError } = await supabase
          .from('student_charges')
          .update({ 
            amount: fee.amount,
            updated_at: new Date().toISOString()
          })
          .eq('session_id', sessionId)
          .eq('term_id', termId)
          .eq('purpose', fee.purpose)
          .in('student_id', studentIds);

        if (updateError) throw updateError;
        
        // Count affected rows
        const { count } = await supabase
          .from('student_charges')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', sessionId)
          .eq('term_id', termId)
          .eq('purpose', fee.purpose)
          .in('student_id', studentIds);

        updatedCount += count || 0;
      }
    }

    // Refresh payment ledgers to reflect changes
    await supabase.rpc('refresh_payment_ledgers');

    return NextResponse.json({ 
      message: `Updated ${updatedCount} student charges to match current fee structures`,
      updatedCount 
    });

  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
