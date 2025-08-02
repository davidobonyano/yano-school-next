'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../lib/auth-service';
import '../../lib/fontawesome';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({
    id: '',
    password: '',
    role: 'student' as 'student' | 'teacher' | 'admin'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);


    try {
      const response = await AuthService.login(credentials);
      
      if (response.success && response.user) {
        const dashboardUrl = AuthService.getDashboardUrl(response.user);
        router.push(dashboardUrl);
      } else {
        alert(response.error || 'Login failed');
      }
    } catch (error) {
      alert('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your Yano School account</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Login As</label>
              <div className="grid grid-cols-3 gap-3">
                {(['student', 'teacher', 'admin'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setCredentials(prev => ({ ...prev, role }))}
                    className={`py-2 px-4 rounded-lg border transition-colors ${
                      credentials.role === role
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* ID/Username */}
            <div>
              <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-2">
                {credentials.role === 'student' ? 'Student ID' : 
                 credentials.role === 'teacher' ? 'Teacher ID' : 'Admin ID'}
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faUser} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="id"
                  name="id"
                  type="text"
                  required
                  value={credentials.id}
                  onChange={(e) => setCredentials(prev => ({ ...prev, id: e.target.value }))}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Enter your ${credentials.role} ID`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>



            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/forgot-password" className="text-blue-600 hover:text-blue-500 font-medium">
              Forgot your password?
            </Link>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-500 font-medium">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}