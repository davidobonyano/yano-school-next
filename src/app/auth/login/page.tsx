'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, LogIn, GraduationCap, BookOpen, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState('');
  const router = useRouter();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        // Get user profile to determine role
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (profile) {
          // Redirect based on role
          switch (profile.role) {
            case 'STUDENT':
              router.push('/dashboard/student');
              break;
            case 'TEACHER':
              router.push('/dashboard/teacher');
              break;
            case 'ADMIN':
              router.push('/dashboard/admin');
              break;
            default:
              router.push('/dashboard');
          }
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      setError('Please enter your email address');
      return;
    }

    setForgotPasswordLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setForgotPasswordSuccess('Password reset email sent! Please check your inbox.');
        setForgotPasswordEmail('');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    }

    setForgotPasswordLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left side - Image/Branding */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 lg:p-12 flex flex-col justify-center text-white">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                  Welcome Back to Yano School
                </h1>
                <p className="text-blue-100 text-lg mb-8">
                  Sign in to access your personalized learning dashboard and continue your educational journey.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="w-6 h-6" />
                    <span>Access Your Learning Dashboard</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-6 h-6" />
                    <span>Take Online Exams</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="w-6 h-6" />
                    <span>Connect with Teachers</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right side - Login Form */}
            <div className="p-8 lg:p-12">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h2>
                  <p className="text-gray-600">Welcome back! Please sign in to your account</p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {forgotPasswordSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm"
                  >
                    {forgotPasswordSuccess}
                  </motion.div>
                )}

                {!isForgotPassword ? (
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          {...form.register('email')}
                          className="pl-10"
                          placeholder="Enter your email"
                        />
                      </div>
                      {form.formState.errors.email && (
                        <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          {...form.register('password')}
                          className="pl-10 pr-10"
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {form.formState.errors.password && (
                        <p className="text-red-500 text-xs mt-1">{form.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Forgot your password?
                      </button>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Signing in...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <LogIn className="w-4 h-4" />
                          <span>Sign In</span>
                        </div>
                      )}
                    </Button>

                    <div className="text-center">
                      <p className="text-gray-600">
                        Don't have an account?{' '}
                        <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                          Sign up
                        </Link>
                      </p>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="forgotEmail">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="forgotEmail"
                          type="email"
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          className="pl-10"
                          placeholder="Enter your email address"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        onClick={handleForgotPassword}
                        disabled={forgotPasswordLoading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {forgotPasswordLoading ? 'Sending...' : 'Send Reset Email'}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsForgotPassword(false);
                          setForgotPasswordEmail('');
                          setError('');
                          setForgotPasswordSuccess('');
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Back to Login
                      </Button>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Enter your email address and we'll send you a link to reset your password.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}