import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/authz';

export async function GET(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.error as Response;
  const { data, error } = await supabaseService
    .from('testimonials')
    .select('id, name, title, message, image_url, display_order')
    .order('display_order', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ testimonials: data ?? [] });
}

export async function POST(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.error as Response;
  const body = await request.json();
  const { name, title, message, image_url, display_order = 0 } = body || {};
  if (!name || !title || !message) return NextResponse.json({ error: 'name, title, message are required' }, { status: 400 });
  const { data, error } = await supabaseService
    .from('testimonials')
    .insert([{ name, title, message, image_url, display_order }])
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data?.id }, { status: 201 });
}

export async function PUT(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.error as Response;
  const body = await request.json();
  const { id, name, title, message, image_url, display_order } = body || {};
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const update: any = {};
  if (name !== undefined) update.name = name;
  if (title !== undefined) update.title = title;
  if (message !== undefined) update.message = message;
  if (image_url !== undefined) update.image_url = image_url;
  if (display_order !== undefined) update.display_order = display_order;
  const { error } = await supabaseService.from('testimonials').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.error as Response;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const { error } = await supabaseService.from('testimonials').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}


