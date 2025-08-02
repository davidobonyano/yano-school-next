'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSignOutAlt, 
  faCog, 
  faBars, 
  faTimes,
  faHome,
  faGraduationCap,
  faChalkboardTeacher,
  faUsers,
  faBook,
  faChartBar,
  faCalendar,
  faBell
} from '@fortawesome/free-solid-svg-icons';
import { AuthService, AuthUser } from '../lib/auth-service';
import '../lib/fontawesome';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: AuthUser;
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(user);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        router.push('/login');
      } else {
        setCurrentUser(user);
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await AuthService.logout();
    router.push('/login');
  };

  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: AuthService.getDashboardUrl(user), icon: faHome },
    ];

    switch (user.role) {
      case 'student':
        return [
          ...baseItems,
          { name: 'My Courses', href: '/dashboard/student/courses', icon: faBook },
          { name: 'My Grades', href: '/dashboard/student/grades', icon: faChartBar },
          { name: 'Assignments', href: '/dashboard/student/assignments', icon: faGraduationCap },
          { name: 'Schedule', href: '/dashboard/student/schedule', icon: faCalendar },
        ];
      case 'teacher':
        return [
          ...baseItems,
          { name: 'My Classes', href: '/dashboard/teacher/classes', icon: faChalkboardTeacher },
          { name: 'Grade Assignments', href: '/dashboard/teacher/assignments', icon: faGraduationCap },
          { name: 'Student Management', href: '/dashboard/teacher/students', icon: faUsers },
          { name: 'Schedule', href: '/dashboard/teacher/schedule', icon: faCalendar },
        ];
      case 'admin':
        return [
          ...baseItems,
          { name: 'User Management', href: '/dashboard/admin/users', icon: faUsers },
          { name: 'Course Management', href: '/dashboard/admin/courses', icon: faBook },
          { name: 'System Settings', href: '/dashboard/admin/settings', icon: faCog },
          { name: 'Reports', href: '/dashboard/admin/reports', icon: faChartBar },
        ];
      default:
        return baseItems;
    }
  };

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <FontAwesomeIcon icon={faTimes} className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 px-2 space-y-1">
              {getNavigationItems().map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <FontAwesomeIcon icon={item.icon} className="mr-4 h-6 w-6" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-semibold text-gray-900">Yano School Portal</h1>
            </div>
            <nav className="mt-8 flex-1 px-2 space-y-1">
              {getNavigationItems().map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <FontAwesomeIcon icon={item.icon} className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <FontAwesomeIcon icon={faBars} className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm"
                    placeholder="Search..."
                    type="search"
                  />
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-700">
                    <div className="font-medium">{currentUser.name}</div>
                    <div className="text-gray-500 capitalize">{currentUser.role}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}