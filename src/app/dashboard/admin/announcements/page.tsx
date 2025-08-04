'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBullhorn,
  faPlus,
  faEdit,
  faTrash,
  faEye,
  faUsers,
  faCalendarPlus
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

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterAudience, setFilterAudience] = useState<string>('');

  const mockAnnouncements: Announcement[] = [
    {
      id: 'ann1',
      title: 'Mid-Term Examination Schedule',
      content: 'The mid-term examinations will commence on January 15th, 2024. Students are advised to prepare adequately and report to their respective examination halls 30 minutes before the scheduled time.',
      type: 'academic',
      targetAudience: 'students',
      author: 'Admin User',
      createdAt: '2024-01-08',
      isActive: true,
      priority: 'high'
    },
    {
      id: 'ann2',
      title: 'Staff Meeting - January 20th',
      content: 'All teaching and non-teaching staff are required to attend the monthly staff meeting on January 20th at 10:00 AM in the conference hall.',
      type: 'general',
      targetAudience: 'teachers',
      author: 'Admin User',
      createdAt: '2024-01-07',
      isActive: true,
      priority: 'medium'
    },
    {
      id: 'ann3',
      title: 'School Fees Payment Reminder',
      content: 'Parents are reminded that the deadline for second term school fees payment is January 31st, 2024. Late payments will attract a penalty fee.',
      type: 'urgent',
      targetAudience: 'parents',
      author: 'Admin User',
      createdAt: '2024-01-05',
      isActive: true,
      priority: 'high'
    },
    {
      id: 'ann4',
      title: 'Inter-House Sports Competition',
      content: 'The annual inter-house sports competition will take place on February 14th, 2024. All students are encouraged to participate and support their respective houses.',
      type: 'event',
      targetAudience: 'all',
      author: 'Admin User',
      createdAt: '2024-01-03',
      isActive: true,
      priority: 'medium'
    }
  ];

  useEffect(() => {
    setAnnouncements(mockAnnouncements);
  }, []);

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesType = !filterType || announcement.type === filterType;
    const matchesAudience = !filterAudience || announcement.targetAudience === filterAudience;
    return matchesType && matchesAudience;
  });

  const handleCreateAnnouncement = (newAnnouncement: Omit<Announcement, 'id' | 'createdAt' | 'author'>) => {
    const announcement: Announcement = {
      ...newAnnouncement,
      id: `ann${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      author: 'Admin User'
    };
    setAnnouncements([announcement, ...announcements]);
    setShowCreateForm(false);
  };

  const handleEditAnnouncement = (updatedAnnouncement: Announcement) => {
    setAnnouncements(announcements.map(a => 
      a.id === updatedAnnouncement.id ? updatedAnnouncement : a
    ));
    setEditingAnnouncement(null);
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      setAnnouncements(announcements.filter(a => a.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setAnnouncements(announcements.map(a => 
      a.id === id ? { ...a, isActive: !a.isActive } : a
    ));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'academic': return 'bg-blue-100 text-blue-800';
      case 'event': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'students': return faUsers;
      case 'teachers': return faUsers;
      case 'parents': return faUsers;
      default: return faUsers;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faBullhorn} className="w-6 h-6 text-orange-600" />
            Announcements Management
          </h1>
          <p className="text-gray-600">Create and manage school announcements</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {/* Stats Cards */}
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
            <div className="bg-green-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faEye} className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900">{announcements.filter(a => a.isActive).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-red-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faBullhorn} className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Urgent</p>
              <p className="text-2xl font-bold text-gray-900">{announcements.filter(a => a.type === 'urgent').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faCalendarPlus} className="h-6 w-6 text-purple-600" />
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="general">General</option>
            <option value="urgent">Urgent</option>
            <option value="academic">Academic</option>
            <option value="event">Event</option>
          </select>
          <select
            value={filterAudience}
            onChange={(e) => setFilterAudience(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Audiences</option>
            <option value="all">Everyone</option>
            <option value="students">Students</option>
            <option value="teachers">Teachers</option>
            <option value="parents">Parents</option>
          </select>
          <div className="flex items-center text-sm text-gray-600">
            Showing {filteredAnnouncements.length} of {announcements.length} announcements
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map((announcement) => (
          <div key={announcement.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(announcement.type)}`}>
                    {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                    {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)} Priority
                  </span>
                  {!announcement.isActive && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-3">{announcement.content}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <FontAwesomeIcon icon={getAudienceIcon(announcement.targetAudience)} className="w-4 h-4" />
                    <span>Target: {announcement.targetAudience.charAt(0).toUpperCase() + announcement.targetAudience.slice(1)}</span>
                  </div>
                  <span>By {announcement.author}</span>
                  <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleToggleActive(announcement.id)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    announcement.isActive 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {announcement.isActive ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => setEditingAnnouncement(announcement)}
                  className="text-blue-600 hover:text-blue-900 p-2"
                  title="Edit"
                >
                  <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteAnnouncement(announcement.id)}
                  className="text-red-600 hover:text-red-900 p-2"
                  title="Delete"
                >
                  <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredAnnouncements.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FontAwesomeIcon icon={faBullhorn} className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500">No announcements found.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Announcement
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modals */}
      {showCreateForm && (
        <CreateAnnouncementModal
          onSave={handleCreateAnnouncement}
          onClose={() => setShowCreateForm(false)}
        />
      )}
      
      {editingAnnouncement && (
        <EditAnnouncementModal
          announcement={editingAnnouncement}
          onSave={handleEditAnnouncement}
          onClose={() => setEditingAnnouncement(null)}
        />
      )}
    </div>
  );
}

// Create Announcement Modal Component  
function CreateAnnouncementModal({ 
  onSave, 
  onClose 
}: { 
  onSave: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'author'>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general' as 'general' | 'urgent' | 'academic' | 'event',
    targetAudience: 'all' as 'all' | 'students' | 'teachers' | 'parents',
    priority: 'medium' as 'low' | 'medium' | 'high',
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Create New Announcement</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter announcement title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea
              required
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter announcement content"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'general' | 'urgent' | 'academic' | 'event' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="urgent">Urgent</option>
                <option value="academic">Academic</option>
                <option value="event">Event</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <select
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as 'all' | 'students' | 'teachers' | 'parents' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Everyone</option>
                <option value="students">Students</option>
                <option value="teachers">Teachers</option>
                <option value="parents">Parents</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Make announcement active immediately
            </label>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Announcement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Announcement Modal Component
function EditAnnouncementModal({ 
  announcement, 
  onSave, 
  onClose 
}: { 
  announcement: Announcement;
  onSave: (announcement: Announcement) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    title: announcement.title,
    content: announcement.content,
    type: announcement.type,
    targetAudience: announcement.targetAudience,
    priority: announcement.priority,
    isActive: announcement.isActive
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...announcement, ...formData });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Edit Announcement</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter announcement title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea
              required
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter announcement content"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'general' | 'urgent' | 'academic' | 'event' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="urgent">Urgent</option>
                <option value="academic">Academic</option>
                <option value="event">Event</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <select
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as 'all' | 'students' | 'teachers' | 'parents' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Everyone</option>
                <option value="students">Students</option>
                <option value="teachers">Teachers</option>
                <option value="parents">Parents</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActiveEdit"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isActiveEdit" className="text-sm font-medium text-gray-700">
              Make announcement active
            </label>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Update Announcement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
