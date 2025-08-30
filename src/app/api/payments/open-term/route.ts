import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/authz';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const gate = requireAdmin(request);
    if (!gate.ok) return gate.error as Response;
    const schema = z.object({
      term: z.string().optional(),
      session: z.string().optional(),
      carryForward: z.boolean().optional()
    });
    const body = schema.parse(await request.json());
    const term = body.term;
    const session = body.session;
    const carryForward = Boolean(body.carryForward);

    // Resolve current period if not provided
    let currentTerm = term;
    let currentSession = session;
    if (!currentTerm || !currentSession) {
      const { data: period, error: pe } = await supabase.rpc('get_app_period');
      if (pe) return NextResponse.json({ error: pe.message }, { status: 500 });
      currentTerm = currentTerm || period?.[0]?.current_term || 'First';
      currentSession = currentSession || period?.[0]?.current_session || '2024/2025';
    }

    // Seed bills for the period
    const { data: seeded, error: seedErr } = await supabase.rpc('open_term_seed_bills', {
      p_term: currentTerm,
      p_session: currentSession
    });
    if (seedErr) return NextResponse.json({ error: seedErr.message }, { status: 500 });

    let carried: any = null;
    if (carryForward) {
      // Determine previous term/session simple rotation First->(none), Second->First, Third->Second
      const order = ['First', 'Second', 'Third'];
      const idx = order.indexOf(currentTerm as string);
      const prevTerm = idx > 0 ? order[idx - 1] : 'Third';
      // naive prev session: if prevTerm wraps, decrement session year string like 2024/2025 -> 2023/2024
      let prevSession = currentSession as string;
      if (idx === 0) {
        const m = /^(\d{4})\/(\d{4})$/.exec(prevSession);
        if (m) {
          const a = Number(m[1]) - 1;
          const b = Number(m[2]) - 1;
          prevSession = `${a}/${b}`;
        }
      }
      const { data: carry, error: cfErr } = await supabase.rpc('carry_forward_outstanding', {
        p_from_term: prevTerm,
        p_from_session: prevSession,
        p_to_term: currentTerm,
        p_to_session: currentSession
      });
      if (cfErr) return NextResponse.json({ error: cfErr.message }, { status: 500 });
      carried = carry;
    }

    return NextResponse.json({ success: true, seeded, carried, term: currentTerm, session: currentSession });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}


