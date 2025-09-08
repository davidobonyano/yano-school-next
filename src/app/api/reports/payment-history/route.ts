import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/authz';

function normalizeTermName(name: string): string {
  const n = (name || '').trim().toLowerCase();
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
    const sessionName = searchParams.get('session');
    const termNameRaw = searchParams.get('term');
    const termName = termNameRaw ? normalizeTermName(termNameRaw) : null;

    // Resolve session/term IDs if provided
    let sessionId: string | null = null;
    let termId: string | null = null;
    if (sessionName) {
      const { data: srow, error: serr } = await supabase
        .from('academic_sessions')
        .select('id')
        .eq('name', sessionName)
        .maybeSingle();
      if (serr) return NextResponse.json({ error: serr.message }, { status: 500 });
      sessionId = srow?.id ?? null;
      if (!sessionId) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (termName && sessionId) {
      let { data: trow, error: terr } = await supabase
        .from('academic_terms')
        .select('id')
        .eq('session_id', sessionId)
        .eq('name', termName)
        .maybeSingle();
      if (terr) return NextResponse.json({ error: terr.message }, { status: 500 });
      if (!trow?.id) {
        const { data: t2, error: t2err } = await supabase
          .from('academic_terms')
          .select('id')
          .eq('session_id', sessionId)
          .ilike('name', `%${termNameRaw}%`)
          .maybeSingle();
        if (t2err) return NextResponse.json({ error: t2err.message }, { status: 500 });
        trow = t2 || null as any;
      }
      termId = (trow as any)?.id ?? null;
      if (!termId) return NextResponse.json({ error: 'Term not found' }, { status: 404 });
    }

    let query = supabase
      .from('payment_records')
      .select('id, student_id, amount, purpose, paid_on, session_id, term_id')
      .order('paid_on', { ascending: false });

    if (sessionId) query = query.eq('session_id', sessionId);
    if (termId) query = query.eq('term_id', termId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const studentIds = Array.from(new Set((data || []).map((p: any) => p.student_id)));
    let studentsMap: Record<string, any> = {};
    if (studentIds.length > 0) {
      const { data: students, error: studentsErr } = await supabase
        .from('school_students')
        .select('id, student_id, full_name')
        .in('id', studentIds);
      if (studentsErr) return NextResponse.json({ error: studentsErr.message }, { status: 500 });
      studentsMap = (students || []).reduce((acc: any, s: any) => { acc[s.id] = s; return acc; }, {});
    }

    // Map session/term IDs to names so rows always have readable values
    const sessionIds = Array.from(new Set((data || []).map((p: any) => p.session_id).filter(Boolean)));
    const termIds = Array.from(new Set((data || []).map((p: any) => p.term_id).filter(Boolean)));

    let sessionsMap: Record<string, string> = {};
    if (sessionIds.length > 0) {
      const { data: sessions, error: sessionsErr } = await supabase
        .from('academic_sessions')
        .select('id, name')
        .in('id', sessionIds);
      if (sessionsErr) return NextResponse.json({ error: sessionsErr.message }, { status: 500 });
      sessionsMap = (sessions || []).reduce((acc: any, s: any) => { acc[s.id] = s.name; return acc; }, {});
    }

    let termsMap: Record<string, string> = {};
    if (termIds.length > 0) {
      const { data: terms, error: termsErr } = await supabase
        .from('academic_terms')
        .select('id, name')
        .in('id', termIds);
      if (termsErr) return NextResponse.json({ error: termsErr.message }, { status: 500 });
      termsMap = (terms || []).reduce((acc: any, t: any) => { acc[t.id] = t.name; return acc; }, {});
    }

    const payments = (data || []).map((p: any) => ({
      id: p.id,
      student_name: studentsMap[p.student_id]?.full_name || 'Unknown',
      student_id: studentsMap[p.student_id]?.student_id || '',
      amount: Number(p.amount || 0),
      payment_method: 'N/A',
      description: p.purpose,
      transaction_date: p.paid_on,
      session: sessionName || sessionsMap[p.session_id] || '',
      term: termNameRaw || termsMap[p.term_id] || '',
    }));

    return NextResponse.json({ payments });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}


