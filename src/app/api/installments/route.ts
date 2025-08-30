import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const schema = z.object({
      studentId: z.string(),
      term: z.string(),
      session: z.string(),
      totalInstallments: z.number().int().positive(),
      expectedPerInstallment: z.number().nonnegative().optional()
    });
    const { studentId, term, session, totalInstallments, expectedPerInstallment } = schema.parse(await request.json());
    const { data, error } = await supabase.rpc('upsert_installment_plan', {
      p_student_id: studentId,
      p_term: term,
      p_session: session,
      p_total_installments: Number(totalInstallments),
      p_expected_per_installment: Number(expectedPerInstallment || 0)
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, result: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}


