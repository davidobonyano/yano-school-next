'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt,
  faClock,
  faMapMarkerAlt,
  faChevronLeft,
  faChevronRight,
  faDownload,
  faPrint
} from '@fortawesome/free-solid-svg-icons';
import { useGlobalAcademicContext } from '@/contexts/GlobalAcademicContext';

interface TimetableItem {
  id?: string;
  class: string;
  subject: string;
  teacher_name: string;
  day: string;
  period: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIMES = [
  '8:00 - 9:00',
  '9:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 1:00',
  '1:00 - 2:00',
  '2:00 - 3:00',
];

function buildClassOptions(): string[] {
  const kg = ['KG1', 'KG2'];
  const nur = ['NUR1', 'NUR2'];
  const pr = ['PR1', 'PR2', 'PR3', 'PR4', 'PR5', 'PR6'];
  const jss = ['JSS1', 'JSS2', 'JSS3'];
  const ssStreams = ['Arts', 'Commercial', 'Science'];
  const ss: string[] = [];
  ['SS1','SS2','SS3'].forEach(level => {
    ssStreams.forEach(stream => ss.push(`${level} ${stream}`));
  });
  return [...nur, ...kg, ...pr, ...jss, ...ss];
}

export default function TeacherTimetablePage() {
  const { academicContext } = useGlobalAcademicContext();
  const [items, setItems] = useState<TimetableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [editing, setEditing] = useState<TimetableItem | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [bulkImport, setBulkImport] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>('');
  const [bulkSaving, setBulkSaving] = useState<boolean>(false);
  const [bulkDay, setBulkDay] = useState<string>('Monday');
  const [bulkClass, setBulkClass] = useState<string>('');

  useEffect(() => {
    const onRefresh = () => fetchItems(selectedClass);
    window.addEventListener('dashboardContextChanged', onRefresh as EventListener);
    return () => window.removeEventListener('dashboardContextChanged', onRefresh as EventListener);
  }, [selectedClass]);

  useEffect(() => {
    fetchItems(selectedClass);
  }, [academicContext.sessionId, academicContext.termId]);

  const fetchItems = async (cls: string) => {
      try {
        setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      const url = new URL('/api/timetables', window.location.origin);
      url.searchParams.set('action', 'by_class');
      if (cls) url.searchParams.set('class', cls);
      url.searchParams.set('session_id', academicContext.sessionId);
      url.searchParams.set('term_id', academicContext.termId);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
      } finally {
        setLoading(false);
      }
    };

  const validate = (payload: TimetableItem) => {
    if (!payload.class?.trim()) return 'Class is required';
    if (!payload.subject?.trim()) return 'Subject is required';
    if (!payload.teacher_name?.trim()) return 'Teacher name is required';
    if (!payload.day?.trim()) return 'Day is required';
    if (!payload.period?.trim()) return 'Period/Time is required';
    if (!academicContext.sessionId || !academicContext.termId) return 'Academic context missing';
    return '';
  };

  const saveItem = async (payload: TimetableItem) => {
    setErrorMessage('');
    setSuccessMessage('');
    const validationError = validate(payload);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    try {
      setSaving(true);
      const res = await fetch('/api/timetables', {
        method: payload.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, session_id: academicContext.sessionId, term_id: academicContext.termId })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMessage(data?.error || 'Failed to save timetable');
        return;
      }
      setEditing(null);
      setSuccessMessage('Timetable saved');
      fetchItems(selectedClass);
      try { window.dispatchEvent(new CustomEvent('timetableUpdated')); } catch {}
    } catch (e: any) {
      setErrorMessage(e?.message || 'Unexpected error during save');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (id: string | undefined) => {
    if (!id) return;
    setErrorMessage('');
    setSuccessMessage('');
    const res = await fetch(`/api/timetables?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrorMessage(data?.error || 'Failed to delete');
      return;
    }
    setSuccessMessage('Deleted');
    fetchItems(selectedClass);
    try { window.dispatchEvent(new CustomEvent('timetableUpdated')); } catch {}
  };

  const parseBulkText = (text: string, day: string, className: string): TimetableItem[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const entries: TimetableItem[] = [];
    
    // Format: "Subject|Teacher" for each time slot
    // Lines correspond to TIMES array in order
    lines.forEach((line, index) => {
      if (index < TIMES.length && line.trim()) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 2) {
          entries.push({
            class: className,
            subject: parts[0],
            teacher_name: parts[1],
            day: day,
            period: TIMES[index]
          });
        }
      }
    });
    return entries;
  };

  const saveBulkEntries = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!bulkClass.trim()) {
      setErrorMessage('Please select a class');
      return;
    }
    
    const entries = parseBulkText(bulkText, bulkDay, bulkClass);
    if (entries.length === 0) {
      setErrorMessage('No valid entries found. Use format: Subject|Teacher (one per line)');
      return;
    }

    try {
      setBulkSaving(true);
      const promises = entries.map(entry => 
        fetch('/api/timetables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...entry, 
            session_id: academicContext.sessionId, 
            term_id: academicContext.termId 
          })
        })
      );
      
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      const failed = results.length - successful;
      
      if (successful > 0) {
        setSuccessMessage(`Successfully imported ${successful} entries for ${bulkDay}${failed > 0 ? `, ${failed} failed` : ''}`);
        setBulkImport(false);
        setBulkText('');
        setBulkClass('');
        fetchItems(selectedClass);
        try { window.dispatchEvent(new CustomEvent('timetableUpdated')); } catch {}
      } else {
        setErrorMessage('Failed to import any entries. Check format and try again.');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Unexpected error during bulk import');
    } finally {
      setBulkSaving(false);
    }
  };

  const times = TIMES;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black">Timetable Management</h1>
          <p className="text-sm text-black/70">{academicContext.session} • {academicContext.term}</p>
          {errorMessage && (
            <div className="mt-2 text-sm text-red-600">{errorMessage}</div>
          )}
          {successMessage && (
            <div className="mt-2 text-sm text-green-700">{successMessage}</div>
          )}
        </div>
        <div className="flex gap-2">
          <select
            value={selectedClass}
            onChange={(e) => { setSelectedClass(e.target.value); fetchItems(e.target.value); }}
            className="border border-black/20 rounded px-3 py-2 text-sm bg-white text-black"
          >
            <option value="">Select Class</option>
            {/* KG1–KG3, PR1–PR6, JSS1–JSS3, SS1–SS3 with streams Art, Commercial, Science */}
            {buildClassOptions().map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            onClick={() => { setErrorMessage(''); setSuccessMessage(''); setEditing({ class: selectedClass || '', subject: '', teacher_name: '', day: 'Monday', period: TIMES[0] }); }}
            className="border border-black/30 px-3 py-2 rounded text-sm text-black bg-white"
          >
            Add Slot
          </button>
          <button
            onClick={() => { setErrorMessage(''); setSuccessMessage(''); setBulkImport(true); }}
            className="border border-black/30 px-3 py-2 rounded text-sm text-black bg-white"
          >
            Bulk Import
          </button>
        </div>
      </div>

      <div className="bg-white border border-black/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/10">
                <th className="text-left text-xs uppercase tracking-wider text-black/70 p-3 w-28">Time</th>
                {DAYS.map(d => (
                  <th key={d} className="text-left text-xs uppercase tracking-wider text-black/70 p-3">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="p-6 text-center text-black/60" colSpan={6}>Loading…</td></tr>
              ) : times.length === 0 ? (
                <tr><td className="p-6 text-center text-black/60" colSpan={6}>No entries</td></tr>
              ) : (
                times.map(t => (
                  <tr key={t} className="border-t border-black/10">
                    <td className="p-3 text-sm font-medium text-black">{t}</td>
                    {DAYS.map(day => {
                      const cell = items.find(i => i.day === day && i.period === t && (!selectedClass || i.class === selectedClass));
            return (
                        <td key={`${day}-${t}`} className="p-3 align-top">
                          {cell ? (
                            <div className="border border-black/20 rounded p-2 space-y-1">
                              <div className="text-xs text-black/70">{cell.class}</div>
                              <div className="text-sm font-semibold text-black">{cell.subject}</div>
                              <div className="text-xs text-black/70">{cell.teacher_name}</div>
                              <div className="flex gap-2 pt-1">
                                <button onClick={() => { setErrorMessage(''); setSuccessMessage(''); setEditing(cell); }} className="text-xs underline">Edit</button>
                                <button onClick={() => removeItem(cell.id)} className="text-xs underline">Delete</button>
                      </div>
                    </div>
                ) : (
                            <div className="text-xs text-black/40">—</div>
                )}
                        </td>
            );
          })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center">
          <div className="bg-white border border-black/20 rounded-lg p-4 w-full max-w-md">
            <h3 className="font-semibold mb-3 text-black">{editing.id ? 'Edit' : 'Add'} Timetable Slot</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-black/70 mb-1">Class</label>
                <input value={editing.class} onChange={e => setEditing({ ...editing, class: e.target.value })} className="w-full border border-black/20 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-black/70 mb-1">Subject</label>
                <input value={editing.subject} onChange={e => setEditing({ ...editing, subject: e.target.value })} className="w-full border border-black/20 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-black/70 mb-1">Teacher Name</label>
                <input value={editing.teacher_name} onChange={e => setEditing({ ...editing, teacher_name: e.target.value })} className="w-full border border-black/20 rounded px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-black/70 mb-1">Day</label>
                  <select value={editing.day} onChange={e => setEditing({ ...editing, day: e.target.value })} className="w-full border border-black/20 rounded px-3 py-2 text-sm bg-white">
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-black/70 mb-1">Period/Time</label>
                  <select value={editing.period} onChange={e => setEditing({ ...editing, period: e.target.value })} className="w-full border border-black/20 rounded px-3 py-2 text-sm bg-white">
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEditing(null)} className="px-3 py-2 border border-black/20 rounded text-sm">Cancel</button>
              <button onClick={() => editing && !saving && saveItem(editing)} disabled={saving} className="px-3 py-2 border border-black rounded text-sm bg-white text-black disabled:opacity-60 disabled:cursor-not-allowed">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {bulkImport && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center">
          <div className="bg-white border border-black/20 rounded-lg p-4 w-full max-w-2xl">
            <h3 className="font-semibold mb-3 text-black">Bulk Import Day Timetable</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-black/70 mb-1">Class</label>
                  <select
                    value={bulkClass}
                    onChange={e => setBulkClass(e.target.value)}
                    className="w-full border border-black/20 rounded px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Select Class</option>
                    {buildClassOptions().map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-black/70 mb-1">Day</label>
                  <select
                    value={bulkDay}
                    onChange={e => setBulkDay(e.target.value)}
                    className="w-full border border-black/20 rounded px-3 py-2 text-sm bg-white"
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-black/70 mb-1">
                  Format: Subject|Teacher (one per time slot, 7 lines max)
                </label>
                <textarea
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  className="w-full border border-black/20 rounded px-3 py-2 text-sm h-40 font-mono"
                  placeholder={`Example for Monday:
Mathematics|Mr. John
English|Ms. Smith
Physics|Dr. Brown
Chemistry|Mrs. White
Biology|Mr. Green
Geography|Ms. Blue
History|Mr. Red`}
                />
              </div>
              <div className="text-xs text-black/60">
                <p>• Each line = one time slot (8:00-9:00, 9:00-10:00, etc.)</p>
                <p>• Leave empty lines for free periods</p>
                <p>• Max 7 lines (8:00-3:00)</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={() => { setBulkImport(false); setBulkText(''); setBulkClass(''); }} 
                className="px-3 py-2 border border-black/20 rounded text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={saveBulkEntries} 
                disabled={bulkSaving || !bulkText.trim() || !bulkClass.trim()}
                className="px-3 py-2 border border-black rounded text-sm bg-white text-black disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {bulkSaving ? 'Importing...' : 'Import Day'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
