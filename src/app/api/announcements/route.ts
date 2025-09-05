import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { supabaseService } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/authz';

const baseSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  audience: z.enum(['students','teachers','admins','all','class','role']),
  expires_at: z.union([z.string(), z.null()]).optional(),
  attachments: z.array(z.object({ name: z.string(), url: z.string().url(), type: z.string().optional(), size: z.number().optional() })).optional(),
  // class targeting
  audience_class_level: z.union([
    z.enum(['KG1','KG2','PRI1','PRI2','PRI3','PRI4','PRI5','PRI6','JSS1','JSS2','JSS3','SS1','SS2','SS3']),
    z.null()
  ]).optional(),
  audience_stream: z.string().nullable().optional(),
  // role targeting (single explicit role)
  audience_role: z.enum(['student','teacher','admin']).nullable().optional()
}).passthrough();

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ announcements: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.error as Response;
  try {
    const raw = await request.json();
    const body = baseSchema.parse({
      ...raw,
      audience_class_level: raw.audience_class_level || null,
      audience_stream: raw.audience_stream || null,
      audience_role: raw.audience_role || null,
      expires_at: raw.expires_at === '' ? null : raw.expires_at
    });
    const derivedTargetRole = (() => {
      if (body.audience === 'role' && body.audience_role) return body.audience_role;
      if (body.audience === 'teachers') return 'teacher';
      if (body.audience === 'students') return 'student';
      if (body.audience === 'admins') return 'admin';
      return 'all';
    })();
    const payload: any = {
      title: body.title,
      body: body.body,
      audience: body.audience,
      expires_at: body.expires_at ? new Date(body.expires_at).toISOString() : null,
      audience_class_level: body.audience_class_level ?? null,
      audience_stream: body.audience_stream ?? null,
      audience_role: body.audience_role ?? null,
      attachments: body.attachments ?? [],
      // legacy compatibility
      target_role: derivedTargetRole
    };
    // Try with full payload; if schema missing optional columns, retry with minimal required columns
    let { data, error } = await supabaseService.from('announcements').insert(payload).select('*').single();
    if (error && /attachments|audience_class_level|audience_stream|audience_role|target_role/.test(error.message)) {
      const minimal: any = {
        title: payload.title,
        body: payload.body,
        audience: payload.audience,
        expires_at: payload.expires_at ?? null,
        target_role: derivedTargetRole
      };
      // If target_role column doesn't exist either, drop it in a final retry below
      let retry = await supabaseService.from('announcements').insert(minimal).select('*').single();
      if (retry.error && /target_role/.test(retry.error.message)) {
        const finalMinimal = { ...minimal } as any;
        delete finalMinimal.target_role;
        retry = await supabaseService.from('announcements').insert(finalMinimal).select('*').single();
      }
      data = retry.data;
      error = retry.error;
    }
    // Support legacy schema where column is 'content' instead of 'body'
    if (error && /content/.test(error.message)) {
      const legacy: any = {
        title: payload.title,
        content: payload.body,
        audience: payload.audience,
        expires_at: payload.expires_at ?? null,
        target_role: derivedTargetRole
      };
      let retryLegacy = await supabaseService.from('announcements').insert(legacy).select('*').single();
      if (retryLegacy.error && /target_role/.test(retryLegacy.error.message)) {
        const without = { ...legacy } as any;
        delete without.target_role;
        retryLegacy = await supabaseService.from('announcements').insert(without).select('*').single();
      }
      data = retryLegacy.data;
      error = retryLegacy.error;
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ announcement: data });
  } catch (err: any) {
    if (err?.issues) return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.error as Response;
  try {
    const schema = baseSchema.extend({ id: z.union([z.string().min(1), z.number()]) });
    const raw = await request.json();
    const body = schema.parse({
      ...raw,
      audience_class_level: raw.audience_class_level || null,
      audience_stream: raw.audience_stream || null,
      audience_role: raw.audience_role || null,
      expires_at: raw.expires_at === '' ? null : raw.expires_at
    });
    const payload: any = {
      title: body.title,
      body: body.body,
      audience: body.audience,
      expires_at: body.expires_at ? new Date(body.expires_at).toISOString() : null,
      audience_class_level: body.audience_class_level ?? null,
      audience_stream: body.audience_stream ?? null,
      audience_role: body.audience_role ?? null,
      attachments: body.attachments ?? []
    };
    let { data, error } = await supabaseService
      .from('announcements')
      .update(payload)
      .eq('id', body.id)
      .select('*')
      .single();
    if (error && /column "body"|content/.test(error.message)) {
      const legacy: any = {
        title: payload.title,
        content: payload.body,
        audience: payload.audience,
        expires_at: payload.expires_at ?? null,
      };
      const retryLegacy = await supabaseService
        .from('announcements')
        .update(legacy)
        .eq('id', body.id)
        .select('*')
        .single();
      data = retryLegacy.data;
      error = retryLegacy.error;
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ announcement: data });
  } catch (err: any) {
    if (err?.issues) return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.error as Response;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    // Use service client to bypass RLS
    let { error } = await supabaseService.from('announcements').delete().eq('id', id);
    // Legacy fallback: some schemas may store ids as text; try casting or alternative key
    if (error && /permission|RLS|row level/i.test(error.message)) {
      // Retry should not be needed with service client, but return explicit message
      return NextResponse.json({ error: 'Delete blocked by RLS' }, { status: 403 });
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}


