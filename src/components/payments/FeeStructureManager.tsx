'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter } from 'lucide-react';

interface FeeStructure {
  id: string;
  class_level: string;
  stream?: string;
  tuition_fee?: number;
  development_levy?: number;
  examination_fee?: number;
  sports_fee?: number;
  pta_fee?: number;
  total_fee?: number;
  description: string;
  session_name?: string;
  term_name?: string;
}

interface Session {
  id: string;
  name: string;
  is_active: boolean;
}

interface Term {
  id: string;
  name: string;
  is_active: boolean;
}

interface FeeStructureManagerProps {
  className?: string;
}

export function FeeStructureManager({ className = '' }: FeeStructureManagerProps) {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const classes = ['KG1', 'KG2', 'PRI1', 'PRI2', 'PRI3', 'PRI4', 'PRI5', 'PRI6', 'JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(feeStructures.map((f) => f.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // Edit modal state
  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FeeStructure>>({});

  const beginEdit = (row: FeeStructure) => {
    setEditRowId(row.id);
    setEditForm({
      tuition_fee: row.tuition_fee ?? 0,
      development_levy: row.development_levy ?? 0,
      examination_fee: row.examination_fee ?? 0,
      sports_fee: row.sports_fee ?? 0,
      pta_fee: row.pta_fee ?? 0,
      total_fee: row.total_fee ?? 0,
    });
  };
  const cancelEdit = () => { setEditRowId(null); setEditForm({}); };

  const saveEdit = async (id: string) => {
    const payload = {
      tuition_fee: Number(editForm.tuition_fee ?? 0),
      development_levy: Number(editForm.development_levy ?? 0),
      examination_fee: Number(editForm.examination_fee ?? 0),
      sports_fee: Number(editForm.sports_fee ?? 0),
      pta_fee: Number(editForm.pta_fee ?? 0),
      total_fee: Number(editForm.total_fee ?? 0),
    };
    const res = await fetch(`/api/fee-structures/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      setFeeStructures((prev) => prev.map((f) => f.id === id ? { ...f, ...payload } : f));
      cancelEdit();
    } else {
      console.error('Failed to update fee structure', await res.text());
    }
  };

  // Delete confirmation modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const confirmDelete = (id: string) => setDeleteId(id);
  const cancelDelete = () => setDeleteId(null);
  const doDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/fee-structures/${deleteId}`, { method: 'DELETE' });
    if (res.ok) {
      setFeeStructures((prev) => prev.filter((f) => f.id !== deleteId));
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(deleteId); return next; });
      setDeleteId(null);
    } else {
      console.error('Failed to delete fee structure', await res.text());
    }
  };

  // Bulk edit modal
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState<{ tuition_fee?: string; development_levy?: string; examination_fee?: string; sports_fee?: string; pta_fee?: string; total_fee?: string; }>({});
  const openBulk = () => setBulkOpen(true);
  const closeBulk = () => { setBulkOpen(false); setBulkForm({}); };
  const saveBulk = async () => {
    const updates: any = {};
    if (bulkForm.tuition_fee !== undefined && bulkForm.tuition_fee !== '') updates.tuition_fee = Number(bulkForm.tuition_fee);
    if (bulkForm.development_levy !== undefined && bulkForm.development_levy !== '') updates.development_levy = Number(bulkForm.development_levy);
    if (bulkForm.examination_fee !== undefined && bulkForm.examination_fee !== '') updates.examination_fee = Number(bulkForm.examination_fee);
    if (bulkForm.sports_fee !== undefined && bulkForm.sports_fee !== '') updates.sports_fee = Number(bulkForm.sports_fee);
    if (bulkForm.pta_fee !== undefined && bulkForm.pta_fee !== '') updates.pta_fee = Number(bulkForm.pta_fee);
    if (bulkForm.total_fee !== undefined && bulkForm.total_fee !== '') updates.total_fee = Number(bulkForm.total_fee);

    if (Object.keys(updates).length === 0) { closeBulk(); return; }

    // Apply sequentially per row
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map(async (id) => {
      const res = await fetch(`/api/fee-structures/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      if (!res.ok) console.error('Bulk update failed for', id, await res.text());
    }));

    // Update local state
    setFeeStructures((prev) => prev.map((f) => selectedIds.has(f.id) ? { ...f, ...updates } : f));
    closeBulk();
  };

  // Fetch sessions and terms
  const fetchSessionsAndTerms = async () => {
    setIsLoadingSessions(true);
    try {
      // Fetch sessions
      const sessionsResponse = await fetch('/api/academic/sessions');
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData.sessions || []);
        const activeSession = sessionsData.sessions?.find((s: Session) => s.is_active);
        if (activeSession) setSelectedSession(activeSession.name);
      }
      // Fetch terms
      const termsResponse = await fetch('/api/academic/terms');
      if (termsResponse.ok) {
        const termsData = await termsResponse.json();
        setTerms(termsData.terms || []);
        const activeTerm = termsData.terms?.find((t: Term) => t.is_active);
        if (activeTerm) setSelectedTerm(activeTerm.name);
      }
    } catch (error) {
      console.error('Error fetching sessions and terms:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Fetch fee structures
  const fetchFeeStructures = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSession !== 'all') params.append('session', selectedSession);
      if (selectedTerm !== 'all') params.append('term', selectedTerm);
      if (selectedClass !== 'all') params.append('class_level', selectedClass);
      if (searchTerm) params.append('search', searchTerm);

      console.log('Fetching fee structures with params:', params.toString());
      const response = await fetch(`/api/fee-structures?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fee structures response:', data);
        const rows = Array.isArray(data?.feeStructures) ? data.feeStructures : (Array.isArray(data?.fees) ? data.fees : []);
        const normalized: FeeStructure[] = rows.map((r: any) => ({
          id: r.id,
          class_level: r.class_level_text ?? r.class_level ?? '',
          stream: r.stream ?? undefined,
          tuition_fee: Number(r.tuition_fee ?? 0),
          development_levy: Number(r.development_levy ?? 0),
          examination_fee: Number(r.examination_fee ?? 0),
          sports_fee: Number(r.sports_fee ?? 0),
          pta_fee: Number(r.pta_fee ?? 0),
          total_fee: Number(r.total_fee ?? 0),
          description: r.description ?? '',
          session_name: r.session ?? r.session_name ?? undefined,
          term_name: r.term ?? r.term_name ?? undefined,
        }));
        setFeeStructures(normalized);
      } else {
        console.error('Failed to fetch fee structures:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Error fetching fee structures:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSessionsAndTerms(); }, []);
  useEffect(() => { if (sessions.length > 0 && terms.length > 0) fetchFeeStructures(); }, [selectedSession, selectedTerm, selectedClass, searchTerm, sessions.length, terms.length]);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fee Structure Management</CardTitle>
              <CardDescription>
                View and manage fee structures for all classes and terms
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setSelectedIds(new Set())}>Clear Selection</Button>
              <Button onClick={openBulk} disabled={selectedIds.size === 0} className="bg-blue-600 text-white hover:bg-blue-700">Bulk Edit</Button>
              <Button className="bg-green-600 text-white hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Fee Structure
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Session</Label>
              <Select value={selectedSession} onValueChange={setSelectedSession} disabled={isLoadingSessions}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingSessions ? "Loading..." : "Select Session"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.name}>
                      {session.name} {session.is_active && '(Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm} disabled={isLoadingSessions}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingSessions ? "Loading..." : "Select Term"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.name}>
                      {term.name} {term.is_active && '(Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search fees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                onClick={fetchFeeStructures} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {/* Debug Info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            <div>Selected Session: {selectedSession}</div>
            <div>Selected Term: {selectedTerm}</div>
            <div>Selected Class: {selectedClass}</div>
            <div>Fee Structures Found: {feeStructures.length}</div>
            <div>Total Sessions: {sessions.length}</div>
            <div>Total Terms: {terms.length}</div>
          </div>

          {/* Fee Structures Table */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-lg text-gray-600">Loading fee structures...</div>
            </div>
          ) : feeStructures.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-lg text-gray-600">No fee structures found</div>
              <div className="text-sm text-gray-500 mt-2">
                Try adjusting your filters or check if fee structures exist for the selected session/term.
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3"><input type="checkbox" checked={selectedIds.size === feeStructures.length} onChange={(e) => toggleSelectAll(e.target.checked)} /></th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stream</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tuition</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dev.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sports</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PTA</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {feeStructures.map((fee) => (
                      <tr key={fee.id}>
                        <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.has(fee.id)} onChange={() => toggleSelect(fee.id)} /></td>
                        <td className="px-6 py-3 text-sm text-gray-900">{fee.class_level}</td>
                        <td className="px-6 py-3 text-sm text-gray-900">{fee.stream || '-'}</td>
                        <td className="px-6 py-3 text-sm text-gray-900">₦{Number(fee.tuition_fee ?? 0).toLocaleString('en-NG')}</td>
                        <td className="px-6 py-3 text-sm text-gray-900">₦{Number(fee.development_levy ?? 0).toLocaleString('en-NG')}</td>
                        <td className="px-6 py-3 text-sm text-gray-900">₦{Number(fee.examination_fee ?? 0).toLocaleString('en-NG')}</td>
                        <td className="px-6 py-3 text-sm text-gray-900">₦{Number(fee.sports_fee ?? 0).toLocaleString('en-NG')}</td>
                        <td className="px-6 py-3 text-sm text-gray-900">₦{Number(fee.pta_fee ?? 0).toLocaleString('en-NG')}</td>
                        <td className="px-6 py-3 text-sm text-gray-900">₦{Number(fee.total_fee ?? 0).toLocaleString('en-NG')}</td>
                        <td className="px-6 py-3 text-sm text-gray-900">{fee.session_name || selectedSession || '-'}</td>
                        <td className="px-6 py-3 text-sm text-gray-900">{fee.term_name || selectedTerm || '-'}</td>
                        <td className="px-6 py-3 text-sm text-gray-900">
                          <div className="flex gap-2">
                            <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => beginEdit(fee)}>Edit</Button>
                            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={() => confirmDelete(fee.id)}>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {editRowId && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                <h3 className="text-lg font-semibold mb-4">Edit Fee Structure</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Tuition</Label>
                    <Input type="number" value={String(editForm.tuition_fee ?? 0)} onChange={(e) => setEditForm((p) => ({ ...p, tuition_fee: Number(e.target.value || 0) }))} />
                  </div>
                  <div>
                    <Label>Development Levy</Label>
                    <Input type="number" value={String(editForm.development_levy ?? 0)} onChange={(e) => setEditForm((p) => ({ ...p, development_levy: Number(e.target.value || 0) }))} />
                  </div>
                  <div>
                    <Label>Examination Fee</Label>
                    <Input type="number" value={String(editForm.examination_fee ?? 0)} onChange={(e) => setEditForm((p) => ({ ...p, examination_fee: Number(e.target.value || 0) }))} />
                  </div>
                  <div>
                    <Label>Sports Fee</Label>
                    <Input type="number" value={String(editForm.sports_fee ?? 0)} onChange={(e) => setEditForm((p) => ({ ...p, sports_fee: Number(e.target.value || 0) }))} />
                  </div>
                  <div>
                    <Label>PTA Fee</Label>
                    <Input type="number" value={String(editForm.pta_fee ?? 0)} onChange={(e) => setEditForm((p) => ({ ...p, pta_fee: Number(e.target.value || 0) }))} />
                  </div>
                  <div>
                    <Label>Total</Label>
                    <Input type="number" value={String(editForm.total_fee ?? 0)} onChange={(e) => setEditForm((p) => ({ ...p, total_fee: Number(e.target.value || 0) }))} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="ghost" onClick={cancelEdit}>Cancel</Button>
                  <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => saveEdit(editRowId)}>Save</Button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirm Modal */}
          {deleteId && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Delete Fee Structure</h3>
                <p className="text-sm text-gray-600">Are you sure you want to delete this fee structure? This action cannot be undone.</p>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="ghost" onClick={cancelDelete}>Cancel</Button>
                  <Button className="bg-red-600 text-white hover:bg-red-700" onClick={doDelete}>Delete</Button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Edit Modal */}
          {bulkOpen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                <h3 className="text-lg font-semibold mb-4">Bulk Edit ({selectedIds.size} selected)</h3>
                <p className="text-sm text-gray-600 mb-4">Only fields you fill will be updated; leave a field blank to keep its current value.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Tuition</Label>
                    <Input type="number" placeholder="leave blank" value={bulkForm.tuition_fee ?? ''} onChange={(e) => setBulkForm((p) => ({ ...p, tuition_fee: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Development Levy</Label>
                    <Input type="number" placeholder="leave blank" value={bulkForm.development_levy ?? ''} onChange={(e) => setBulkForm((p) => ({ ...p, development_levy: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Examination Fee</Label>
                    <Input type="number" placeholder="leave blank" value={bulkForm.examination_fee ?? ''} onChange={(e) => setBulkForm((p) => ({ ...p, examination_fee: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Sports Fee</Label>
                    <Input type="number" placeholder="leave blank" value={bulkForm.sports_fee ?? ''} onChange={(e) => setBulkForm((p) => ({ ...p, sports_fee: e.target.value }))} />
                  </div>
                  <div>
                    <Label>PTA Fee</Label>
                    <Input type="number" placeholder="leave blank" value={bulkForm.pta_fee ?? ''} onChange={(e) => setBulkForm((p) => ({ ...p, pta_fee: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Total</Label>
                    <Input type="number" placeholder="leave blank" value={bulkForm.total_fee ?? ''} onChange={(e) => setBulkForm((p) => ({ ...p, total_fee: e.target.value }))} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="ghost" onClick={closeBulk}>Cancel</Button>
                  <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={saveBulk}>Apply</Button>
                </div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
