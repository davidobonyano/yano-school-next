import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type UpsertBody = {
  studentId: string; // YAN student code from school_students.student_id
  courseId?: string; // optional UUID
  courseCode?: string; // optional human course code (e.g., MTH101)
  session: string; // e.g., '2024/2025'
  term: string; // e.g., 'First Term' | 'First'
  ca: number; // out of 20
  midterm: number; // out of 20
  exam: number; // out of 60
  uploadedBy?: string; // teacher id (uuid)
  uploadId?: string | null;
};

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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UpsertBody;
    const { studentId, courseId: incomingCourseId, courseCode, session, term, ca, midterm, exam, uploadedBy, uploadId } = body || {} as UpsertBody;

    if (!studentId || (!incomingCourseId && !courseCode) || !session || !term) {
      return NextResponse.json({ error: 'studentId, (courseId or courseCode), session, term are required' }, { status: 400 });
    }

    // Validate bounds
    const caNum = Number(ca ?? 0);
    const midNum = Number(midterm ?? 0);
    const examNum = Number(exam ?? 0);
    if (caNum < 0 || caNum > 20 || midNum < 0 || midNum > 20 || examNum < 0 || examNum > 60) {
      return NextResponse.json({ error: 'Scores out of range. CA(0-20), Midterm(0-20), Exam(0-60)' }, { status: 400 });
    }

    // Look up session and term IDs
    const { data: sessionRow, error: sErr } = await supabase
      .from('academic_sessions')
      .select('id, name')
      .eq('name', session)
      .maybeSingle();
    if (sErr || !sessionRow) {
      return NextResponse.json({ error: sErr?.message || 'Session not found' }, { status: 400 });
    }

    const termNorm = normalizeTermName(term);
    const [p1, p2] = termNamePatterns(termNorm);
    const { data: termRow, error: tErr } = await supabase
      .from('academic_terms')
      .select('id, name, session_id')
      .eq('session_id', sessionRow.id)
      .or(`name.ilike.${p1},name.ilike.${p2}`)
      .maybeSingle();
    if (tErr || !termRow) {
      return NextResponse.json({ error: tErr?.message || 'Term not found for session' }, { status: 400 });
    }

    // Resolve course ID from code if needed
    let courseId = incomingCourseId || '';
    if (!courseId && courseCode) {
      const { data: courseRow, error: cErr } = await supabase
        .from('courses')
        .select('id, code')
        .ilike('code', courseCode)
        .maybeSingle();
      if (cErr || !courseRow) {
        return NextResponse.json({ error: cErr?.message || `Course not found for code ${courseCode}` }, { status: 400 });
      }
      courseId = courseRow.id as string;
    }

    // Call RPC to upsert
    const { data: rpcData, error: rpcErr } = await supabase.rpc('upsert_student_result', {
      p_student_id: studentId,
      p_course_id: courseId,
      p_session_id: sessionRow.id,
      p_term_id: termRow.id,
      p_ca: caNum,
      p_midterm: midNum,
      p_exam: examNum,
      p_uploaded_by: uploadedBy || null,
      p_upload_id: uploadId || null,
    });

    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message }, { status: 500 });
    }

    return NextResponse.json({ result: rpcData });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}


