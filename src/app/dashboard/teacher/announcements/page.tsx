'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBullhorn,
  faFilter,
  faCalendarAlt,
  faUser,
  faEye
} from '@fortawesome/free-solid-svg-icons';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'urgent' | 'academic' | 'event';
  targetAudience: 'all' | 'students' | 'teachers' | 'parents';
  author: string;
  createdAt: string;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high';
}

export default function TeacherAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');

  // Mock announcements - role-based for teachers
  const mockAnnouncements: Announcement[] = [
    {
      id: 'ann1',
      title: 'Mid-Term Examination Schedule',
      content: 'The mid-term examinations will commence on January 15th, 2024. All teachers are required to submit question papers by January 10th. Invigilation schedules will be shared by January 12th.',
      type: 'academic',
      targetAudience: 'teachers',
      author: 'Academic Office',
      createdAt: '2024-01-08',
      isActive: true,
      priority: 'high'
    },
    {
      id: 'ann2',
      title: 'Staff Meeting - January 20th',
      content: 'All teaching and non-teaching staff are required to attend the monthly staff meeting on January 20th at 10:00 AM in the conference hall. Agenda includes curriculum updates and new policies.',
      type: 'general',
      targetAudience: 'teachers',
      author: 'Principal',
      createdAt: '2024-01-07',
      isActive: true,
      priority: 'medium'
    },
    {
      id: 'ann3',
      title: 'Grade Submission Deadline',
      content: 'All first-term grades must be submitted through the teacher portal by January 25th, 2024. Late submissions will require written justification.',
      type: 'urgent',
      targetAudience: 'teachers',
      author: 'Academic Office',
      createdAt: '2024-01-05',
      isActive: true,
      priority: 'high'
    },
    {
      id: 'ann4',
      title: 'Professional Development Workshop',
      content: 'A workshop on "Modern Teaching Methodologies" will be held on February 3rd, 2024. All teachers are encouraged to attend. Registration is optional but recommended.',
      type: 'event',
      targetAudience: 'teachers',
      author: 'HR Department',
      createdAt: '2024-01-03',
      isActive: true,
      priority: 'medium'
    },
    {
      id: 'ann5',
      title: 'New Digital Resources Available',
      content: 'The school has subscribed to additional digital learning resources. Access credentials and training materials are available in the staff resource center.',
      type: 'general',
      targetAudience: 'teachers',
      author: 'IT Department',
      createdAt: '2024-01-02',
      isActive: true,
      priority: 'low'
    },
    {
      id: 'ann6',
      title: 'Student Progress Review Guidelines',
      content: 'New guidelines for student progress reviews have been implemented. Please review the updated assessment criteria and reporting formats.',
      type: 'academic',
      targetAudience: 'teachers',
      author: 'Academic Office',
      createdAt: '2024-01-01',
      isActive: true,
      priority: 'medium'
    }
  ];

  useEffect(() => {
    // Filter announcements relevant to teachers
    const teacherAnnouncements = mockAnnouncements.filter(
      announcement => 
        announcement.targetAudience === 'teachers' || 
        announcement.targetAudience === 'all'
    );
    setAnnouncements(teacherAnnouncements);
  }, []);

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesType = !filterType || announcement.type === filterType;
    const matchesPriority = !filterPriority || announcement.priority === filterPriority;
    return matchesType && matchesPriority && announcement.isActive;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'academic': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'event': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      default: return '🟢';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faBullhorn} className="w-6 h-6 text-orange-600" />
          Announcements
        </h1>
        <p className="text-gray-600">Stay updated with school announcements and notices</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faBullhorn} className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-red-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faBullhorn} className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">
                {announcements.filter(a => a.priority === 'high').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faCalendarAlt} className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Academic</p>
              <p className="text-2xl font-bold text-gray-900">
                {announcements.filter(a => a.type === 'academic').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faEye} className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {announcements.filter(a => {
                  const announcementDate = new Date(a.createdAt);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return announcementDate >= weekAgo;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="">All Types</option>
            <option value="general">General</option>
            <option value="urgent">Urgent</option>
            <option value="academic">Academic</option>
            <option value="event">Event</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          <div className="flex items-center text-sm text-gray-600">
            <FontAwesomeIcon icon={faFilter} className="w-4 h-4 mr-2" />
            Showing {filteredAnnouncements.length} of {announcements.length} announcements
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map((announcement) => (
          <div key={announcement.id} className={`bg-white rounded-lg shadow-md border-l-4 overflow-hidden ${
            announcement.priority === 'high' ? 'border-red-500' : 
            announcement.priority === 'medium' ? 'border-yellow-500' : 'border-green-500'
          }`}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(announcement.type)}`}>
                      {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                      {getPriorityIcon(announcement.priority)} {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">{announcement.content}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                      <span>By {announcement.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4" />
                      <span>{new Date(announcement.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                      <span>Teachers & Staff</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons for urgent announcements */}
              {announcement.priority === 'high' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <span className="font-medium">⚠️ Action Required:</span>
                    <span className="text-sm">Please acknowledge this urgent announcement</span>
                  </div>
                </div>
              )}

              {/* Academic announcements with additional info */}
              {announcement.type === 'academic' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <span className="font-medium">📚 Academic Notice:</span>
                    <span className="text-sm">This affects your teaching responsibilities</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredAnnouncements.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FontAwesomeIcon icon={faBullhorn} className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Announcements Found</h3>
            <p className="text-gray-500">
              {announcements.length === 0 
                ? 'There are no announcements at this time.' 
                : 'Try adjusting your filter criteria to see more announcements.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-indigo-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-indigo-200">
            <h4 className="font-medium text-gray-900 mb-2">Need to Share Information?</h4>
            <p className="text-sm text-gray-600 mb-3">
              Contact the administration office to submit announcements for students or parents.
            </p>
            <a 
              href="/contact" 
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Contact Admin →
            </a>
          </div>
          <div className="bg-white rounded-lg p-4 border border-indigo-200">
            <h4 className="font-medium text-gray-900 mb-2">Missed Something?</h4>
            <p className="text-sm text-gray-600 mb-3">
              Check your email or visit the staff notice board for additional information.
            </p>
            <span className="text-indigo-600 text-sm font-medium">
              📧 Check Email
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
