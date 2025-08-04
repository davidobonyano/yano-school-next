'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardList,
  faPlus,
  faEdit,
  faTrash,
  faPlay,
  faCheck,
  faClock,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import { mockExams, mockCourses, Exam } from '@/lib/enhanced-mock-data';

interface ExamQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'essay' | 'true-false';
  options?: string[];
  correctAnswer?: string;
  points: number;
}

interface ExtendedExam extends Exam {
  questions?: ExamQuestion[];
  totalPoints?: number;
  instructions?: string;
}

export default function ExamManagementPage() {
  const [exams, setExams] = useState<ExtendedExam[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingExam, setEditingExam] = useState<ExtendedExam | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Enhanced exam data with questions
  const enhancedExams: ExtendedExam[] = [
    ...mockExams.map(exam => ({
      ...exam,
      questions: [
        {
          id: 'q1',
          question: 'What is the quadratic formula?',
          type: 'multiple-choice' as const,
          options: ['x = -b ± √(b²-4ac)/2a', 'x = a²+b²', 'x = ab/c', 'x = √(a+b)'],
          correctAnswer: 'x = -b ± √(b²-4ac)/2a',
          points: 10
        },
        {
          id: 'q2', 
          question: 'Solve for x: 2x + 5 = 15',
          type: 'essay' as const,
          points: 15
        }
      ],
      totalPoints: 25,
      instructions: 'Answer all questions. Show your working for essay questions.'
    })),
    {
      id: 'exam6',
      courseId: 'MATH101',
      courseName: 'Mathematics',
      date: '2024-02-15',
      time: '10:00 AM',
      duration: 90,
      venue: 'Exam Hall A',
      status: 'Active',
      questions: [],
      totalPoints: 0,
      instructions: ''
    }
  ];

  useEffect(() => {
    setExams(enhancedExams);
  }, []);

  const filteredExams = exams.filter(exam => 
    !filterStatus || exam.status === filterStatus
  );

  const handleCreateExam = (examData: Omit<ExtendedExam, 'id'>) => {
    const newExam: ExtendedExam = {
      ...examData,
      id: `exam${Date.now()}`
    };
    setExams([...exams, newExam]);
    setShowCreateForm(false);
  };

  const handleEditExam = (updatedExam: ExtendedExam) => {
    setExams(exams.map(e => e.id === updatedExam.id ? updatedExam : e));
    setEditingExam(null);
  };

  const handleDeleteExam = (examId: string) => {
    if (confirm('Are you sure you want to delete this exam?')) {
      setExams(exams.filter(e => e.id !== examId));
    }
  };

  const handleStatusChange = (examId: string, newStatus: 'Upcoming' | 'Active' | 'Completed') => {
    setExams(exams.map(e => 
      e.id === examId ? { ...e, status: newStatus } : e
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return faPlay;
      case 'Completed': return faCheck;
      default: return faClock;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faClipboardList} className="w-6 h-6 text-purple-600" />
            Exam Management
          </h1>
          <p className="text-gray-600">Create and manage your exams</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
          Create New Exam
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faClock} className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">{exams.filter(e => e.status === 'Upcoming').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faPlay} className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900">{exams.filter(e => e.status === 'Active').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-gray-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faCheck} className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{exams.filter(e => e.status === 'Completed').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faClipboardList} className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Exams</p>
              <p className="text-2xl font-bold text-gray-900">{exams.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="">All Status</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Exams List */}
      <div className="space-y-4">
        {filteredExams.map((exam) => (
          <div key={exam.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{exam.courseName}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                    <FontAwesomeIcon icon={getStatusIcon(exam.status)} className="w-3 h-3 mr-1" />
                    {exam.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2" />
                    {exam.date} at {exam.time}
                  </div>
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faClock} className="w-4 h-4 mr-2" />
                    {exam.duration} minutes
                  </div>
                  <div>Venue: {exam.venue}</div>
                  <div>Questions: {exam.questions?.length || 0}</div>
                </div>
                {exam.totalPoints && (
                  <div className="mt-2 text-sm text-gray-600">
                    Total Points: {exam.totalPoints}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <select
                  value={exam.status}
                  onChange={(e) => handleStatusChange(exam.id, e.target.value as 'Upcoming' | 'Active' | 'Completed')}
                  className="px-3 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
                <button
                  onClick={() => setEditingExam(exam)}
                  className="text-blue-600 hover:text-blue-900 p-2"
                  title="Edit"
                >
                  <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteExam(exam.id)}
                  className="text-red-600 hover:text-red-900 p-2"
                  title="Delete"
                >
                  <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredExams.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FontAwesomeIcon icon={faClipboardList} className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500">No exams found. Create your first exam to get started.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modals */}
      {showCreateForm && (
        <CreateExamModal
          onSave={handleCreateExam}
          onClose={() => setShowCreateForm(false)}
        />
      )}
      
      {editingExam && (
        <EditExamModal
          exam={editingExam}
          onSave={handleEditExam}
          onClose={() => setEditingExam(null)}
        />
      )}
    </div>
  );
}

// Create Exam Modal Component
function CreateExamModal({ 
  onSave, 
  onClose 
}: { 
  onSave: (exam: Omit<ExtendedExam, 'id'>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    courseId: '',
    courseName: '',
    date: '',
    time: '',
    duration: 60,
    venue: '',
    status: 'Upcoming' as const,
    instructions: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Create New Exam</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select
                value={formData.courseId}
                onChange={(e) => {
                  const course = mockCourses.find(c => c.id === e.target.value);
                  setFormData({ 
                    ...formData, 
                    courseId: e.target.value,
                    courseName: course?.name || ''
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select a course</option>
                {mockCourses.map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Enter exam venue"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
            <textarea
              rows={3}
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Enter exam instructions"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Create Exam
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Exam Modal Component
function EditExamModal({ 
  exam, 
  onSave, 
  onClose 
}: { 
  exam: ExtendedExam;
  onSave: (exam: ExtendedExam) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    courseId: exam.courseId,
    courseName: exam.courseName,
    date: exam.date,
    time: exam.time,
    duration: exam.duration,
    venue: exam.venue,
    status: exam.status,
    instructions: exam.instructions || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...exam, ...formData });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Edit Exam</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select
                value={formData.courseId}
                onChange={(e) => {
                  const course = mockCourses.find(c => c.id === e.target.value);
                  setFormData({ 
                    ...formData, 
                    courseId: e.target.value,
                    courseName: course?.name || ''
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select a course</option>
                {mockCourses.map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Enter exam venue"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
            <textarea
              rows={3}
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Enter exam instructions"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Update Exam
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
