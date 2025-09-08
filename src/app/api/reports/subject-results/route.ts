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

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const classLevel = searchParams.get('class_level');
		const stream = searchParams.get('stream');
		const term = searchParams.get('term');
		const session = searchParams.get('session');
		const courseId = searchParams.get('course_id');

		if (!term || !session || !courseId) {
			return NextResponse.json({ error: 'term, session and course_id are required' }, { status: 400 });
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

		// Get students optionally filtered by class/stream
		let studentsQuery = supabase
			.from('school_students')
			.select('student_id, full_name, class_level, stream')
			.eq('is_active', true);
		if (classLevel && classLevel !== 'All') {
			studentsQuery = studentsQuery.eq('class_level', classLevel);
		}
		if (stream && stream !== 'All' && stream !== 'null') {
			studentsQuery = studentsQuery.eq('stream', stream);
		}
		const { data: students, error: stErr } = await studentsQuery;
		if (stErr) return NextResponse.json({ error: stErr.message }, { status: 500 });
		const studentIds = (students || []).map(s => s.student_id);
		const idToName: Record<string, string> = {};
		(students || []).forEach(s => {
			idToName[s.student_id] = s.full_name;
		});

		if (studentIds.length === 0) return NextResponse.json({ rankings: [] });

		// Fetch per-subject results for selected course in period and selected students
		const { data: results, error: resErr } = await supabase
			.from('student_results')
			.select('student_id, total_score')
			.eq('session_id', sessionRow.id)
			.eq('term_id', termRow.id)
			.eq('course_id', courseId)
			.in('student_id', studentIds);
		if (resErr) return NextResponse.json({ error: resErr.message }, { status: 500 });

		// Build ranking list for this subject
		const totalsMap = new Map<string, number>();
		for (const row of results || []) {
			const sid = (row as any).student_id as string;
			const tot = Number((row as any).total_score || 0);
			totalsMap.set(sid, (totalsMap.get(sid) || 0) + tot);
		}

		const list = studentIds.map(sid => ({
			studentId: sid,
			fullName: idToName[sid] || sid,
			score: totalsMap.get(sid) || 0
		}));
		list.sort((a, b) => b.score - a.score);

		let currentRank = 0;
		let lastAggregate: number | null = null;
		const rankings = list.map(item => {
			if (lastAggregate === null || item.score < lastAggregate) {
				currentRank += 1;
				lastAggregate = item.score;
			}
			return { ...item, rank: currentRank };
		});

		return NextResponse.json({ rankings });
	} catch (err: any) {
		return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
	}
} 