'use client';

import { useState } from 'react';

interface Student {
  studentId: string;
  studentName: string;
  classLabel: string;
  outstandingAmount: number;
}

interface CarryOverModalProps {
  students: Student[];
  currentSession: string;
  currentTerm: string;
  onCarryOver: (toSession: string, toTerm: string) => void;
  onClose: () => void;
}

export function CarryOverModal({ 
  students, 
  currentSession, 
  currentTerm, 
  onCarryOver, 
  onClose 
}: CarryOverModalProps) {
  const [formData, setFormData] = useState({
    toSession: '',
    toTerm: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.toSession && formData.toTerm) {
      onCarryOver(formData.toSession, formData.toTerm);
    }
  };

  const totalOutstanding = students.reduce((sum, student) => sum + student.outstandingAmount, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Carry Over Outstanding Balances</h2>
        
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Summary</h3>
          <p className="text-yellow-700">
            Carrying over {students.length} outstanding balances from <strong>{currentSession} {currentTerm}</strong>
          </p>
          <p className="text-yellow-700">
            Total amount to carry over: <strong>₦{totalOutstanding.toLocaleString()}</strong>
          </p>
        </div>

        <div className="mb-6 max-h-60 overflow-y-auto">
          <h3 className="font-semibold mb-2">Students with Outstanding Balances:</h3>
          <div className="space-y-2">
            {students.map((student) => (
              <div key={student.studentId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{student.studentName}</span>
                  <span className="text-gray-500 ml-2">({student.studentId})</span>
                  <span className="text-gray-500 ml-2">- {student.classLabel}</span>
                </div>
                <span className="font-medium text-red-600">₦{student.outstandingAmount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Carry Over To Session</label>
            <input
              type="text"
              required
              value={formData.toSession}
              onChange={(e) => setFormData({ ...formData, toSession: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 2025/2026"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Carry Over To Term</label>
            <select
              required
              value={formData.toTerm}
              onChange={(e) => setFormData({ ...formData, toTerm: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Term</option>
              <option value="1st Term">1st Term</option>
              <option value="2nd Term">2nd Term</option>
              <option value="3rd Term">3rd Term</option>
            </select>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
              Carry Over Balances
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




