// Utility functions for exporting data to CSV and other formats

export interface ExportableData {
  [key: string]: any;
}

export function exportToCSV(data: ExportableData[], filename: string) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportToJSON(data: ExportableData[], filename: string) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function formatDataForExport(data: any[], type: 'course-registrations' | 'graduated-students' | 'payment-history') {
  switch (type) {
    case 'course-registrations':
      return data.map(item => ({
        'Student Name': item.student_name,
        'Student ID': item.student_id,
        'Course': item.course_name,
        'Class': item.class_level,
        'Stream': item.stream || '',
        'Session': item.session,
        'Term': item.term,
        'Status': item.status,
        'Registered Date': new Date(item.registered_at).toLocaleDateString(),
        'Approved By': item.approved_by || '',
        'Approved Date': item.approved_at ? new Date(item.approved_at).toLocaleDateString() : ''
      }));

    case 'graduated-students':
      return data.map(item => ({
        'Student ID': item.student_id,
        'Full Name': item.full_name,
        'Class': item.class_level,
        'Stream': item.stream || '',
        'Graduation Session': item.session,
        'Graduation Date': new Date(item.graduation_date).toLocaleDateString()
      }));

    case 'payment-history':
      return data.map(item => ({
        'Student Name': item.student_name,
        'Student ID': item.student_id,
        'Amount': `₦${Number(item.amount).toLocaleString()}`,
        'Payment Method': item.payment_method,
        'Description': item.description,
        'Session': item.session,
        'Term': item.term,
        'Transaction Date': new Date(item.transaction_date).toLocaleDateString(),
        'Recorded By': item.recorded_by
      }));

    default:
      return data;
  }
}





