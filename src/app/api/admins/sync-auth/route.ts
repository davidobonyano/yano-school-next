import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';

type SyncResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ email: string; message: string }>;
  details: Array<{ email: string; action: 'created' | 'updated' | 'skipped'; note?: string }>;
};

async function findAuthUserByEmail(email: string) {
  try {
    const { data, error } = await supabaseService.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) return null;
    const found = data.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
    return found || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const roleHeader = request.headers.get('x-role');
    if (roleHeader !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const sendInvites: boolean = Boolean(body?.sendInvites);
    const updateOnly: boolean = Boolean(body?.updateOnly || body?.safeMode);

    const result: SyncResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      details: []
    };

    const { data: admins, error: adminsError } = await supabaseService
      .from('admins')
      .select('id, name, email, is_active');
    if (adminsError) {
      console.error('sync-auth read admins error:', adminsError);
      return NextResponse.json({ error: adminsError.message, stage: 'read_admins' }, { status: 500 });
    }

    for (const admin of admins || []) {
      const email = (admin.email || '').trim().toLowerCase();
      if (!email) {
        result.skipped += 1;
        result.details.push({ email: '', action: 'skipped', note: 'missing email' });
        continue;
      }

      const existing = await findAuthUserByEmail(email);
      const userMetadata = { role: 'admin', name: admin.name || '' } as Record<string, any>;

      if (!existing) {
        if (updateOnly) {
          result.skipped += 1;
          result.details.push({ email, action: 'skipped', note: 'no auth user; updateOnly mode' });
          continue;
        }
        if (sendInvites) {
          const { error } = await supabaseService.auth.admin.inviteUserByEmail(email, { data: userMetadata } as any);
          if (error) {
            result.errors.push({ email, message: error.message });
          } else {
            result.created += 1;
            result.details.push({ email, action: 'created', note: 'invited' });
          }
        } else {
          const { data, error } = await supabaseService.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: userMetadata
          } as any);
          if (error) {
            // Gracefully handle DB trigger failures referencing auth_id
            const message = String(error.message || '');
            if (message.includes('auth_id') || message.includes('42703')) {
              result.errors.push({ email, message: 'Database trigger referencing auth_id blocked creation. Remove trigger on auth.users.' });
            } else {
              result.errors.push({ email, message });
            }
          } else {
            result.created += 1;
            result.details.push({ email, action: 'created', note: 'created without invite' });
          }
        }
        continue;
      }

      const currentMeta = (existing.user_metadata || {}) as Record<string, any>;
      const needUpdate = currentMeta.role !== 'admin' || (admin.name && currentMeta.name !== admin.name);
      if (needUpdate) {
        const { error } = await supabaseService.auth.admin.updateUserById(existing.id, { user_metadata: userMetadata } as any);
        if (error) {
          result.errors.push({ email, message: error.message });
        } else {
          result.updated += 1;
          result.details.push({ email, action: 'updated' });
        }
      } else {
        result.skipped += 1;
        result.details.push({ email, action: 'skipped', note: 'already up-to-date' });
      }
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('sync-auth fatal error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}


