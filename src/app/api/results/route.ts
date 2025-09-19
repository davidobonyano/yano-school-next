import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const session = searchParams.get('session');
    const term = searchParams.get('term');

    if (!studentId || !session || !term) {
      return NextResponse.json({ error: 'student_id, session, term are required' }, { status: 400 });
    }

    const { data: sessionRow, error: sErr } = await supabase
      .from('academic_sessions')
      .select('id')
      .eq('name', session)
      .maybeSingle();
    if (sErr || !sessionRow) return NextResponse.json({ error: sErr?.message || 'Session not found' }, { status: 400 });

    const termNorm = normalizeTermName(term);
    const [p1, p2] = termNamePatterns(termNorm);
    const { data: termRow, error: tErr } = await supabase
      .from('academic_terms')
      .select('id')
      .eq('session_id', sessionRow.id)
      .or(`name.ilike.${p1},name.ilike.${p2}`)
      .maybeSingle();
    if (tErr || !termRow) return NextResponse.json({ error: tErr?.message || 'Term not found' }, { status: 400 });

    const { data, error } = await supabase
      .from('student_results')
      .select(`
        id,
        course_id,
        ca_score,
        midterm_score,
        exam_score,
        total_score,
        grade,
        remark,
        courses:course_id (name)
      `)
      .eq('student_id', studentId)
      .eq('session_id', sessionRow.id)
      .eq('term_id', termRow.id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const results = (data || []).map((r: any) => ({
      id: r.id,
      courseId: r.course_id,
      courseName: r.courses?.name || 'Course',
      ca: Number(r.ca_score || 0),
      midterm: Number(r.midterm_score || 0),
      exam: Number(r.exam_score || 0),
      total: Number(r.total_score || 0),
      grade: r.grade,
      remark: r.remark || null,
    }));

    return new NextResponse(JSON.stringify({ results }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120'
      }
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


