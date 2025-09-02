'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileExport,
  faChartBar,
  faDownload,
  faFilter,
  faCalendarAlt,
  faUsers,
  faBookOpen,
  faClipboardList,
  faChartLine,
  faPrint
} from '@fortawesome/free-solid-svg-icons';

interface ReportData {
  id: string;
  name: string;
  type: 'academic' | 'attendance' | 'performance' | 'comprehensive';
  dateRange: string;
  status: 'generated' | 'pending' | 'failed';
  downloadUrl?: string;
  createdAt: string;
}

export default function TeacherReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [dateRange, setDateRange] = useState('current-term');

  // Fetch reports data
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        // TODO: Replace with real API call
        // const response = await fetch('/api/teachers/reports');
        // const data = await response.json();
        // setReports(data.reports || []);
        
        // For now, set empty array
        setReports([]);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const generateReport = async (type: string) => {
    try {
      // TODO: Implement report generation API call
      console.log('Generating report:', type);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newReport: ReportData = {
        id: `report${Date.now()}`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
        type: type as any,
        dateRange: dateRange,
        status: 'generated',
        createdAt: new Date().toISOString()
      };
      
      setReports([newReport, ...reports]);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const downloadReport = (report: ReportData) => {
    // TODO: Implement actual download functionality
    console.log('Downloading report:', report.id);
  };

  const printReport = (report: ReportData) => {
    // TODO: Implement print functionality
    console.log('Printing report:', report.id);
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'academic': return faBookOpen;
      case 'attendance': return faUsers;
      case 'performance': return faChartLine;
      case 'comprehensive': return faChartBar;
      default: return faFileExport;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'generated': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800'}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-gray-200 rounded-lg h-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faFileExport} className="w-6 h-6 text-teal-600" />
          Reports & Analytics
        </h1>
        <p className="text-gray-600">Generate and manage comprehensive reports for your classes</p>
      </div>

      {/* Quick Report Generation */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate New Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Select Report Type</option>
              <option value="academic">Academic Performance</option>
              <option value="attendance">Attendance Report</option>
              <option value="performance">Class Performance</option>
              <option value="comprehensive">Comprehensive Report</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="current-term">Current Term</option>
              <option value="last-term">Last Term</option>
              <option value="current-year">Current Academic Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => generateReport(selectedReportType)}
              disabled={!selectedReportType}
              className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faFileExport} className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Report Types Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faBookOpen} className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Academic Reports</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.type === 'academic').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Attendance Reports</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.type === 'attendance').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faChartLine} className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Performance Reports</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.type === 'performance').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-orange-100 rounded-lg p-3 mr-4">
              <FontAwesomeIcon icon={faChartBar} className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Comprehensive</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.type === 'comprehensive').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Reports */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Generated Reports</h2>
        </div>
        
        {reports.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {reports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <FontAwesomeIcon icon={getReportIcon(report.type)} className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center">
                          <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-1" />
                          {report.dateRange}
                        </span>
                        <span className={getStatusBadge(report.status)}>
                          {report.status}
                        </span>
                        <span>
                          Generated: {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {report.status === 'generated' && (
                      <>
                        <button
                          onClick={() => downloadReport(report)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download Report"
                        >
                          <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => printReport(report)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Print Report"
                        >
                          <FontAwesomeIcon icon={faPrint} className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faFileExport} className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Generated</h3>
            <p className="text-gray-500">
              You haven't generated any reports yet. Use the form above to create your first report.
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-teal-50 border border-teal-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-teal-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-teal-200">
            <h4 className="font-medium text-gray-900 mb-2">Bulk Report Generation</h4>
            <p className="text-sm text-gray-600 mb-3">
              Need to generate multiple reports at once? Contact the administration office.
            </p>
            <a 
              href="/contact" 
              className="text-teal-600 hover:text-teal-800 text-sm font-medium"
            >
              Contact Admin →
            </a>
          </div>
          <div className="bg-white rounded-lg p-4 border border-teal-200">
            <h4 className="font-medium text-gray-900 mb-2">Custom Report Templates</h4>
            <p className="text-sm text-gray-600 mb-3">
              Request custom report templates for specific needs.
            </p>
            <span className="text-teal-600 text-sm font-medium">
              📧 Submit Request
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 