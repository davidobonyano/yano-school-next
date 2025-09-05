"use client";

import { useEffect, useMemo, useState } from 'react';
import { useGlobalAcademicContext } from '@/contexts/GlobalAcademicContext';
import { exportToCSV } from '@/lib/export-utils';
import Link from 'next/link';

interface RankingItem {
	studentId: string;
	fullName: string;
	aggregate: number;
	rank: number;
}

export default function AdminResultsPage() {
	const { academicContext } = useGlobalAcademicContext();
	const [classLevel, setClassLevel] = useState('SS1');
	const [stream, setStream] = useState<'All' | string>('All');
	const [session, setSession] = useState<string>(academicContext?.session || '2024/2025');
	const [term, setTerm] = useState<string>(academicContext?.term || 'First Term');
	const [rankings, setRankings] = useState<RankingItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
			setSession(academicContext?.session || session);
		setTerm(academicContext?.term || term);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [academicContext?.session, academicContext?.term]);

	const fetchRankings = async () => {
		try {
			setLoading(true);
			setError(null);
			const params = new URLSearchParams({ class_level: classLevel, term, session });
			if (stream && stream !== 'All') params.set('stream', stream);
			const res = await fetch(`/api/reports/results?${params.toString()}`, { cache: 'no-store' });
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || 'Failed to load rankings');
			setRankings(json.rankings || []);
		} catch (e: any) {
			setError(e?.message || 'Unexpected error');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchRankings();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [classLevel, stream, session, term]);

	const handleExportCSV = () => {
		const formatted = rankings.map(r => ({
			'Rank': r.rank,
			'Student': r.fullName,
			'Student ID': r.studentId,
			'Aggregate Score': r.aggregate,
			'Session': session,
			'Term': term,
			'Class': classLevel,
			'Stream': stream === 'All' ? '' : stream
		}));
		exportToCSV(formatted, `rankings-${classLevel}-${term}-${session}`);
	};

	return (
		<div className="p-6 bg-gray-50 min-h-screen">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">Results Overview</h1>
				<div className="flex gap-2">
					<button onClick={handleExportCSV} className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50">Export CSV</button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
				<select value={classLevel} onChange={e => setClassLevel(e.target.value)} className="border rounded px-3 py-2 bg-white">
					<option>All</option>
					<option>KG1</option>
					<option>KG2</option>
					<option>PRI1</option>
					<option>PRI2</option>
					<option>PRI3</option>
					<option>PRI4</option>
					<option>PRI5</option>
					<option>PRI6</option>
					<option>JSS1</option>
					<option>JSS2</option>
					<option>JSS3</option>
					<option>SS1</option>
					<option>SS2</option>
					<option>SS3</option>
				</select>
				<input value={typeof stream === 'string' ? stream : ''} onChange={e => setStream((e.target.value || 'All') as any)} className="border rounded px-3 py-2 bg-white" placeholder="Stream (or All)" />
				<input value={session} onChange={e => setSession(e.target.value)} className="border rounded px-3 py-2 bg-white" placeholder="Session e.g. 2024/2025" />
				<select value={term} onChange={e => setTerm(e.target.value)} className="border rounded px-3 py-2 bg-white">
					<option>First Term</option>
					<option>Second Term</option>
					<option>Third Term</option>
				</select>
				<button onClick={fetchRankings} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Load</button>
			</div>

			{error && (
				<div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded mb-4 text-sm">{error}</div>
			)}

			<div className="bg-white rounded-lg shadow border overflow-hidden">
				<div className="px-4 py-3 border-b flex items-center justify-between">
					<h2 className="font-semibold">Class Rankings</h2>
					<span className="text-sm text-gray-500">{term} • {session} • {classLevel}{stream && stream !== 'All' ? ` • ${stream}` : ''}</span>
				</div>
				<div className="overflow-auto">
					<table className="min-w-full text-sm">
						<thead className="bg-gray-50">
							<tr>
								<th className="text-left px-4 py-2">Rank</th>
								<th className="text-left px-4 py-2">Student</th>
								<th className="text-left px-4 py-2">Aggregate</th>
								<th className="text-left px-4 py-2">Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr><td className="px-4 py-3" colSpan={4}>Loading...</td></tr>
							) : rankings.length === 0 ? (
								<tr><td className="px-4 py-3" colSpan={4}>No data</td></tr>
							) : (
								rankings.map(r => (
									<tr key={r.studentId} className="border-t">
										<td className="px-4 py-2">{r.rank}</td>
										<td className="px-4 py-2">{r.fullName} <span className="text-gray-400">({r.studentId})</span></td>
										<td className="px-4 py-2">{r.aggregate}</td>
										<td className="px-4 py-2">
											<div className="flex gap-2">
												<Link href={`/api/students/${r.studentId}/transcript/pdf`} target="_blank" className="text-blue-600 hover:underline">Transcript PDF</Link>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			<p className="text-xs text-gray-500 mt-4">Read-only view. Admins cannot edit student results here.</p>
		</div>
	);
} 