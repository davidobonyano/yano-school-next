import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/authz';

// Auto-create payment records for all students when session/term changes
export async function POST(request: Request) {
  try {
    const gate = requireAdmin(request);
    if (!gate.ok) return gate.error as Response;

    const { sessionId, termId, sessionName, termName } = await request.json();

    let resolvedSessionId = sessionId;
    let resolvedTermId = termId;

    // Fallback: allow using names to resolve IDs server-side
    if ((!resolvedSessionId || !resolvedTermId) && (sessionName && termName)) {
      const { data: sessionRow, error: sErr } = await supabase
        .from('academic_sessions')
        .select('id')
        .eq('name', sessionName)
        .maybeSingle();
      if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
      resolvedSessionId = sessionRow?.id;

      const { data: termRow, error: tErr } = await supabase
        .from('academic_terms')
        .select('id')
        .eq('name', termName)
        .eq('session_id', resolvedSessionId)
        .maybeSingle();
      if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });
      resolvedTermId = termRow?.id;
    }

    // Proceed if we have IDs; otherwise if we have names, we'll try text-based RPC later.
    // Only reject if neither IDs nor names are provided.
    if ((!resolvedSessionId || !resolvedTermId) && !(sessionName && termName)) {
      return NextResponse.json({ error: 'Provide either (sessionId, termId) or (sessionName, termName)' }, { status: 400 });
    }

    // Attempt UUID-based RPC first (signature: (p_session_id uuid, p_term_id uuid) RETURNS TABLE)
    let recordsCreated = 0 as number;
    let message: string | undefined;
    let triedUuidSignature = false;

    if (resolvedSessionId && resolvedTermId) {
      triedUuidSignature = true;
      const { data: uuidResult, error: uuidError } = await supabase.rpc('create_payment_records_for_period', {
        p_session_id: resolvedSessionId,
        p_term_id: resolvedTermId
      });
      if (!uuidError) {
        // uuidResult may be an array of rows or a scalar/json depending on function definition
        const row = Array.isArray(uuidResult) ? uuidResult?.[0] : uuidResult as any;
        recordsCreated = Number(row?.records_created ?? 0);
        message = row?.message || (recordsCreated ? `Created ${recordsCreated} payment records` : undefined);
      } else {
        // eslint-disable-next-line no-console
        console.error('auto-create UUID RPC failed:', uuidError);
        // Fall through to try text-based signature
        // If no names provided, bubble up the error
        if (!sessionName || !termName) {
          return NextResponse.json({ error: uuidError.message, where: 'uuid_signature' }, { status: 500 });
        }
      }
    }

    // If UUID signature wasn't tried or didn't succeed, try text-based signature (p_term text, p_session text)
    if (recordsCreated === 0 && sessionName && termName && (!triedUuidSignature || message === undefined)) {
      const { data: textResult, error: textError } = await supabase.rpc('create_payment_records_for_period', {
        p_term: termName,
        p_session: sessionName
      });
      if (textError) {
        // eslint-disable-next-line no-console
        console.error('auto-create TEXT RPC failed:', textError);
        return NextResponse.json({ error: textError.message, where: 'text_signature' }, { status: 500 });
      }
      // textResult is likely a jsonb object
      const obj = Array.isArray(textResult) ? textResult?.[0] : textResult as any;
      const rc = obj?.records_created ?? obj?.recordsCreated;
      if (rc !== undefined) recordsCreated = Number(rc) || 0;
      if (!message) {
        message = obj?.message || (recordsCreated ? `Created ${recordsCreated} payment records` : 'No records created');
      }
    }

    return NextResponse.json({
      success: true,
      recordsCreated,
      message: message || (recordsCreated ? `Created ${recordsCreated} payment records` : 'No records created')
    });

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
