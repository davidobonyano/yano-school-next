import { NextResponse } from 'next/server';
import { clearAdminSessionCookie } from '@/lib/admin-session';

export async function POST() {
  try {
    await clearAdminSessionCookie();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
