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
  faSave
} from '@fortawesome/free-solid-svg-icons';
import { mockUsers, User } from '@/lib/enhanced-mock-data';

export default function StudentIDAssignmentPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [newIds, setNewIds] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Enhanced mock data with more processing students
  const enhancedStudents = [
    ...mockUsers.students,
    { id: 'temp001', email: 'processing1@example.com', password: 'temppass', name: 'Alice Johnson', class: 'JSS1A', status: 'processing' as const },
    { id: 'temp002', email: 'processing2@example.com', password: 'temppass', name: 'Bob Williams', class: 'JSS1B', status: 'processing' as const },
    { id: 'temp003', email: 'processing3@example.com', password: 'temppass', name: 'Carol Davis', class: 'JSS2A', status: 'processing' as const },
    { id: 'temp004', email: 'processing4@example.com', password: 'temppass', name: 'David Miller', class: 'JSS2B', status: 'processing' as const },
  ];

  useEffect(() => {
    setStudents(enhancedStudents);
  }, []);

  const processingStudents = students.filter(s => s.status === 'processing');
  
  const filteredStudents = processingStudents.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.class && student.class.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const generateStudentId = (student: User) => {
    const classCode = student.class?.replace(/[^A-Z0-9]/g, '') || 'UNK';
    const nameCode = student.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${classCode}${nameCode}${timestamp}`;
  };

  const handleGenerateId = (studentId: string, student: User) => {
    const generatedId = generateStudentId(student);
    setNewIds(prev => ({
      ...prev,
      [studentId]: generatedId
    }));
  };

  const handleSaveId = (studentId: string) => {
    const newId = newIds[studentId];
    if (!newId) return;

    // Update the student's ID and status
    setStudents(students.map(s => 
      s.id === studentId 
        ? { ...s, id: newId, status: 'active' as const }
        : s
    ));

    // Remove from newIds and stop editing
    setNewIds(prev => {
      const updated = { ...prev };
      delete updated[studentId];
      return updated;
    });
    setEditingStudent(null);
  };

  const handleRejectStudent = (studentId: string) => {
    if (confirm('Are you sure you want to reject this student registration?')) {
      setStudents(students.filter(s => s.id !== studentId));
    }
  };

  const handleBulkApprove = () => {
    const updates = processingStudents.map(student => {
      const newId = generateStudentId(student);
      return { ...student, id: newId, status: 'active' as const };
    });

    setStudents(students.map(s => {
      const update = updates.find(u => u.email === s.email);
      return update || s;
    }));
    
    setNewIds({});
    setEditingStudent(null);
    alert(`Successfully assigned IDs to ${updates.length} students!`);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faUserCheck} className="w-6 h-6 text-orange-600" />
            Assign Student IDs
          </h1>
          <p className="text-gray-600">Review and assign unique IDs to new student registrations</p>
        </div>
        {processingStudents.length > 0 && (
          <button
            onClick={handleBulkApprove}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
            Approve All ({processingStudents.length})
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-orange-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faUserCheck} className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Approval</p>
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
              <p className="text-2xl font-bold text-gray-900">{students.filter(s => s.status === 'active').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faIdCard} className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students by name, email, or class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Students List */}
      {filteredStudents.length > 0 ? (
        <div className="space-y-4">
          {filteredStudents.map((student) => (
            <div key={student.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-600 font-medium text-lg">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                    <p className="text-gray-600">{student.email}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-500">Class: {student.class || 'Not Assigned'}</span>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Processing
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {editingStudent === student.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newIds[student.id] || ''}
                        onChange={(e) => setNewIds(prev => ({
                          ...prev,
                          [student.id]: e.target.value
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded text-sm w-32"
                        placeholder="Enter student ID"
                      />
                      <button
                        onClick={() => handleSaveId(student.id)}
                        disabled={!newIds[student.id]}
                        className="p-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        title="Save ID"
                      >
                        <FontAwesomeIcon icon={faSave} className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingStudent(null)}
                        className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        title="Cancel"
                      >
                        <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          handleGenerateId(student.id, student);
                          setEditingStudent(student.id);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                        Generate ID
                      </button>
                      <button
                        onClick={() => {
                          const generatedId = generateStudentId(student);
                          setStudents(students.map(s => 
                            s.id === student.id 
                              ? { ...s, id: generatedId, status: 'active' as const }
                              : s
                          ));
                        }}
                        className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
                        title="Auto-approve with generated ID"
                      >
                        <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRejectStudent(student.id)}
                        className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                        title="Reject application"
                      >
                        <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FontAwesomeIcon icon={faUserCheck} className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {processingStudents.length === 0 ? 'No Pending Applications' : 'No Results Found'}
          </h3>
          <p className="text-gray-500">
            {processingStudents.length === 0 
              ? 'All student registrations have been processed.' 
              : 'Try adjusting your search criteria.'
            }
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Instructions:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Review each student&apos;s information before assigning an ID</li>
          <li>• Generated IDs follow the format: [CLASS][INITIALS][TIMESTAMP]</li>
          <li>• You can edit the generated ID before saving</li>
          <li>• Use &quot;Approve All&quot; to batch process all pending students</li>
          <li>• Rejected applications will be permanently removed</li>
        </ul>
      </div>
    </div>
  );
}
