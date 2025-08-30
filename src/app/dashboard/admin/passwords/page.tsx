'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faKey,
  faSearch,
  faFilter,
  faEye,
  faEyeSlash,
  faCopy,
  faEdit,
  faUserShield,
  faChalkboardTeacher,
  faUserGraduate,
  faCheck,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  school_name: string;
  is_active: boolean;
}

interface Student {
  id: string;
  student_id: string;
  full_name: string;
  email: string | null;
  class_level: string | null;
  school_name: string | null;
  is_active: boolean;
}

export default function PasswordManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Fetch teachers and students from the database
  useEffect(() => {
    fetchTeachers();
    fetchStudents();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers');
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers || []);
      } else {
        console.error('Error fetching teachers:', response.statusText);
        setMessage('Error fetching teachers');
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setMessage('Error fetching teachers');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      } else {
        console.error('Error fetching students:', response.statusText);
        setMessage('Error fetching students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setMessage('Error fetching students');
    } finally {
      setLoading(false);
    }
  };

  const setTeacherPassword = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/teachers/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        setMessage(`Password set successfully for ${email}`);
        setShowPasswordForm(null);
        setNewPassword('');
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage('Error setting password');
    }
  };

  const setStudentPassword = async (studentId: string, password: string) => {
    try {
      const response = await fetch('/api/students/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, password }),
      });

      if (response.ok) {
        setMessage(`Password set successfully for student ID: ${studentId}`);
        setShowPasswordForm(null);
        setNewPassword('');
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage('Error setting password');
    }
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || roleFilter === 'teachers';
    
    return matchesSearch && matchesRole;
  });

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         student.student_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || roleFilter === 'students';
    
    return matchesSearch && matchesRole;
  });

  const togglePasswordVisibility = (userId: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(userId)) {
      newVisible.delete(userId);
    } else {
      newVisible.add(userId);
    }
    setVisiblePasswords(newVisible);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setMessage('Copied to clipboard!');
      setTimeout(() => setMessage(''), 3000);
    });
  };

  const handlePasswordSubmit = (identifier: string, userType: 'teacher' | 'student') => {
    if (newPassword.trim()) {
      if (userType === 'teacher') {
        setTeacherPassword(identifier, newPassword);
      } else {
        setStudentPassword(identifier, newPassword);
      }
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faKey} className="w-6 h-6 text-red-600" />
          Password Management
        </h1>
        <p className="text-gray-600">Manage teacher and student passwords and authentication settings</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.includes('Error') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {message}
          <button 
            onClick={() => setMessage('')} 
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Authentication Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faChalkboardTeacher} className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-medium text-blue-800">Authentication Method</h3>
        </div>
        <p className="text-sm text-blue-700 mt-2">
          Teachers can now authenticate using their existing Supabase credentials (same as your exam portal).
          If they don't have Supabase accounts, you can set local passwords below.
        </p>
      </div>

      {/* Security Warning */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <FontAwesomeIcon icon={faUserShield} className="w-5 h-5 text-red-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Security Notice</h3>
            <p className="text-sm text-red-700 mt-1">
              This page contains sensitive information. Only authorized administrators should have access.
              Do not share passwords or leave this page unattended.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search teachers and students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value="teachers">Teachers</option>
            <option value="students">Students</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {roleFilter === 'teachers' ? 'Teacher Accounts' : 
             roleFilter === 'students' ? 'Student Accounts' : 
             'Teacher & Student Accounts'}
          </h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    School
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
                          <FontAwesomeIcon icon={faChalkboardTeacher} className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{teacher.full_name}</div>
                          <div className="text-sm text-gray-500">ID: {teacher.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {teacher.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {teacher.school_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        teacher.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {teacher.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {showPasswordForm === teacher.email ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <button
                            onClick={() => handlePasswordSubmit(teacher.email)}
                            className="text-green-600 hover:text-green-900"
                            title="Save password"
                          >
                            <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setShowPasswordForm(null);
                              setNewPassword('');
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel"
                          >
                            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowPasswordForm(teacher.email)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                          title="Set password"
                        >
                          <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                          Set Password
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && filteredTeachers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No teachers found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Usage Guidelines */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Authentication Setup Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Option 1: Supabase Authentication (Recommended)</h4>
            <ul className="space-y-1">
              <li>• Teachers use existing Supabase accounts</li>
              <li>• Same credentials as your exam portal</li>
              <li>• Automatic profile synchronization</li>
              <li>• No need to manage separate passwords</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Option 2: Local Passwords</h4>
            <ul className="space-y-1">
              <li>• Set individual passwords using "Set Password"</li>
              <li>• Passwords stored securely with bcrypt</li>
              <li>• Teachers must remember new passwords</li>
              <li>• Requires manual password management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
