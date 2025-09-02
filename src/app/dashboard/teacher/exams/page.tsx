'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExternalLinkAlt,
  faClipboardList,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';

export default function ExamManagementPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faClipboardList} className="w-6 h-6 text-purple-600" />
          Exam Management
        </h1>
        <p className="text-gray-600">Manage exams and access the external exam portal when needed.</p>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <FontAwesomeIcon icon={faExternalLinkAlt} className="w-16 h-16 text-purple-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Exam Portal</h2>
          <p className="text-gray-600">
            Click the button below to access the dedicated exam management portal.
          </p>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <p className="text-purple-800 font-medium">
            The exam portal provides specialized tools for creating, managing, and grading exams.
          </p>
        </div>
        
        <a
          href="https://yano-exams-o6re.vercel.app/admin"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
          Go to Exam Portal
        </a>
        
        <p className="text-sm text-gray-500 mt-4">
          The exam portal will open in a new tab
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">About the Exam Portal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <h4 className="font-medium text-gray-900 mb-2">Dedicated Platform</h4>
            <p className="text-sm text-gray-600 mb-3">
              The exam portal provides a specialized interface for creating, managing, and grading exams.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <h4 className="font-medium text-gray-900 mb-2">Advanced Features</h4>
            <p className="text-sm text-gray-600 mb-3">
              Access question banks, exam templates, and advanced grading tools.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
