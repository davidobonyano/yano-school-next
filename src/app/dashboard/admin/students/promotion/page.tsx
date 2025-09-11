'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowUp, 
  faArrowDown,
  faCheck,
  faUsers,
  faGraduationCap,
  faSave
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '@/lib/supabase';

type Student = {
  id: string;
  name: string;
  email?: string | null;
  class?: string;
};

interface PromotionRecord {
  studentId: string;
  studentName: string;
  currentClass: string;
  newClass: string;
  action: 'promote' | 'demote' | 'lateral';
}

export default function StudentPromotionPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [targetClass, setTargetClass] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const classes = [
    'JSS1A', 'JSS1B', 'JSS1C',
    'JSS2A', 'JSS2B', 'JSS2C', 
    'JSS3A', 'JSS3B', 'JSS3C',
    'SS1A', 'SS1B', 'SS1C',
    'SS2A', 'SS2B', 'SS2C',
    'SS3A', 'SS3B', 'SS3C'
  ];

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('school_students')
        .select('id, full_name, email, class_level, stream');
      if (!error) {
        setStudents((data || []).map((s: any) => ({
          id: s.id,
          name: s.full_name,
          email: s.email,
          class: s.stream ? `${s.class_level}${s.stream?.slice(0,1)}` : s.class_level,
        })));
      }
    })();
  }, []);

  const studentsInSelectedClass = students.filter(s => s.class === selectedClass);

  const getActionType = (currentClass: string, newClass: string): 'promote' | 'demote' | 'lateral' => {
    const classLevels: { [key: string]: number } = {
      'JSS1A': 1, 'JSS1B': 1, 'JSS1C': 1,
      'JSS2A': 2, 'JSS2B': 2, 'JSS2C': 2,
      'JSS3A': 3, 'JSS3B': 3, 'JSS3C': 3,
      'SS1A': 4, 'SS1B': 4, 'SS1C': 4,
      'SS2A': 5, 'SS2B': 5, 'SS2C': 5,
      'SS3A': 6, 'SS3B': 6, 'SS3C': 6,
    };

    const currentLevel = classLevels[currentClass] || 0;
    const newLevel = classLevels[newClass] || 0;

    if (newLevel > currentLevel) return 'promote';
    if (newLevel < currentLevel) return 'demote';
    return 'lateral';
  };

  const handleAddPromotion = (student: Student) => {
    if (!targetClass || student.class === targetClass) return;

    const existingIndex = promotions.findIndex(p => p.studentId === student.id);
    const newPromotion: PromotionRecord = {
      studentId: student.id,
      studentName: student.name,
      currentClass: student.class || '',
      newClass: targetClass,
      action: getActionType(student.class || '', targetClass)
    };

    if (existingIndex >= 0) {
      const newPromotions = [...promotions];
      newPromotions[existingIndex] = newPromotion;
      setPromotions(newPromotions);
    } else {
      setPromotions([...promotions, newPromotion]);
    }
  };

  const handleRemovePromotion = (studentId: string) => {
    setPromotions(promotions.filter(p => p.studentId !== studentId));
  };

  const handleBulkPromote = () => {
    if (!selectedClass || !targetClass) return;

    const newPromotions = studentsInSelectedClass.map(student => ({
      studentId: student.id,
      studentName: student.name,
      currentClass: student.class || '',
      newClass: targetClass,
      action: getActionType(student.class || '', targetClass)
    }));

    // Remove existing promotions for these students and add new ones
    const otherPromotions = promotions.filter(p => !studentsInSelectedClass.some(s => s.id === p.studentId));
    setPromotions([...otherPromotions, ...newPromotions]);
  };

  const handleProcessPromotions = async () => {
    if (promotions.length === 0) return;

    setIsProcessing(true);
    
    // Simulate API processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In a real app, you would make API calls here
    console.log('Processing promotions:', promotions);

    // Update local state to reflect changes
    const updatedStudents = students.map(student => {
      const promotion = promotions.find(p => p.studentId === student.id);
      if (promotion) {
        return { ...student, class: promotion.newClass };
      }
      return student;
    });

    setStudents(updatedStudents);
    setPromotions([]);
    setIsProcessing(false);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'promote': return faArrowUp;
      case 'demote': return faArrowDown;
      default: return faCheck;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'promote': return 'text-green-600 bg-green-100';
      case 'demote': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faGraduationCap} className="w-6 h-6 text-purple-600" />
          Student Promotion & Class Movement
        </h1>
        <p className="text-gray-600">Promote, demote, or move students between classes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel: Select and Move Students */}
        <div className="space-y-6">
          {/* Class Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Source Class</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="currentClass" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Class
                </label>
                <select
                  id="currentClass"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select class</option>
                  {classes.map(cls => (
                    <option key={cls} value={cls}>
                      {cls} ({students.filter(s => s.class === cls).length} students)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="targetClass" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Class
                </label>
                <select
                  id="targetClass"
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select target class</option>
                  {classes.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {selectedClass && targetClass && (
              <div className="mt-4">
                <button
                  onClick={handleBulkPromote}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faUsers} className="w-4 h-4" />
                  Move All Students from {selectedClass} to {targetClass}
                </button>
              </div>
            )}
          </div>

          {/* Students in Selected Class */}
          {selectedClass && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Students in {selectedClass} ({studentsInSelectedClass.length})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {studentsInSelectedClass.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </div>
                    <button
                      onClick={() => handleAddPromotion(student)}
                      disabled={!targetClass || student.class === targetClass}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add to Queue
                    </button>
                  </div>
                ))}
                {studentsInSelectedClass.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No students in this class</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Promotion Queue */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Promotion Queue ({promotions.length})
            </h2>
            {promotions.length > 0 && (
              <button
                onClick={handleProcessPromotions}
                disabled={isProcessing}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faSave} className="w-4 h-4" />
                {isProcessing ? 'Processing...' : 'Process All'}
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {promotions.map(promotion => (
              <div key={promotion.studentId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{promotion.studentName}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <span>{promotion.currentClass}</span>
                      <FontAwesomeIcon 
                        icon={getActionIcon(promotion.action)} 
                        className={`w-3 h-3 ${getActionColor(promotion.action).split(' ')[0]}`}
                      />
                      <span>{promotion.newClass}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(promotion.action)}`}>
                      {promotion.action.charAt(0).toUpperCase() + promotion.action.slice(1)}
                    </span>
                    <button
                      onClick={() => handleRemovePromotion(promotion.studentId)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {promotions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FontAwesomeIcon icon={faUsers} className="w-12 h-12 mb-4 text-gray-300" />
                <p>No promotions queued</p>
                <p className="text-sm">Select students from the left panel to add them to the promotion queue</p>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {promotions.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {promotions.filter(p => p.action === 'promote').length}
                  </div>
                  <div className="text-sm text-gray-500">Promotions</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">
                    {promotions.filter(p => p.action === 'demote').length}
                  </div>
                  <div className="text-sm text-gray-500">Demotions</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {promotions.filter(p => p.action === 'lateral').length}
                  </div>
                  <div className="text-sm text-gray-500">Lateral Moves</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
