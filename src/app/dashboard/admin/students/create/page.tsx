'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSave, 
  faArrowLeft,
  faUser,
  faEnvelope,
  faSchool,
  faIdCard,
  faPhone
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '@/lib/supabase';
import { useNotifications } from '@/components/ui/notifications';

export default function CreateStudentPage() {
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    school_name: '',
    class_level: '' as ClassLevel | '',
    stream: '',
    parent_name: '',
    parent_phone: '',
  });
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [nextNumber, setNextNumber] = useState<number | null>(null);
  const [existingIds, setExistingIds] = useState<string[]>([]);
  const [selectedCustomId, setSelectedCustomId] = useState<string>('');

  type ClassLevel =
    | 'NUR1' | 'NUR2'
    | 'KG1' | 'KG2'
    | 'PRI1' | 'PRI2' | 'PRI3' | 'PRI4' | 'PRI5' | 'PRI6'
    | 'JSS1' | 'JSS2' | 'JSS3'
    | 'SS1' | 'SS2' | 'SS3';

  const classes: ClassLevel[] = useMemo(() => (
    ['KG1','KG2','NUR1','NUR2','PRI1','PRI2','PRI3','PRI4','PRI5','PRI6','JSS1','JSS2','JSS3','SS1','SS2','SS3'] as ClassLevel[]
  ), []);

  const isSS = useMemo(() => ['SS1','SS2','SS3'].includes((formData.class_level || '') as any), [formData.class_level]);

  useEffect(() => {
    // Try to pick the first teacher as creator by default
    const loadTeacher = async () => {
      const { data } = await supabase.from('teachers').select('id').limit(1);
      if (data && data.length > 0) setTeacherId(data[0].id);
    };
    const loadIdData = async () => {
      const [{ data: nextData }, { data: idsData }] = await Promise.all([
        supabase.rpc('get_next_student_number'),
        supabase.from('school_students').select('student_id')
      ]);
      if (typeof nextData === 'number') setNextNumber(nextData);
      if (Array.isArray(idsData)) setExistingIds(idsData.map((r: any) => r.student_id as string));
    };
    loadTeacher();
    loadIdData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!formData.name || !formData.school_name || !formData.class_level) {
        showErrorToast('Full name, school name and class are required');
        setIsSubmitting(false);
        return;
      }

      if (selectedCustomId) {
        const { error } = await supabase.from('school_students').insert({
          student_id: selectedCustomId,
          full_name: formData.name,
          class_level: formData.class_level,
          school_name: formData.school_name,
          email: formData.email || null,
          phone: formData.phone || null,
          parent_name: formData.parent_name || null,
          parent_phone: formData.parent_phone || null,
          stream: isSS ? (formData.stream || null) : null,
          created_by: teacherId
        });
        if (error) throw error;
        showSuccessToast(`Student created with custom ID ${selectedCustomId}`);
      } else {
        const { data, error } = await supabase.rpc('add_school_student', {
          p_full_name: formData.name,
          p_class_level: formData.class_level,
          p_school_name: formData.school_name,
          p_teacher_id: teacherId, // defaults to first teacher; can be null if none
          p_email: formData.email || null,
          p_phone: formData.phone || null,
          p_parent_name: formData.parent_name || null,
          p_parent_phone: formData.parent_phone || null,
          p_stream: isSS ? (formData.stream || null) : null,
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Failed to create student');
        showSuccessToast(`Student created with ID ${data.student_id}`);
      }
      router.push('/dashboard/admin/students');
    } catch (err: any) {
      showErrorToast(err.message || 'Failed to create student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
            <h1 className="text-2xl font-bold text-gray-900">Add New Student</h1>
            <p className="text-gray-600">Create a new student profile</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            {/* Student ID Management */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                Student ID Management
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Available ID</label>
                  <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono text-gray-800 text-lg text-center">
                    {typeof nextNumber === 'number' ? `YAN${String(nextNumber).padStart(3,'0')}` : 'Loading...'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Specific ID (optional)</label>
                  <select
                    value={selectedCustomId}
                    onChange={(e) => setSelectedCustomId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Auto-assign next available</option>
                    {getAvailableIds(existingIds, nextNumber).slice(0, 50).map(id => (
                      <option key={id} value={id}>{id}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                If a number was deleted (e.g., YAN004), you can re-use it by selecting from the list. Otherwise, the system assigns the next sequential ID.
              </p>
            </div>
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-blue-600" />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter student's full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address (optional)
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="student@example.com"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone (optional)
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faPhone} className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="08012345678"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="school_name" className="block text-sm font-medium text-gray-700 mb-1">
                    School Name *
                  </label>
                  <input
                    type="text"
                    id="school_name"
                    name="school_name"
                    required
                    value={formData.school_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter school name"
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faSchool} className="w-5 h-5 text-green-600" />
                Academic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="class_level" className="block text-sm font-medium text-gray-700 mb-1">
                    Class Level *
                  </label>
                  <select
                    id="class_level"
                    name="class_level"
                    required
                    value={formData.class_level}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a class</option>
                    {classes.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                {isSS && (
                  <div>
                    <label htmlFor="stream" className="block text-sm font-medium text-gray-700 mb-1">
                      Stream (SS1–SS3)
                    </label>
                    <select
                      id="stream"
                      name="stream"
                      value={formData.stream}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Stream</option>
                      <option value="Science">Science</option>
                      <option value="Arts">Arts</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Parent/Guardian */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-purple-600" />
                Parent/Guardian (optional)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="parent_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Name
                  </label>
                  <input
                    type="text"
                    id="parent_name"
                    name="parent_name"
                    value={formData.parent_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mr/Mrs ..."
                  />
                </div>
                <div>
                  <label htmlFor="parent_phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Phone
                  </label>
                  <input
                    type="text"
                    id="parent_phone"
                    name="parent_phone"
                    value={formData.parent_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="08087654321"
                  />
                </div>
              </div>
            </div>

            {/* Student ID Note */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faIdCard} className="w-5 h-5 text-purple-600" />
                Student Identification
              </h2>
              
              <p className="text-sm text-gray-600">ID is auto-generated (YAN001, YAN002, ...) unless you choose a specific available ID above.</p>
            </div>

            {/* Additional Information Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Note:</h3>
              <p className="text-sm text-blue-700">
                A default password will be generated for the student. They will be required to change it on first login.
                Payment records, grades, and course enrollments can be managed after the student profile is created.
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faSave} className="w-4 h-4" />
                {isSubmitting ? 'Creating...' : 'Create Student'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function getAvailableIds(existingIds: string[], nextNumber: number | null): string[] {
  const taken = new Set(existingIds);
  const result: string[] = [];
  // Search from 1 up to nextNumber (or 5000 as a cap) to find gaps
  const upper = typeof nextNumber === 'number' ? Math.max(nextNumber, 1) + 100 : 5000;
  for (let i = 1; i <= upper; i++) {
    const id = `YAN${String(i).padStart(3, '0')}`;
    if (!taken.has(id)) result.push(id);
    if (result.length >= 200) break; // limit
  }
  return result;
}
