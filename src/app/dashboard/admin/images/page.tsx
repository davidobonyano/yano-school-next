'use client';

import { useEffect, useState } from 'react';

type GalleryRow = { id: string; image_url: string; alt?: string; title: string; category: 'prefects'|'students'|'events'|'school'; description?: string; display_order: number };
type TeamRow = { id: string; name: string; role: string; photo_url?: string; bio?: string; fun_fact?: string; display_order: number };
type UniformRow = { id: string; image_url: string; alt?: string; title: string; description?: string; text_color?: string; display_order: number };
type TestimonialRow = { id: string; name: string; title: string; message: string; image_url?: string; display_order: number };

const categories = ['prefects','students','events','school'] as const;

export default function AdminImagesPage() {
  const [tab, setTab] = useState<'gallery'|'team'|'uniforms'|'testimonials'>('gallery');
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Images Manager</h1>
      <div className="flex gap-2">
        <button className={`px-3 py-1 rounded ${tab==='gallery'?'bg-blue-600 text-white':'bg-gray-200'}`} onClick={()=>setTab('gallery')}>Gallery</button>
        <button className={`px-3 py-1 rounded ${tab==='team'?'bg-blue-600 text-white':'bg-gray-200'}`} onClick={()=>setTab('team')}>Team</button>
        <button className={`px-3 py-1 rounded ${tab==='uniforms'?'bg-blue-600 text-white':'bg-gray-200'}`} onClick={()=>setTab('uniforms')}>Uniforms</button>
        <button className={`px-3 py-1 rounded ${tab==='testimonials'?'bg-blue-600 text-white':'bg-gray-200'}`} onClick={()=>setTab('testimonials')}>Testimonials</button>
      </div>

      {tab==='gallery' && <GallerySection />}
      {tab==='team' && <TeamSection />}
      {tab==='uniforms' && <UniformsSection />}
      {tab==='testimonials' && <TestimonialsSection />}
    </div>
  );
}

async function uploadImageAndGetUrl(file: File, folder: string): Promise<{ url: string; compression?: { originalSize: number; compressedSize: number; compressionRatio: number; dimensions: { original: { width: number; height: number }; compressed: { width: number; height: number } } } }> {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);
  const res = await fetch('/api/admin/storage/upload', { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || 'Upload failed');
  }
  const json = await res.json();
  return { url: json.publicUrl, compression: json.compression };
}

