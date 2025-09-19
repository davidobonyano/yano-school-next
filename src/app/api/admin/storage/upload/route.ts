import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authz';
import { supabaseService } from '@/lib/supabase-server';
import { compressImage, getCompressionSettings } from '@/lib/image-compression';

export async function POST(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.error as Response;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const folder = (formData.get('folder') as string | null) || 'misc';
  if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 });

  try {
    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);
    
    // Check if it's an image file
    const isImage = file.type.startsWith('image/');
    
    let finalBuffer = originalBuffer;
    let compressionInfo = null;
    
    if (isImage) {
      // Get compression settings based on file type and size
      const compressionSettings = getCompressionSettings(file.type, originalBuffer.length);
      
      // Compress the image
      const compressionResult = await compressImage(originalBuffer, compressionSettings);
      finalBuffer = compressionResult.buffer;
      
      compressionInfo = {
        originalSize: compressionResult.originalSize,
        compressedSize: compressionResult.compressedSize,
        compressionRatio: compressionResult.compressionRatio,
        dimensions: compressionResult.dimensions
      };
    }

    // Generate filename with timestamp and preserve extension
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const path = `${folder}/${Date.now()}-${file.name.replace(/\.[^/.]+$/, '')}.${fileExtension}`;
    
    // Determine content type for upload
    const contentType = isImage ? 'image/jpeg' : (file.type || 'application/octet-stream');
    
    const { error } = await supabaseService.storage.from('site-images').upload(path, finalBuffer, {
      contentType,
      upsert: false,
    });
    
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    
    const { data } = supabaseService.storage.from('site-images').getPublicUrl(path);
    
    return NextResponse.json({ 
      publicUrl: data?.publicUrl,
      compression: compressionInfo
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}






