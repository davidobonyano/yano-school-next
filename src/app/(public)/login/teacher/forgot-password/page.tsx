'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft,
  faEnvelope,
  faCheckCircle,
  faExclamationTriangle,
  faChalkboardTeacher
} from '@fortawesome/free-solid-svg-icons';
import { mockUsers } from '@/lib/enhanced-mock-data';

type RecoveryStep = 'enter-email' | 'success';

export default function TeacherForgotPassword() {
  const [currentStep, setCurrentStep] = useState<RecoveryStep>('enter-email');
  const [email, setEmail] = useState('');
  const [foundTeacher, setFoundTeacher] = useState<{id: string; name: string; email: string} | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleEmailRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Find teacher by email
    const teacher = mockUsers.teachers.find(t => t.email.toLowerCase() === email.toLowerCase().trim());
    
    if (teacher) {
      setFoundTeacher(teacher);
      setCurrentStep('success');
      setMessage(`Password recovery instructions have been sent to ${email}`);
    } else {
      setError('No teacher account found with this email address.');
    }
  };

  const resetForm = () => {
    setCurrentStep('enter-email');
    setEmail('');
    setFoundTeacher(null);
    setMessage('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <FontAwesomeIcon icon={faChalkboardTeacher} className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Password Recovery</h1>
            <p className="text-gray-600 mt-2">
              {currentStep === 'enter-email' && "Enter your registered email address"}
              {currentStep === 'success' && "Recovery instructions sent!"}
            </p>
          </div>

          {/* Step 1: Enter Email */}
          {currentStep === 'enter-email' && (
            <form onSubmit={handleEmailRecovery} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Enter the email address you used when your account was created
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Need help remembering your email?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Check with the school administration</li>
                  <li>• Look for previous emails from the school system</li>
                  <li>• Contact IT support for assistance</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <a
                  href="/login/teacher"
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
                  Back to Login
                </a>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Send Recovery Email
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Success */}
          {currentStep === 'success' && (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faCheckCircle} className="w-8 h-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Recovery Email Sent!</h3>
                <p className="text-gray-600 mb-4">{message}</p>
                {foundTeacher && (
                  <p className="text-sm text-gray-500">
                    Instructions sent to <strong>{foundTeacher.name}</strong>
                  </p>
                )}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-green-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Check your email inbox (and spam folder)</li>
                  <li>• Click the recovery link in the email</li>
                  <li>• Create a new password</li>
                  <li>• Log in with your new password</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-yellow-900 mb-2">Important Security Note:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• The recovery link will expire in 24 hours</li>
                  <li>• Don&apos;t share the recovery link with anyone</li>
                  <li>• If you didn&apos;t request this, contact IT immediately</li>
                </ul>
              </div>

              <div className="space-y-3">
                <button
                  onClick={resetForm}
                  className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Try Another Email
                </button>
                <a
                  href="/login/teacher"
                  className="block w-full py-3 px-4 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 transition-colors"
                >
                  Back to Teacher Login
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="font-medium text-gray-900 mb-2">Need immediate assistance?</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>IT Support:</strong> ext. 2100</p>
              <p><strong>Admin Office:</strong> ext. 1000</p>
              <p><strong>Email:</strong> support@school.edu</p>
            </div>
          </div>
        </div>

        {/* Admin Note */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Admin users: Contact the system administrator directly for password recovery
          </p>
        </div>
      </div>
    </div>
  );
}
