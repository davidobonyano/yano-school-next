import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { studentId, term, session } = await request.json();
    
    if (!studentId || !term || !session) {
      return NextResponse.json({ 
        error: 'studentId, term, and session are required' 
      }, { status: 400 });
    }

    // Get comprehensive financial summary using the database function
    type SummaryRow = { billed_total?: number; paid_total?: number; overdue_total?: number };
    const { data: summaryData, error: summaryError } = await supabase.rpc('get_student_financial_summary', {
      p_student_id: studentId,
      p_term: term,
      p_session: session
    });

    if (summaryError) {
      return NextResponse.json({ error: summaryError.message }, { status: 500 });
    }

    // Handle empty results
    if (!summaryData || summaryData.length === 0) {
      return NextResponse.json({
        summary: {
          student_id: studentId,
          billed_total: 0,
          paid_total: 0,
          pending_total: 0,
          outstanding_total: 0,
          overdue_total: 0,
          payment_status: 'Pending'
        }
      });
    }

    const summary = (summaryData as SummaryRow[])[0];
    
    // Calculate payment status based on new definitions
    let payment_status = 'Pending';
    const billed = Number(summary.billed_total || 0);
    const paid = Number(summary.paid_total || 0);
    
    if (paid >= billed && billed > 0) {
      payment_status = 'Paid';
    } else if (paid > 0 && paid < billed) {
      payment_status = 'Outstanding';
    } else {
      payment_status = 'Pending';
    }

    const result = {
      student_id: studentId,
      billed_total: billed,
      paid_total: paid,
      pending_total: Math.max(billed - paid, 0),
      outstanding_total: Math.max(billed - paid, 0),
      overdue_total: Number(summary.overdue_total || 0),
      payment_status
    };

    return NextResponse.json({ summary: result });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 });
  }
}

// Additional endpoint to get bulk financial summaries for multiple students
export async function PUT(request: Request) {
  try {
    const { studentIds, term, session } = await request.json();
    
    if (!studentIds || !Array.isArray(studentIds) || !term || !session) {
      return NextResponse.json({ 
        error: 'studentIds (array), term, and session are required' 
      }, { status: 400 });
    }

    // Get bulk financial summaries
    type BulkRow = { student_id: string; billed_total?: number; paid_total?: number; overdue_total?: number };
    const { data: bulkData, error: bulkError } = await supabase.rpc('get_bulk_student_summaries', {
      p_student_ids: studentIds,
      p_term: term,
      p_session: session
    });

    if (bulkError) {
      return NextResponse.json({ error: bulkError.message }, { status: 500 });
    }

    // Process and format the data
    const summaries = ((bulkData as BulkRow[] | null) || []).map((row) => {
      const billed = Number(row.billed_total || 0);
      const paid = Number(row.paid_total || 0);
      
      let payment_status = 'Pending';
      if (paid >= billed && billed > 0) {
        payment_status = 'Paid';
      } else if (paid > 0 && paid < billed) {
        payment_status = 'Outstanding';
      }

      return {
        student_id: row.student_id,
        billed_total: billed,
        paid_total: paid,
        pending_total: Math.max(billed - paid, 0),
        outstanding_total: Math.max(billed - paid, 0),
        overdue_total: Number(row.overdue_total || 0),
        payment_status
      };
    });

    return NextResponse.json({ summaries });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 });
  }
}
