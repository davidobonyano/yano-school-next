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
    .select('id, student_id, full_name, class_level, stream');
  if (studentsErr) return NextResponse.json({ error: studentsErr.message }, { status: 500 });

  // Expected per student from fee_structures (no dependency on student_charges)
  const { data: feeStructures, error: feeErr } = await supabase
    .from('fee_structures')
    .select('purpose, amount, class_level, stream, is_active')
    .eq('session_id', sessionId)
    .eq('term_id', termId)
    .eq('is_active', true);
  if (feeErr) return NextResponse.json({ error: feeErr.message }, { status: 500 });

  // payments per student
  const { data: payments, error: paymentsErr } = await supabase
    .from('payment_records')
    .select('student_id, amount')
    .eq('session_id', sessionId)
    .eq('term_id', termId);
  if (paymentsErr) return NextResponse.json({ error: paymentsErr.message }, { status: 500 });

  const byStudent = new Map<string, { classLevel: string | null; stream: string | null; studentId: string; studentName: string; expected: number; paid: number }>();
  for (const s of students ?? []) {
    byStudent.set(s.id, {
      classLevel: (s as any).class_level ?? null,
      stream: (s as any).stream ?? null,
      studentId: (s as any).student_id,
      studentName: (s as any).full_name,
      expected: 0,
      paid: 0
    });
  }
  // Compute expected by matching fee structures to each student
  for (const [sid, entry] of byStudent.entries()) {
    const feesForStudent = (feeStructures ?? []).filter(f => {
      const fClassRaw = (f as any).class_level as string | null | undefined;
      const fStreamRaw = (f as any).stream as string | null | undefined;
      const studentClassRaw = entry.classLevel as string | null | undefined;
      const studentStreamRaw = entry.stream as string | null | undefined;

      const norm = (v: string | null | undefined) => (v ?? '').toString().trim().toLowerCase();
      const matchesClass = norm(fClassRaw) === norm(studentClassRaw);
      const matchesStream = fStreamRaw == null || norm(fStreamRaw) === norm(studentStreamRaw);
      return matchesClass && matchesStream;
    });
    const expectedSum = feesForStudent.reduce((acc, f: any) => acc + Number(f.amount || 0), 0);
    entry.expected += expectedSum;
    byStudent.set(sid, entry);
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





