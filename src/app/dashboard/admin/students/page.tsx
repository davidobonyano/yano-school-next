'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faTrash, 
  faPlus,
  faSearch,
  faFilter,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import { mockUsers, User } from '@/lib/enhanced-mock-data';

export default function StudentsPage() {
  const [students, setStudents] = useState<User[]>(mockUsers.students);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Enhanced mock data with more students for demo
  const enhancedStudents = [
    ...mockUsers.students,
    { id: 'stu789', email: 'john.doe@example.com', password: 'pass789', name: 'John Doe', class: 'JSS1A', status: 'active' as const },
    { id: 'stu101', email: 'jane.smith@example.com', password: 'pass101', name: 'Jane Smith', class: 'JSS1B', status: 'active' as const },
    { id: 'stu112', email: 'mike.johnson@example.com', password: 'pass112', name: 'Mike Johnson', class: 'JSS2A', status: 'processing' as const },
    { id: 'stu113', email: 'sarah.wilson@example.com', password: 'pass113', name: 'Sarah Wilson', class: 'JSS2B', status: 'active' as const },
    { id: 'stu114', email: 'david.brown@example.com', password: 'pass114', name: 'David Brown', class: 'JSS3A', status: 'active' as const },
  ];

  useEffect(() => {
    setStudents(enhancedStudents);
  }, []);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !classFilter || student.class === classFilter;
    const matchesStatus = !statusFilter || student.status === statusFilter;
    
    return matchesSearch && matchesClass && matchesStatus;
  });

  const classes = [...new Set(students.map(s => s.class).filter(Boolean))];
  const statuses = [...new Set(students.map(s => s.status).filter(Boolean))];

  const handleDelete = (studentId: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      setStudents(students.filter(s => s.id !== studentId));
    }
  };

  const handleStatusChange = (studentId: string, newStatus: 'active' | 'processing') => {
    setStudents(students.map(s => 
      s.id === studentId ? { ...s, status: newStatus } : s
    ));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600">View and manage all students</p>
        </div>
        <a
          href="/dashboard/admin/students/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
          Add Student
        </a>
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
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Classes</option>
            {classes.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : ''}
              </option>
            ))}
          </select>
          <div className="flex items-center text-sm text-gray-600">
            <FontAwesomeIcon icon={faFilter} className="w-4 h-4 mr-2" />
            {filteredStudents.length} of {students.length} students
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.class || 'Not Assigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={student.status || 'active'}
                      onChange={(e) => handleStatusChange(student.id, e.target.value as 'active' | 'processing')}
                      className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${
                        student.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="processing">Processing</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <a
                        href={`/dashboard/admin/students/${student.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                      </a>
                      <a
                        href={`/dashboard/admin/students/${student.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No students found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {students.filter(s => s.status === 'active').length}
            </div>
            <div className="text-sm text-gray-500">Active Students</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {students.filter(s => s.status === 'processing').length}
            </div>
            <div className="text-sm text-gray-500">Processing</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {classes.length}
            </div>
            <div className="text-sm text-gray-500">Total Classes</div>
          </div>
        </div>
      </div>
    </div>
  );
}
