import { NextRequest, NextResponse } from 'next/server';
import { supabaseService as supabase } from '@/lib/supabase-server';

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

function normalizeTermName(term: string): 'First' | 'Second' | 'Third' {
	const t = (term || '').toLowerCase().trim();
	if (t.includes('first') || t.includes('1st') || t.startsWith('1')) return 'First';
	if (t.includes('second') || t.includes('2nd') || t.startsWith('2')) return 'Second';
	if (t.includes('third') || t.includes('3rd') || t.startsWith('3')) return 'Third';
	return 'First';
}

function computeGradePoint(grade: string | null | undefined): number {
	const g = (grade || '').toUpperCase();
	if (g === 'A' || g === 'A1' || g === 'A+') return 5;
	if (g === 'B' || g === 'B2' || g === 'B+') return 4;
	if (g === 'C' || g === 'C3' || g === 'C+') return 3;
	if (g === 'D' || g === 'D7') return 2;
	if (g === 'E' || g === 'E8') return 1;
	return 0;
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const classLevel = searchParams.get('class_level');
		const stream = searchParams.get('stream');
		const term = searchParams.get('term');
		const session = searchParams.get('session');

		if (!classLevel || !term || !session) {
			return NextResponse.json({ error: 'class_level, term, session are required' }, { status: 400 });
		}

		// Resolve session and term ids
		const { data: sessionRow, error: sErr } = await supabase
			.from('academic_sessions')
			.select('id')
			.eq('name', session)
			.maybeSingle();
		if (sErr || !sessionRow) return NextResponse.json({ error: sErr?.message || 'Session not found' }, { status: 400 });

		const termNorm = normalizeTermName(term);
		const [p1, p2] = termNamePatterns(termNorm as any);
		const { data: termRow, error: tErr } = await supabase
			.from('academic_terms')
			.select('id')
			.eq('session_id', sessionRow.id)
			.or(`name.ilike.${p1},name.ilike.${p2}`)
			.maybeSingle();
		if (tErr || !termRow) return NextResponse.json({ error: tErr?.message || 'Term not found' }, { status: 400 });

		// Students in class/stream
		let studentsQuery = supabase
			.from('school_students')
			.select('student_id, full_name, class_level, stream')
			.eq('is_active', true)
			.eq('class_level', classLevel);
		if (stream && stream !== 'All' && stream !== 'null') {
			const s = String(stream).toLowerCase();
			let variants: string[] = [];
			if (s.startsWith('art')) variants = ['Art', 'Arts', 'art', 'arts', 'ART', 'ARTS'];
			else if (s.startsWith('science')) variants = ['Science', 'Sciences', 'science', 'sciences', 'SCIENCE', 'SCIENCES'];
			else if (s.startsWith('comm')) variants = ['Commercial', 'Commerce', 'commercial', 'commerce', 'COMMERCIAL', 'COMMERCE'];
			else variants = [stream];
			studentsQuery = studentsQuery.in('stream', variants);
		}
		const { data: students, error: stErr } = await studentsQuery;
		if (stErr) return NextResponse.json({ error: stErr.message }, { status: 500 });
		const studentIds = (students || []).map(s => s.student_id);
		const idToName: Record<string, string> = {};
		(students || []).forEach(s => { idToName[s.student_id] = s.full_name; });
		if (studentIds.length === 0) return NextResponse.json({ courses: [], students: [] });

		// Courses for this class_level for this period
		let { data: courses, error: cErr } = await supabase
			.from('courses')
			.select('id, name, class_level, term, term_id, session_id')
			.eq('class_level', classLevel)
			.or(`term_id.eq.${termRow.id},and(term.eq.${term},session_id.eq.${sessionRow.id})`)
			.order('name', { ascending: true });
		if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
		// Fallback: if none matched due to missing term columns, fetch by class only
		if (!courses || courses.length === 0) {
			const fallback = await supabase
				.from('courses')
				.select('id, name, class_level')
				.eq('class_level', classLevel)
				.order('name', { ascending: true });
			if (!fallback.error && fallback.data) courses = fallback.data as any[];
		}

		// Dedupe by name (case-insensitive), prefer entries with matching term_id
    type CourseRow = { id: string; name: string; term_id?: string | null } & Record<string, any>;
    const uniqueByName: Record<string, CourseRow> = {};
    for (const c of ((courses as CourseRow[] | null) || [])) {
			const key = String(c.name || '').trim().toLowerCase();
			if (!key) continue;
			const existing = uniqueByName[key];
			if (!existing) {
				uniqueByName[key] = c;
			} else {
        const existingPref = (existing.term_id as string | null) === termRow.id ? 1 : 0;
        const currentPref = (c.term_id as string | null) === termRow.id ? 1 : 0;
				if (currentPref > existingPref) uniqueByName[key] = c;
			}
		}
    const uniqueCourses = Object.values(uniqueByName);

		// Results for this period and students (for per-course rankings)
		const { data: periodResults, error: prErr } = await supabase
			.from('student_results')
			.select('student_id, course_id, total_score, grade')
			.eq('session_id', sessionRow.id)
			.eq('term_id', termRow.id)
			.in('student_id', studentIds);
		if (prErr) return NextResponse.json({ error: prErr.message }, { status: 500 });

		// All results for CGPA (across all sessions/terms)
		const { data: allResults, error: arErr } = await supabase
			.from('student_results')
			.select('student_id, total_score, grade')
			.in('student_id', studentIds);
		if (arErr) return NextResponse.json({ error: arErr.message }, { status: 500 });

		// Build per-course rankings
    type PeriodResult = { student_id: string; course_id: string; total_score: number; grade: string | null };
    const courseIdToRows: Record<string, { studentId: string; fullName: string; score: number }[]> = {};
    ((periodResults as PeriodResult[] | null) || []).forEach((r) => {
			const list = courseIdToRows[r.course_id] || [];
			list.push({ studentId: r.student_id, fullName: idToName[r.student_id] || r.student_id, score: Number(r.total_score || 0) });
			courseIdToRows[r.course_id] = list;
		});
		Object.keys(courseIdToRows).forEach(cid => {
			courseIdToRows[cid].sort((a, b) => b.score - a.score);
			let rank = 0; let last: number | null = null;
			courseIdToRows[cid] = courseIdToRows[cid].map(row => {
				if (last === null || row.score < last) { rank += 1; last = row.score; }
				return { ...row, rank };
			});
		});

		// Per-student GPA for period and CGPA overall (simple GPA: average grade points across subjects)
    const studentPeriodGpa: Record<string, number> = {};
		const studentCgpa: Record<string, number> = {};
		const periodGrades: Record<string, number[]> = {};
		const allGrades: Record<string, number[]> = {};

    ((periodResults as PeriodResult[] | null) || []).forEach((r) => {
			const gp = computeGradePoint(r.grade);
			if (!periodGrades[r.student_id]) periodGrades[r.student_id] = [];
			periodGrades[r.student_id].push(gp);
		});
		Object.keys(periodGrades).forEach(sid => {
			const arr = periodGrades[sid];
			studentPeriodGpa[sid] = arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
		});

    type AnyResult = { student_id: string; grade: string | null };
    ((allResults as AnyResult[] | null) || []).forEach((r) => {
			const gp = computeGradePoint(r.grade);
			if (!allGrades[r.student_id]) allGrades[r.student_id] = [];
			allGrades[r.student_id].push(gp);
		});
		Object.keys(allGrades).forEach(sid => {
			const arr = allGrades[sid];
			studentCgpa[sid] = arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
		});

		// Compose course summaries
    const courseSummaries = (uniqueCourses || []).map((c) => {
			const rows = courseIdToRows[c.id] || [];
			const top = rows[0] || null;
			return {
				courseId: c.id,
				courseName: c.name,
				topStudent: top,
				rankings: rows
			};
		});

		// Compose students list with GPA/CGPA
		const studentsList = (students || []).map(s => ({
			studentId: s.student_id,
			fullName: s.full_name,
			gpa: Number((studentPeriodGpa[s.student_id] || 0).toFixed(2)),
			cgpa: Number((studentCgpa[s.student_id] || 0).toFixed(2))
		}));

		// Overall best by aggregate this period
		const totalsMap = new Map<string, number>();
		(periodResults || []).forEach((r: any) => {
			totalsMap.set(r.student_id, (totalsMap.get(r.student_id) || 0) + Number(r.total_score || 0));
		});
		const overall = studentsList.map(s => ({
			studentId: s.studentId,
			fullName: s.fullName,
			aggregate: totalsMap.get(s.studentId) || 0
		})).sort((a, b) => b.aggregate - a.aggregate).map((row, idx) => ({ ...row, rank: idx + 1 }));

		return NextResponse.json({
			courses: courseSummaries,
			students: studentsList,
			overall
		});
	} catch (err: any) {
		return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
	}
}
