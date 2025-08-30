import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { requireAdmin } from '@/lib/authz';

export async function POST(request: Request) {
  try {
    const gate = requireAdmin(request);
    if (!gate.ok) return gate.error as Response;
    const schema = z.object({
      studentIds: z.array(z.string()).min(1),
      term: z.string(),
      session: z.string(),
      method: z.enum(['Cash','Transfer','POS','Online']),
      recordedBy: z.string().uuid().nullable().optional()
    });
    const { studentIds, term, session, method, recordedBy } = schema.parse(await request.json());
    const { data, error } = await supabase.rpc('bulk_mark_fully_paid', {
      p_student_ids: studentIds,
      p_term: term,
      p_session: session,
      p_method: method,
      p_recorded_by: recordedBy || null
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, result: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}


