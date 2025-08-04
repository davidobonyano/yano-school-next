'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faTrash, 
  faPlus,
  faSearch,
  faFilter,
  faEye,
  faChalkboardTeacher
} from '@fortawesome/free-solid-svg-icons';
import { mockUsers, User } from '@/lib/enhanced-mock-data';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Enhanced mock data with more teachers
  const enhancedTeachers = [
    ...mockUsers.teachers,
    { id: 'teach789', email: 'physics.teacher@example.com', password: 'teachpass', name: 'Dr. Physics Teacher', status: 'active' as const },
    { id: 'teach101', email: 'math.teacher@example.com', password: 'teachpass', name: 'Prof. Math Teacher', status: 'active' as const },
    { id: 'teach112', email: 'english.teacher@example.com', password: 'teachpass', name: 'Mrs. English Teacher', status: 'processing' as const },
  ];

  useEffect(() => {
    setTeachers(enhancedTeachers);
  }, []);

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || teacher.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statuses = [...new Set(teachers.map(s => s.status).filter(Boolean))];

  const handleDelete = (teacherId: string) => {
    if (confirm('Are you sure you want to delete this teacher?')) {
      setTeachers(teachers.filter(t => t.id !== teacherId));
    }
  };

  const handleStatusChange = (teacherId: string, newStatus: 'active' | 'processing') => {
    setTeachers(teachers.map(t => 
      t.id === teacherId ? { ...t, status: newStatus } : t
    ));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faChalkboardTeacher} className="w-6 h-6 text-green-600" />
            Teacher Management
          </h1>
          <p className="text-gray-600">View and manage all teachers</p>
        </div>
        <a
          href="/dashboard/admin/teachers/create"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
          Add Teacher
        </a>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
            {filteredTeachers.length} of {teachers.length} teachers
          </div>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
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
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 font-medium">
                          {teacher.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                        <div className="text-sm text-gray-500">{teacher.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {teacher.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={teacher.status || 'active'}
                      onChange={(e) => handleStatusChange(teacher.id, e.target.value as 'active' | 'processing')}
                      className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${
                        teacher.status === 'active' 
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
                        href={`/dashboard/admin/teachers/${teacher.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                      </a>
                      <a
                        href={`/dashboard/admin/teachers/${teacher.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(teacher.id)}
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
        
        {filteredTeachers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No teachers found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {teachers.filter(t => t.status === 'active').length}
            </div>
            <div className="text-sm text-gray-500">Active Teachers</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {teachers.filter(t => t.status === 'processing').length}
            </div>
            <div className="text-sm text-gray-500">Processing</div>
          </div>
        </div>
      </div>
    </div>
  );
}
