import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { requireAdmin } from '@/lib/authz';

export async function POST(request: Request) {
  try {
    const gate = requireAdmin(request);
    if (!gate.ok) return gate.error as Response;
    const schema = z.object({
      studentId: z.string(),
      term: z.string(),
      session: z.string(),
      amount: z.number(),
      description: z.string().optional(),
      recordedBy: z.string().uuid().nullable().optional()
    });
    const { studentId, term, session, amount, description, recordedBy } = schema.parse(await request.json());
    const { data, error } = await supabase.rpc('record_adjustment', {
      p_student_id: studentId,
      p_term: term,
      p_session: session,
      p_amount: Number(amount),
      p_description: description || 'Manual adjustment',
      p_recorded_by: recordedBy || null
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, result: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}


