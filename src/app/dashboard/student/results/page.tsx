'use client';

import { useEffect, useMemo, useState } from 'react';
import { getStudentSession } from '@/lib/student-session';
import { useRouter } from 'next/navigation';

interface Row {
	id: string;
	session: string;
	term: string;
	courseName: string;
	ca: number;
	midterm: number;
	exam: number;
	total: number;
	grade: string;
}

function gradeToPoint(grade: string): number {
	if (!grade) return 0;
	if (grade.startsWith('A')) return 5.0;
	if (grade === 'B2') return 4.5;
	if (grade === 'B3') return 4.0;
	if (grade === 'C4') return 3.5;
	if (grade === 'C5') return 3.0;
	if (grade === 'C6') return 2.5;
	if (grade === 'D7') return 2.0;
	if (grade === 'E8') return 1.0;
	return 0.0;
}

export default function FullResultsPage() {
	const router = useRouter();
	const [rows, setRows] = useState<Row[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [sessionFilter, setSessionFilter] = useState<string>('All');
	const [termFilter, setTermFilter] = useState<string>('All');
	const [studentName, setStudentName] = useState<string>('');
	const [studentId, setStudentId] = useState<string>('');

	useEffect(() => {
		const s = getStudentSession();
		if (s) {
			setStudentName(s.full_name || '');
			setStudentId(s.student_id || '');
		}
		const fetchAll = async () => {
			if (!s?.student_id) return;
			setLoading(true);
			try {
				// Fetch sessions list
				const sessResp = await fetch('/api/settings/academic-context?action=sessions');
				const sessJson = await sessResp.json();
				const sessions: Array<{ name: string }> = sessJson.sessions || [];
				const terms = ['First Term', 'Second Term', 'Third Term'];
				const all: Row[] = [];
				for (const sess of sessions) {
					for (const term of terms) {
						const r = await fetch(`/api/results?student_id=${encodeURIComponent(s.student_id)}&session=${encodeURIComponent(sess.name)}&term=${encodeURIComponent(term)}`);
						if (!r.ok) continue;
						const data = await r.json();
						for (const x of (data.results || [])) {
							all.push({
								id: x.id,
								session: sess.name,
								term,
								courseName: x.courseName,
								ca: Number(x.ca || 0),
								midterm: Number(x.midterm || 0),
								exam: Number(x.exam || 0),
								total: Number(x.total || 0),
								grade: x.grade || ''
							});
						}
					}
				}
				setRows(all);
			} finally {
				setLoading(false);
			}
		};
		fetchAll();
	}, []);

	const filtered = useMemo(() => rows.filter(r =>
		(sessionFilter === 'All' || r.session === sessionFilter) &&
		(termFilter === 'All' || r.term === termFilter)
	), [rows, sessionFilter, termFilter]);

	const sessions = useMemo(() => ['All', ...Array.from(new Set(rows.map(r => r.session)))], [rows]);
	const terms = useMemo(() => ['All', 'First Term', 'Second Term', 'Third Term'], []);

	const termGpa = useMemo(() => {
		const termRows = filtered.filter(r => termFilter !== 'All');
		if (termRows.length === 0) return '—';
		const pts = termRows.map(r => gradeToPoint(r.grade));
		const g = pts.reduce((a: number, b: number) => a + b, 0) / pts.length;
		return g.toFixed(2);
	}, [filtered, termFilter]);

	const overallCgpa = useMemo(() => {
		if (rows.length === 0) return '0.00';
		const pts = rows.map(r => gradeToPoint(r.grade));
		const g = pts.reduce((a: number, b: number) => a + b, 0) / pts.length;
		return g.toFixed(2);
	}, [rows]);

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-6">
				<div className="flex items-center gap-3">
					<button onClick={() => router.push('/dashboard/student/grades')} className="px-3 py-1.5 rounded border hover:bg-gray-50">Back</button>
					<h1 className="text-2xl font-bold">Full Results</h1>
				</div>
				<span className="text-sm text-gray-500">Student: {studentName || studentId}</span>
			</div>

			<div className="bg-white p-4 rounded-lg shadow border mb-4 text-sm text-gray-700">
				For an official transcript in professional report format, please visit the Admin office.
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<div className="bg-white p-4 rounded-lg shadow border">
					<h3 className="text-sm font-medium text-gray-700">Term GPA</h3>
					<p className="text-2xl font-bold text-blue-600">{termGpa}</p>
					<p className="text-xs text-gray-500 mt-1">Sum of grade points for the selected term ÷ number of subjects in that term.</p>
				</div>
				<div className="bg-white p-4 rounded-lg shadow border">
					<h3 className="text-sm font-medium text-gray-700">Overall CGPA (All Sessions)</h3>
					<p className="text-2xl font-bold text-indigo-600">{overallCgpa}</p>
					<p className="text-xs text-gray-500 mt-1">All grade points across every term/session ÷ total subjects across all sessions.</p>
				</div>
				<div className="bg-white p-4 rounded-lg shadow border">
					<h3 className="text-sm font-medium text-gray-700">Filters</h3>
					<div className="mt-2 grid grid-cols-1 gap-2">
						<div>
							<label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
							<select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)} className="w-full p-2 border rounded-md">
								{sessions.map(s => (<option key={s} value={s}>{s}</option>))}
							</select>
						</div>
						<div>
							<label className="block text-xs font-medium text-gray-600 mb-1">Term</label>
							<select value={termFilter} onChange={(e) => setTermFilter(e.target.value)} className="w-full p-2 border rounded-md">
								{terms.map(t => (<option key={t} value={t}>{t}</option>))}
							</select>
						</div>
						<div className="text-xs text-gray-600">Showing {filtered.length} of {rows.length}</div>
					</div>
				</div>
			</div>

			<div className="bg-white p-6 rounded-lg shadow border">
				{loading ? (
					<div className="text-sm text-gray-500">Loading...</div>
				) : filtered.length === 0 ? (
					<div className="text-sm text-gray-500">No results found</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full">
							<thead>
								<tr className="border-b-2 border-gray-200">
									<th className="text-left py-3 px-4 font-semibold">Session</th>
									<th className="text-left py-3 px-4 font-semibold">Term</th>
									<th className="text-left py-3 px-4 font-semibold">Subject</th>
									<th className="text-center py-3 px-4 font-semibold">CA</th>
									<th className="text-center py-3 px-4 font-semibold">Midterm</th>
									<th className="text-center py-3 px-4 font-semibold">Exam</th>
									<th className="text-center py-3 px-4 font-semibold">Total</th>
									<th className="text-center py-3 px-4 font-semibold">Grade</th>
								</tr>
							</thead>
							<tbody>
								{filtered.map(r => (
									<tr key={r.id} className="border-b hover:bg-gray-50">
										<td className="py-3 px-4">{r.session}</td>
										<td className="py-3 px-4">{r.term}</td>
										<td className="py-3 px-4">{r.courseName}</td>
										<td className="py-3 px-4 text-center">{r.ca}</td>
										<td className="py-3 px-4 text-center">{r.midterm}</td>
										<td className="py-3 px-4 text-center">{r.exam}</td>
										<td className="py-3 px-4 text-center font-semibold">{r.total}</td>
										<td className="py-3 px-4 text-center">{r.grade}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
} 