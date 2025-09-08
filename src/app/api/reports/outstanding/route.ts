import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/authz';

function normalizeTermName(name: string): string {
  const n = name.trim().toLowerCase();
  if (n === 'first term' || n === '1st term') return '1st Term';
  if (n === 'second term' || n === '2nd term') return '2nd Term';
  if (n === 'third term' || n === '3rd term') return '3rd Term';
  return name;
}

export async function GET(request: Request) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.error as Response;
    const { searchParams } = new URL(request.url);
    const termName = searchParams.get('term');
    const sessionName = searchParams.get('session');
    if (!termName || !sessionName) return NextResponse.json({ error: 'term and session are required' }, { status: 400 });

    // Resolve session/term ids
    const { data: sessionRow, error: sessErr } = await supabase
      .from('academic_sessions')
      .select('id')
      .eq('name', sessionName)
      .maybeSingle();
    if (sessErr) return NextResponse.json({ error: sessErr.message }, { status: 500 });
    if (!sessionRow?.id) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const preferred = normalizeTermName(termName);
    let { data: termRow, error: termErr } = await supabase
      .from('academic_terms')
      .select('id')
      .eq('session_id', sessionRow.id)
      .eq('name', preferred)
      .maybeSingle();
    if (termErr) return NextResponse.json({ error: termErr.message }, { status: 500 });

    if (!termRow?.id) {
      const { data: t2, error: t2err } = await supabase
        .from('academic_terms')
        .select('id')
        .eq('session_id', sessionRow.id)
        .ilike('name', `%${termName}%`)
        .maybeSingle();
      if (t2err) return NextResponse.json({ error: t2err.message }, { status: 500 });
      termRow = t2 || null as any;
    }

    if (!termRow?.id) return NextResponse.json({ error: 'Term not found' }, { status: 404 });

    // Expected from student_charges, paid from payment_records
    const { data: charges, error: chargesErr } = await supabase
      .from('student_charges')
      .select('student_id, amount')
      .eq('session_id', sessionRow.id)
      .eq('term_id', termRow.id);
    if (chargesErr) return NextResponse.json({ error: chargesErr.message }, { status: 500 });

    const { data: payments, error: paymentsErr } = await supabase
      .from('payment_records')
      .select('student_id, amount')
      .eq('session_id', sessionRow.id)
      .eq('term_id', termRow.id);
    if (paymentsErr) return NextResponse.json({ error: paymentsErr.message }, { status: 500 });

    // Fetch student details for display
    const studentIds = Array.from(new Set([...(charges || []), ...(payments || [])].map((x: any) => x.student_id)));
    let studentsMap: Record<string, any> = {};
    if (studentIds.length > 0) {
      const { data: students, error: studentsErr } = await supabase
        .from('school_students')
        .select('id, student_id, full_name, class_level, stream')
        .in('id', studentIds);
      if (studentsErr) return NextResponse.json({ error: studentsErr.message }, { status: 500 });
      studentsMap = (students || []).reduce((acc: any, s: any) => { acc[s.id] = s; return acc; }, {});
    }

    // Aggregate per student
    const byStudent: Record<string, { expected: number; paid: number; } > = {};
    for (const c of charges || []) {
      const sid = c.student_id;
      if (!byStudent[sid]) byStudent[sid] = { expected: 0, paid: 0 };
      byStudent[sid].expected += Number(c.amount || 0);
    }
    for (const p of payments || []) {
      const sid = p.student_id;
      if (!byStudent[sid]) byStudent[sid] = { expected: 0, paid: 0 };
      byStudent[sid].paid += Number(p.amount || 0);
    }

    const rows = Object.entries(byStudent)
      .map(([sid, agg]) => {
        const s = studentsMap[sid] || {};
        return {
          class_level: s.class_level || 'Unknown',
          stream: s.stream || null,
          student_id: s.student_id || '',
          full_name: s.full_name || 'Unknown',
          outstanding: Math.max(0, agg.expected - agg.paid),
          status: (agg.expected - agg.paid) > 0 ? 'Outstanding' : 'Paid'
        };
      })
      .filter(r => r.outstanding > 0)
      .sort((a, b) => b.outstanding - a.outstanding);

    // Simple aging buckets derived from outstanding remains (placeholder buckets)
    const aging = [] as any[]; // Not available without payment dates per invoice; return empty for now

    return NextResponse.json({ outstanding: rows, aging });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}








