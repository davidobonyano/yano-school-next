import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/authz';

export async function GET(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.error as Response;
  const { data, error } = await supabaseService
    .from('team_members')
    .select('id, name, role, photo_url, bio, fun_fact, display_order')
    .order('display_order', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ team: data ?? [] });
}

export async function POST(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.error as Response;
  const body = await request.json();
  const { name, role, photo_url, bio = '', fun_fact = '', display_order = 0 } = body || {};
  if (!name || !role) return NextResponse.json({ error: 'name and role are required' }, { status: 400 });
  const { data, error } = await supabaseService
    .from('team_members')
    .insert([{ name, role, photo_url, bio, fun_fact, display_order }])
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data?.id }, { status: 201 });
}

export async function PUT(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.error as Response;
  const body = await request.json();
  const { id, name, role, photo_url, bio, fun_fact, display_order } = body || {};
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const update: any = {};
  if (name !== undefined) update.name = name;
  if (role !== undefined) update.role = role;
  if (photo_url !== undefined) update.photo_url = photo_url;
  if (bio !== undefined) update.bio = bio;
  if (fun_fact !== undefined) update.fun_fact = fun_fact;
  if (display_order !== undefined) update.display_order = display_order;
  const { error } = await supabaseService.from('team_members').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.error as Response;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const { error } = await supabaseService.from('team_members').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}


