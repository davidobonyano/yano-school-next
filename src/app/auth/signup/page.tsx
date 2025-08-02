'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, GraduationCap, BookOpen, MapPin, Calendar, Users } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';

// Validation schemas
const studentSignupSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
  studentId: z.string().optional(),
  grade: z.string().optional(),
  section: z.string().optional(),
  dateOfBirth: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  address: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const teacherSignupSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
  department: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type StudentSignupData = z.infer<typeof studentSignupSchema>;
type TeacherSignupData = z.infer<typeof teacherSignupSchema>;

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const studentForm = useForm<StudentSignupData>({
    resolver: zodResolver(studentSignupSchema),
  });

  const teacherForm = useForm<TeacherSignupData>({
    resolver: zodResolver(teacherSignupSchema),
  });

  const onStudentSubmit = async (data: StudentSignupData) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check if student ID already exists
      if (data.studentId) {
        const { data: existingStudent } = await supabase
          .from('users')
          .select('id')
          .eq('student_id', data.studentId)
          .single();

        if (existingStudent) {
          setError('Student ID already exists in the system');
          setIsLoading(false);
          return;
        }
      }

      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        // Insert user profile data
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: data.email,
            role: 'STUDENT',
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            student_id: data.studentId,
            grade: data.grade,
            section: data.section,
            date_of_birth: data.dateOfBirth,
            parent_name: data.parentName,
            parent_phone: data.parentPhone,
            address: data.address,
          });

        if (profileError) {
          setError('Failed to create profile. Please try again.');
          setIsLoading(false);
          return;
        }

        setSuccess('Student account created successfully! Please check your email to verify your account.');
        studentForm.reset();
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    }

    setIsLoading(false);
  };

  const onTeacherSubmit = async (data: TeacherSignupData) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        // Insert user profile data
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: data.email,
            role: 'TEACHER',
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            department: data.department,
            qualification: data.qualification,
            experience: data.experience ? parseInt(data.experience) : null,
          });

        if (profileError) {
          setError('Failed to create profile. Please try again.');
          setIsLoading(false);
          return;
        }

        setSuccess('Teacher account created successfully! Please check your email to verify your account.');
        teacherForm.reset();
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    }

    setIsLoading(false);
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
                  Welcome to Yano School
                </h1>
                <p className="text-blue-100 text-lg mb-8">
                  Join our community of learners and educators. Create your account to access our comprehensive learning platform.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="w-6 h-6" />
                    <span>Comprehensive Learning Management</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-6 h-6" />
                    <span>Interactive Exam System</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="w-6 h-6" />
                    <span>Collaborative Learning Environment</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right side - Signup Form */}
            <div className="p-8 lg:p-12">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h2>
                  <p className="text-gray-600">Choose your role and get started</p>
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

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm"
                  >
                    {success}
                  </motion.div>
                )}

                <Tabs defaultValue="student" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="student">Student</TabsTrigger>
                    <TabsTrigger value="teacher">Teacher</TabsTrigger>
                  </TabsList>

                  <TabsContent value="student">
                    <form onSubmit={studentForm.handleSubmit(onStudentSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name *</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="firstName"
                              {...studentForm.register('firstName')}
                              className="pl-10"
                              placeholder="Enter first name"
                            />
                          </div>
                          {studentForm.formState.errors.firstName && (
                            <p className="text-red-500 text-xs mt-1">{studentForm.formState.errors.firstName.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="lastName">Last Name *</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="lastName"
                              {...studentForm.register('lastName')}
                              className="pl-10"
                              placeholder="Enter last name"
                            />
                          </div>
                          {studentForm.formState.errors.lastName && (
                            <p className="text-red-500 text-xs mt-1">{studentForm.formState.errors.lastName.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            {...studentForm.register('email')}
                            className="pl-10"
                            placeholder="Enter your email"
                          />
                        </div>
                        {studentForm.formState.errors.email && (
                          <p className="text-red-500 text-xs mt-1">{studentForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="studentId">Student ID (Optional)</Label>
                        <Input
                          id="studentId"
                          {...studentForm.register('studentId')}
                          placeholder="Enter student ID if you have one"
                        />
                        <p className="text-xs text-gray-500 mt-1">If you already have a student ID from the exam system, enter it here</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="grade">Grade</Label>
                          <Input
                            id="grade"
                            {...studentForm.register('grade')}
                            placeholder="e.g., Grade 10"
                          />
                        </div>

                        <div>
                          <Label htmlFor="section">Section</Label>
                          <Input
                            id="section"
                            {...studentForm.register('section')}
                            placeholder="e.g., A, B, C"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="phone"
                            {...studentForm.register('phone')}
                            className="pl-10"
                            placeholder="Enter phone number"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="dateOfBirth"
                            type="date"
                            {...studentForm.register('dateOfBirth')}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="parentName">Parent/Guardian Name</Label>
                          <Input
                            id="parentName"
                            {...studentForm.register('parentName')}
                            placeholder="Parent/Guardian name"
                          />
                        </div>

                        <div>
                          <Label htmlFor="parentPhone">Parent/Guardian Phone</Label>
                          <Input
                            id="parentPhone"
                            {...studentForm.register('parentPhone')}
                            placeholder="Parent/Guardian phone"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="address">Address</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="address"
                            {...studentForm.register('address')}
                            className="pl-10"
                            placeholder="Enter your address"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="password">Password *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            {...studentForm.register('password')}
                            className="pl-10 pr-10"
                            placeholder="Enter password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {studentForm.formState.errors.password && (
                          <p className="text-red-500 text-xs mt-1">{studentForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            {...studentForm.register('confirmPassword')}
                            className="pl-10 pr-10"
                            placeholder="Confirm password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {studentForm.formState.errors.confirmPassword && (
                          <p className="text-red-500 text-xs mt-1">{studentForm.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoading ? 'Creating Account...' : 'Create Student Account'}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="teacher">
                    <form onSubmit={teacherForm.handleSubmit(onTeacherSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="teacherFirstName">First Name *</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="teacherFirstName"
                              {...teacherForm.register('firstName')}
                              className="pl-10"
                              placeholder="Enter first name"
                            />
                          </div>
                          {teacherForm.formState.errors.firstName && (
                            <p className="text-red-500 text-xs mt-1">{teacherForm.formState.errors.firstName.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="teacherLastName">Last Name *</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="teacherLastName"
                              {...teacherForm.register('lastName')}
                              className="pl-10"
                              placeholder="Enter last name"
                            />
                          </div>
                          {teacherForm.formState.errors.lastName && (
                            <p className="text-red-500 text-xs mt-1">{teacherForm.formState.errors.lastName.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="teacherEmail">Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="teacherEmail"
                            type="email"
                            {...teacherForm.register('email')}
                            className="pl-10"
                            placeholder="Enter your email"
                          />
                        </div>
                        {teacherForm.formState.errors.email && (
                          <p className="text-red-500 text-xs mt-1">{teacherForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="teacherPhone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="teacherPhone"
                            {...teacherForm.register('phone')}
                            className="pl-10"
                            placeholder="Enter phone number"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="department">Department</Label>
                          <Input
                            id="department"
                            {...teacherForm.register('department')}
                            placeholder="e.g., Mathematics, Science"
                          />
                        </div>

                        <div>
                          <Label htmlFor="qualification">Qualification</Label>
                          <Input
                            id="qualification"
                            {...teacherForm.register('qualification')}
                            placeholder="e.g., M.Ed, B.Sc"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input
                          id="experience"
                          type="number"
                          {...teacherForm.register('experience')}
                          placeholder="Number of years"
                        />
                      </div>

                      <div>
                        <Label htmlFor="teacherPassword">Password *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="teacherPassword"
                            type={showPassword ? 'text' : 'password'}
                            {...teacherForm.register('password')}
                            className="pl-10 pr-10"
                            placeholder="Enter password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {teacherForm.formState.errors.password && (
                          <p className="text-red-500 text-xs mt-1">{teacherForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="teacherConfirmPassword">Confirm Password *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="teacherConfirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            {...teacherForm.register('confirmPassword')}
                            className="pl-10 pr-10"
                            placeholder="Confirm password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {teacherForm.formState.errors.confirmPassword && (
                          <p className="text-red-500 text-xs mt-1">{teacherForm.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoading ? 'Creating Account...' : 'Create Teacher Account'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 text-center">
                  <p className="text-gray-600">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                      Sign in
                    </Link>
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}