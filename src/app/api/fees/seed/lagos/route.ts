import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Lagos private-school-like baseline amounts (in NGN)
// You can tweak these later if needed
const FEES = {
	KG: { tuition_fee: 60000, development_levy: 10000, examination_fee: 5000, sports_fee: 3000, pta_fee: 5000 },
	PRI_LOWER: { tuition_fee: 70000, development_levy: 10000, examination_fee: 5000, sports_fee: 3000, pta_fee: 5000 },
	PRI_UPPER: { tuition_fee: 80000, development_levy: 10000, examination_fee: 5000, sports_fee: 3000, pta_fee: 5000 },
	JSS: { tuition_fee: 120000, development_levy: 15000, examination_fee: 7000, sports_fee: 5000, pta_fee: 5000 },
	SS: { tuition_fee: 150000, development_levy: 20000, examination_fee: 10000, sports_fee: 5000, pta_fee: 5000 },
} as const;

const TERMS = ['First Term', 'Second Term', 'Third Term'] as const;

function computeTotal(f: { tuition_fee: number; development_levy: number; examination_fee: number; sports_fee: number; pta_fee: number }) {
	return f.tuition_fee + f.development_levy + f.examination_fee + f.sports_fee + f.pta_fee;
}

function buildRows(session: string) {
	const rows: any[] = [];
	for (const term of TERMS) {
		// KG
		['KG1', 'KG2'].forEach((kg) => {
			const base = FEES.KG;
			rows.push({
				class_level_text: kg,
				class_level_code: kg,
				term: term,
				session: session,
				...base,
				total_fee: computeTotal(base),
			});
		});

		// Primary 1-6
		['Primary 1', 'Primary 2', 'Primary 3'].forEach((p) => {
			const base = FEES.PRI_LOWER;
			rows.push({
				class_level_text: p,
				class_level_code: ('PRI' + p.split(' ')[1]) as any,
				term: term,
				session: session,
				...base,
				total_fee: computeTotal(base),
			});
		});
		['Primary 4', 'Primary 5', 'Primary 6'].forEach((p) => {
			const base = FEES.PRI_UPPER;
			rows.push({
				class_level_text: p,
				class_level_code: ('PRI' + p.split(' ')[1]) as any,
				term: term,
				session: session,
				...base,
				total_fee: computeTotal(base),
			});
		});

		// JSS 1-3 (stored as 'JSS 1', etc.)
		['JSS 1', 'JSS 2', 'JSS 3'].forEach((j) => {
			const base = FEES.JSS;
			rows.push({
				class_level_text: j,
				class_level_code: (j.replace('JSS ', 'JSS')) as any,
				term: term,
				session: session,
				...base,
				total_fee: computeTotal(base),
			});
		});

		// SS1-SS3 (class_level_text can be 'SS1' or 'SS 1'; keep 'SS1' for consistency)
		['SS1', 'SS2', 'SS3'].forEach((s) => {
			const base = FEES.SS;
			rows.push({
				class_level_text: s,
				class_level_code: s as any,
				term: term,
				session: session,
				...base,
				total_fee: computeTotal(base),
			});
		});
	}
	return rows;
}

export async function POST(request: Request) {
	try {
		const body = await request.json().catch(() => ({}));
		const session = body?.session || '2024/2025';
		const terms: string[] = Array.isArray(body?.terms) && body.terms.length ? body.terms : [...TERMS];

		// Safety: delete existing structures for target session/terms to avoid duplicates
		const { error: delErr } = await supabase
			.from('fee_structures')
			.delete()
			.in('term', terms)
			.eq('session', session);
		if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

		const allRows = buildRows(session).filter((r) => terms.includes(r.term));

		const { data, error } = await supabase.from('fee_structures').insert(allRows).select('*');
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });
		return NextResponse.json({ success: true, inserted: data?.length || 0, session, terms, fees: data });
	} catch (err: any) {
		return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
	}
}
