import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const term = searchParams.get('term');
    const session = searchParams.get('session');
    const limit = Number(searchParams.get('limit') || '0');

    // Base select; include nested payment_ledger for term/session filter when provided
    let query = supabase
      .from('receipts')
      .select('*, payment_ledgers:payment_ledger_id(term, session), school_students:student_id(student_id, full_name, class_level, stream)')
      .order('issued_at', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (term) {
      query = query.eq('payment_ledgers.term', term);
    }
    if (session) {
      query = query.eq('payment_ledgers.session', session);
    }

    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Strip nested field before returning
    const rows = (data || []).map((r: any) => {
      const { payment_ledgers, school_students, ...rest } = r;
      if (school_students) {
        (rest as any).student_name = school_students.full_name || null;
        (rest as any).student_class = school_students.class_level || null;
        (rest as any).student_stream = school_students.stream || null;
      }
      return rest;
    });

    return NextResponse.json({ receipts: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}








