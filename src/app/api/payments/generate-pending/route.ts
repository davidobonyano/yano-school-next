import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/authz';
import { supabaseService } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const gate = requireAdmin(request);
    if (!gate.ok) return gate.error as Response;
    
    const schema = z.object({
      term: z.string(),
      session: z.string()
    });
    
    const { term, session } = schema.parse(await request.json());

    // Call the seed_pending_payments RPC function
    const { data: result, error } = await supabaseService.rpc('seed_pending_payments', {
      p_term: term,
      p_session: session
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Generated ${result?.inserted || 0} pending payments`,
      result 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}







