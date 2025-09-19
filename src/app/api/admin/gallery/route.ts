import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/authz';

export async function GET(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.error as Response;
  const { data, error } = await supabaseService
    .from('gallery_images')
    .select('id, image_url, alt, title, category, description, display_order')
    .order('display_order', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ images: data ?? [] });
}

export async function POST(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.error as Response;
  const body = await request.json();
  const { image_url, alt = '', title, category, description = '', display_order = 0 } = body || {};
  if (!image_url || !title || !category) return NextResponse.json({ error: 'image_url, title, category are required' }, { status: 400 });
  const { data, error } = await supabaseService
    .from('gallery_images')
    .insert([{ image_url, alt, title, category, description, display_order }])
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data?.id }, { status: 201 });
}

export async function PUT(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.error as Response;
  const body = await request.json();
  const { id, image_url, alt, title, category, description, display_order } = body || {};
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const update: any = {};
  if (image_url !== undefined) update.image_url = image_url;
  if (alt !== undefined) update.alt = alt;
  if (title !== undefined) update.title = title;
  if (category !== undefined) update.category = category;
  if (description !== undefined) update.description = description;
  if (display_order !== undefined) update.display_order = display_order;
  const { error } = await supabaseService.from('gallery_images').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.error as Response;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const { error } = await supabaseService.from('gallery_images').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}


