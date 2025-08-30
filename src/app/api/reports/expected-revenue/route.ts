import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
         const { searchParams } = new URL(request.url);
     const term = searchParams.get('term') || 'First Term';
     const session = searchParams.get('session') || '2024/2025';
     
     // Normalize term to match fee_structures format
     const normalizedTerm = term.includes('First') ? 'First Term' : 
                           term.includes('Second') ? 'Second Term' : 
                           term.includes('Third') ? 'Third Term' : term;

    // Get all active students
    const { data: students, error: studentsErr } = await supabase
      .from('school_students')
      .select('student_id, class_level, stream')
      .eq('is_active', true);

    if (studentsErr) {
      return NextResponse.json({ error: studentsErr.message }, { status: 500 });
    }

    let totalExpectedRevenue = 0;
    let totalActualRevenue = 0;
    let totalOutstanding = 0;

    // Calculate expected and actual revenue for each student
    for (const student of students || []) {
      // Get expected fee from fee structures
      let classText = student.class_level;
      if (classText?.startsWith('PRI')) {
        classText = `Primary ${classText.replace('PRI', '')}`;
      } else if (classText?.startsWith('JSS')) {
        classText = classText.replace('JSS', 'JSS ');
      } else if (classText?.startsWith('SS')) {
        classText = classText; // Keep as is (SS1, SS2, SS3)
      }

             const { data: fee, error: feeErr } = await supabase
         .from('fee_structures')
         .select('total_fee')
         .eq('term', normalizedTerm)
         .eq('session', session)
         .in('class_level_text', [classText, classText?.replace('SS', 'SS ')])
         .order('updated_at', { ascending: false })
         .limit(1)
         .maybeSingle();

      if (!feeErr && fee) {
        totalExpectedRevenue += Number(fee.total_fee || 0);
      }

             // Get actual payments from payment ledgers
       const { data: payments, error: paymentsErr } = await supabase
         .from('payment_ledgers')
         .select('amount, entry_type')
         .eq('student_id', student.student_id)
         .eq('term', normalizedTerm)
         .eq('session', session);

      if (!paymentsErr && payments) {
        const paid = payments
          .filter(p => p.entry_type === 'Payment')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const billed = payments
          .filter(p => p.entry_type === 'Bill' || p.entry_type === 'CarryForward')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        
        totalActualRevenue += paid;
        totalOutstanding += Math.max(billed - paid, 0);
      }
    }

    const collectionRate = totalExpectedRevenue > 0 ? 
      ((totalActualRevenue / totalExpectedRevenue) * 100).toFixed(1) : '0.0';

    return NextResponse.json({
      expectedRevenue: totalExpectedRevenue,
      actualRevenue: totalActualRevenue,
      outstanding: totalOutstanding,
      collectionRate: parseFloat(collectionRate),
      totalStudents: students?.length || 0
    });

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
