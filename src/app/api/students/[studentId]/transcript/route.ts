import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest, context: { params: Promise<{ studentId: string }> }) {
	try {
		const { studentId } = await context.params;
		if (!studentId) return NextResponse.json({ error: 'studentId is required' }, { status: 400 });

		// Fetch student basic info
		const { data: student, error: sErr } = await supabase
			.from('school_students')
			.select('student_id, full_name, class_level, stream')
			.eq('student_id', studentId)
			.maybeSingle();
		if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
		if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

		// Fetch all results with session/term names and course names
		const { data: results, error: rErr } = await supabase
			.from('student_results')
			.select(`
				id, course_id, ca_score, midterm_score, exam_score, total_score, grade, remark,
				session_id, term_id,
				courses:course_id (name),
				academic_sessions:session_id (name),
				academic_terms:term_id (name)
			`)
			.eq('student_id', studentId)
			.order('created_at', { ascending: true });
		if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

		const rows = (results || []).map((r: any) => ({
			course: r.courses?.name || r.course_id,
			session: r.academic_sessions?.name || r.session_id,
			term: r.academic_terms?.name || r.term_id,
			ca: r.ca_score,
			midterm: r.midterm_score,
			exam: r.exam_score,
			total: r.total_score,
			grade: r.grade,
			remark: r.remark
		}));

		return NextResponse.json({
			student: {
				id: student.student_id,
				name: student.full_name,
				class_level: student.class_level,
				stream: student.stream
			},
			results: rows
		});
	} catch (err: any) {
		return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
	}
} 