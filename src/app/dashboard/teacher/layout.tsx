'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AcademicContextProvider } from '@/lib/academic-context';
import { AcademicContextDisplay } from '@/components/academic-context/AcademicContextDisplay';
import { GlobalAcademicSync } from '@/lib/global-academic-sync';
import { useDashboardRefresh } from '@/lib/use-dashboard-refresh';
import ThemeToggle from '@/components/theme/ThemeToggle';

import { 
  faHome, 
  faClipboardList,
  faBookOpen,
  faCalendarAlt,
  faBullhorn,
  faSignOutAlt,
  faChalkboardTeacher,
  faFileExport,
  faTimes,
  faChartBar,
  faBars
} from '@fortawesome/free-solid-svg-icons';

export default function TeacherLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [teacher, setTeacher] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);

  // Use the dashboard refresh hook to automatically refresh when context changes
  useDashboardRefresh();

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const deltaX = touchCurrentX.current - touchStartX.current;
    const threshold = 50;

    if (deltaX > threshold && touchStartX.current < 50 && !sidebarOpen) {
      setSidebarOpen(true);
    } else if (deltaX < -threshold && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  // Fetch teacher data
  useEffect(() => {
    setIsMounted(true);
    const fetchTeacherData = async () => {
      try {
        // Session is now handled by middleware and cookies
        const response = await fetch('/api/teachers/me');

        if (!response.ok) {
          if (response.status === 401) {
            // Session expired or invalid, redirect to login
            router.push('/login/teacher');
            return;
          }
          throw new Error('Failed to fetch teacher data');
        }

        const data = await response.json();
        if (data.success && data.teacher) {
          setTeacher(data.teacher);
        }
      } catch (error) {
        console.error('Error fetching teacher data:', error);
        // On error, redirect to login
        router.push('/login/teacher');
      }
    };

    fetchTeacherData();
  }, [router]);

  const handleLogout = async () => {
    // Clear session cookie and redirect to login
    try {
      await fetch('/api/teachers/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error during logout:', error);
    }
    router.push('/login/teacher');
  };



  const navItems = [
    { 
      href: '/dashboard/teacher', 
      icon: faHome, 
      label: 'Dashboard',
      bgColor: 'bg-gradient-to-r from-indigo-600 to-indigo-700',
      hoverColor: 'hover:from-indigo-700 hover:to-indigo-800',
      iconColor: 'text-indigo-100'
    },
    { 
      href: '/dashboard/teacher/exams', 
      icon: faClipboardList, 
      label: 'Manage Exams',
      bgColor: 'bg-gradient-to-r from-purple-600 to-purple-700',
      hoverColor: 'hover:from-purple-700 hover:to-purple-800',
      iconColor: 'text-purple-100'
    },
    { 
      href: '/dashboard/teacher/courses', 
      icon: faBookOpen, 
      label: 'My Courses',
      bgColor: 'bg-gradient-to-r from-blue-600 to-blue-700',
      hoverColor: 'hover:from-blue-700 hover:to-blue-800',
      iconColor: 'text-blue-100'
    },
    { 
      href: '/dashboard/teacher/timetable', 
      icon: faCalendarAlt, 
      label: 'Timetable',
      bgColor: 'bg-gradient-to-r from-orange-600 to-orange-700',
      hoverColor: 'hover:from-orange-700 hover:to-orange-800',
      iconColor: 'text-orange-100'
    },
    { 
      href: '/dashboard/teacher/results', 
      icon: faChartBar, 
      label: 'Results Management',
      bgColor: 'bg-gradient-to-r from-green-600 to-green-700',
      hoverColor: 'hover:from-green-700 hover:to-green-800',
      iconColor: 'text-green-100'
    },
    { 
      href: '/dashboard/teacher/announcements', 
      icon: faBullhorn, 
      label: 'Announcements',
      bgColor: 'bg-gradient-to-r from-red-600 to-red-700',
      hoverColor: 'hover:from-red-700 hover:to-red-800',
      iconColor: 'text-red-100'
    },
    { 
      href: '/dashboard/teacher/reports', 
      icon: faFileExport, 
      label: 'Reports',
      bgColor: 'bg-gradient-to-r from-teal-600 to-teal-700',
      hoverColor: 'hover:from-teal-700 hover:to-teal-800',
      iconColor: 'text-teal-100'
    },
  ];

  return (
    <AcademicContextProvider>
      <GlobalAcademicSync />
      <div 
        className="flex h-screen bg-gray-100 relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
      {/* Mobile Top Nav with Hamburger (client-only to avoid SSR mismatch) */}
      {isMounted && (
        <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b z-40 flex items-center justify-between px-4">
          <button 
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200"
          >
            <FontAwesomeIcon icon={faBars} className="w-5 h-5 text-gray-700" />
          </button>
          <div className="text-sm font-medium text-gray-700">Menu</div>
          <div className="w-9" />
        </header>
      )}

      {/* Desktop Sidebar - Full width with colors */}
      <aside className="hidden lg:flex lg:flex-col lg:w-80 bg-white shadow-xl border-r">
        {/* Profile Section */}
        <div className="p-6 bg-gradient-to-r from-indigo-900 to-indigo-800 text-white">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-white/20 border-2 border-white/30 overflow-hidden backdrop-blur-sm">
              <div className="h-full w-full bg-white/10 flex items-center justify-center text-white text-2xl font-bold">
                <FontAwesomeIcon icon={faChalkboardTeacher} />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold">{teacher?.name || 'Welcome back, Teacher!'}</h2>
              <p className="text-sm text-indigo-300">Teacher</p>
              <p className="text-sm text-indigo-300">ID: {teacher?.id || 'Loading...'}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-3">
          {navItems.map((item, index) => (
            <motion.a
              key={item.href}
              href={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`
                flex items-center gap-4 p-4 rounded-xl transition-all duration-300 group
                ${pathname === item.href 
                  ? `${item.bgColor} text-white shadow-lg transform scale-105` 
                  : `bg-gray-50 hover:bg-gray-100 text-gray-700 ${item.hoverColor}`
                }
              `}
            >
              <div className={`
                p-2 rounded-lg 
                ${pathname === item.href 
                  ? 'bg-white/20' 
                  : `${item.bgColor.replace('bg-gradient-to-r from-', 'bg-').replace(' to-' + item.bgColor.split('to-')[1], '')}/10`
                }
              `}>
                <FontAwesomeIcon 
                  icon={item.icon} 
                  className={`w-5 h-5 ${pathname === item.href ? 'text-white' : item.iconColor.replace('text-', 'text-').replace('-100', '-600')}`} 
                />
              </div>
              <span className="font-medium">{item.label}</span>
              {pathname === item.href && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto w-2 h-2 bg-white rounded-full"
                />
              )}
            </motion.a>
          ))}
        </nav>

        {/* Theme Toggle & Logout Section */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 font-medium">Theme</span>
            <ThemeToggle />
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 w-full p-4 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 group"
          >
            <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200">
              <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5" />
            </div>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Expanded Sidebar */}
      {isMounted && (
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-45"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              ref={sidebarRef}
              initial={{ x: '-60%' }}
              animate={{ x: 0 }}
              exit={{ x: '-60%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[60vw] max-w-xs bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Close Button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors z-10"
              >
                <FontAwesomeIcon icon={faTimes} className="h-5 w-5 text-gray-600" />
              </button>

              {/* Profile Section */}
              <div className="p-6 bg-gradient-to-r from-indigo-900 to-indigo-800 text-white">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white/20 border-2 border-white/30 overflow-hidden backdrop-blur-sm">
                    <div className="h-full w-full bg-white/10 flex items-center justify-center text-white text-lg font-bold">
                      <FontAwesomeIcon icon={faChalkboardTeacher} />
                    </div>
                  </div>
                  <div>
                    <h2 className="font-bold">{teacher?.name || 'Welcome back, Teacher!'}</h2>
                    <p className="text-xs text-indigo-300">Teacher</p>
                    <p className="text-xs text-indigo-300">ID: {teacher?.id || 'Loading...'}</p>
                  </div>
                </div>
              </div>
              
              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item, index) => (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg transition-all duration-300
                      ${pathname === item.href 
                        ? `${item.bgColor} text-white shadow-md` 
                        : 'hover:bg-gray-100 text-gray-700'
                      }
                    `}
                  >
                    <FontAwesomeIcon 
                      icon={item.icon} 
                      className={`w-5 h-5 ${pathname === item.href ? 'text-white' : item.iconColor.replace('text-', 'text-').replace('-100', '-600')}`} 
                    />
                    <span className="font-medium">{item.label}</span>
                  </motion.a>
                ))}
              </nav>

              {/* Theme Toggle & Logout Section */}
              <div className="p-4 border-t border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-medium">Theme</span>
                  <ThemeToggle />
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-gray-50 lg:ml-0 pt-14 lg:pt-0">
        <div className="sticky top-0 z-30 bg-gray-50/80 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60 border-b border-gray-200">
          <div className="px-4 py-3">
            <AcademicContextDisplay showControls={false} className="!mb-0" />
          </div>
        </div>
        {children}
      </main>
      </div>
    </AcademicContextProvider>
  );
}
