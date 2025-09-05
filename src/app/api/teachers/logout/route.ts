import { NextResponse } from 'next/server';
import { clearTeacherSessionCookie } from '@/lib/teacher-session';

export async function POST() {
  try {
    await clearTeacherSessionCookie();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}




