'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { mockUsers } from '@/lib/enhanced-mock-data';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { 
  faHome, 
  faUserGraduate,
  faChalkboardTeacher,
  faCreditCard,
  faBullhorn,
  faUserPlus,
  faArrowUp,
  faSignOutAlt,
  faUserShield,
  faBookOpen,
  faClipboardList,
  faFileExport
} from '@fortawesome/free-solid-svg-icons';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const admin = mockUsers.admins[0]; // Replace with real auth data

  const handleLogout = () => {
    // In a real app, you would clear auth state here
    router.push('/login'); // Redirect to login page
  };

  const navItems = [
    { href: '/dashboard/admin', icon: faHome, label: 'Dashboard' },
    { 
      label: 'Student Management',
      items: [
        { href: '/dashboard/admin/students', icon: faUserGraduate, label: 'All Students' },
        { href: '/dashboard/admin/students/create', icon: faUserPlus, label: 'Add Student' },
        { href: '/dashboard/admin/students/promotion', icon: faArrowUp, label: 'Promote Students' },
      ]
    },
    { 
      label: 'Teacher Management',
      items: [
        { href: '/dashboard/admin/teachers', icon: faChalkboardTeacher, label: 'All Teachers' },
        { href: '/dashboard/admin/teachers/create', icon: faUserPlus, label: 'Add Teacher' },
      ]
    },
    { 
      label: 'Academic',
      items: [
        { href: '/dashboard/admin/courses', icon: faBookOpen, label: 'Courses' },
        { href: '/dashboard/admin/exams', icon: faClipboardList, label: 'Exam Management' },
      ]
    },
    { href: '/dashboard/admin/payments', icon: faCreditCard, label: 'Payment Records' },
    { href: '/dashboard/admin/announcements', icon: faBullhorn, label: 'Announcements' },
    { href: '/dashboard/admin/passwords', icon: faUserShield, label: 'Password Management' },
    { href: '/dashboard/admin/reports', icon: faFileExport, label: 'Reports & Export' },
  ];

  interface NavItem {
    href?: string;
    icon?: IconDefinition;
    label: string;
    items?: NavItem[];
  }

  const renderNavItem = (item: NavItem, level = 0) => {
    if (item.items) {
      return (
        <div key={item.label} className="mb-2">
          <div className="text-xs font-semibold text-green-300 uppercase tracking-wider px-3 py-2">
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
          pathname === item.href ? 'bg-green-800' : 'hover:bg-green-800'
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
      <aside className="w-64 bg-green-900 text-white p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-8 p-2">
          <FontAwesomeIcon 
            icon={faUserShield} 
            className="h-12 w-12 text-green-200"
          />
          <div>
            <h2 className="font-bold">{admin.name}</h2>
            <p className="text-xs text-green-200">Administrator</p>
            <p className="text-xs text-green-200">ID: {admin.id}</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => renderNavItem(item))}
        </nav>

        <div className="p-3 border-t border-green-800">
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
