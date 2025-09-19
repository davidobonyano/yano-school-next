import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { requireAdmin } from '@/lib/authz';

export async function POST(request: Request) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.error as Response;
    const schema = z.object({
      studentIds: z.array(z.string()).min(1),
      newTerm: z.string(),
      newSession: z.string(),
      seedBills: z.boolean().optional()
    });
    const { studentIds, newTerm, newSession, seedBills } = schema.parse(await request.json());
    const { data, error } = await supabase.rpc('bulk_promote_students', {
      p_student_ids: studentIds,
      p_new_term: newTerm,
      p_new_session: newSession,
      p_seed_bills: Boolean(seedBills)
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, result: data });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


