'use client';

import { useEffect, useMemo, useState } from 'react';
import { useNotifications } from '@/components/ui/notifications';
import { useAcademicContext } from '@/lib/academic-context';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faFilter, faSave, faUsers, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { CLASS_LEVELS } from '@/types/courses';

interface Student {
	id: string;
	name: string;
	class_level: string;
	stream: string;
	status?: string;
}

interface ApprovedCourse {
	id: string;
	name?: string;
	code?: string;
	class_level?: string;
}

interface ExistingResult {
	courseId: string;
	courseName: string;
	ca: number;
	midterm: number;
	exam: number;
	total: number;
	grade: string;
}

interface ScoreInputs {
	ca: number; // over 20
	midterm: number; // over 20
	exam: number; // over 60
}

function calculateTotalScore(inputs: ScoreInputs): number {
	const ca = Number(inputs.ca || 0);
	const mid = Number(inputs.midterm || 0);
	const ex = Number(inputs.exam || 0);
	return ca + mid + ex;
}

function gradeFromTotal(total: number): string {
	if (total >= 75) return 'A1';
	if (total >= 70) return 'B2';
	if (total >= 65) return 'B3';
	if (total >= 60) return 'C4';
	if (total >= 55) return 'C5';
	if (total >= 50) return 'C6';
	if (total >= 45) return 'D7';
	if (total >= 40) return 'E8';
	return 'F9';
}

