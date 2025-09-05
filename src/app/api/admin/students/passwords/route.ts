import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/authz';

export async function GET(request: Request) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.error as Response;

    // Get all students with their password status
    const { data: students, error } = await supabaseService
      .from('school_students')
      .select(`
        id,
        student_id,
        full_name,
        class_level,
        stream,
        last_login,
        created_at
      `)
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching students:', error);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    // Get all students who have passwords
    const { data: studentsWithPasswords, error: credError } = await supabaseService
      .from('student_credentials')
      .select('student_id');

    if (credError) {
      console.error('Error fetching student credentials:', credError);
      return NextResponse.json({ error: 'Failed to fetch password status' }, { status: 500 });
    }

    // Create a set of student IDs that have passwords
    const studentsWithPasswordsSet = new Set(
      studentsWithPasswords?.map(cred => cred.student_id) || []
    );

    // Transform the data to include password status
    const transformedStudents = students?.map(student => ({
      id: student.id,
      student_id: student.student_id,
      first_name: student.full_name.split(' ')[0] || student.full_name, // Extract first name
      last_name: student.full_name.split(' ').slice(1).join(' ') || '', // Extract last name
      class_level: student.class_level,
      stream: student.stream,
      has_password: studentsWithPasswordsSet.has(student.student_id),
      last_login: student.last_login,
      created_at: student.created_at
    })) || [];

    return NextResponse.json({ students: transformedStudents });
  } catch (error) {
    console.error('Error in students passwords API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


