'use client';

import { useState } from 'react';
import { StudentCourseRegistration } from '@/types/courses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, BookOpen, User, Calendar, AlertCircle, Loader2 } from 'lucide-react';
// import { toast } from 'sonner';

interface RegistrationTableProps {
  registrations: StudentCourseRegistration[];
  userRole: 'admin' | 'teacher' | 'student';
  onRefresh: () => void;
  isLoading?: boolean;
}

export function RegistrationTable({ 
  registrations, 
  userRole, 
  onRefresh, 
  isLoading = false 
}: RegistrationTableProps) {
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManageRegistrations = userRole === 'admin' || userRole === 'teacher';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleApprove = async (registrationId: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/courses/registrations/${registrationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          approved_by: 'current-user-id', // In real app, get from auth context
          approved_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve registration');
      }

      console.log('Registration approved successfully!');
      onRefresh();
      setApprovingId(null);
    } catch (error) {
      console.error('Error approving registration:', error);
      console.error(error instanceof Error ? error.message : 'Failed to approve registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (registrationId: string) => {
    if (!rejectionReason.trim()) {
      console.error('Please provide a reason for rejection');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/courses/registrations/${registrationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          approved_by: 'current-user-id', // In real app, get from auth context
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject registration');
      }

      console.log('Registration rejected successfully!');
      onRefresh();
      setRejectingId(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting registration:', error);
      console.error(error instanceof Error ? error.message : 'Failed to reject registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (registrationId: string) => {
    if (!confirm('Are you sure you want to delete this registration?')) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/courses/registrations/${registrationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete registration');
      }

      console.log('Registration deleted successfully!');
      onRefresh();
    } catch (error) {
      console.error('Error deleting registration:', error);
      console.error(error instanceof Error ? error.message : 'Failed to delete registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading registrations...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (registrations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No registrations found</p>
            <p className="text-sm">
              {userRole === 'student' 
                ? 'You haven\'t registered for any courses yet.' 
                : 'No course registrations to display.'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Course Registrations
          </CardTitle>
          <CardDescription>
            {userRole === 'student' 
              ? 'Your course registration history' 
              : 'Manage student course registrations'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Student</th>
                  <th className="text-left p-3 font-medium">Course</th>
                  <th className="text-left p-3 font-medium">Class</th>
                  <th className="text-left p-3 font-medium">Term/Session</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Registered</th>
                  {canManageRegistrations && <th className="text-left p-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {registrations.map((registration) => (
                  <tr key={registration.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{registration.student_name || 'Unknown Student'}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{registration.course_name || 'Unknown Course'}</div>
                        <div className="text-sm text-gray-500">{registration.course_code}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        {registration.class_level}
                        {registration.stream && <span className="text-gray-500"> ({registration.stream})</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <div>{registration.term}</div>
                        <div className="text-gray-500">{registration.session}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      {getStatusBadge(registration.status)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(registration.registered_at).toLocaleDateString()}
                      </div>
                    </td>
                    {canManageRegistrations && (
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {registration.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => setApprovingId(registration.id)}
                                disabled={isSubmitting}
                                className="h-8 px-2 bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setRejectingId(registration.id)}
                                disabled={isSubmitting}
                                className="h-8 px-2"
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(registration.id)}
                            disabled={isSubmitting}
                            className="h-8 px-2"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={!!approvingId} onOpenChange={() => setApprovingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Registration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to approve this course registration?</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setApprovingId(null)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                onClick={() => approvingId && handleApprove(approvingId)}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Approve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={!!rejectingId} onOpenChange={() => setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Registration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Reason for Rejection</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this registration..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectingId(null)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => rejectingId && handleReject(rejectingId)}
                disabled={isSubmitting || !rejectionReason.trim()}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