export default function ResultsManagementPage() {
	const { currentContext, isLoading: contextLoading } = useAcademicContext();
  const { showSuccessToast, showErrorToast } = useNotifications();

	const [sessionFilter, setSessionFilter] = useState<string>('');
	const [termFilter, setTermFilter] = useState<string>('');
	const [availableSessions, setAvailableSessions] = useState<string[]>([]);
	const [availableTerms, setAvailableTerms] = useState<string[]>([]);
	const [classLevel, setClassLevel] = useState<string>('All');
	const [stream, setStream] = useState<string>('All');
	const [students, setStudents] = useState<Student[]>([]);
	const [studentsLoading, setStudentsLoading] = useState<boolean>(false);
	const [selectedStudentId, setSelectedStudentId] = useState<string>('');

	const [courses, setCourses] = useState<ApprovedCourse[]>([]);
	const [coursesLoading, setCoursesLoading] = useState<boolean>(false);
	const [scoresByCourseId, setScoresByCourseId] = useState<Record<string, ScoreInputs>>({});
	const [savingCourseId, setSavingCourseId] = useState<string>('');
	const [existingResults, setExistingResults] = useState<ExistingResult[]>([]);
	const [bulkSaving, setBulkSaving] = useState<boolean>(false);
	const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
	const [bulkText, setBulkText] = useState<string>('');

	const sessionName = sessionFilter || currentContext?.session_name || '';
	const termName = termFilter || currentContext?.term_name || '';

	// Initialize filters to current context on mount and fetch available options
	useEffect(() => {
		const fetchAvailableOptions = async () => {
			try {
				const response = await fetch('/api/academic/sessions-terms');
				if (response.ok) {
					const data = await response.json();
					setAvailableSessions(data.sessions || []);
					setAvailableTerms(data.terms || []);
				}
			} catch (error) {
				console.error('Failed to fetch sessions and terms:', error);
			}
		};

		if (currentContext && !sessionFilter) {
			setSessionFilter(currentContext.session_name || '');
			setTermFilter(currentContext.term_name || '');
		}
		
		fetchAvailableOptions();
	}, [currentContext, sessionFilter]);

	const classLevelOptions = useMemo(() => [
		'All', ...CLASS_LEVELS
	], []);

	const streamOptions = useMemo(() => [
		'All', 'Arts', 'Science', 'Commercial', 'General'
	], []);

	// Load students when class/stream selected
	useEffect(() => {
		const fetchStudents = async () => {
			setStudentsLoading(true);
			try {
				const params = new URLSearchParams();
				if (classLevel && classLevel !== 'All') params.set('class_level', classLevel);
				if (stream && stream !== 'All') params.set('stream', stream);
				const res = await fetch(`/api/students/by-class?${params.toString()}`);
				if (!res.ok) throw new Error('Failed to fetch students');
				const data = await res.json();
				const mapped: Student[] = (data.students || []).map((s: any) => ({
					id: s.student_id,
					name: s.full_name,
					class_level: s.class_level,
					stream: s.stream,
					status: s.is_active ? 'active' : 'inactive'
				}));
				setStudents(mapped);
			} catch (err) {
				console.error(err);
				setStudents([]);
			} finally {
				setStudentsLoading(false);
			}
		};
		fetchStudents();
		// Reset selection when filters change
		setSelectedStudentId('');
		setCourses([]);
		setScoresByCourseId({});
		setExistingResults([]);
	}, [classLevel, stream]);

	// Load approved courses when student is selected
	useEffect(() => {
		const fetchApprovedCourses = async () => {
			if (!selectedStudentId || !sessionName || !termName) {
				setCourses([]);
				setExistingResults([]);
				return;
			}
			setCoursesLoading(true);
			try {
				const url = `/api/courses/approved?student_id=${encodeURIComponent(selectedStudentId)}&term=${encodeURIComponent(termName)}&session=${encodeURIComponent(sessionName)}`;
				const res = await fetch(url);
				if (!res.ok) throw new Error('Failed to fetch approved courses');
				const data = await res.json();
				const approved: ApprovedCourse[] = data.courses || [];
				setCourses(approved);
				// Initialize score inputs if not present
				setScoresByCourseId(prev => {
					const next = { ...prev };
					for (const c of approved) {
						if (!next[c.id]) next[c.id] = { ca: 0, midterm: 0, exam: 0 };
					}
					return next;
				});
				// Fetch existing results and prefill
				const r = await fetch(`/api/results?student_id=${encodeURIComponent(selectedStudentId)}&session=${encodeURIComponent(sessionName)}&term=${encodeURIComponent(termName)}`);
				if (r.ok) {
					const rd = await r.json();
					const results: ExistingResult[] = (rd.results || []).map((x: any) => ({
						courseId: x.courseId,
						courseName: x.courseName,
						ca: Number(x.ca || 0),
						midterm: Number(x.midterm || 0),
						exam: Number(x.exam || 0),
						total: Number(x.total || 0),
						grade: x.grade || gradeFromTotal(Number(x.total || 0))
					}));
					setExistingResults(results);
					// Prefill inputs for matching courses
					setScoresByCourseId(prev => {
						const filled = { ...prev };
						for (const resu of results) {
							if (filled[resu.courseId]) {
								filled[resu.courseId] = { ca: resu.ca, midterm: resu.midterm, exam: resu.exam };
							}
						}
						return filled;
					});
				}
			} catch (err) {
				console.error(err);
				setCourses([]);
				setExistingResults([]);
			} finally {
				setCoursesLoading(false);
			}
		};
		fetchApprovedCourses();
	}, [selectedStudentId, sessionName, termName]);

	const updateScore = (courseId: string, field: keyof ScoreInputs, value: number) => {
		setScoresByCourseId(prev => ({
			...prev,
			[courseId]: {
				...prev[courseId],
				[field]: Number.isFinite(value) ? value : 0
			}
		}) as Record<string, ScoreInputs>);
	};

	const saveCourseScore = async (courseId: string, silent = false) => {
		if (!selectedStudentId || !sessionName || !termName) return;
		const inputs = scoresByCourseId[courseId] || { ca: 0, midterm: 0, exam: 0 };
		// Basic validation
		if (inputs.ca < 0 || inputs.ca > 20) return !silent && showErrorToast('CA must be between 0 and 20');
		if (inputs.midterm < 0 || inputs.midterm > 20) return !silent && showErrorToast('Midterm must be between 0 and 20');
		if (inputs.exam < 0 || inputs.exam > 60) return !silent && showErrorToast('Exam must be between 0 and 60');

		setSavingCourseId(courseId);
		try {
			const resp = await fetch('/api/results/upsert', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					studentId: selectedStudentId,
					courseId,
					session: sessionName,
					term: termName,
					ca: inputs.ca,
					midterm: inputs.midterm,
					exam: inputs.exam
				})
			});
			if (!resp.ok) {
				const err = await resp.json().catch(() => ({}));
				throw new Error(err.error || 'Failed to save result');
			}
			if (!silent) showSuccessToast('Result saved');
		} catch (e) {
			console.error('Failed to save result', e);
			!silent && showErrorToast(e instanceof Error ? e.message : 'Failed to save');
		} finally {
			setSavingCourseId('');
		}
	};

	const saveAll = async () => {
		if (!selectedStudentId) return;
		setBulkSaving(true);
		try {
			const errors: string[] = [];
			for (const c of courses) {
				try {
					await saveCourseScore(c.id, true);
				} catch (e) {
					errors.push(c.name || c.code || c.id);
				}
			}
			if (errors.length > 0) {
				showErrorToast(`Some courses failed to save: ${errors.join(', ')}`);
			} else {
				showSuccessToast('All results saved');
			}
			// Refresh existing results after save
			const r = await fetch(`/api/results?student_id=${encodeURIComponent(selectedStudentId)}&session=${encodeURIComponent(sessionName)}&term=${encodeURIComponent(termName)}`);
			if (r.ok) {
				const rd = await r.json();
				const results: ExistingResult[] = (rd.results || []).map((x: any) => ({
					courseId: x.courseId,
					courseName: x.courseName,
					ca: Number(x.ca || 0),
					midterm: Number(x.midterm || 0),
					exam: Number(x.exam || 0),
					total: Number(x.total || 0),
					grade: x.grade || gradeFromTotal(Number(x.total || 0))
				}));
				setExistingResults(results);
			} else {
				const err = await r.json().catch(() => ({}));
				console.error('Failed to fetch existing results:', err);
			}
		} catch (e) {
			console.error(e);
			showErrorToast(e instanceof Error ? e.message : 'Failed to save all');
		} finally {
			setBulkSaving(false);
		}
	};

	const parseBulkCSV = (text: string) => {
		// Expected headers: student_id (YAN code), course_code, ca, midterm, exam
		const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
		if (lines.length === 0) return [] as Array<{studentId:string;courseCode:string;ca:number;midterm:number;exam:number}>;
		const [headerLine, ...rows] = lines;
		const headers = headerLine.split(',').map(h => h.trim().toLowerCase());
		const idx = {
			student_id: headers.indexOf('student_id'),
			course_code: headers.indexOf('course_code'),
			ca: headers.indexOf('ca'),
			midterm: headers.indexOf('midterm'),
			exam: headers.indexOf('exam')
		};
		if (idx.student_id < 0 || idx.course_code < 0 || idx.ca < 0 || idx.midterm < 0 || idx.exam < 0) {
			throw new Error('CSV must include headers: student_id,course_code,ca,midterm,exam');
		}
		return rows.map((r) => {
			const cols = r.split(',');
			return {
				studentId: (cols[idx.student_id] || '').trim(),
				courseCode: (cols[idx.course_code] || '').trim(),
				ca: parseFloat(cols[idx.ca] || '0'),
				midterm: parseFloat(cols[idx.midterm] || '0'),
				exam: parseFloat(cols[idx.exam] || '0'),
			};
		}).filter(x => x.studentId && x.courseCode);
	};

	const handleBulkUpload = async () => {
		if (!sessionName || !termName) {
			showErrorToast('Academic context missing');
			return;
		}
		let rows: Array<{studentId:string;courseCode:string;ca:number;midterm:number;exam:number}> = [];
		try {
			rows = parseBulkCSV(bulkText);
		} catch (e) {
			showErrorToast(e instanceof Error ? e.message : 'Invalid CSV');
			return;
		}
		if (rows.length === 0) {
			showErrorToast('No valid rows found');
			return;
		}
		setBulkSaving(true);
		try {
			const results = await Promise.allSettled(rows.map(row => fetch('/api/results/upsert', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					studentId: row.studentId,
					courseCode: row.courseCode,
					session: sessionName,
					term: termName,
					ca: row.ca,
					midterm: row.midterm,
					exam: row.exam
				})
			})));
			const success = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
			const failed = results.length - success;
			showSuccessToast(`Uploaded ${success} rows${failed ? `, ${failed} failed` : ''}`);
			setShowBulkModal(false);
			setBulkText('');
		} catch (e) {
			showErrorToast('Bulk upload failed');
		} finally {
			setBulkSaving(false);
		}
	};

	return (
		<div className="p-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
						<FontAwesomeIcon icon={faChartBar} className="w-6 h-6 text-green-600" />
						Results Management
					</h1>
					<p className="text-gray-600">Enter CA, Midterm, and Exam scores for approved courses</p>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left column: Filters + Students */}
				<div className="bg-white rounded-lg shadow p-4 lg:col-span-1">
					<div className="flex items-center gap-2 mb-4">
						<FontAwesomeIcon icon={faFilter} className="w-4 h-4 text-gray-500" />
						<span className="text-sm text-gray-700">Filters</span>
					</div>
					
					{/* Session/Term Override */}
					<div className="grid grid-cols-2 gap-3 mb-4">
						<div>
							<label className="block text-xs text-gray-600 mb-1">Session</label>
							<select
								value={sessionFilter}
								onChange={(e) => setSessionFilter(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
							>
								<option value="">{contextLoading ? 'Loading...' : 'Select Session'}</option>
								{availableSessions.map((session) => (
									<option key={session} value={session}>{session}</option>
								))}
							</select>
						</div>
						<div>
							<label className="block text-xs text-gray-600 mb-1">Term</label>
							<select
								value={termFilter}
								onChange={(e) => setTermFilter(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
							>
								<option value="">{contextLoading ? 'Loading...' : 'Select Term'}</option>
								{availableTerms.map((term) => (
									<option key={term} value={term}>{term}</option>
								))}
							</select>
						</div>
					</div>

					{/* Class/Stream */}
					<div className="grid grid-cols-2 gap-3 mb-4">
						<select
							value={classLevel}
							onChange={(e) => setClassLevel(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
						>
							{classLevelOptions.map((lvl) => (
								<option key={lvl} value={lvl}>{lvl}</option>
							))}
						</select>
						<select
							value={stream}
							onChange={(e) => setStream(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
						>
							{streamOptions.map((st) => (
								<option key={st} value={st}>{st}</option>
							))}
						</select>
					</div>

					<div className="flex items-center gap-2 mb-2">
						<FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-gray-500" />
						<span className="text-sm text-gray-700">Students</span>
					</div>
					<div className="border rounded-lg max-h-[55vh] overflow-auto">
						{studentsLoading ? (
							<div className="p-4 text-sm text-gray-500">Loading students...</div>
						) : students.length === 0 ? (
							<div className="p-4 text-sm text-gray-500">No students</div>
						) : (
							<ul className="divide-y">
								{students.map((s) => (
									<li key={s.id}>
										<button
											className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${selectedStudentId === s.id ? 'bg-green-50' : ''}`}
											onClick={() => setSelectedStudentId(s.id)}
										>
											<div className="font-medium text-gray-900">{s.name}</div>
											<div className="text-xs text-gray-500">{s.id}</div>
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>

				{/* Right column: Approved courses with inputs */}
				<div className="bg-white rounded-lg shadow p-4 lg:col-span-2">
					<div className="flex justify-between items-center mb-4">
						<div>
							<h2 className="text-lg font-semibold text-gray-900">Approved Courses</h2>
							<p className="text-sm text-gray-600">Session: {contextLoading ? '...' : sessionName || 'N/A'} • Term: {contextLoading ? '...' : termName || 'N/A'}</p>
						</div>
						<div className="flex items-center gap-2 text-sm text-gray-600">
							{selectedStudentId ? `Student: ${selectedStudentId}` : 'Select a student'}
							<button
								onClick={saveAll}
								className={`ml-3 inline-flex items-center gap-2 px-3 py-1.5 rounded text-white ${bulkSaving ? 'bg-gray-400' : 'bg-green-700 hover:bg-green-800'}`}
								disabled={bulkSaving || !selectedStudentId || courses.length === 0}
							>
								{bulkSaving ? 'Saving All...' : 'Save All'}
							</button>
							<button onClick={() => setShowBulkModal(true)} className="ml-2 inline-flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Bulk Upload CSV</button>
						</div>
					</div>

					{!selectedStudentId ? (
						<div className="p-6 text-center text-gray-500">Select a student to view courses</div>
					) : coursesLoading ? (
						<div className="p-6 text-center text-gray-500">Loading courses...</div>
					) : courses.length === 0 ? (
						<div className="p-6 text-center text-gray-500">No approved courses found for this student</div>
					) : (
						<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
							<div className="xl:col-span-2 overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CA (20)</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Midterm (20)</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam (60)</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total (100)</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{courses.map((c) => {
											const inputs = scoresByCourseId[c.id] || { ca: 0, midterm: 0, exam: 0 };
											const displayName = c.code && c.name ? `${c.code} — ${c.name}` : (c.name || c.code || c.id);
											const total = calculateTotalScore(inputs);
											const grade = gradeFromTotal(total);
											const hasSaved = existingResults.some(r => r.courseId === c.id);
											return (
												<tr key={c.id} className="hover:bg-gray-50">
													<td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
														<div className="flex items-center gap-2">
															<span>{displayName}</span>
															{hasSaved && (
																<span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
																	<FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
																	Saved
																</span>
															)}
														</div>
													</td>
													<td className="px-6 py-3 whitespace-nowrap">
														<input
															type="number"
															min={0}
															max={20}
															value={inputs.ca}
															onChange={(e) => updateScore(c.id, 'ca', parseInt(e.target.value || '0', 10))}
															className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
														/>
													</td>
													<td className="px-6 py-3 whitespace-nowrap">
														<input
															type="number"
															min={0}
															max={20}
															value={inputs.midterm}
															onChange={(e) => updateScore(c.id, 'midterm', parseInt(e.target.value || '0', 10))}
															className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
														/>
													</td>
													<td className="px-6 py-3 whitespace-nowrap">
														<input
															type="number"
															min={0}
															max={60}
															value={inputs.exam}
															onChange={(e) => updateScore(c.id, 'exam', parseInt(e.target.value || '0', 10))}
															className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
														/>
													</td>
													<td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{total}</td>
													<td className="px-6 py-3 whitespace-nowrap">
														<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
															total < 40 ? 'bg-red-100 text-red-800' :
															total >= 75 ? 'bg-green-100 text-green-800' :
															total >= 60 ? 'bg-blue-100 text-blue-800' :
															'text-yellow-800 bg-yellow-100'
														}`}>{grade}</span>
													</td>
													<td className="px-6 py-3 whitespace-nowrap text-sm">
														<button
															onClick={() => saveCourseScore(c.id)}
															className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-white ${savingCourseId === c.id ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
															disabled={savingCourseId === c.id}
														>
															<FontAwesomeIcon icon={faSave} className="w-4 h-4" />
															{savingCourseId === c.id ? 'Saving...' : 'Save'}
														</button>
													</td>
												</tr>
										);
									})}
								</tbody>
							</table>
							</div>
							{/* Side panel: Existing results */}
							<div className="xl:col-span-1">
								<div className="border rounded-lg">
									<div className="px-4 py-3 border-b bg-gray-50 font-medium">Uploaded Results</div>
									<div className="max-h-[60vh] overflow-auto divide-y">
										{existingResults.length === 0 ? (
											<div className="p-4 text-sm text-gray-500">No results uploaded yet</div>
										) : existingResults.map((r) => (
											<div key={r.courseId} className="p-4">
												<div className="text-sm font-medium text-gray-900">{r.courseName}</div>
												<div className="mt-1 text-xs text-gray-600">CA {r.ca} • Mid {r.midterm} • Exam {r.exam}</div>
												<div className="mt-1 flex items-center justify-between">
													<span className="text-sm font-semibold">Total {r.total}</span>
													<span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100">{r.grade}</span>
												</div>
												<div className="mt-2">
													<button
														onClick={() => setScoresByCourseId(prev => ({ ...prev, [r.courseId]: { ca: r.ca, midterm: r.midterm, exam: r.exam } }))}
														className="text-xs text-green-700 hover:underline"
													>
														Edit in form
													</button>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{showBulkModal && (
				<div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-4">
						<div className="text-lg font-semibold mb-2">Bulk Results Upload (CSV)</div>
						<div className="text-sm text-gray-600 mb-3">Headers required: <code>student_id,course_code,ca,midterm,exam</code></div>
						<textarea
							value={bulkText}
							onChange={(e) => setBulkText(e.target.value)}
							className="w-full h-56 border rounded p-2 font-mono text-sm"
							placeholder={`student_id,course_code,ca,midterm,exam\nYAN001,MTH101,15,18,55\nYAN002,ENG201,20,19,60`}
						/>
						<div className="mt-3 flex justify-end gap-2">
							<button onClick={() => { setShowBulkModal(false); setBulkText(''); }} className="px-3 py-1.5 border rounded">Cancel</button>
							<button onClick={handleBulkUpload} disabled={bulkSaving || !bulkText.trim()} className="px-3 py-1.5 border rounded bg-green-700 text-white disabled:opacity-60">{bulkSaving ? 'Uploading...' : 'Upload'}</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
