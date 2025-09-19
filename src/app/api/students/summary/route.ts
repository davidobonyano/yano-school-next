import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function gradeToPoint(grade: string): number {
	const g = (grade || '').toUpperCase();
	// Granular mapping per student-facing rules
	if (g === 'A1' || g.startsWith('A')) return 5.0;
	if (g === 'B2') return 4.5;
	if (g === 'B3') return 4.0;
	if (g === 'C4') return 3.5;
	if (g === 'C5') return 3.0;
	if (g === 'C6') return 2.5;
	if (g === 'D7') return 2.0;
	if (g === 'E8') return 1.0;
	return 0.0;
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
		const studentId = searchParams.get('student_id');
		const session = searchParams.get('session');
		const term = searchParams.get('term'); // optional for term GPA

		if (!studentId) {
			return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
		}

		// Resolve session id if provided
		let sessionId: string | null = null;
		if (session) {
			const { data: sessionRow, error: sErr } = await supabase
				.from('academic_sessions')
				.select('id')
				.eq('name', session)
				.maybeSingle();
			if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
			sessionId = sessionRow?.id ?? null;
		}

		// Prepare queries in parallel
		const overallQuery = supabase
			.from('student_results')
			.select('grade')
			.eq('student_id', studentId);

		const sessionQuery = sessionId
			? supabase
					.from('student_results')
					.select('grade')
					.eq('student_id', studentId)
					.eq('session_id', sessionId)
			: null;

		let termQuery: any = null;
		if (sessionId && term) {
			const termNorm = normalizeTermName(term);
			const [p1, p2] = ((): [string, string] => {
				switch (termNorm) {
					case 'First':
						return ['1st%', 'First%'];
					case 'Second':
						return ['2nd%', 'Second%'];
					case 'Third':
						return ['3rd%', 'Third%'];
				}
			})();
			const { data: termRow, error: tErr } = await supabase
				.from('academic_terms')
				.select('id')
				.eq('session_id', sessionId)
				.or(`name.ilike.${p1},name.ilike.${p2}`)
				.maybeSingle();
			if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });
			if (termRow?.id) {
				termQuery = supabase
					.from('student_results')
					.select('grade')
					.eq('student_id', studentId)
					.eq('session_id', sessionId)
					.eq('term_id', termRow.id);
			}
		}

		const [overallRes, sessionRes, termRes] = await Promise.all([
			overallQuery,
			sessionQuery ?? Promise.resolve({ data: null, error: null }),
			termQuery ?? Promise.resolve({ data: null, error: null })
		]);

		if (overallRes.error) return NextResponse.json({ error: overallRes.error.message }, { status: 500 });
		if (sessionRes?.error) return NextResponse.json({ error: sessionRes.error.message }, { status: 500 });
		if (termRes?.error) return NextResponse.json({ error: termRes.error.message }, { status: 500 });

		const computeAvg = (grades: Array<{ grade: string }> | null | undefined) => {
			const pts = (grades || []).map(r => gradeToPoint(r.grade));
			if (pts.length === 0) return '0.00';
			const g = pts.reduce((a, b) => a + b, 0) / pts.length;
			return g.toFixed(2);
		};

		const responseJson = {
			overallCgpa: computeAvg(overallRes.data as Array<{ grade: string }> | null),
			sessionCgpa: computeAvg(sessionRes?.data as Array<{ grade: string }> | null),
			termGpa: computeAvg(termRes?.data as Array<{ grade: string }> | null)
		};

		return new NextResponse(JSON.stringify(responseJson), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}


