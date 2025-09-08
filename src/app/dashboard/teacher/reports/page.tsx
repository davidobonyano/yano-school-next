'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileExport,
  faChartBar,
  faDownload,
  faFilter,
  faCalendarAlt,
  faUsers,
  faBookOpen,
  faClipboardList,
  faChartLine,
  faPrint
} from '@fortawesome/free-solid-svg-icons';

interface ReportData {
  id: string;
  name: string;
  type: 'academic' | 'attendance' | 'performance' | 'comprehensive';
  dateRange: string;
  status: 'generated' | 'pending' | 'failed';
  downloadUrl?: string;
  createdAt: string;
}

export default function TeacherReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [dateRange, setDateRange] = useState('current-term');

  // Fetch reports data
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        // TODO: Replace with real API call
        // const response = await fetch('/api/teachers/reports');
        // const data = await response.json();
        // setReports(data.reports || []);
        
        // For now, set empty array
        setReports([]);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const generateReport = async (type: string) => {
    try {
      // TODO: Implement report generation API call
      console.log('Generating report:', type);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newReport: ReportData = {
        id: `report${Date.now()}`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
        type: type as any,
        dateRange: dateRange,
        status: 'generated',
        createdAt: new Date().toISOString()
      };
      
      setReports([newReport, ...reports]);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const downloadReport = (report: ReportData) => {
    // TODO: Implement actual download functionality
    console.log('Downloading report:', report.id);
  };

  const printReport = (report: ReportData) => {
    // TODO: Implement print functionality
    console.log('Printing report:', report.id);
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'academic': return faBookOpen;
      case 'attendance': return faUsers;
      case 'performance': return faChartLine;
      case 'comprehensive': return faChartBar;
      default: return faFileExport;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'generated': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800'}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-gray-200 rounded-lg h-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faFileExport} className="w-6 h-6 text-teal-600" />
          Reports & Analytics
        </h1>
        <p className="text-gray-600">Generate and manage comprehensive reports for your classes</p>
      </div>

      {/* Quick Report Generation */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate New Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Select Report Type</option>
              <option value="academic">Academic Performance</option>
              <option value="performance">Class Performance</option>
              <option value="comprehensive">Comprehensive Report</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="current-term">Current Term</option>
              <option value="last-term">Last Term</option>
              <option value="current-year">Current Academic Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => generateReport(selectedReportType)}
              disabled={!selectedReportType}
              className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faFileExport} className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Academic Rankings */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Rankings</h2>
        <AcademicRankings />
      </div>

      {/* Report Types Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faBookOpen} className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Academic Reports</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.type === 'academic').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faChartLine} className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Performance Reports</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.type === 'performance').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-orange-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faChartBar} className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Comprehensive</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.type === 'comprehensive').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Reports */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Generated Reports</h2>
        </div>
        
        {reports.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {reports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <FontAwesomeIcon icon={getReportIcon(report.type)} className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center">
                          <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-1" />
                          {report.dateRange}
                        </span>
                        <span className={getStatusBadge(report.status)}>
                          {report.status}
                        </span>
                        <span>
                          Generated: {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {report.status === 'generated' && (
                      <>
                        <button
                          onClick={() => downloadReport(report)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download Report"
                        >
                          <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => printReport(report)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Print Report"
                        >
                          <FontAwesomeIcon icon={faPrint} className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faFileExport} className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Generated</h3>
            <p className="text-gray-500">
              You haven't generated any reports yet. Use the form above to create your first report.
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-teal-50 border border-teal-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-teal-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-teal-200">
            <h4 className="font-medium text-gray-900 mb-2">Bulk Report Generation</h4>
            <p className="text-sm text-gray-600 mb-3">
              Need to generate multiple reports at once? Contact the administration office.
            </p>
            <a 
              href="/contact" 
              className="text-teal-600 hover:text-teal-800 text-sm font-medium"
            >
              Contact Admin →
            </a>
          </div>
          <div className="bg-white rounded-lg p-4 border border-teal-200">
            <h4 className="font-medium text-gray-900 mb-2">Custom Report Templates</h4>
            <p className="text-sm text-gray-600 mb-3">
              Request custom report templates for specific needs.
            </p>
            <span className="text-teal-600 text-sm font-medium">
              📧 Submit Request
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 

function AcademicRankings() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedClassLevel, setSelectedClassLevel] = useState<string>('All');
  const [selectedStream, setSelectedStream] = useState<string>('All');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overall'|'subject'|'top-per-subject'|'rankings-per-subject'|'class-courses'>('overall');
  const [loading, setLoading] = useState<boolean>(false);
  const [overallRankings, setOverallRankings] = useState<any[]>([]);
  const [subjectRankings, setSubjectRankings] = useState<any[]>([]);

  const downloadCSV = (filename: string, rows: Array<Record<string, any>>) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = () => {
    const meta = `${selectedSession}_${selectedTerm}_${selectedClassLevel}${selectedClassLevel.startsWith('SS') && selectedStream && selectedStream !== 'All' ? '_' + selectedStream : ''}`.replace(/\s+/g,'-');
    if (activeTab === 'overall') {
      const rows = overallRankings.map(r => ({ Rank: r.rank, Student: r.fullName, Aggregate: r.aggregate }));
      downloadCSV(`overall_${meta}.csv`, rows);
    } else if (activeTab === 'subject') {
      const rows = subjectRankings.map(r => ({ Rank: r.rank, Student: r.fullName, Score: r.score }));
      downloadCSV(`subject_${meta}_${(courses.find(c => c.id === selectedCourseId)?.name || 'subject')}.csv`, rows);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      const [sRes, tRes, cRes] = await Promise.all([
        fetch('/api/academic/sessions').then(r => r.json()).catch(() => ({ sessions: [] })),
        fetch('/api/academic/terms').then(r => r.json()).catch(() => ({ terms: [] })),
        fetch('/api/courses?limit=200').then(r => r.json()).catch(() => ({ courses: [] })),
      ]);
      setSessions(sRes.sessions || []);
      setTerms(tRes.terms || []);
      setCourses((cRes.courses || []).filter((c: any) => !!c?.id));
      if ((sRes.sessions || []).length > 0) setSelectedSession((sRes.sessions[0].name) || '');
      if ((tRes.terms || []).length > 0) setSelectedTerm((tRes.terms[0].name) || '');
    };
    bootstrap();
  }, []);

  const loadOverall = async () => {
    if (!selectedSession || !selectedTerm) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        session: selectedSession,
        term: selectedTerm,
        class_level: selectedClassLevel,
      });
      if (selectedStream && selectedStream !== 'All') params.append('stream', selectedStream);
      const res = await fetch(`/api/reports/results?${params.toString()}`);
      if (!res.ok) {
        console.error('results API failed', res.status);
        setOverallRankings([]);
        return;
      }
      const data = await res.json().catch(() => ({ rankings: [] }));
      setOverallRankings(Array.isArray(data.rankings) ? data.rankings : []);
    } catch (e) {
       
    } finally {
      setLoading(false);
    }
  };

  const loadSubject = async () => {
    if (!selectedSession || !selectedTerm || !selectedCourseId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        session: selectedSession,
        term: selectedTerm,
        course_id: selectedCourseId,
        class_level: selectedClassLevel,
      });
      if (selectedStream && selectedStream !== 'All') params.append('stream', selectedStream);
      const res = await fetch(`/api/reports/subject-results?${params.toString()}`);
      if (!res.ok) {
        console.error('subject-results API failed', res.status);
        setSubjectRankings([]);
        return;
      }
      const data = await res.json().catch(() => ({ rankings: [] }));
      setSubjectRankings(Array.isArray(data.rankings) ? data.rankings : []);
    } catch (e) {
       
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSession, selectedTerm, selectedClassLevel, selectedStream]);

  useEffect(() => {
    if (activeTab === 'subject') loadSubject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedSession, selectedTerm, selectedCourseId, selectedClassLevel, selectedStream]);

  const filteredTerms = terms.filter((t: any) => t?.academic_sessions?.name === selectedSession);
  const classLevels = ['All', 'NUR1', 'NUR2', 'KG1', 'KG2', 'PRI1', 'PRI2', 'PRI3', 'PRI4', 'PRI5', 'PRI6', 'JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];

  // Fetch courses when class level changes
  useEffect(() => {
    const fetchCourses = async () => {
      const params = new URLSearchParams({ limit: '200' });
      if (selectedClassLevel && selectedClassLevel !== 'All') params.append('class_level', selectedClassLevel);
      const res = await fetch(`/api/courses?${params.toString()}`);
      const data = await res.json().catch(() => ({ courses: [] }));
      const list = (data.courses || []).filter((c: any) => !!c?.id && !!c?.name);
      const seen: Record<string, boolean> = {};
      const deduped = list.filter((c: any) => {
        const key = String(c.name).trim().toLowerCase();
        if (seen[key]) return false;
        seen[key] = true;
        return true;
      });
      setCourses(deduped);
    };
    fetchCourses();
  }, [selectedClassLevel]);

  // If not SS classes, reset stream to All
  useEffect(() => {
    if (!selectedClassLevel.startsWith('SS')) {
      setSelectedStream('All');
    }
  }, [selectedClassLevel]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
        <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)} className="px-3 py-2 border rounded">
          {sessions.map((s: any) => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>
        <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="px-3 py-2 border rounded">
          {filteredTerms.map((t: any) => (
            <option key={t.id} value={t.name}>{t.name}</option>
          ))}
        </select>
        <select value={selectedClassLevel} onChange={e => setSelectedClassLevel(e.target.value)} className="px-3 py-2 border rounded">
          {classLevels.map(l => (<option key={l} value={l}>{l}</option>))}
        </select>
        {selectedClassLevel.startsWith('SS') ? (
          <select value={selectedStream} onChange={e => setSelectedStream(e.target.value)} className="px-3 py-2 border rounded">
            {['All', 'Science', 'Arts', 'Commercial'].map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
        ) : (
          <div className="px-3 py-2 text-gray-500 border rounded bg-gray-50">No Stream</div>
        )}
        <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="px-3 py-2 border rounded">
          <option value="">Select Subject/Course (optional)</option>
          {courses.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('overall')} className={`px-3 py-2 rounded ${activeTab==='overall' ? 'bg-teal-600 text-white' : 'bg-gray-100'}`}>Overall (All Subjects)</button>
        <button onClick={() => setActiveTab('subject')} className={`px-3 py-2 rounded ${activeTab==='subject' ? 'bg-teal-600 text-white' : 'bg-gray-100'}`}>By Subject</button>
        <button onClick={() => setActiveTab('top-per-subject' as any)} className={`px-3 py-2 rounded ${activeTab==='top-per-subject' ? 'bg-teal-600 text-white' : 'bg-gray-100'}`}>Top per Subject</button>
        <button onClick={() => setActiveTab('rankings-per-subject' as any)} className={`px-3 py-2 rounded ${activeTab==='rankings-per-subject' ? 'bg-teal-600 text-white' : 'bg-gray-100'}`}>Rankings per Subject</button>
        <button onClick={() => setActiveTab('class-courses' as any)} className={`px-3 py-2 rounded ${activeTab==='class-courses' ? 'bg-teal-600 text-white' : 'bg-gray-100'}`}>Class Courses Report</button>
        {(activeTab === 'overall' || activeTab === 'subject') && (
          <div className="ml-auto flex gap-2">
            <button onClick={handleDownload} className="px-3 py-2 rounded bg-gray-800 text-white">Download CSV</button>
            <button onClick={() => window.print()} className="px-3 py-2 rounded bg-gray-200">Print</button>
          </div>
        )}
      </div>

      {activeTab === 'overall' && (
        <RankingTable loading={loading} rankings={overallRankings} scoreKey="aggregate" />
      )}
      {activeTab === 'subject' && (
        <RankingTable loading={loading} rankings={subjectRankings} scoreKey="score" />
      )}
      {activeTab === 'top-per-subject' && (
        <TopPerSubject
          loading={loading}
          session={selectedSession}
          term={selectedTerm}
          classLevel={selectedClassLevel}
          stream={selectedStream}
          courses={courses}
        />
      )}
      {activeTab === 'rankings-per-subject' && (
        <PerSubjectRankings
          loading={loading}
          session={selectedSession}
          term={selectedTerm}
          classLevel={selectedClassLevel}
          stream={selectedStream}
          courses={courses}
        />
      )}
      {activeTab === 'class-courses' && (
        <ClassCoursesReport
          session={selectedSession}
          term={selectedTerm}
          classLevel={selectedClassLevel}
          stream={selectedStream}
        />
      )}
    </div>
  );
}

function RankingTable({ loading, rankings, scoreKey }: { loading: boolean; rankings: any[]; scoreKey: 'aggregate'|'score'; }) {
  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!rankings || rankings.length === 0) return <div className="text-gray-500">No data</div>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Rank</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Student</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rankings.map((r: any) => (
            <tr key={r.studentId}>
              <td className="px-4 py-2">{r.rank}</td>
              <td className="px-4 py-2">{r.fullName}</td>
              <td className="px-4 py-2">{r[scoreKey] || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopPerSubject({ loading: parentLoading, session, term, classLevel, stream, courses }: { loading: boolean; session: string; term: string; classLevel: string; stream: string; courses: any[]; }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!session || !term) return;
      setLoading(true);
      try {
        const paramsBase = new URLSearchParams({ session, term });
        if (classLevel && classLevel !== 'All') paramsBase.append('class_level', classLevel);
        if (classLevel.startsWith('SS') && stream && stream !== 'All') paramsBase.append('stream', stream);
        const courseList = (courses || []).slice(0, 100);
        const results = await Promise.all(courseList.map(async (c: any) => {
          const params = new URLSearchParams(paramsBase.toString());
          params.append('course_id', c.id);
          const res = await fetch(`/api/reports/subject-results?${params.toString()}`);
          if (!res.ok) return null;
          const data = await res.json().catch(() => ({ rankings: [] }));
          const top = (data.rankings || [])[0] || null;
          return top ? { subject: c.name, student: top.fullName, score: top.score, studentId: top.studentId } : null;
        }));
        setRows(results.filter(Boolean));
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, term, classLevel, stream, JSON.stringify(courses)]);

  if (loading || parentLoading) return <div className="text-gray-500">Loading...</div>;
  if (!rows || rows.length === 0) return <div className="text-gray-500">No data</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Subject</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Top Student</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r: any, idx: number) => (
            <tr key={idx}>
              <td className="px-4 py-2">{r.subject}</td>
              <td className="px-4 py-2">{r.student}</td>
              <td className="px-4 py-2">{r.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PerSubjectRankings({ loading: parentLoading, session, term, classLevel, stream, courses }: { loading: boolean; session: string; term: string; classLevel: string; stream: string; courses: any[]; }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const run = async () => {
      if (!session || !term) return;
      setLoading(true);
      try {
        const paramsBase = new URLSearchParams({ session, term });
        if (classLevel && classLevel !== 'All') paramsBase.append('class_level', classLevel);
        if (classLevel.startsWith('SS') && stream && stream !== 'All') paramsBase.append('stream', stream);
        const courseList = (courses || []).slice(0, 50);
        const pairs = await Promise.all(courseList.map(async (c: any) => {
          const params = new URLSearchParams(paramsBase.toString());
          params.append('course_id', c.id);
          const res = await fetch(`/api/reports/subject-results?${params.toString()}`);
          if (!res.ok) return [c.name, []] as [string, any[]];
          const json = await res.json().catch(() => ({ rankings: [] }));
          return [c.name, json.rankings || []] as [string, any[]];
        }));
        const obj: Record<string, any[]> = {};
        pairs.forEach(([name, rankings]) => { obj[name] = rankings; });
        setData(obj);
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, term, classLevel, stream, JSON.stringify(courses)]);

  if (loading || parentLoading) return <div className="text-gray-500">Loading...</div>;
  const subjectNames = Object.keys(data);
  if (subjectNames.length === 0) return <div className="text-gray-500">No data</div>;

  return (
    <div className="space-y-8">
      {subjectNames.map((subject) => (
        <div key={subject} className="border rounded-lg">
          <div className="px-4 py-2 border-b text-sm font-semibold">{subject}</div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Position</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Student</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data[subject] || []).map((r: any) => (
                  <tr key={r.studentId}>
                    <td className="px-4 py-2">{r.rank}</td>
                    <td className="px-4 py-2">{r.fullName}</td>
                    <td className="px-4 py-2">{r.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClassCoursesReport({ session, term, classLevel, stream }: { session: string; term: string; classLevel: string; stream: string; }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<{ courses: any[]; students: any[]; overall: any[] }>({ courses: [], students: [], overall: [] });
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  const buildAndDownloadCSV = () => {
    const meta = `${session}_${term}_${classLevel}${classLevel.startsWith('SS') && stream && stream !== 'All' ? '_' + stream : ''}`.replace(/\s+/g,'-');
    const rows: any[] = [];
    // Overall rows
    rows.push({ Section: 'Overall', Rank: '', Student: '', Aggregate: '' });
    (data.overall || []).forEach((r: any) => rows.push({ Section: 'Overall', Rank: r.rank, Student: r.fullName, Aggregate: r.aggregate }));
    // Courses rankings
    (data.courses || []).forEach((c: any) => {
      rows.push({ Section: `Course: ${c.courseName}`, Rank: '', Student: '', Aggregate: '' });
      (c.rankings || []).forEach((r: any) => rows.push({ Section: `Course: ${c.courseName}`, Rank: r.rank, Student: r.fullName, Score: r.score }));
    });
    // GPA/CGPA
    rows.push({ Section: 'GPA/CGPA', Student: '', GPA: '', CGPA: '' });
    (data.students || []).forEach((s: any) => rows.push({ Section: 'GPA/CGPA', Student: s.fullName, GPA: s.gpa, CGPA: s.cgpa }));
    const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
    const csvRows = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class_courses_report_${meta}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const run = async () => {
      if (!session || !term || !classLevel || classLevel === 'All') return;
      setLoading(true);
      try {
        const params = new URLSearchParams({ session, term, class_level: classLevel });
        if (classLevel.startsWith('SS') && stream && stream !== 'All') params.append('stream', stream);
        const res = await fetch(`/api/reports/class-courses?${params.toString()}`);
        if (!res.ok) {
          console.error('class-courses API failed', res.status);
          setData({ courses: [], students: [], overall: [] });
          return;
        }
        const json = await res.json().catch(() => ({ courses: [], students: [], overall: [] }));
        setData({
          courses: Array.isArray(json.courses) ? json.courses : [],
          students: Array.isArray(json.students) ? json.students : [],
          overall: Array.isArray(json.overall) ? json.overall : []
        });
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [session, term, classLevel, stream]);

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!data || (data.courses || []).length === 0) return <div className="text-gray-500">No data</div>;

  const studentById: Record<string, any> = {};
  (data.students || []).forEach((s: any) => { studentById[s.studentId] = s; });

  return (
    <div className="space-y-8">
      <div className="flex justify-end gap-2">
        <button onClick={buildAndDownloadCSV} className="px-3 py-2 rounded bg-gray-800 text-white">Download CSV</button>
        <button onClick={() => window.print()} className="px-3 py-2 rounded bg-gray-200">Print</button>
      </div>
      {/* Overall best in class (aggregate) */}
      <div className="bg-white border rounded-lg">
        <div className="px-4 py-2 border-b font-semibold">Overall Best (All Subjects)</div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Rank</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Student</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Aggregate (GPA, CGPA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data.overall || []).map((r: any) => (
                <tr key={r.studentId}>
                  <td className="px-4 py-2">{r.rank}</td>
                  <td className="px-4 py-2">{r.fullName}</td>
                  <td className="px-4 py-2">
                    {r.aggregate}
                    {(() => { const s = studentById[r.studentId]; return s ? ` (${Number(s.gpa).toFixed(2)}, ${Number(s.cgpa).toFixed(2)})` : '' })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-course tables */}
      <div className="space-y-6">
        {data.courses.map((c: any) => (
          <div key={c.courseId} className="bg-white border rounded-lg">
            <div className="px-4 py-2 border-b flex items-center justify-between">
              <div className="font-semibold">{c.courseName}</div>
              <div className="text-sm text-gray-600">Top: {c.topStudent ? `${c.topStudent.fullName} (${c.topStudent.score})` : 'N/A'}</div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Position</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Student</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(c.rankings || []).map((r: any) => (
                    <tr key={r.studentId}>
                      <td className="px-4 py-2">{r.rank}</td>
                      <td className="px-4 py-2">{r.fullName}</td>
                      <td className="px-4 py-2">{r.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Per-student GPA/CGPA */}
      <div className="bg-white border rounded-lg">
        <div className="px-4 py-2 border-b font-semibold">GPA (this term/session) and CGPA (overall)</div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Student</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">GPA</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">CGPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data.students || []).map((s: any) => (
                <tr key={s.studentId}>
                  <td className="px-4 py-2">{s.fullName}</td>
                  <td className="px-4 py-2">{s.gpa}</td>
                  <td className="px-4 py-2">{s.cgpa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 