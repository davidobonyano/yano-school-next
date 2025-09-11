"use client";

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faCalendarAlt, faBook, faTimes, faEye } from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RegistrationSummary {
  session: string;
  term: string;
  total_courses: number;
  approved_courses: number;
}

interface CourseDetail {
  registration_id: string;
  course_code: string;
  course_name: string;
  class_level: string;
  stream: string;
  term: string;
  session: string;
  status: string;
  registered_at: string;
}

interface StudentRegistrationSummaryProps {
  studentId?: string;
  className?: string;
}

export function StudentRegistrationSummary({ studentId, className }: StudentRegistrationSummaryProps) {
  const [summaries, setSummaries] = useState<RegistrationSummary[]>([]);
  const [courseDetails, setCourseDetails] = useState<CourseDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!studentId) {
        setSummaries([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/registrations/student-history?student_id=${encodeURIComponent(studentId)}`);
        if (!response.ok) throw new Error('Failed to fetch registration history');
        const data = await response.json();
        setSummaries(data.summaries || []);
      } catch (error) {
        console.error('Error fetching registration summary:', error);
        setSummaries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [studentId]);

  const fetchCourseDetails = async () => {
    if (!studentId) return;
    
    setDetailsLoading(true);
    try {
      const response = await fetch(`/api/registrations/student-details?student_id=${encodeURIComponent(studentId)}`);
      if (!response.ok) throw new Error('Failed to fetch course details');
      const data = await response.json();
      setCourseDetails(data.courses || []);
    } catch (error) {
      console.error('Error fetching course details:', error);
      setCourseDetails([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewDetails = () => {
    setShowDetails(true);
    fetchCourseDetails();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 text-green-600" />
            Registration Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-4">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!studentId || summaries.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 text-green-600" />
            Registration Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-4">No registration history found</div>
        </CardContent>
      </Card>
    );
  }

  const currentSummary = summaries[0];
  const previousSummaries = summaries.slice(1, 4);

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 text-green-600" />
              Registration Summary
            </div>
            {summaries.length > 0 && (
              <button
                onClick={handleViewDetails}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                View Details
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Current Session/Term */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Current</span>
            </div>
            <div className="text-lg font-semibold text-green-900">
              {currentSummary.session} • {currentSummary.term}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <FontAwesomeIcon icon={faBook} className="w-3 h-3 text-green-600" />
                <span className="text-sm text-green-700">{currentSummary.approved_courses}/{currentSummary.total_courses} approved</span>
              </div>
            </div>
          </div>

          {/* Previous Sessions/Terms */}
          {previousSummaries.map((summary, idx) => (
            <div key={`${summary.session}-${summary.term}`} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">
                {summary.session} • {summary.term}
              </div>
              <div className="flex items-center gap-1">
                <FontAwesomeIcon icon={faBook} className="w-3 h-3 text-gray-600" />
                <span className="text-sm text-gray-700">{summary.approved_courses}/{summary.total_courses} approved</span>
              </div>
            </div>
          ))}
        </div>

        {summaries.length > 4 && (
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-500">
              Showing latest 4 sessions • {summaries.length} total
            </span>
          </div>
        )}
        </CardContent>
      </Card>

      {/* Detailed Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faBook} className="w-5 h-5 text-green-600" />
                All Course Registrations
              </h2>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {detailsLoading ? (
                <div className="text-center py-8 text-gray-500">Loading course details...</div>
              ) : courseDetails.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No course registrations found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session/Term</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class/Stream</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {courseDetails.map((course, index) => (
                        <tr key={`${course.registration_id}-${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{course.course_code}</div>
                              <div className="text-xs text-gray-500">{course.course_name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {course.session} • {course.term}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {course.class_level}
                            {course.stream && ` • ${course.stream}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              course.status === 'approved' ? 'bg-green-100 text-green-800' :
                              course.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {course.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(course.registered_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
