'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserCheck, 
  faIdCard,
  faCheck,
  faTimes,
  faSearch,
  faEdit,
  faSave,
  faUsers,
  faEye,
  faPlus
} from '@fortawesome/free-solid-svg-icons';

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  class?: string;
  status?: 'active' | 'processing';
}

export default function StudentsManagementPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [newIds, setNewIds] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch students data
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        // TODO: Replace with real API call
        // const response = await fetch('/api/teachers/students');
        // const data = await response.json();
        // setStudents(data.students || []);
        
        // For now, set empty array
        setStudents([]);
      } catch (error) {
        console.error('Error fetching students:', error);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const processingStudents = students.filter(s => s.status === 'processing');
  const activeStudents = students.filter(s => s.status === 'active');
  
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.class && student.class.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const generateStudentId = (student: User) => {
    // TODO: Implement proper ID generation logic
    const timestamp = Date.now().toString().slice(-6);
    const initials = student.name.split(' ').map(n => n[0]).join('').toUpperCase();
    return `STU${initials}${timestamp}`;
  };

  const handleAssignId = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      const newId = generateStudentId(student);
      setNewIds(prev => ({ ...prev, [studentId]: newId }));
      setEditingStudent(studentId);
    }
  };

  const handleSaveId = (studentId: string) => {
    const newId = newIds[studentId];
    if (newId) {
      setStudents(students.map(s => 
        s.id === studentId 
          ? { ...s, id: newId, status: 'active' as const }
          : s
      ));
      setNewIds(prev => {
        const updated = { ...prev };
        delete updated[studentId];
        return updated;
      });
      setEditingStudent(null);
    }
  };

  const handleCancelEdit = (studentId: string) => {
    setNewIds(prev => {
      const updated = { ...prev };
      delete updated[studentId];
      return updated;
    });
    setEditingStudent(null);
  };

  const handleAddStudent = (studentData: Omit<User, 'id'>) => {
    const newStudent: User = {
      ...studentData,
      id: `temp${Date.now()}`,
      status: 'processing'
    };
    setStudents([...students, newStudent]);
    setShowAddForm(false);
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
            <FontAwesomeIcon icon={faUsers} className="w-6 h-6 text-green-600" />
            Students Management
          </h1>
          <p className="text-gray-600">Manage and view all your students</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
          Add Student
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-orange-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faIdCard} className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending IDs</p>
              <p className="text-2xl font-bold text-gray-900">{processingStudents.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faCheck} className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">{activeStudents.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Students</label>
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email, or class..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          
          <div className="flex items-end">
            <div className="flex items-center text-sm text-gray-600">
              <FontAwesomeIcon icon={faUsers} className="w-4 h-4 mr-2" />
              Showing {filteredStudents.length} of {students.length} students
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredStudents.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <div key={student.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {student.status === 'active' ? 'Active' : 'Pending ID'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Email:</span> {student.email}
                      </div>
                      <div>
                        <span className="font-medium">Class:</span> {student.class || 'Not assigned'}
                      </div>
                      <div>
                        <span className="font-medium">Student ID:</span> {student.id}
                      </div>
                      {newIds[student.id] && (
                        <div>
                          <span className="font-medium">New ID:</span> 
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-mono">
                            {newIds[student.id]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {editingStudent === student.id ? (
                      <>
                        <button
                          onClick={() => handleSaveId(student.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Save ID"
                        >
                          <FontAwesomeIcon icon={faSave} className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancelEdit(student.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => window.open(`/dashboard/teacher/results?student=${student.id}`, '_blank')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Results"
                        >
                          <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                        </button>
                        {student.status === 'processing' && !newIds[student.id] && (
                          <button
                            onClick={() => handleAssignId(student.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                          >
                            <FontAwesomeIcon icon={faIdCard} className="w-4 h-4" />
                            Assign ID
                          </button>
                        )}
                        {student.status === 'processing' && newIds[student.id] && (
                          <button
                            onClick={() => setEditingStudent(student.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faUsers} className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-500">
              {students.length === 0 
                ? 'You haven\'t added any students yet. Get started by adding your first student.' 
                : 'Try adjusting your search criteria to see more students.'
              }
            </p>
            {students.length === 0 && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mx-auto"
              >
                <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                Add Your First Student
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Student Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Student</h2>
              {/* TODO: Implement student creation form */}
              <p className="text-gray-600 mb-4">Student creation form will be implemented here.</p>
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
                  Add Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-medium text-gray-900 mb-2">Bulk Operations</h4>
            <p className="text-sm text-gray-600 mb-3">
              Need to perform bulk operations on students? Contact the administration office.
            </p>
            <a 
              href="/contact" 
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Contact Admin →
            </a>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-medium text-gray-900 mb-2">Student Reports</h4>
            <p className="text-sm text-gray-600 mb-3">
              Generate comprehensive reports for your students.
            </p>
            <a 
              href="/dashboard/teacher/reports" 
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              View Reports →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
