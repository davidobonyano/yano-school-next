'use client';

import { useState, useEffect } from 'react';
import { getStudentSession } from '@/lib/student-session';
import { useGlobalAcademicContext } from '@/contexts/GlobalAcademicContext';

export default function StudentGrades() {
  const { academicContext } = useGlobalAcademicContext();
  const [selectedTerm, setSelectedTerm] = useState('First Term');
  const [selectedSession, setSelectedSession] = useState('');
  const [studentName, setStudentName] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [grades, setGrades] = useState<any[]>([]);

  useEffect(() => {
    const s = getStudentSession();
    setStudentName(s?.full_name || '');
    setStudentId(s?.student_id || '');
    // TODO: Replace with real grades endpoint when available
    setGrades([]);
  }, [selectedTerm, selectedSession]);

  // Sync selected session with global academic context
  useEffect(() => {
    if (academicContext.session) {
      setSelectedSession(academicContext.session);
    }
  }, [academicContext.session]);
  
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    if (grade.startsWith('D')) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const calculateGPA = () => {
    if (grades.length === 0) return '0.00';
    const total = grades.reduce((sum, grade) => sum + grade.total, 0);
    return (total / grades.length / 100 * 4).toFixed(2);
  };

  const getOverallPosition = () => {
    if (grades.length === 0) return 'N/A';
    const avgPosition = grades.reduce((sum, grade) => sum + (grade.position || 0), 0) / grades.length;
    return Math.round(avgPosition);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Grades</h1>
        <span className="text-sm text-gray-500">Student: {studentName || studentId}</span>
      </div>

      {/* Term and Session Filters */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
            <select 
              value={selectedTerm} 
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session</label>
            <select 
              value={selectedSession} 
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value={academicContext.session || '2025/2026'}>{academicContext.session || '2025/2026'}</option>
              <option value="2022/2023">2022/2023</option>
            </select>
          </div>
          <div className="flex flex-col justify-end">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Download Transcript
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-700">Current GPA</h3>
          <p className="text-2xl font-bold text-blue-600">{calculateGPA()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-700">Total Subjects</h3>
          <p className="text-2xl font-bold text-green-600">{grades.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-700">Class Position</h3>
          <p className="text-2xl font-bold text-purple-600">{getOverallPosition()}</p>
        </div>
      </div>
      
      {/* Grades Table */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-lg font-semibold mb-4">{selectedTerm} - {selectedSession} Results</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold">Subject</th>
                <th className="text-center py-3 px-4 font-semibold">Assignment (20)</th>
                <th className="text-center py-3 px-4 font-semibold">Test (30)</th>
                <th className="text-center py-3 px-4 font-semibold">Exam (70)</th>
                <th className="text-center py-3 px-4 font-semibold">Total (100)</th>
                <th className="text-center py-3 px-4 font-semibold">Grade</th>
                <th className="text-center py-3 px-4 font-semibold">Position</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade) => (
                <tr key={grade.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{grade.courseName}</td>
                  <td className="py-3 px-4 text-center">{grade.assignment || '-'}</td>
                  <td className="py-3 px-4 text-center">{grade.test || '-'}</td>
                  <td className="py-3 px-4 text-center">{grade.exam || '-'}</td>
                  <td className="py-3 px-4 text-center font-semibold">{grade.total}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getGradeColor(grade.grade)}`}>
                      {grade.grade}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-medium">{grade.position || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {grades.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No grades available for {selectedTerm} - {selectedSession}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
