'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faDownload } from '@fortawesome/free-solid-svg-icons';

export default function SchoolCalendar() {
  return (
    <section className="mb-16 bg-gray-100 px-4 py-8 rounded-2xl shadow-inner">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center">
        <FontAwesomeIcon icon={faCalendarAlt} className="text-red-400 mr-2" />
        2024/2025 Lagos State School Calendar
      </h2>

      <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
        <li>
          <strong>1st Term:</strong> Sept 9, 2024 – Dec 13, 2024
        </li>
        <li>
          <strong>2nd Term:</strong> Jan 6, 2025 – Apr 11, 2025
        </li>
        <li>
          <strong>3rd Term:</strong> Apr 28, 2025 – Jul 28, 2025
        </li>
        <li>
          Mid‑term breaks and public holidays follow Lagos State government announcements.
        </li>
      </ul>

      <div className="flex flex-col sm:flex-row gap-4">
        <a
          href="/files/lagos.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center px-6 py-2 bg-red-400 text-white rounded-full hover:bg-red-500 transition text-sm shadow"
        >
          <FontAwesomeIcon icon={faDownload} className="mr-2" />
          View PDF
        </a>
      </div>
    </section>
  );
}
