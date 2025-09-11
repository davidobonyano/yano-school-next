'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowUp, 
  faArrowDown,
  faUsers,
  faGraduationCap,
  faSave,
  faUserGraduate,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '@/lib/supabase';
import { useNotifications } from '@/components/ui/notifications';

type ClassLevel = 'NUR1' | 'NUR2' | 'KG1' | 'KG2' | 'PRI1' | 'PRI2' | 'PRI3' | 'PRI4' | 'PRI5' | 'PRI6' | 'JSS1' | 'JSS2' | 'JSS3' | 'SS1' | 'SS2' | 'SS3';

interface Student {
  id: string;
  student_id: string;
  full_name: string;
  class_level: ClassLevel;
  stream?: string | null;
  is_active: boolean;
}

interface PromotionRecord {
  studentId: string;
  studentName: string;
  currentClass: ClassLevel;
  newClass: ClassLevel;
  action: 'promote' | 'demote' | 'graduate';
}

const CLASS_HIERARCHY: Record<ClassLevel, number> = {
  'KG1': 1, 'KG2': 2,
  'NUR1': 3, 'NUR2': 4,
  'PRI1': 5, 'PRI2': 6, 'PRI3': 7, 'PRI4': 8, 'PRI5': 9, 'PRI6': 10,
  'JSS1': 11, 'JSS2': 12, 'JSS3': 13,
  'SS1': 14, 'SS2': 15, 'SS3': 16
};

const NEXT_CLASS: Record<ClassLevel, ClassLevel | 'GRADUATED'> = {
  'KG1': 'KG2',
  'KG2': 'NUR1',
  'NUR1': 'NUR2',
  'NUR2': 'PRI1',
  'PRI1': 'PRI2',
  'PRI2': 'PRI3',
  'PRI3': 'PRI4',
  'PRI4': 'PRI5',
  'PRI5': 'PRI6',
  'PRI6': 'JSS1',
  'JSS1': 'JSS2',
  'JSS2': 'JSS3',
  'JSS3': 'SS1',
  'SS1': 'SS2',
  'SS2': 'SS3',
  'SS3': 'GRADUATED'
};

