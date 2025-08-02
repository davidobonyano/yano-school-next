'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome, faInfoCircle, faGraduationCap, faUserPlus, faEnvelope,
  faPhone, faMapMarkerAlt, faBars, faTimes, faSun, faMoon, faArrowUp,
  faUser, faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import '../lib/fontawesome';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { AuthService } from '@/lib/auth-service';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [userType, setUserType] = useState('Student');
  const [selectedRole, setSelectedRole] = useState('student');

  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const sidebarRef = useRef(null);
  const authModalRef = useRef(null);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const navLinks = [
    { path: '/', label: 'Home', icon: faHome },
    { path: '/about', label: 'About', icon: faInfoCircle },
    { path: '/programs', label: 'Programs', icon: faGraduationCap },
    { path: '/admissions', label: 'Admissions', icon: faUserPlus },
    { path: '/contact', label: 'Contact', icon: faEnvelope },
  ];

  useEffect(() => {
    const storedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(storedMode);

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : 'auto';
  }, [menuOpen]);

  // Check for existing user session
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        if (user) {
          setIsLoggedIn(true);
          setUserType(user.role.charAt(0).toUpperCase() + user.role.slice(1));
        }
      } catch (error) {
        console.error('Error checking user session:', error);
      }
    };

    checkUserSession();
  }, []);

  // Close auth modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (authModalRef.current && !(authModalRef.current as HTMLElement).contains(event.target as Node)) {
        setShowAuthModal(false);
        setShowForgotPassword(false);
      }
    };

    if (showAuthModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAuthModal]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await AuthService.login({
        id: loginId,
        password: loginPassword,
        role: selectedRole as 'student' | 'teacher' | 'admin'
      });

      if (result.success && result.user) {
        setIsLoggedIn(true);
        setUserType(result.user.role.charAt(0).toUpperCase() + result.user.role.slice(1));
        setShowAuthModal(false);
        setLoginId('');
        setLoginPassword('');
        
        // Redirect to appropriate dashboard
        window.location.href = AuthService.getDashboardUrl(result.user);
      } else {
        alert(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await AuthService.forgotPassword(loginId, selectedRole as 'student' | 'teacher' | 'admin');
      
      if (result.success) {
        alert('Password reset link sent to your email!');
        setShowForgotPassword(false);
        setLoginId('');
      } else {
        alert(result.error || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      alert('An error occurred while processing your request');
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      setIsLoggedIn(false);
      setUserType('Student');
      setShowAuthModal(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className={`fixed bottom-4 left-4 z-50 p-3 rounded-full shadow-md transition-colors duration-300 ${
            darkMode ? 'bg-white text-black' : 'bg-blue-900 text-white'
          } hover:scale-110`}
          aria-label="Back to top"
        >
          <FontAwesomeIcon icon={faArrowUp} />
        </button>
      )}

      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            ref={authModalRef}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {showForgotPassword ? 'Forgot Password' : 'Sign In'}
              </h2>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setShowForgotPassword(false);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

                         {!showForgotPassword ? (
               <form onSubmit={handleLogin} className="space-y-4">
                 {/* Role Selection */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Login as
                   </label>
                   <div className="grid grid-cols-3 gap-2">
                     <button
                       type="button"
                       onClick={() => setSelectedRole('student')}
                       className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                         selectedRole === 'student'
                           ? 'bg-blue-600 text-white'
                           : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                       }`}
                     >
                       Student
                     </button>
                     <button
                       type="button"
                       onClick={() => setSelectedRole('teacher')}
                       className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                         selectedRole === 'teacher'
                           ? 'bg-blue-600 text-white'
                           : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                       }`}
                     >
                       Teacher
                     </button>
                     <button
                       type="button"
                       onClick={() => setSelectedRole('admin')}
                       className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                         selectedRole === 'admin'
                           ? 'bg-blue-600 text-white'
                           : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                       }`}
                     >
                       Admin
                     </button>
                   </div>
                 </div>
                 
                                   <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {selectedRole === 'student' ? 'Student ID' : selectedRole === 'teacher' ? 'Teacher ID' : 'Admin ID'}
                    </label>
                    <input
                      type="text"
                      required
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder={`Enter your ${selectedRole} ID`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your password"
                    />
                  </div>
                 <button
                   type="submit"
                   className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                 >
                   Sign In
                 </button>
                 <div className="text-center">
                   <button
                     type="button"
                     onClick={() => setShowForgotPassword(true)}
                     className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
                   >
                     Forgot Password?
                   </button>
                 </div>
                 <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                   Don&apos;t have an account?{' '}
                   <Link
                     href="/auth/signup"
                     className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
                     onClick={() => setShowAuthModal(false)}
                   >
                     Sign up
                   </Link>
                 </div>
               </form>
                         ) : (
               <form onSubmit={handleForgotPassword} className="space-y-4">
                                   <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {selectedRole === 'student' ? 'Student ID' : selectedRole === 'teacher' ? 'Teacher ID' : 'Admin ID'}
                    </label>
                    <input
                      type="text"
                      required
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder={`Enter your ${selectedRole} ID`}
                    />
                  </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Send Reset Link
                </button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Sidebar - Mobile */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 right-0 h-full w-[70%] bg-white dark-sidebar z-50 p-6 transition-transform duration-300 ease-in-out lg:hidden overflow-y-auto max-h-screen ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <button
          onClick={() => setMenuOpen(false)}
          className="absolute top-4 right-4 text-xl z-50"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <nav className="flex flex-col space-y-6 mt-12">
          {navLinks.map(({ path, label, icon }) => (
            <Link
              key={path}
              href={path}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200 ${
                pathname === path
                  ? 'bg-blue-100 text-blue-900 font-semibold'
                  : 'hover:bg-blue-50'
              }`}
            >
              <FontAwesomeIcon icon={icon} />
              <span>{label}</span>
            </Link>
          ))}
          
                     {/* User Authentication in Sidebar */}
           <div className="border-t pt-4">
             {isLoggedIn ? (
               <div className="space-y-2">
                 <div className="flex items-center gap-3 px-3 py-2 text-blue-900">
                   <FontAwesomeIcon icon={faUser} />
                   <span>Welcome, {userType}</span>
                 </div>
                 <button
                   onClick={() => {
                     handleLogout();
                     setMenuOpen(false);
                   }}
                   className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-red-50 text-red-600 w-full"
                 >
                   <FontAwesomeIcon icon={faSignOutAlt} />
                   <span>Sign Out</span>
                 </button>
               </div>
             ) : (
               <button
                 onClick={() => {
                   setShowAuthModal(true);
                   setMenuOpen(false);
                 }}
                 className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-blue-50 text-blue-900 w-full"
               >
                 <FontAwesomeIcon icon={faUser} />
                 <span>Login</span>
               </button>
             )}
           </div>
        </nav>
        <button
          onClick={() => {
            setDarkMode(!darkMode);
            setMenuOpen(false);
          }}
          className={`mt-8 self-start transition-colors duration-300 w-10 h-10 flex items-center justify-center ${
            darkMode
              ? 'bg-white text-black border border-gray-400 rounded-full'
              : 'bg-gray-200 text-blue-900 rounded-full border border-transparent'
          }`}
          aria-label="Toggle Dark Mode"
        >
          <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
        </button>
      </div>

      <div className={`transition-transform duration-500 ease-in-out ${
        menuOpen ? "-translate-x-[70%] scale-[0.7] rounded-lg overflow-hidden" : ""
      }`}>
        
    

      {/* Contact Info Header */}
      <header
        className={`text-sm py-2 px-4 flex justify-between items-center flex-wrap z-20 transition-all duration-300 ${
          isHomePage
            ? 'absolute top-0 left-0 w-full text-gray-700 bg-transparent'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        <div className="flex flex-wrap gap-4 items-center">
          <span className="flex items-center gap-2">
            <FontAwesomeIcon icon={faPhone} />
            +234 90 355 26 146
          </span>
          <span className="flex items-center gap-2">
            <FontAwesomeIcon icon={faEnvelope} />
            yanoschoools@gmail.com
          </span>
          <span className="flex items-center gap-2">
            <FontAwesomeIcon icon={faMapMarkerAlt} />
            Ikorodu, Lagos.
          </span>
        </div>
      </header>

      {/* Desktop Navbar */}
      <nav
        className={`z-30 hidden lg:flex items-center px-6 ${
          isHomePage
            ? 'absolute lg:top-13 left-1/2 transform -translate-x-1/2 w-[80%] bg-white text-blue-900 rounded-xl shadow-md justify-between'
            : 'bg-lightmode-header shadow-md py-4 justify-between'
        }`}
      >
        <Link href="/">
          <Image
            src="/images/yano-logo.png"
            alt="Yano School Logo"
            width={160}
            height={64}
            className="h-16 w-auto object-contain"
            priority
          />
        </Link>
        <div className="flex space-x-6 font-medium items-center">
          {navLinks.map(({ path, label }) => (
            <Link
              key={path}
              href={path}
              className={`relative group transition-all duration-200 pb-1 ${
                pathname === path
                  ? 'text-blue-900 font-semibold'
                  : isHomePage
                  ? 'text-blue-900'
                  : 'text-gray-700 dark:text-gray-300'
              } hover:text-blue-700 dark:hover:text-white`}
            >
              {label}
              <span
                className={`absolute left-0 -bottom-3 h-[2px] bg-blue-700 transition-all duration-300 ${
                  pathname === path ? 'w-full' : 'w-0 group-hover:w-full'
                }`}
              ></span>
            </Link>
          ))}
          
          {/* User Authentication in Desktop Nav */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center gap-2 text-blue-900">
                  <FontAwesomeIcon icon={faUser} />
                  <span className="text-sm">Student</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm"
                  title="Sign Out"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} />
                </button>
              </div>
                         ) : (
               <button
                 onClick={() => setShowAuthModal(true)}
                 className="flex items-center gap-2 text-blue-900 hover:text-blue-700 transition-colors"
                 title="Login"
               >
                 <FontAwesomeIcon icon={faUser} />
                 <span className="text-sm">Login</span>
               </button>
             )}
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`transition-colors duration-300 w-10 h-10 flex items-center justify-center ${
                darkMode
                  ? 'bg-white text-black border border-gray-400 rounded-full'
                  : 'bg-gray-200 text-blue-900 rounded-full border border-transparent'
              }`}
              aria-label="Toggle Dark Mode"
            >
              <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <div
        className={`flex lg:hidden justify-between items-center px-4 shadow-md transition-all duration-300 ${
          isHomePage
            ? 'absolute top-[80px] w-[80%] left-1/2 transform -translate-x-1/2 bg-white z-30 rounded-xl shadow-md'
            : 'bg-lightmode-header dark:bg-darkmode-header'
        }`}
      >
        <Link href="/">
          <Image
            src="/images/yano-logo.png"
            alt="Yano School Logo"
            width={150}
            height={60}
            className="h-15 w-auto object-contain"
            priority
          />
        </Link>
        <div className="flex items-center space-x-4">
          {/* User Icon for Mobile */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2 text-blue-900">
              <FontAwesomeIcon icon={faUser} />
            </div>
                     ) : (
             <button
               onClick={() => setShowAuthModal(true)}
               className="text-blue-900 hover:text-blue-700"
               title="Login"
             >
               <FontAwesomeIcon icon={faUser} />
             </button>
           )}
          
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
            className={`text-xl ${
              isHomePage ? 'text-blue-900' : darkMode ? 'text-white' : 'text-gray-700'
            }`}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main
       >
        {children}
        <Footer />
      </main>
     </div> 
    </>
  );
}
