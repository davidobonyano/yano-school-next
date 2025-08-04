'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { mockUsers } from '@/lib/mock-data';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faBook, 
  faChartBar, 
  faCalendarAlt,
  faCreditCard,
  faSignOutAlt,
  faUserCircle
} from '@fortawesome/free-solid-svg-icons';

export default function StudentLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const student = mockUsers.students[0]; // Replace with real auth data

  const handleLogout = () => {
    // In a real app, you would clear auth state here
    router.push('/login'); // Redirect to login page
  };

  const navItems = [
    { href: '/dashboard/student', icon: faHome, label: 'Dashboard' },
    { href: '/dashboard/student/courses', icon: faBook, label: 'Courses' },
    { href: '/dashboard/student/grades', icon: faChartBar, label: 'Grades' },
    { href: '/dashboard/student/schedule', icon: faCalendarAlt, label: 'Schedule' },
    { href: '/dashboard/student/payments', icon: faCreditCard, label: 'Payments' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-8 p-2">
          <FontAwesomeIcon 
            icon={faUserCircle} 
            className="h-12 w-12 text-blue-200"
          />
          <div>
            <h2 className="font-bold">{student.name}</h2>
            <p className="text-xs text-blue-200">ID: {student.id}</p>
            <p className="text-xs text-blue-200">Class: {student.class || 'Form 4 Science'}</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded transition-colors ${
                pathname === item.href ? 'bg-blue-800' : 'hover:bg-blue-800'
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
              <span>{item.label}</span>
            </a>
          ))}
             <div className="p-3 border-t border-blue-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-red-200 hover:text-white w-full"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
        </nav>

       
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-white">
        {children}
      </main>
    </div>
  );
}