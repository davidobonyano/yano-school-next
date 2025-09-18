'use client';

import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, Upload } from 'lucide-react';
import { COURSE_CATEGORIES, COURSE_TERMS, CLASS_LEVELS, ACADEMIC_STREAMS, CourseCreate } from '@/types/courses';
import { useNotifications } from '@/components/ui/notifications';

interface BulkCourseImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allowTeacher?: boolean;
  onImported?: (count: number) => void;
}

const CLASS_GROUPS: Record<string, string[]> = {
  'PRI1-3': ['PRI1', 'PRI2', 'PRI3'],
  'PRI4-6': ['PRI4', 'PRI5', 'PRI6'],
  'JSS1-3': ['JSS1', 'JSS2', 'JSS3'],
  'SS1-3': ['SS1', 'SS2', 'SS3']
};

function generateCodeFromName(name: string): string {
  const base = name
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();
  return base || 'CRS';
}

function toTermLabelFromNumber(n: number): typeof COURSE_TERMS[number] {
  return n === 1 ? '1st' : n === 2 ? '2nd' : '3rd';
}

export function BulkCourseImportDialog({ open, onOpenChange, onImported }: BulkCourseImportDialogProps) {
  const { showErrorToast, showSuccessToast } = useNotifications();
  const [rawCourses, setRawCourses] = useState('');
  const [category, setCategory] = useState<typeof COURSE_CATEGORIES[number]>('Core');
  const [subjectType, setSubjectType] = useState<string>('');
  const [streams, setStreams] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<number[]>([1]);
  const [codePrefix, setCodePrefix] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'create' | 'rename'>('create');
  const [renameFrom, setRenameFrom] = useState('');
  const [renameTo, setRenameTo] = useState('');

  const allSelectedLevels = useMemo(() => {
    const fromGroups = selectedGroups.flatMap((g) => CLASS_GROUPS[g] || []);
    return Array.from(new Set([...selectedLevels, ...fromGroups]));
  }, [selectedLevels, selectedGroups]);

  const parsedNames = useMemo(() => {
    return rawCourses
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => !!l);
  }, [rawCourses]);

  const previewCount = parsedNames.length * allSelectedLevels.length * selectedTerms.length * Math.max(streams.length, 1);

  const buildCourses = (): CourseCreate[] => {
    const courses: CourseCreate[] = [];
    for (const name of parsedNames) {
      const base = codePrefix || generateCodeFromName(name);
      for (const level of allSelectedLevels) {
        for (const termNum of selectedTerms) {
          const termLabel = toTermLabelFromNumber(termNum);
          const codeBase = `${base}${level.replace(/[^A-Z0-9]/g, '')}${termNum}`; // includes term number as requested
          if (streams.length === 0) {
            courses.push({
              name,
              code: codeBase,
              description: '',
              class_level: level,
              term: termLabel,
              category,
              stream: null,
              subject_type: subjectType || null
            });
          } else {
            for (const stream of streams) {
              courses.push({
                name,
                code: `${codeBase}-${stream[0].toUpperCase()}`,
                description: '',
                class_level: level,
                term: termLabel,
                category,
                stream,
                subject_type: subjectType || null
              });
            }
          }
        }
      }
    }
    return courses;
  };

  const handleSubmit = async () => {
    if (mode === 'create') {
      if (parsedNames.length === 0) {
        showErrorToast('Enter at least one course name');
        return;
      }
    } else {
      if (!renameFrom || !renameTo) {
        showErrorToast('Enter both the current name and the new name');
        return;
      }
    }
    if (allSelectedLevels.length === 0) {
      showErrorToast('Select at least one class level or group');
      return;
    }
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        const courses = buildCourses();
        const resp = await fetch('/api/courses/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courses, operation: 'create' })
        });
        const data = await resp.json();
        if (!resp.ok) {
          throw new Error(data.error || 'Bulk import failed');
        }
        showSuccessToast(data.message || `Imported ${courses.length} courses`);
        onImported?.(courses.length);
      } else {
        const resp = await fetch('/api/courses/management', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'rename_courses',
            data: {
              from: renameFrom,
              to: renameTo,
              class_levels: allSelectedLevels,
              terms: selectedTerms.map((n) => toTermLabelFromNumber(n)),
              streams: streams.length ? streams : [null]
            }
          })
        });
        const data = await resp.json();
        if (!resp.ok) {
          throw new Error(data.error || 'Bulk rename failed');
        }
        showSuccessToast(data.message || 'Courses renamed');
        onImported?.(0);
      }
      onOpenChange(false);
      // reset minimal
      setRawCourses('');
      setRenameFrom('');
      setRenameTo('');
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'Bulk import failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bulk Import Courses</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Mode</Label>
            <div className="flex gap-2">
              <button type="button" onClick={()=>setMode('create')} className={`px-3 py-1 rounded-full text-sm border ${mode==='create'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300'}`}>Create</button>
              <button type="button" onClick={()=>setMode('rename')} className={`px-3 py-1 rounded-full text-sm border ${mode==='rename'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300'}`}>Rename/Replace</button>
            </div>
          </div>

          {mode==='create' ? (
            <div className="space-y-2">
              <Label>Course names (one per line)</Label>
              <Textarea
                placeholder="e.g. Mathematics\nEnglish Language\nBiology"
                rows={6}
                value={rawCourses}
                onChange={(e) => setRawCourses(e.target.value)}
              />
              <p className="text-xs text-gray-500">Codes will include class and term number. Example: MESS11 for Mathematics • SS1 • 1st term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current course name</Label>
                <Input value={renameFrom} onChange={(e)=>setRenameFrom(e.target.value)} placeholder="e.g. Basic Science" />
              </div>
              <div className="space-y-2">
                <Label>New course name</Label>
                <Input value={renameTo} onChange={(e)=>setRenameTo(e.target.value)} placeholder="e.g. Integrated Science" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject type (optional)</Label>
              <Input value={subjectType} onChange={(e) => setSubjectType(e.target.value)} placeholder="e.g. Science" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class level groups</Label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(CLASS_GROUPS).map((g) => {
                  const active = selectedGroups.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGroups((prev) => active ? prev.filter((x) => x !== g) : [...prev, g])}
                      className={`px-3 py-1 rounded-full text-sm border ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
                    >
                      {active && <Check className="w-3 h-3 inline mr-1" />} {g}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Specific class levels</Label>
              <div className="grid grid-cols-3 gap-2">
                {CLASS_LEVELS.map((lvl) => {
                  const active = selectedLevels.includes(lvl);
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSelectedLevels((prev) => active ? prev.filter((x) => x !== lvl) : [...prev, lvl])}
                      className={`px-2 py-1 rounded text-xs border ${active ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white text-gray-700 border-gray-300'}`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Terms</Label>
              <div className="flex gap-2">
                {[1,2,3].map((n) => {
                  const active = selectedTerms.includes(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSelectedTerms((prev) => active ? prev.filter((x) => x !== n) : [...prev, n])}
                      className={`px-3 py-1 rounded-full text-sm border ${active ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300'}`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Streams (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {ACADEMIC_STREAMS.map((s) => {
                  const active = streams.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStreams((prev) => active ? prev.filter((x) => x !== s) : [...prev, s])}
                      className={`px-3 py-1 rounded-full text-sm border ${active ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300'}`}
                    >
                      {active && <Check className="w-3 h-3 inline mr-1" />} {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code prefix (optional)</Label>
              <Input value={codePrefix} onChange={(e) => setCodePrefix(e.target.value.toUpperCase())} placeholder="e.g. MATH" />
              <p className="text-xs text-gray-500">Codes are generated as: [prefix or initials][Class][TermNumber][StreamInitial]</p>
            </div>
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="text-sm text-gray-700">{previewCount} courses will be created</div>
              {parsedNames[0] && allSelectedLevels[0] && (
                <div className="text-xs text-gray-500">
                  Example: {`${(codePrefix || generateCodeFromName(parsedNames[0]))}${allSelectedLevels[0].replace(/[^A-Z0-9]/g, '')}${selectedTerms[0] || 1}${streams[0] ? `-${streams[0][0].toUpperCase()}` : ''}`}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {isSubmitting ? 'Importing...' : 'Import Courses'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BulkCourseImportDialog;


