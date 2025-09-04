import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeTermName(term: string): 'First' | 'Second' | 'Third' {
  const t = (term || '').toLowerCase().trim();
  if (t.includes('first') || t.includes('1st') || t.startsWith('1') || t.includes('first term')) return 'First';
  if (t.includes('second') || t.includes('2nd') || t.startsWith('2') || t.includes('second term')) return 'Second';
  if (t.includes('third') || t.includes('3rd') || t.startsWith('3') || t.includes('third term')) return 'Third';
  return 'First';
}

function termNamePatterns(term: 'First' | 'Second' | 'Third'): [string, string] {
  switch (term) {
    case 'First':
      return ['1st%', 'First%'];
    case 'Second':
      return ['2nd%', 'Second%'];
    case 'Third':
      return ['3rd%', 'Third%'];
  }
}

function gradeToPoint(grade: string): number {
  if (!grade) return 0;
  if (grade.startsWith('A')) return 5.0;
  if (grade === 'B2') return 4.5;
  if (grade === 'B3') return 4.0;
  if (grade === 'C4') return 3.5;
  if (grade === 'C5') return 3.0;
  if (grade === 'C6') return 2.5;
  if (grade === 'D7') return 2.0;
  if (grade === 'E8') return 1.0;
  return 0.0;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const session = searchParams.get('session');
    const term = searchParams.get('term'); // optional for term GPA

    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }

    // Resolve session id if provided
    let sessionId: string | null = null;
    if (session) {
      const { data: sessionRow, error: sErr } = await supabase
        .from('academic_sessions')
        .select('id')
        .eq('name', session)
        .maybeSingle();
      if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
      sessionId = sessionRow?.id ?? null;
    }

    // Prepare queries in parallel
    const overallQuery = supabase
      .from('student_results')
      .select('grade')
      .eq('student_id', studentId);

    const sessionQuery = sessionId
      ? supabase
          .from('student_results')
          .select('grade')
          .eq('student_id', studentId)
          .eq('session_id', sessionId)
      : null;

    // Resolve term id if term provided (requires session as well)
    let termQuery = null as any;
    if (sessionId && term) {
      const termNorm = normalizeTermName(term);
      const [p1, p2] = termNamePatterns(termNorm);
      const { data: termRow, error: tErr } = await supabase
        .from('academic_terms')
        .select('id')
        .eq('session_id', sessionId)
        .or(`name.ilike.${p1},name.ilike.${p2}`)
        .maybeSingle();
      if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });
      if (termRow?.id) {
        termQuery = supabase
          .from('student_results')
          .select('grade')
          .eq('student_id', studentId)
          .eq('session_id', sessionId)
          .eq('term_id', termRow.id);
      }
    }

    const [overallRes, sessionRes, termRes] = await Promise.all([
      overallQuery,
      sessionQuery ?? Promise.resolve({ data: null, error: null } as any),
      termQuery ?? Promise.resolve({ data: null, error: null } as any)
    ]);

    if (overallRes.error) return NextResponse.json({ error: overallRes.error.message }, { status: 500 });
    if (sessionRes?.error) return NextResponse.json({ error: sessionRes.error.message }, { status: 500 });
    if (termRes?.error) return NextResponse.json({ error: termRes.error.message }, { status: 500 });

    const computeAvg = (grades: Array<{ grade: string }> | null | undefined) => {
      const pts = (grades || []).map(r => gradeToPoint(r.grade));
      if (pts.length === 0) return '0.00';
      const g = pts.reduce((a, b) => a + b, 0) / pts.length;
      return g.toFixed(2);
    };

    const responseJson = {
      overallCgpa: computeAvg(overallRes.data as any),
      sessionCgpa: computeAvg(sessionRes?.data as any),
      termGpa: computeAvg(termRes?.data as any)
    };

    return new NextResponse(JSON.stringify(responseJson), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}


