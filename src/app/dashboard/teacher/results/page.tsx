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

interface Grade {
  id: string;
  studentId: string;
  courseId: string;
  term: string;
  assignment: number;
  test: number;
  exam: number;
  total: number;
  grade: string;
  remarks?: string;
}

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
  const [loading, setLoading] = useState(true);

  // Fetch grades data
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        // TODO: Replace with real API call
        // const response = await fetch('/api/teachers/grades');
        // const data = await response.json();
        // const enhancedGrades = data.grades.map((grade: Grade) => ({
        //   ...grade,
        //   studentName: 'Student Name', // Will come from API
        //   className: 'Class Name' // Will come from API
        // }));
        // setGrades(enhancedGrades);
        
        // For now, set empty array
        setGrades([]);
      } catch (error) {
        console.error('Error fetching grades:', error);
        setGrades([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
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
        updatedGrade.total = calculateTotal(updatedGrade.assignment, updatedGrade.test, updatedGrade.exam);
        updatedGrade.grade = getGradeFromTotal(updatedGrade.total);
        return updatedGrade;
      }
      return grade;
    }));
  };

  const handleSaveGrade = (gradeId: string) => {
    // TODO: Implement API call to save grade
    console.log('Saving grade:', gradeId);
    setEditingGrade(null);
  };

  const handleAddGrade = (gradeData: Omit<Grade, 'id'>) => {
    const newGrade: Grade = {
      ...gradeData,
      id: `grade${Date.now()}`,
      total: calculateTotal(gradeData.assignment, gradeData.test, gradeData.exam),
      grade: getGradeFromTotal(calculateTotal(gradeData.assignment, gradeData.test, gradeData.exam))
    };
    setGrades([...grades, newGrade as ExtendedGrade]);
    setShowAddForm(false);
  };

  const exportGrades = () => {
    // TODO: Implement export functionality
    console.log('Exporting grades...');
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faChartBar} className="w-6 h-6 text-green-600" />
            Results Management
          </h1>
          <p className="text-gray-600">Manage and update student grades and results</p>
        </div>
        
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button
            onClick={exportGrades}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            Add Grade
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faChartBar} className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Grades</p>
              <p className="text-2xl font-bold text-gray-900">{grades.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faCheckCircle} className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Passing Grades</p>
              <p className="text-2xl font-bold text-gray-900">
                {grades.filter(g => g.grade !== 'F').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-orange-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faTimesCircle} className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Failing Grades</p>
              <p className="text-2xl font-bold text-gray-900">
                {grades.filter(g => g.grade === 'F').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faChartBar} className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {grades.length > 0 
                  ? Math.round(grades.reduce((sum, g) => sum + g.total, 0) / grades.length)
                  : 0
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by student name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Courses</option>
              {courses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
            <select
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Terms</option>
              {terms.map(term => (
                <option key={term} value={term}>{term}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <div className="flex items-center text-sm text-gray-600">
              <FontAwesomeIcon icon={faFilter} className="w-4 h-4 mr-2" />
              Showing {filteredGrades.length} of {grades.length} grades
            </div>
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredGrades.length > 0 ? (
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
                    Term
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exam
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
                        <div className="text-sm font-medium text-gray-900">{grade.studentName || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{grade.studentId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.courseId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grade.term}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingGrade === grade.id ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={grade.assignment}
                          onChange={(e) => handleUpdateGrade(grade.id, 'assignment', parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{grade.assignment}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingGrade === grade.id ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={grade.test}
                          onChange={(e) => handleUpdateGrade(grade.id, 'test', parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{grade.test}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingGrade === grade.id ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={grade.exam}
                          onChange={(e) => handleUpdateGrade(grade.id, 'exam', parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{grade.exam}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{grade.total}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        grade.grade === 'F' ? 'bg-red-100 text-red-800' :
                        grade.grade.includes('A') ? 'bg-green-100 text-green-800' :
                        grade.grade.includes('B') ? 'bg-blue-100 text-blue-800' :
                        grade.grade.includes('C') ? 'bg-yellow-100 text-yellow-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {grade.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingGrade === grade.id ? (
                        <button
                          onClick={() => handleSaveGrade(grade.id)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          <FontAwesomeIcon icon={faSave} className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingGrade(grade.id)}
                          className="text-blue-600 hover:text-blue-900"
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
        ) : (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faChartBar} className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Grades Found</h3>
            <p className="text-gray-500">
              {grades.length === 0 
                ? 'You haven\'t added any grades yet. Get started by adding your first grade entry.' 
                : 'Try adjusting your filter criteria to see more grades.'
              }
            </p>
            {grades.length === 0 && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mx-auto"
              >
                <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                Add Your First Grade
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Grade Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Grade</h2>
              {/* TODO: Implement grade creation form */}
              <p className="text-gray-600 mb-4">Grade creation form will be implemented here.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Grade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
