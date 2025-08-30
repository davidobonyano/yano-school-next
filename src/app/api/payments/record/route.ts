import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/authz';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const gate = requireAdmin(request);
    if (!gate.ok) return gate.error as Response;
    const schema = z.object({
      studentId: z.string(),
      term: z.string(),
      session: z.string(),
      amount: z.number().positive(),
      method: z.enum(['Cash','Transfer','POS','Online']),
      recordedBy: z.string().uuid().nullable().optional(),
      description: z.string().optional()
    });
    const { studentId, term, session, amount, method, recordedBy, description } = schema.parse(await request.json());

    const { data, error } = await supabase.rpc('record_payment', {
      p_student_id: studentId,
      p_term: term,
      p_session: session,
      p_amount: Number(amount),
      p_method: method,
      p_recorded_by: recordedBy || null,
      p_description: description || 'Payment received'
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, result: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}