export default function PromotionsPage() {
  const { showSuccessToast, showErrorToast } = useNotifications();
  const [students, setStudents] = useState<Student[]>([]);
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassLevel | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('school_students')
      .select('id, student_id, full_name, class_level, stream, is_active')
      .eq('is_active', true)
      .order('class_level', { ascending: true })
      .order('full_name', { ascending: true });
    
    if (!error && data) {
      setStudents(data);
    }
    setLoading(false);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm || 
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !selectedClass || student.class_level === selectedClass;
    return matchesSearch && matchesClass;
  });

  const handleAutoPromote = () => {
    if (!selectedClass) return;

    const newPromotions: PromotionRecord[] = [];
    const studentsInClass = students.filter(s => s.class_level === selectedClass);

    studentsInClass.forEach(student => {
      if (student.class_level === 'SS3') {
        // SS3 students are ready for graduation
        newPromotions.push({
          studentId: student.id,
          studentName: student.full_name,
          currentClass: student.class_level,
          newClass: 'SS3',
          action: 'graduate'
        });
      } else {
        // Promote to next class
        const nextClass = NEXT_CLASS[student.class_level];
        if (nextClass !== 'GRADUATED') {
          newPromotions.push({
            studentId: student.id,
            studentName: student.full_name,
            currentClass: student.class_level,
            newClass: nextClass as ClassLevel,
            action: 'promote'
          });
        }
      }
    });

    setPromotions(newPromotions);
  };

  const handleIndividualPromotion = (student: Student, action: 'promote' | 'demote' | 'graduate') => {
    const existingIndex = promotions.findIndex(p => p.studentId === student.id);
    
    let newClass: ClassLevel;
    if (action === 'graduate') {
      newClass = 'SS3';
    } else if (action === 'promote') {
      newClass = NEXT_CLASS[student.class_level] as ClassLevel;
    } else {
      // Demote - go back one class
      const currentLevel = CLASS_HIERARCHY[student.class_level];
      const demoteLevel = Math.max(1, currentLevel - 1);
      newClass = Object.keys(CLASS_HIERARCHY).find(key => 
        CLASS_HIERARCHY[key as ClassLevel] === demoteLevel
      ) as ClassLevel;
    }

    const newPromotion: PromotionRecord = {
      studentId: student.id,
      studentName: student.full_name,
      currentClass: student.class_level,
      newClass,
      action
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

  const handleProcessPromotions = async () => {
    if (promotions.length === 0) return;

    setIsProcessing(true);
    
    try {
      // Resolve current context for logging
      const ctxRes = await fetch('/api/settings/academic-context?action=current');
      const ctxJson = await ctxRes.json();
      const sessionId = ctxJson?.current?.session_id || null;
      const termId = ctxJson?.current?.term_id || null;

      for (const promotion of promotions) {
        if (promotion.action === 'graduate') {
          // Mark student as graduated (inactive)
          await supabase
            .from('school_students')
            .update({ is_active: false })
            .eq('id', promotion.studentId);

          // Log transition row for graduation with session/term
          await supabase
            .from('student_transitions')
            .insert({
              student_id: promotion.studentId,
              from_class: promotion.currentClass,
              to_class: promotion.newClass,
              action: 'Graduate',
              session_id: sessionId,
              term_id: termId
            });
        } else {
          // Update class level
          await supabase
            .from('school_students')
            .update({ class_level: promotion.newClass })
            .eq('id', promotion.studentId);

          // Log transition for promote/demote
          await supabase
            .from('student_transitions')
            .insert({
              student_id: promotion.studentId,
              from_class: promotion.currentClass,
              to_class: promotion.newClass,
              action: promotion.action === 'promote' ? 'Promote' : 'Demote',
              session_id: sessionId,
              term_id: termId
            });
        }
      }

      await fetchStudents();
      setPromotions([]);
      showSuccessToast(`Successfully processed ${promotions.length} student movements!`);
    } catch (error) {
      console.error('Error processing promotions:', error);
      showErrorToast('Error processing promotions. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'promote': return faArrowUp;
      case 'demote': return faArrowDown;
      case 'graduate': return faUserGraduate;
      default: return faUsers;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'promote': return 'text-green-600 bg-green-100';
      case 'demote': return 'text-red-600 bg-red-100';
      case 'graduate': return 'text-purple-600 bg-purple-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const classes = Object.keys(CLASS_HIERARCHY) as ClassLevel[];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faGraduationCap} className="w-6 h-6 text-purple-600" />
          Student Promotion & Class Management
        </h1>
        <p className="text-gray-600">Manage student promotions, demotions, and graduations</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value as ClassLevel | '')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Classes</option>
            {classes.map(cls => (
              <option key={cls} value={cls}>
                {cls} ({students.filter(s => s.class_level === cls).length})
              </option>
            ))}
          </select>
          <button
            onClick={handleAutoPromote}
            disabled={!selectedClass}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faUsers} className="w-4 h-4" />
            Auto-Promote Class
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                    </tr>
                  ) : filteredStudents.map((student) => {
                    const nextClass = NEXT_CLASS[student.class_level];
                    
                    return (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {student.full_name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                              <div className="text-sm text-gray-500">{student.student_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{student.class_level}</div>
                          {student.stream && (
                            <div className="text-xs text-gray-500">{student.stream}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {student.class_level === 'SS3' ? (
                              <button
                                onClick={() => handleIndividualPromotion(student, 'graduate')}
                                className="text-purple-600 hover:text-purple-900"
                                title="Mark for Graduation"
                              >
                                Graduate
                              </button>
                            ) : nextClass !== 'GRADUATED' ? (
                              <button
                                onClick={() => handleIndividualPromotion(student, 'promote')}
                                className="text-green-600 hover:text-green-900"
                                title="Promote"
                              >
                                Promote
                              </button>
                            ) : null}
                            {student.class_level !== 'KG1' && (
                              <button
                                onClick={() => handleIndividualPromotion(student, 'demote')}
                                className="text-red-600 hover:text-red-900"
                                title="Demote"
                              >
                                Demote
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {!loading && filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No students found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>

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
                      <span>{promotion.action === 'graduate' ? 'GRADUATED' : promotion.newClass}</span>
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
                <p className="text-sm">Select students to add them to the promotion queue</p>
              </div>
            )}
          </div>

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
                  <div className="text-lg font-bold text-purple-600">
                    {promotions.filter(p => p.action === 'graduate').length}
                  </div>
                  <div className="text-sm text-gray-500">Graduations</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">
                    {promotions.filter(p => p.action === 'demote').length}
                  </div>
                  <div className="text-sm text-gray-500">Demotions</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <FontAwesomeIcon icon={faUserGraduate} className="w-8 h-8 text-purple-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-purple-900 mb-2">SS3 Graduation Information</h3>
            <p className="text-purple-700 mb-3">
              SS3 students who meet graduation requirements will be marked as graduated and deactivated from the system. 
              This is a permanent action that cannot be undone.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded border border-purple-200">
                <div className="font-medium text-purple-900">Graduation Criteria</div>
                <div className="text-purple-700">SS3 completion</div>
              </div>
              <div className="bg-white p-3 rounded border border-purple-200">
                <div className="font-medium text-purple-900">System Action</div>
                <div className="text-purple-700">Mark as inactive (graduated)</div>
              </div>
              <div className="bg-white p-3 rounded border border-purple-200">
                <div className="font-medium text-purple-900">Records</div>
                <div className="text-purple-700">Academic records preserved</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 