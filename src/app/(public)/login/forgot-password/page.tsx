'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft,
  faEnvelope,
  faIdCard,
  faCheckCircle,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';

type RecoveryStep = 'choose-method' | 'enter-email' | 'enter-student-id' | 'show-email' | 'success';

export default function StudentForgotPassword() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<RecoveryStep>('choose-method');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [foundStudent, setFoundStudent] = useState<{id: string; name: string; email: string} | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch('/api/students/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to process request');
        return;
      }
      if (data?.devToken) {
        setMessage(`Development token generated. You can reset now.`);
        router.push(`/login/reset-password?token=${encodeURIComponent(data.devToken)}`);
        return;
      }
      setCurrentStep('success');
      setMessage(`Password recovery instructions have been sent to ${email}`);
    } catch (err: any) {
      setError(err?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentIdLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch('/api/students/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: studentId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Lookup failed');
        return;
      }
      if (!data?.found) {
        setError('No student account found with this Student ID.');
        return;
      }
      setFoundStudent({ id: data.student.student_id, name: data.student.full_name, email: data.student.email });
      setCurrentStep('show-email');
    } catch (err: any) {
      setError(err?.message || 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailConfirmRecovery = async () => {
    if (!foundStudent?.email) return;
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch('/api/students/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: foundStudent.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to send recovery email');
        return;
      }
      if (data?.devToken) {
        setMessage(`Development token generated. You can reset now.`);
        router.push(`/login/reset-password?token=${encodeURIComponent(data.devToken)}`);
        return;
      }
      setCurrentStep('success');
      setMessage(`Password recovery instructions have been sent to ${foundStudent.email}`);
    } catch (err: any) {
      setError(err?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep('choose-method');
    setEmail('');
    setStudentId('');
    setFoundStudent(null);
    setMessage('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FontAwesomeIcon icon={faIdCard} className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Student Password Recovery</h1>
            <p className="text-gray-600 mt-2">
              {currentStep === 'choose-method' && "Choose how you'd like to recover your password"}
              {currentStep === 'enter-email' && "Enter your registered email address"}
              {currentStep === 'enter-student-id' && "Enter your Student ID"}
              {currentStep === 'show-email' && "Confirm your email address"}
              {currentStep === 'success' && "Recovery instructions sent!"}
            </p>
          </div>

          {/* Step 1: Choose Recovery Method */}
          {currentStep === 'choose-method' && (
            <div className="space-y-4">
              <button
                onClick={() => setCurrentStep('enter-email')}
                className="w-full p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faEnvelope} className="w-6 h-6 text-blue-600 mr-4" />
                  <div>
                    <h3 className="font-medium text-gray-900">I remember my email</h3>
                    <p className="text-sm text-gray-500">Enter the email you used during registration</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setCurrentStep('enter-student-id')}
                className="w-full p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faIdCard} className="w-6 h-6 text-green-600 mr-4" />
                  <div>
                    <h3 className="font-medium text-gray-900">I remember my Student ID</h3>
                    <p className="text-sm text-gray-500">Find my email using my Student ID</p>
                  </div>
                </div>
              </button>

              <div className="mt-6 text-center">
                <a 
                  href="/login" 
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
                  Back to Login
                </a>
              </div>
            </div>
          )}

          {/* Step 2: Enter Email */}
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
                    className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send Recovery Email
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Enter Student ID */}
          {currentStep === 'enter-student-id' && (
            <form onSubmit={handleStudentIdLookup} className="space-y-6">
              <div>
                <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
                  Student ID
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faIdCard} className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="studentId"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                    className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                    placeholder="Enter your Student ID"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Find My Email
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Show Email Found */}
          {currentStep === 'show-email' && foundStudent && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <FontAwesomeIcon icon={faCheckCircle} className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Found!</h3>
                <p className="text-gray-600 mb-4">
                  We found your account, <strong>{foundStudent.name}</strong>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Your registered email:</h4>
                <p className="text-blue-800 font-mono bg-white px-3 py-2 rounded border">
                  {foundStudent.email}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-1">Remember this email?</h4>
                <p className="text-sm text-yellow-800">
                  You can use this email to recover your password. Click below to send recovery instructions.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={resetForm}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Start Over
                </button>
                <button
                  onClick={handleEmailConfirmRecovery}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send Recovery Email
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {currentStep === 'success' && (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faCheckCircle} className="w-8 h-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Recovery Email Sent!</h3>
                <p className="text-gray-600 mb-4">{message}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Check your email inbox (and spam folder)</li>
                  <li>• Click the recovery link in the email</li>
                  <li>• Create a new password</li>
                  <li>• Log in with your new password</li>
                </ul>
              </div>

              <div className="space-y-3">
                <button
                  onClick={resetForm}
                  className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Try Another Account
                </button>
                <a
                  href="/login"
                  className="block w-full py-3 px-4 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Login
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Still having trouble? Contact the{' '}
            <a href="/contact" className="text-blue-600 hover:text-blue-700 font-medium">
              school administration
            </a>{' '}
            for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
