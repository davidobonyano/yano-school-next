'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { mockUsers } from '@/lib/enhanced-mock-data';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { 
  faHome, 
  faUserCheck,
  faClipboardList,
  faBookOpen,
  faChartBar,
  faCalendarAlt,
  faBullhorn,
  faSignOutAlt,
  faChalkboardTeacher,
  faFileExport
} from '@fortawesome/free-solid-svg-icons';

export default function TeacherLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const teacher = mockUsers.teachers[0]; // Replace with real auth data

  const handleLogout = () => {
    // In a real app, you would clear auth state here
    router.push('/login'); // Redirect to login page
  };

  interface NavItem {
    href?: string;
    icon?: IconDefinition;
    label: string;
    items?: NavItem[];
  }

  const navItems: NavItem[] = [
    { href: '/dashboard/teacher', icon: faHome, label: 'Dashboard' },
    { 
      label: 'Student Management',
      items: [
        { href: '/dashboard/teacher/student-ids', icon: faUserCheck, label: 'Assign Student IDs' },
        { href: '/dashboard/teacher/results', icon: faChartBar, label: 'Manage Results' },
      ]
    },
    { 
      label: 'Academic Tools',
      items: [
        { href: '/dashboard/teacher/exams', icon: faClipboardList, label: 'Create & Manage Exams' },
        { href: '/dashboard/teacher/courses', icon: faBookOpen, label: 'Assigned Courses' },
      ]
    },
    { href: '/dashboard/teacher/timetable', icon: faCalendarAlt, label: 'My Timetable' },
    { href: '/dashboard/teacher/announcements', icon: faBullhorn, label: 'Announcements' },
    { href: '/dashboard/teacher/reports', icon: faFileExport, label: 'Reports & Export' },
  ];

  const renderNavItem = (item: NavItem, level = 0) => {
    if (item.items) {
      return (
        <div key={item.label} className="mb-2">
          <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider px-3 py-2">
            {item.label}
          </div>
          {item.items.map((subItem: NavItem) => renderNavItem(subItem, 1))}
        </div>
      );
    }

    return (
      <a
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 p-3 rounded transition-colors ${
          level === 1 ? 'ml-2' : ''
        } ${
          pathname === item.href ? 'bg-indigo-800' : 'hover:bg-indigo-800'
        }`}
      >
        {item.icon && <FontAwesomeIcon icon={item.icon as IconDefinition} className="w-5 h-5" />}
        <span>{item.label}</span>
      </a>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-8 p-2">
          <FontAwesomeIcon 
            icon={faChalkboardTeacher} 
            className="h-12 w-12 text-indigo-200"
          />
          <div>
            <h2 className="font-bold">{teacher.name}</h2>
            <p className="text-xs text-indigo-200">Teacher</p>
            <p className="text-xs text-indigo-200">ID: {teacher.id}</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => renderNavItem(item))}
        </nav>

        <div className="p-3 border-t border-indigo-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-red-200 hover:text-white w-full"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-white">
        {children}
      </main>
    </div>
  );
}
