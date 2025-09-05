import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { readAdminSession } from '@/lib/admin-session';

// GET: list all students for admin
export async function GET(request: Request) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { searchParams } = new URL(request.url);
  const classLevel = searchParams.get('classLevel');
  const stream = searchParams.get('stream');
  
  let query = supabase
    .from('school_students')
    .select('id, student_id, full_name, class_level, stream')
    .order('student_id');
    
  if (classLevel && classLevel !== 'All') {
    query = query.eq('class_level', classLevel);
  }
  
  if (stream && stream !== 'All') {
    query = query.eq('stream', stream);
  }
  
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json({ students: data || [] });
}
