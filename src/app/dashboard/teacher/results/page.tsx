'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartBar,
  faEdit,
  faSave,
  faPlus,
  faDownload,
  faSearch,
  faFilter,
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { mockGrades, mockUsers, mockCourses, Grade } from '@/lib/enhanced-mock-data';

interface ExtendedGrade extends Grade {
  studentName?: string;
  className?: string;
}

export default function ResultsManagementPage() {
  const [grades, setGrades] = useState<ExtendedGrade[]>([]);
  const [editingGrade, setEditingGrade] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Enhanced grades with student names
  useEffect(() => {
    const enhancedGrades = mockGrades.map(grade => ({
      ...grade,
      studentName: mockUsers.students.find(s => s.id === grade.studentId)?.name || 'Unknown Student',
      className: mockUsers.students.find(s => s.id === grade.studentId)?.class || 'Unknown Class'
    }));
    setGrades(enhancedGrades);
  }, []);

  const filteredGrades = grades.filter(grade => {
    const matchesSearch = grade.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grade.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = !courseFilter || grade.courseId === courseFilter;
    const matchesTerm = !termFilter || grade.term === termFilter;
    
    return matchesSearch && matchesCourse && matchesTerm;
  });

  const courses = [...new Set(grades.map(g => g.courseId))];
  const terms = [...new Set(grades.map(g => g.term))];

  const calculateTotal = (assignment: number = 0, test: number = 0, exam: number = 0) => {
    return assignment + test + exam;
  };

  const getGradeFromTotal = (total: number) => {
    if (total >= 90) return 'A+';
    if (total >= 80) return 'A';
    if (total >= 70) return 'B+';
    if (total >= 60) return 'B';
    if (total >= 50) return 'C';
    if (total >= 40) return 'D';
    return 'F';
  };

  const handleUpdateGrade = (gradeId: string, field: string, value: number) => {
    setGrades(grades.map(grade => {
      if (grade.id === gradeId) {
        const updatedGrade = { ...grade, [field]: value };
        const newTotal = calculateTotal(
          updatedGrade.assignment,
          updatedGrade.test,
          updatedGrade.exam
        );
        return {
          ...updatedGrade,
          total: newTotal,
          grade: getGradeFromTotal(newTotal)
        };
      }
      return grade;
    }));
  };

  const handleAddNewResult = (newGrade: Omit<ExtendedGrade, 'id'>) => {
    const grade: ExtendedGrade = {
      ...newGrade,
      id: `grade${Date.now()}`,
      total: calculateTotal(newGrade.assignment, newGrade.test, newGrade.exam),
      grade: getGradeFromTotal(calculateTotal(newGrade.assignment, newGrade.test, newGrade.exam))
    };
    setGrades([...grades, grade]);
    setShowAddForm(false);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A': return 'text-green-600 bg-green-50';
      case 'B+':
      case 'B': return 'text-blue-600 bg-blue-50';
      case 'C': return 'text-yellow-600 bg-yellow-50';
      case 'D': return 'text-orange-600 bg-orange-50';
      default: return 'text-red-600 bg-red-50';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faChartBar} className="w-6 h-6 text-green-600" />
            Student Results Management
          </h1>
          <p className="text-gray-600">Update and manage student grades and results</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            Add Result
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faCheckCircle} className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Results</p>
              <p className="text-2xl font-bold text-gray-900">{grades.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faChartBar} className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {grades.length > 0 
                  ? Math.round(grades.reduce((sum, g) => sum + g.total, 0) / grades.length)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faCheckCircle} className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pass Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {grades.length > 0 
                  ? Math.round((grades.filter(g => g.total >= 50).length / grades.length) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faTimesCircle} className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Courses</option>
            {courses.map(courseId => {
              const course = mockCourses.find(c => c.id === courseId);
              return (
                <option key={courseId} value={courseId}>{course?.name || courseId}</option>
              );
            })}
          </select>
          <select
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Terms</option>
            {terms.map(term => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>
          <div className="flex items-center text-sm text-gray-600">
            <FontAwesomeIcon icon={faFilter} className="w-4 h-4 mr-2" />
            {filteredGrades.length} results
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignment (20)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test (30)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exam (50)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGrades.map((grade) => (
                <tr key={grade.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{grade.studentName}</div>
                      <div className="text-sm text-gray-500">{grade.className}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{grade.courseName}</div>
                    <div className="text-sm text-gray-500">{grade.term} • {grade.session}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingGrade === grade.id ? (
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={grade.assignment || 0}
                        onChange={(e) => handleUpdateGrade(grade.id, 'assignment', parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{grade.assignment || 0}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingGrade === grade.id ? (
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={grade.test || 0}
                        onChange={(e) => handleUpdateGrade(grade.id, 'test', parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{grade.test || 0}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingGrade === grade.id ? (
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={grade.exam || 0}
                        onChange={(e) => handleUpdateGrade(grade.id, 'exam', parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{grade.exam || 0}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{grade.total}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(grade.grade)}`}>
                      {grade.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingGrade === grade.id ? (
                      <button
                        onClick={() => setEditingGrade(null)}
                        className="text-green-600 hover:text-green-900 mr-2"
                        title="Save"
                      >
                        <FontAwesomeIcon icon={faSave} className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingGrade(grade.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredGrades.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No results found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Add Result Modal */}
      {showAddForm && (
        <AddResultModal 
          onAdd={handleAddNewResult} 
          onClose={() => setShowAddForm(false)} 
        />
      )}
    </div>
  );
}

// Add Result Modal
function AddResultModal({ 
  onAdd, 
  onClose 
}: { 
  onAdd: (grade: Omit<ExtendedGrade, 'id'>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    studentId: '',
    courseId: '',
    courseName: '',
    term: 'First Term',
    session: '2023/2024',
    assignment: 0,
    test: 0,
    exam: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const course = mockCourses.find(c => c.id === formData.courseId);
    const student = mockUsers.students.find(s => s.id === formData.studentId);
    
    onAdd({
      ...formData,
      courseName: course?.name || formData.courseName,
      studentName: student?.name || 'Unknown Student',
      className: student?.class || 'Unknown Class',
      total: 0,
      grade: 'F'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Add New Result</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select a student</option>
              {mockUsers.students.map(student => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select
              value={formData.courseId}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select a course</option>
              {mockCourses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignment (20)</label>
              <input
                type="number"
                min="0"
                max="20"
                value={formData.assignment}
                onChange={(e) => setFormData({ ...formData, assignment: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test (30)</label>
              <input
                type="number"
                min="0"
                max="30"
                value={formData.test}
                onChange={(e) => setFormData({ ...formData, test: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam (50)</label>
              <input
                type="number"
                min="0"
                max="50"
                value={formData.exam}
                onChange={(e) => setFormData({ ...formData, exam: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Add Result
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
