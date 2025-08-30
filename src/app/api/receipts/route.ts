import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .order('issued_at', { ascending: false })
      .maybeSingle(false);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const rows = (data || []).filter((r: any) => (studentId ? r.student_id === studentId : true));
    return NextResponse.json({ receipts: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}








