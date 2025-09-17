import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { readAdminSession } from '@/lib/admin-session';

// POST: Update student charges when fee structures change
export async function POST(request: Request) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { sessionId, termId } = await request.json();
  
  if (!sessionId || !termId) {
    return NextResponse.json({ error: 'sessionId and termId required' }, { status: 400 });
  }

  try {
    // Resolve term name once
    const { data: termRow, error: termErr } = await supabase
      .from('academic_terms')
      .select('name')
      .eq('id', termId)
      .maybeSingle();
    if (termErr) throw termErr;
    const termName = termRow?.name || null;

    // Get all fee structures for this session/term
    const { data: feeStructures, error: feeError } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('session_id', sessionId)
      .eq('term_id', termId)
      .eq('is_active', true);

    if (feeError) throw feeError;

    if (!feeStructures || feeStructures.length === 0) {
      return NextResponse.json({ message: 'No active fee structures to sync', updatedCount: 0 });
    }

    // Build distinct class_level/stream keys to minimize student queries
    const feeKeys = Array.from(new Set(
      feeStructures.map(f => `${String(f.class_level)}||${f.stream === null ? 'NULL' : String(f.stream)}`)
    ));

    // Fetch students for each key in parallel
    const studentsByKey = new Map<string, { id: string }[]>();
    await Promise.all(
      feeKeys.map(async (key) => {
        const [classLevel, streamRaw] = key.split('||');
        let studentsQuery = supabase
          .from('school_students')
          .select('id')
          .eq('class_level', classLevel);
        if (streamRaw === 'NULL') {
          studentsQuery = studentsQuery.is('stream', null);
        } else {
          // Match stream case-insensitively to support variants like 'Arts' vs 'ARTS'
          const normalized = (streamRaw || '').trim();
          studentsQuery = studentsQuery.ilike('stream', normalized);
        }
        const { data, error } = await studentsQuery;
        if (error) throw error;
        studentsByKey.set(key, data ?? []);
      })
    );

    // Build all upsert rows in memory, combining duplicates on conflict key by summing amount
    type UpsertRow = {
      student_id: string;
      session_id: string;
      term_id: string;
      term_name: string | null;
      purpose: string;
      description: string;
      amount: number;
      carried_over: boolean;
      updated_at: string;
    };
    const combinedByKey = new Map<string, UpsertRow>();
    const nowIso = new Date().toISOString();
    for (const fee of feeStructures) {
      const key = `${String(fee.class_level)}||${fee.stream === null ? 'NULL' : String(fee.stream)}`;
      const students = studentsByKey.get(key) ?? [];
      if (students.length === 0) continue;
      for (const s of students) {
        const conflictKey = `${s.id}||${sessionId}||${termId}||${fee.purpose}||false||Current Term Fee`;
        const existing = combinedByKey.get(conflictKey);
        if (existing) {
          existing.amount = Number(existing.amount) + Number(fee.amount);
          existing.updated_at = nowIso;
        } else {
          combinedByKey.set(conflictKey, {
            student_id: s.id,
            session_id: sessionId,
            term_id: termId,
            term_name: termName,
            purpose: fee.purpose,
            description: 'Current Term Fee',
            amount: Number(fee.amount),
            carried_over: false,
            updated_at: nowIso
          } as UpsertRow);
        }
      }
    }

    const allRows: UpsertRow[] = Array.from(combinedByKey.values());

    // No rows to upsert
    if (allRows.length === 0) {
      return NextResponse.json({ message: 'No matching students for fee structures', updatedCount: 0 });
    }

    // Upsert in chunks to reduce round trips and payload size
    const chunkSize = 1000;
    for (let i = 0; i < allRows.length; i += chunkSize) {
      const chunk = allRows.slice(i, i + chunkSize);
      const { error: upsertErr } = await supabase
        .from('student_charges')
        .upsert(chunk, {
          onConflict: 'student_id,session_id,term_id,purpose,carried_over,description'
        });
      if (upsertErr) throw upsertErr;
    }

    // After syncing current term charges, also carry over unpaid balances
    // from the previous term/session into this term as separate charge rows.
    const { error: carryErr } = await supabase.rpc('carry_over_unpaid_balances', {
      target_session: sessionId,
      target_term: termId
    });
    if (carryErr) throw carryErr;

    const updatedCount = allRows.length;

    return NextResponse.json({ 
      message: `Updated ${updatedCount} student charges and carried over previous balances`,
      updatedCount 
    });

  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
