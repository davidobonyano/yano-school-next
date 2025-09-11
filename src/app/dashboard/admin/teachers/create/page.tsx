'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSave, 
  faArrowLeft,
  faChalkboardTeacher,
  faEnvelope,
  faIdCard
} from '@fortawesome/free-solid-svg-icons';
import { useNotifications } from '@/components/ui/notifications';

export default function CreateTeacherPage() {
  const router = useRouter();
  const { showSuccessToast } = useNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    id: '',
    status: 'active' as 'active' | 'processing',
    subjects: [] as string[]
  });

  const availableSubjects = [
    'Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology',
    'History', 'Geography', 'Economics', 'Government', 'Literature',
    'Fine Arts', 'Physical Education', 'Computer Science', 'French',
    'Civic Education', 'Agricultural Science'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate ID if not provided
    const teacherData = {
      ...formData,
      id: formData.id || `teach${Date.now()}`,
      password: 'defaultpass123' // In real app, generate secure password
    };

    console.log('Creating teacher:', teacherData);
    showSuccessToast(`Teacher ${teacherData.name} created successfully!`);
    router.push('/dashboard/admin/teachers');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubjectChange = (subject: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      subjects: checked 
        ? [...prev.subjects, subject]
        : prev.subjects.filter(s => s !== subject)
    }));
  };

  const generateTeacherId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const nameCode = formData.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const generatedId = `T${nameCode}${timestamp}`;
    setFormData(prev => ({
      ...prev,
      id: generatedId
    }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Teacher</h1>
            <p className="text-gray-600">Create a new teacher profile</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faChalkboardTeacher} className="w-5 h-5 text-green-600" />
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter teacher's full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="teacher@example.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Teacher ID */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faIdCard} className="w-5 h-5 text-purple-600" />
                Teacher Identification
              </h2>
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-1">
                    Teacher ID
                  </label>
                  <input
                    type="text"
                    id="id"
                    name="id"
                    value={formData.id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Leave empty to auto-generate"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={generateTeacherId}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={!formData.name}
                  >
                    Generate ID
                  </button>
                </div>
              </div>
              {!formData.name && (
                <p className="text-sm text-gray-500 mt-1">Enter name first to generate ID</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="active">Active</option>
                <option value="processing">Processing</option>
              </select>
            </div>

            {/* Subjects */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Teaching Subjects</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableSubjects.map(subject => (
                  <label key={subject} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.subjects.includes(subject)}
                      onChange={(e) => handleSubjectChange(subject, e.target.checked)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{subject}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Select the subjects this teacher will be teaching
              </p>
            </div>

            {/* Additional Information Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-900 mb-2">Note:</h3>
              <p className="text-sm text-green-700">
                A default password will be generated for the teacher. They will be required to change it on first login.
                Course assignments and class schedules can be managed after the teacher profile is created.
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faSave} className="w-4 h-4" />
                {isSubmitting ? 'Creating...' : 'Create Teacher'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
