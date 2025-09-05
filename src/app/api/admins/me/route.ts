import { NextResponse } from 'next/server';
import { readAdminSession } from '@/lib/admin-session';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await readAdminSession();
    if (!session?.adminId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, name, email, is_active, created_at, updated_at')
      .eq('id', session.adminId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    return NextResponse.json({ admin });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}



