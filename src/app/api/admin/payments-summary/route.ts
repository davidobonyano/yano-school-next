import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { readAdminSession } from '@/lib/admin-session';

// Returns totals per class/term: expected (charges), collected, outstanding, and list of owing students
export async function GET(request: Request) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const termId = searchParams.get('termId');
  if (!sessionId || !termId) return NextResponse.json({ error: 'sessionId and termId required' }, { status: 400 });

  // Aggregate expected vs collected per class level
  const { data: students, error: studentsErr } = await supabase
    .from('school_students')
    .select('id, student_id, full_name, class_level');
  if (studentsErr) return NextResponse.json({ error: studentsErr.message }, { status: 500 });

  // charges per student
  const { data: charges, error: chargesErr } = await supabase
    .from('student_charges')
    .select('student_id, purpose, amount')
    .eq('session_id', sessionId)
    .eq('term_id', termId);
  if (chargesErr) return NextResponse.json({ error: chargesErr.message }, { status: 500 });

  // payments per student
  const { data: payments, error: paymentsErr } = await supabase
    .from('payment_records')
    .select('student_id, amount')
    .eq('session_id', sessionId)
    .eq('term_id', termId);
  if (paymentsErr) return NextResponse.json({ error: paymentsErr.message }, { status: 500 });

  const byStudent = new Map<string, { classLevel: string | null; studentId: string; studentName: string; expected: number; paid: number }>();
  for (const s of students ?? []) {
    byStudent.set(s.id, { 
      classLevel: s.class_level ?? null, 
      studentId: s.student_id,
      studentName: s.full_name,
      expected: 0, 
      paid: 0 
    });
  }
  for (const c of charges ?? []) {
    const entry = byStudent.get(c.student_id);
    if (entry) entry.expected += Number(c.amount || 0);
  }
  for (const p of payments ?? []) {
    const entry = byStudent.get(p.student_id);
    if (entry) entry.paid += Number(p.amount || 0);
  }

  const perClass: Record<string, { expected: number; collected: number; outstanding: number } > = {};
  const owing: Array<{ studentId: string; studentName: string; classLevel: string | null; outstanding: number }> = [];
  for (const [sid, row] of byStudent.entries()) {
    const classLevel = row.classLevel ?? 'Unknown';
    if (!perClass[classLevel]) perClass[classLevel] = { expected: 0, collected: 0, outstanding: 0 };
    perClass[classLevel].expected += row.expected;
    perClass[classLevel].collected += row.paid;
    perClass[classLevel].outstanding += Math.max(0, row.expected - row.paid);
    const outstanding = row.expected - row.paid;
    if (outstanding > 0) owing.push({ 
      studentId: row.studentId, 
      studentName: row.studentName,
      classLevel: row.classLevel ?? null, 
      outstanding 
    });
  }

  return NextResponse.json({ perClass, owing });
}





