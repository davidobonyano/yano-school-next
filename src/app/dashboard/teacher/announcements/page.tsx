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

type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: 'students'|'teachers'|'admins'|'all'|'class'|'role';
  created_at: string;
  expires_at: string | null;
  audience_class_level?: string | null;
  audience_stream?: string | null;
  audience_role?: 'student'|'teacher'|'admin' | null;
  attachments?: { name: string; url: string; type?: string; size?: number }[];
};

export default function TeacherAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filterAudience, setFilterAudience] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/announcements', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        const now = Date.now();
        const list: Announcement[] = (data.announcements || [])
          .filter((a: Announcement) => {
            const notExpired = !a.expires_at || new Date(a.expires_at).getTime() > now;
            const forTeachers = a.audience === 'all' || a.audience === 'teachers' || (a.audience === 'role' && a.audience_role === 'teacher');
            return notExpired && forTeachers;
          });
        setAnnouncements(list);
      } catch {}
    })();
  }, []);

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesAudience = !filterAudience || a.audience === filterAudience;
    return matchesAudience;
  });

  const getAudienceBadge = (a: Announcement) => {
    if (a.audience === 'class') {
      const cls = a.audience_class_level || '?';
      const stream = a.audience_stream ? ` ${a.audience_stream}` : '';
      return `${cls}${stream ? ' -' + stream : ''}`;
    }
    if (a.audience === 'role') return `Role: ${a.audience_role}`;
    return a.audience;
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
              <p className="text-sm font-medium text-gray-500">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {announcements.filter(a => {
                  const d = new Date(a.created_at);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return d >= weekAgo;
                }).length}
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
              <p className="text-sm font-medium text-gray-500">With Expiry</p>
              <p className="text-2xl font-bold text-gray-900">{announcements.filter(a => !!a.expires_at).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filterAudience}
            onChange={(e) => setFilterAudience(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="">All Audiences</option>
            <option value="all">All</option>
            <option value="teachers">Teachers</option>
            <option value="role">Role-targeted</option>
            <option value="class">Class-targeted</option>
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
          <div key={announcement.id} className="bg-white rounded-lg shadow-md border-l-4 overflow-hidden border-gray-300">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {getAudienceBadge(announcement)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">{announcement.body}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4" />
                      <span>{new Date(announcement.created_at).toLocaleDateString('en-US', { 
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
