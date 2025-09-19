'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getStudentSession } from '@/lib/student-session';

export default function StudentPhotoSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [studentId, setStudentId] = useState<string>('');
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [originalSizeKb, setOriginalSizeKb] = useState<number | null>(null);
  const [compressedSizeKb, setCompressedSizeKb] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const s = getStudentSession();
    if (s?.student_id) {
      setStudentId(s.student_id);
      (async () => {
        try {
          const { data, error } = await supabase
            .from('school_students')
            .select('profile_image_url')
            .eq('student_id', s.student_id)
            .maybeSingle();
          if (!error) setCurrentUrl((data as any)?.profile_image_url || null);
        } catch {}
      })();
    }
  }, []);

  if (!mounted) return null;

  const handlePick = () => fileInputRef.current?.click();

  const compressImage = async (file: File, maxBytes: number): Promise<Blob> => {
    const img = document.createElement('img');
    const objectUrl = URL.createObjectURL(file);
    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = objectUrl;
      });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Keep aspect ratio; target max side 512px for reasonable size
      const maxSide = 512;
      const { width, height } = img;
      const scale = Math.min(1, maxSide / Math.max(width, height));
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let quality = 0.9;
      let blob: Blob | null = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', quality));
      // Reduce quality until <= maxBytes or quality too low
      while (blob && blob.size > maxBytes && quality > 0.4) {
        quality -= 0.1;
        blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', quality));
      }
      if (!blob) throw new Error('Failed to compress image');
      // If still too large, downscale further
      while (blob.size > maxBytes && (canvas.width > 96 || canvas.height > 96)) {
        canvas.width = Math.max(96, Math.floor(canvas.width * 0.85));
        canvas.height = Math.max(96, Math.floor(canvas.height * 0.85));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        quality = Math.max(0.4, quality - 0.05);
        blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', quality));
        if (!blob) throw new Error('Compression failed');
      }
      return blob;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setMessage('');
    try {
      const maxBytes = 300 * 1024; // 300kb
      const compressed = await compressImage(file, maxBytes);
      const preview = URL.createObjectURL(compressed);
      setPreviewUrl(preview);
      setOriginalSizeKb(Math.round(file.size / 102.4) / 10);
      setCompressedSizeKb(Math.round(compressed.size / 102.4) / 10);
    } catch (err: any) {
      setError(err?.message || 'Failed to prepare image');
    }
  };

  const handleUpload = async () => {
    if (!studentId) return;
    if (!previewUrl || !fileInputRef.current?.files?.[0]) {
      setError('Please select a photo first');
      return;
    }
    setUploading(true);
    setError('');
    setMessage('');
    try {
      // Recompress from original file to ensure freshest blob
      const original = fileInputRef.current.files[0];
      const blob = await compressImage(original, 300 * 1024);
      const arrayBuffer = await blob.arrayBuffer();
      const filePath = `${studentId}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from('student-photos')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });
      if (upErr) throw new Error(upErr.message);

      const { data: pub } = supabase.storage.from('student-photos').getPublicUrl(filePath);
      const publicUrl = pub?.publicUrl;
      if (!publicUrl) throw new Error('Could not resolve public URL');

      const { error: updateErr } = await supabase
        .from('school_students')
        .update({ profile_image_url: publicUrl })
        .eq('student_id', studentId);
      if (updateErr) throw new Error(updateErr.message);

      setCurrentUrl(publicUrl);
      setMessage('Photo uploaded successfully.');
      // Ensure sizes are visible after upload too
      setOriginalSizeKb(prev => prev ?? Math.round(original.size / 102.4) / 10);
      setCompressedSizeKb(prev => prev ?? Math.round(blob.size / 102.4) / 10);
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile Photo</h1>
        <p className="text-sm text-gray-600">Upload a clear, recent photo. Max size 300kb.</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-24 w-24 rounded-lg bg-gray-100 overflow-hidden border">
          {previewUrl || currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl || currentUrl || ''} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">No photo</div>
          )}
        </div>
        <div className="space-x-2">
          <button onClick={handlePick} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50" disabled={uploading}>Choose Photo</button>
          <button onClick={handleUpload} className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50" disabled={uploading || !previewUrl}>Upload</button>
        </div>
      </div>

      {(originalSizeKb !== null || compressedSizeKb !== null) && (
        <div className="text-xs text-gray-600">
          {originalSizeKb !== null && (
            <span>Original: {originalSizeKb.toFixed(1)} KB</span>
          )}
          {compressedSizeKb !== null && (
            <span className="ml-3">Compressed: {compressedSizeKb.toFixed(1)} KB</span>
          )}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {message && <div className="text-green-700 text-sm">{message}</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="text-xs text-gray-500">
        Tip: Square photos look best. We auto-compress to ≤ 300 KB.
      </div>
    </div>
  );
}










