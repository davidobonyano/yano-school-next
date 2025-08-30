'use client';

import { useState, useEffect } from 'react';
import { 
  StudentCourseRegistration, 
  CourseRegistrationCreate, 
  CourseRegistrationUpdate,
  CourseRegistrationFilters 
} from '@/types/courses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, BookOpen, Users, AlertCircle, Loader2, Filter } from 'lucide-react';
// import { toast } from 'sonner';
import { CourseRegistrationForm } from './CourseRegistrationForm';
import { RegistrationTable } from './RegistrationTable';

interface CourseRegistrationManagerProps {
  userRole: 'admin' | 'teacher' | 'student';
  userId?: string;
  userClassLevel?: string;
  userStream?: string;
  className?: string;
}

export function CourseRegistrationManager({ 
  userRole, 
  userId, 
  userClassLevel, 
  userStream, 
  className = '' 
}: CourseRegistrationManagerProps) {
  const [registrations, setRegistrations] = useState<StudentCourseRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [filters, setFilters] = useState<CourseRegistrationFilters>({
    status: undefined,
    class_level: 'all',
    term: 'all',
    session: 'all'
  });

  const canManageRegistrations = userRole === 'admin' || userRole === 'teacher';
  const canCreateRegistrations = userRole === 'student';

  // Fetch registrations based on user role and filters
  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Add user-specific filters
      if (userRole === 'student' && userId) {
        params.append('student_id', userId);
      }
      
      // Add general filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
      });

      const response = await fetch(`/api/courses/registrations?${params}`);
      if (!response.ok) throw new Error('Failed to fetch registrations');
      
      const data = await response.json();
      setRegistrations(data.registrations || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      console.error('Failed to load registrations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [userRole, userId, filters]);

  const handleRegistrationSuccess = () => {
    fetchRegistrations();
  };

  const handleFilterChange = (key: keyof CourseRegistrationFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: undefined,
      class_level: 'all',
      term: 'all',
      session: 'all'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Registrations</h1>
          <p className="text-gray-600 mt-1">
            {userRole === 'admin' && 'Manage all student course registrations'}
            {userRole === 'teacher' && 'Review and approve student course registrations'}
            {userRole === 'student' && 'Register for courses and track your applications'}
          </p>
        </div>
        
        {canCreateRegistrations && (
          <Button onClick={() => setShowRegistrationForm(true)} className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Register for Course
          </Button>
        )}
      </div>

      {/* Filters */}
      {canManageRegistrations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                                      <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="class-filter">Class Level</Label>
                <Select value={filters.class_level} onValueChange={(value) => handleFilterChange('class_level', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                                      <SelectItem value="all">All classes</SelectItem>
                  <SelectItem value="JSS1">JSS1</SelectItem>
                  <SelectItem value="JSS2">JSS2</SelectItem>
                  <SelectItem value="JSS3">JSS3</SelectItem>
                  <SelectItem value="SS1">SS1</SelectItem>
                  <SelectItem value="SS2">SS2</SelectItem>
                  <SelectItem value="SS3">SS3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="term-filter">Term</Label>
                <Select value={filters.term} onValueChange={(value) => handleFilterChange('term', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All terms" />
                  </SelectTrigger>
                  <SelectContent>
                                      <SelectItem value="all">All terms</SelectItem>
                  <SelectItem value="1st Term">1st Term</SelectItem>
                  <SelectItem value="2nd Term">2nd Term</SelectItem>
                  <SelectItem value="3rd Term">3rd Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-filter">Session</Label>
                <Select value={filters.session} onValueChange={(value) => handleFilterChange('session', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All sessions" />
                  </SelectTrigger>
                  <SelectContent>
                                      <SelectItem value="all">All sessions</SelectItem>
                  <SelectItem value="2025/2026">2025/2026</SelectItem>
                  <SelectItem value="2024/2025">2024/2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registration Table */}
      <RegistrationTable
        registrations={registrations}
        userRole={userRole}
        onRefresh={fetchRegistrations}
        isLoading={isLoading}
      />

      {/* Registration Form Dialog */}
      {canCreateRegistrations && userClassLevel && (
        <CourseRegistrationForm
          isOpen={showRegistrationForm}
          onClose={() => setShowRegistrationForm(false)}
          onSuccess={handleRegistrationSuccess}
          userClassLevel={userClassLevel}
          userStream={userStream}
        />
      )}
    </div>
  );
}
