'use client';

import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faFilter, faTrash, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { useNotifications } from '@/components/ui/notifications';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase, StudentRow } from '@/lib/supabase';

type ClassLevel =
  | 'NUR1' | 'NUR2'
  | 'KG1' | 'KG2'
  | 'PRI1' | 'PRI2' | 'PRI3' | 'PRI4' | 'PRI5' | 'PRI6'
  | 'JSS1' | 'JSS2' | 'JSS3'
  | 'SS1' | 'SS2' | 'SS3';

export default function StudentsPage() {
  const { showErrorToast } = useNotifications();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<ClassLevel | ''>('');
  const [streamFilter, setStreamFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('');
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ full_name: string; email: string; phone: string; class_level: ClassLevel; stream: string; school_name: string; parent_name: string; parent_phone: string; is_active: boolean; } | null>(null);
  const [nextNumber, setNextNumber] = useState<number | null>(null);
  const [existingIds, setExistingIds] = useState<string[]>([]);
  const [allowReassignId, setAllowReassignId] = useState(false);
  const [selectedCustomId, setSelectedCustomId] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<StudentRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('school_students')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setStudents(data as StudentRow[]);
      setLoading(false);
    };
    fetchStudents();
  }, []);

  const classes = useMemo(() => {
    return Array.from(new Set(students.map(s => s.class_level).filter(Boolean))) as ClassLevel[];
  }, [students]);

  const streams = useMemo(() => {
    return Array.from(new Set(students.map(s => s.stream).filter(Boolean))) as string[];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q ||
        student.full_name.toLowerCase().includes(q) ||
        (student.email || '').toLowerCase().includes(q) ||
        (student.student_id || '').toLowerCase().includes(q) ||
        (student.school_name || '').toLowerCase().includes(q);
      const matchesClass = !classFilter || student.class_level === classFilter;
      const matchesStream = !streamFilter || (student.stream || '') === streamFilter;
      const matchesStatus = !statusFilter || (statusFilter === 'active' ? student.is_active : !student.is_active);
      return matchesSearch && matchesClass && matchesStream && matchesStatus;
    });
  }, [students, searchTerm, classFilter, streamFilter, statusFilter]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from('school_students').delete().eq('id', deleteTarget.id);
    setStudents(prev => prev.filter(s => s.id !== deleteTarget.id));
    setDeleting(false);
    setDeleteTarget(null);
  };

  const openEdit = (s: StudentRow) => {
    setEditing(s);
    setForm({
      full_name: s.full_name,
      email: s.email || '',
      phone: s.phone || '',
      class_level: (s.class_level as ClassLevel) || 'KG1',
      stream: s.stream || '',
      school_name: s.school_name || '',
      parent_name: s.parent_name || '',
      parent_phone: s.parent_phone || '',
      is_active: !!s.is_active,
    });
    (async () => {
      const [{ data: nextData }, { data: idsData }] = await Promise.all([
        supabase.rpc('get_next_student_number'),
        supabase.from('school_students').select('student_id')
      ]);
      if (typeof nextData === 'number') setNextNumber(nextData);
      if (Array.isArray(idsData)) setExistingIds((idsData as any[]).map(r => r.student_id as string));
    })();
  };

  const saveEdit = async () => {
    if (!editing || !form) return;
    setSaving(true);
    // Normalize stream to allowed values and SS-only
    const isSS = ['SS1','SS2','SS3'].includes(form.class_level);
    const normalizedStream = (form.stream || '').trim();
    const canonicalStream = normalizedStream
      ? (/^science$/i.test(normalizedStream)
          ? 'Science'
          : (/^commercial$/i.test(normalizedStream)
              ? 'Commercial'
              : (/^arts?$/i.test(normalizedStream)
                  ? 'Arts'
                  : normalizedStream)))
      : '';
    if (allowReassignId && selectedCustomId) {
      const { error: idErr } = await supabase
        .from('school_students')
        .update({ student_id: selectedCustomId })
        .eq('id', editing.id);
      if (idErr) { setSaving(false); showErrorToast(idErr.message); return; }
    }
    const { error } = await supabase
      .from('school_students')
      .update({
        full_name: form.full_name,
        email: form.email || null,
        phone: form.phone || null,
        class_level: form.class_level,
        stream: isSS ? (canonicalStream || null) : null,
        school_name: form.school_name,
        parent_name: form.parent_name || null,
        parent_phone: form.parent_phone || null,
        is_active: form.is_active,
      })
      .eq('id', editing.id);
    setSaving(false);
    if (!error) {
      setStudents(prev => prev.map(p => (p.id === editing.id ? { ...p, ...form } as unknown as StudentRow : p)));
      setEditing(null);
      setForm(null);
      setAllowReassignId(false);
      setSelectedCustomId('');
    } else {
      showErrorToast(error.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600">View and manage all students</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/dashboard/admin/promotions"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faGraduationCap} className="w-4 h-4" />
            Manage Promotions
          </a>
          <a
            href="/dashboard/admin/students/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            Add Student
          </a>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, ID, school..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value as ClassLevel | '')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Classes</option>
            {classes.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          <select
            value={streamFilter}
            onChange={(e) => setStreamFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Streams</option>
            {streams.map(stream => (
              <option key={stream} value={stream}>{stream}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'active' | 'inactive' | '')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="flex items-center text-sm text-gray-600">
            <FontAwesomeIcon icon={faFilter} className="w-4 h-4 mr-2" />
            {filteredStudents.length} of {students.length} students
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stream</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-md bg-blue-100 overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        { (student as any).profile_image_url ? (
                          <img src={(student as any).profile_image_url as string} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-blue-600 font-medium">
                            {student.full_name.split(' ').map(n => n[0]).join('')}
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.student_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.class_level}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.stream || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${student.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                      {student.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => openEdit(student)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        Edit
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            onClick={() => setDeleteTarget(student)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete student?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete
                              {` ${deleteTarget?.full_name || 'this student'}`} and remove their data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
                              {deleting ? 'Deleting…' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No students found matching your criteria.</p>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {students.filter(s => s.is_active).length}
            </div>
            <div className="text-sm text-gray-500">Active Students</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">
              {students.filter(s => !s.is_active).length}
            </div>
            <div className="text-sm text-gray-500">Inactive</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {classes.length}
            </div>
            <div className="text-sm text-gray-500">Total Classes</div>
          </div>
        </div>
      </div>

      {editing && form && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Student</h3>
              <button onClick={() => { setEditing(null); setForm(null); }} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Current Student ID</label>
                  <div className="px-3 py-2 bg-white border rounded-lg font-mono">{editing.student_id}</div>
                </div>
                <div className="flex items-end gap-2">
                  <input id="reassign" type="checkbox" checked={allowReassignId} onChange={e => setAllowReassignId(e.target.checked)} />
                  <label htmlFor="reassign" className="text-sm text-gray-700">Allow reassign ID</label>
                </div>
              </div>
              {allowReassignId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Next Available ID</label>
                    <div className="px-3 py-2 bg-white border rounded-lg font-mono">{typeof nextNumber === 'number' ? `YAN${String(nextNumber).padStart(3,'0')}` : 'Loading...'}</div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Assign Specific ID</label>
                    <select value={selectedCustomId} onChange={e => setSelectedCustomId(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                      <option value="">Auto-assign next available</option>
                      {getAvailableIds(existingIds, nextNumber).slice(0,50).map(id => <option key={id} value={id}>{id}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">School</label>
                <input value={form.school_name} onChange={e => setForm({ ...form, school_name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Class Level</label>
                <select value={form.class_level} onChange={e => setForm({ ...form, class_level: e.target.value as ClassLevel })} className="w-full border rounded-lg px-3 py-2">
                  {(['NUR1','NUR2','KG1','KG2','PRI1','PRI2','PRI3','PRI4','PRI5','PRI6','JSS1','JSS2','JSS3','SS1','SS2','SS3'] as ClassLevel[]).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Stream (SS only)</label>
                <select value={form.stream} onChange={e => setForm({ ...form, stream: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="">Select Stream</option>
                  <option value="Science">Science</option>
                  <option value="Arts">Arts</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Parent Name</label>
                <input value={form.parent_name} onChange={e => setForm({ ...form, parent_name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Parent Phone</label>
                <input value={form.parent_phone} onChange={e => setForm({ ...form, parent_phone: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <input id="is_active" type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => { setEditing(null); setForm(null); }} className="px-4 py-2 rounded-lg border">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getAvailableIds(existingIds: string[], nextNumber: number | null): string[] {
  const taken = new Set(existingIds);
  const result: string[] = [];
  const upper = typeof nextNumber === 'number' ? Math.max(nextNumber, 1) + 100 : 5000;
  for (let i = 1; i <= upper; i++) {
    const id = `YAN${String(i).padStart(3, '0')}`;
    if (!taken.has(id)) result.push(id);
    if (result.length >= 200) break;
  }
  return result;
}