function GallerySection() {
  const [items, setItems] = useState<GalleryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [compressionInfo, setCompressionInfo] = useState<{ originalSize: number; compressedSize: number; compressionRatio: number; dimensions: { original: { width: number; height: number }; compressed: { width: number; height: number } } } | null>(null);
  const [form, setForm] = useState<Partial<GalleryRow>>({ display_order: 0, category: 'students' });

  const show = (m: string) => { setMessage(m); setTimeout(()=>setMessage(''),3000); };
  const load = async () => {
    setLoading(true);
    try { const res = await fetch('/api/admin/gallery'); const data = await res.json(); setItems(data.images||[]); } catch { show('Load failed'); }
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);

  const onUpload = async (file?: File|null) => {
    if (!file) return;
    try { 
      const result = await uploadImageAndGetUrl(file, 'gallery'); 
      setForm(prev=>({ ...prev, image_url: result.url })); 
      setCompressionInfo(result.compression || null);
      show('Uploaded successfully'); 
    } catch (e: unknown) { 
      show((e as Error)?.message || 'Upload failed'); 
      setCompressionInfo(null);
    }
  };
  const save = async () => {
    const method = form.id ? 'PUT' : 'POST';
    const res = await fetch('/api/admin/gallery', { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
    if (!res.ok) return show('Save failed'); show('Saved'); setForm({ display_order: 0, category: 'students' }); load();
  };
  const del = async (id: string) => { const res = await fetch(`/api/admin/gallery?id=${id}`, { method: 'DELETE' }); if (!res.ok) return show('Delete failed'); show('Deleted'); load(); };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3">
        {message && <div className="text-sm text-blue-700">{message}</div>}
        {compressionInfo && (
          <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
            <div className="font-medium text-green-800 mb-2">Image Compressed Successfully</div>
            <div className="space-y-1 text-green-700">
              <div>Original: {(compressionInfo.originalSize / 1024).toFixed(1)} KB</div>
              <div>Compressed: {(compressionInfo.compressedSize / 1024).toFixed(1)} KB</div>
              <div>Size reduction: {compressionInfo.compressionRatio.toFixed(1)}%</div>
              <div>Dimensions: {compressionInfo.dimensions.original.width}×{compressionInfo.dimensions.original.height} → {compressionInfo.dimensions.compressed.width}×{compressionInfo.dimensions.compressed.height}</div>
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm text-gray-700">Title</label>
          <input className="border rounded px-2 py-1 w-full" value={form.title||''} onChange={e=>setForm({...form,title:e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Category</label>
          <select className="border rounded px-2 py-1 w-full" value={form.category||'students'} onChange={e=>setForm({...form, category: e.target.value as any})}>
            {categories.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700">Image URL</label>
          <input className="border rounded px-2 py-1 w-full" value={form.image_url||''} onChange={e=>setForm({...form,image_url:e.target.value})} placeholder="https://..." />
          <input type="file" accept="image/*" className="mt-2" onChange={e=>onUpload(e.target.files?.[0]||null)} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Alt</label>
          <input className="border rounded px-2 py-1 w-full" value={form.alt||''} onChange={e=>setForm({...form,alt:e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Description</label>
          <textarea className="border rounded px-2 py-1 w-full min-h-[100px]" value={form.description||''} onChange={e=>setForm({...form,description:e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Display Order</label>
          <input type="number" className="border rounded px-2 py-1 w-full" value={form.display_order??0} onChange={e=>setForm({...form,display_order:Number(e.target.value)})} />
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded">{form.id?'Update':'Create'}</button>
          {form.id && <button onClick={()=>setForm({ display_order: 0, category: 'students' })} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>}
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="font-semibold">Existing</h2>
        {loading ? <div className="text-gray-600">Loading...</div> : (
          <ul className="divide-y border rounded">
            {items.map(x=> (
              <li key={x.id} className="p-3 flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{x.title}</div>
                  <div className="text-sm text-gray-600">{x.category}</div>
                  <div className="text-xs text-gray-500 break-words">{x.image_url}</div>
                  {x.description && <div className="text-sm text-gray-700 mt-1">{x.description}</div>}
                  <div className="text-xs text-gray-500">Order: {x.display_order}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>setForm(x)} className="px-3 py-1 bg-yellow-500 text-white rounded">Edit</button>
                  <button onClick={()=>del(x.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                </div>
              </li>
            ))}
            {items.length===0 && <li className="p-3 text-gray-600">No images</li>}
          </ul>
        )}
      </div>
    </div>
  );
}

function TeamSection() {
  const [items, setItems] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<Partial<TeamRow>>({ display_order: 0 });
  const show = (m: string) => { setMessage(m); setTimeout(()=>setMessage(''),3000); };
  const load = async () => { setLoading(true); try { const r=await fetch('/api/admin/team'); const d=await r.json(); setItems(d.team||[]);} catch { show('Load failed'); } setLoading(false); };
  useEffect(()=>{ load(); },[]);
  const onUpload = async (file?: File|null) => { if (!file) return; try { const result = await uploadImageAndGetUrl(file, 'team'); setForm(p=>({...p, photo_url: result.url })); show('Uploaded'); } catch(e: unknown){ show((e as Error)?.message||'Upload failed'); } };
  const save = async () => { const method=form.id?'PUT':'POST'; const res=await fetch('/api/admin/team',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}); if(!res.ok) return show('Save failed'); show('Saved'); setForm({ display_order:0 }); load(); };
  const del = async (id: string) => { const res=await fetch(`/api/admin/team?id=${id}`,{method:'DELETE'}); if(!res.ok) return show('Delete failed'); show('Deleted'); load(); };
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3">
        {message && <div className="text-sm text-blue-700">{message}</div>}
        <div>
          <label className="block text-sm text-gray-700">Name</label>
          <input className="border rounded px-2 py-1 w-full" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Role</label>
          <input className="border rounded px-2 py-1 w-full" value={form.role||''} onChange={e=>setForm({...form,role:e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Photo URL</label>
          <input className="border rounded px-2 py-1 w-full" value={form.photo_url||''} onChange={e=>setForm({...form,photo_url:e.target.value})} placeholder="https://..." />
          <input type="file" accept="image/*" className="mt-2" onChange={e=>onUpload(e.target.files?.[0]||null)} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Bio</label>
          <textarea className="border rounded px-2 py-1 w-full min-h-[100px]" value={form.bio||''} onChange={e=>setForm({...form,bio:e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Fun Fact</label>
          <input className="border rounded px-2 py-1 w-full" value={form.fun_fact||''} onChange={e=>setForm({...form,fun_fact:e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Display Order</label>
          <input type="number" className="border rounded px-2 py-1 w-full" value={form.display_order??0} onChange={e=>setForm({...form,display_order:Number(e.target.value)})} />
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded">{form.id?'Update':'Create'}</button>
          {form.id && <button onClick={()=>setForm({ display_order:0 })} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>}
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="font-semibold">Existing</h2>
        {loading ? <div className="text-gray-600">Loading...</div> : (
          <ul className="divide-y border rounded">
            {items.map(x=> (
              <li key={x.id} className="p-3 flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{x.name}</div>
                  <div className="text-sm text-gray-600">{x.role}</div>
                  {x.photo_url && <div className="text-xs text-gray-500 break-words">{x.photo_url}</div>}
                  {x.bio && <div className="text-sm text-gray-700 mt-1">{x.bio}</div>}
                  {x.fun_fact && <div className="text-xs text-gray-500 mt-1">Fun fact: {x.fun_fact}</div>}
                  <div className="text-xs text-gray-500">Order: {x.display_order}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>setForm(x)} className="px-3 py-1 bg-yellow-500 text-white rounded">Edit</button>
                  <button onClick={()=>del(x.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                </div>
              </li>
            ))}
            {items.length===0 && <li className="p-3 text-gray-600">No members</li>}
          </ul>
        )}
      </div>
    </div>
  );
}

function UniformsSection() {
  const [items, setItems] = useState<UniformRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<Partial<UniformRow>>({ display_order: 0, text_color: 'text-gray-800' });
  const show = (m: string) => { setMessage(m); setTimeout(()=>setMessage(''),3000); };
  const load = async () => { setLoading(true); try { const r=await fetch('/api/admin/uniforms'); const d=await r.json(); setItems(d.uniforms||[]);} catch { show('Load failed'); } setLoading(false); };
  useEffect(()=>{ load(); },[]);
  const onUpload = async (file?: File|null) => { if (!file) return; try { const result = await uploadImageAndGetUrl(file, 'uniforms'); setForm(p=>({...p, image_url: result.url })); show('Uploaded'); } catch(e: unknown){ show((e as Error)?.message||'Upload failed'); } };
  const save = async () => { const method=form.id?'PUT':'POST'; const res=await fetch('/api/admin/uniforms',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}); if(!res.ok) return show('Save failed'); show('Saved'); setForm({ display_order:0, text_color:'text-gray-800' }); load(); };
  const del = async (id: string) => { const res=await fetch(`/api/admin/uniforms?id=${id}`,{method:'DELETE'}); if(!res.ok) return show('Delete failed'); show('Deleted'); load(); };
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3">
        {message && <div className="text-sm text-blue-700">{message}</div>}
        <div>
          <label className="block text-sm text-gray-700">Title</label>
          <input className="border rounded px-2 py-1 w-full" value={form.title||''} onChange={e=>setForm({...form,title:e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Image URL</label>
          <input className="border rounded px-2 py-1 w-full" value={form.image_url||''} onChange={e=>setForm({...form,image_url:e.target.value})} placeholder="https://..." />
          <input type="file" accept="image/*" className="mt-2" onChange={e=>onUpload(e.target.files?.[0]||null)} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Alt</label>
          <input className="border rounded px-2 py-1 w-full" value={form.alt||''} onChange={e=>setForm({...form,alt:e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Description</label>
          <textarea className="border rounded px-2 py-1 w-full min-h-[100px]" value={form.description||''} onChange={e=>setForm({...form,description:e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Text Color (Tailwind class)</label>
          <input className="border rounded px-2 py-1 w-full" value={form.text_color||'text-gray-800'} onChange={e=>setForm({...form,text_color:e.target.value})} placeholder="e.g., text-blue-700" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Display Order</label>
          <input type="number" className="border rounded px-2 py-1 w-full" value={form.display_order??0} onChange={e=>setForm({...form,display_order:Number(e.target.value)})} />
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded">{form.id?'Update':'Create'}</button>
          {form.id && <button onClick={()=>setForm({ display_order:0, text_color:'text-gray-800' })} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>}
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="font-semibold">Existing</h2>
        {loading ? <div className="text-gray-600">Loading...</div> : (
          <ul className="divide-y border rounded">
            {items.map(x=> (
              <li key={x.id} className="p-3 flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{x.title}</div>
                  <div className="text-xs text-gray-500 break-words">{x.image_url}</div>
                  {x.description && <div className="text-sm text-gray-700 mt-1">{x.description}</div>}
                  <div className="text-xs text-gray-500">Color: {x.text_color}</div>
                  <div className="text-xs text-gray-500">Order: {x.display_order}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>setForm(x)} className="px-3 py-1 bg-yellow-500 text-white rounded">Edit</button>
                  <button onClick={()=>del(x.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                </div>
              </li>
            ))}
            {items.length===0 && <li className="p-3 text-gray-600">No uniforms</li>}
          </ul>
        )}
      </div>
    </div>
  );
}

function TestimonialsSection() {
  const [items, setItems] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<Partial<TestimonialRow>>({ display_order: 0 });
  const show = (m: string) => { setMessage(m); setTimeout(()=>setMessage(''),3000); };
  const load = async () => { setLoading(true); try { const r=await fetch('/api/admin/testimonials'); const d=await r.json(); setItems(d.testimonials||[]);} catch { show('Load failed'); } setLoading(false); };
  useEffect(()=>{ load(); },[]);
  const onUpload = async (file?: File|null) => { if (!file) return; try { const result = await uploadImageAndGetUrl(file, 'testimonials'); setForm(p=>({...p, image_url: result.url })); show('Uploaded'); } catch(e: unknown){ show((e as Error)?.message||'Upload failed'); } };
  const save = async () => { const method=form.id?'PUT':'POST'; const res=await fetch('/api/admin/testimonials',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}); if(!res.ok) return show('Save failed'); show('Saved'); setForm({ display_order:0 }); load(); };
  const del = async (id: string) => { const res=await fetch(`/api/admin/testimonials?id=${id}`,{method:'DELETE'}); if(!res.ok) return show('Delete failed'); show('Deleted'); load(); };
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3">
        {message && <div className="text-sm text-blue-700">{message}</div>}
        <div>
          <label className="block text-sm text-gray-700">Name</label>
          <input className="border rounded px-2 py-1 w-full" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Title</label>
          <input className="border rounded px-2 py-1 w-full" value={form.title||''} onChange={e=>setForm({...form,title:e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Message</label>
          <textarea className="border rounded px-2 py-1 w-full min-h-[100px]" value={form.message||''} onChange={e=>setForm({...form,message:e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Image URL</label>
          <input className="border rounded px-2 py-1 w-full" value={form.image_url||''} onChange={e=>setForm({...form,image_url:e.target.value})} placeholder="https://..." />
          <input type="file" accept="image/*" className="mt-2" onChange={e=>onUpload(e.target.files?.[0]||null)} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Display Order</label>
          <input type="number" className="border rounded px-2 py-1 w-full" value={form.display_order??0} onChange={e=>setForm({...form,display_order:Number(e.target.value)})} />
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded">{form.id?'Update':'Create'}</button>
          {form.id && <button onClick={()=>setForm({ display_order:0 })} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>}
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="font-semibold">Existing</h2>
        {loading ? <div className="text-gray-600">Loading...</div> : (
          <ul className="divide-y border rounded">
            {items.map(x=> (
              <li key={x.id} className="p-3 flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{x.name}</div>
                  <div className="text-sm text-gray-600">{x.title}</div>
                  <div className="text-sm text-gray-700 mt-1">{x.message}</div>
                  {x.image_url && <div className="text-xs text-gray-500 break-words">{x.image_url}</div>}
                  <div className="text-xs text-gray-500">Order: {x.display_order}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>setForm(x)} className="px-3 py-1 bg-yellow-500 text-white rounded">Edit</button>
                  <button onClick={()=>del(x.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                </div>
              </li>
            ))}
            {items.length===0 && <li className="p-3 text-gray-600">No testimonials</li>}
          </ul>
        )}
      </div>
    </div>
  );
}


