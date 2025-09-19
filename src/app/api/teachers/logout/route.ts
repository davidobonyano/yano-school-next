import { NextResponse } from 'next/server';
import { clearTeacherSessionCookie } from '@/lib/teacher-session';

export async function POST() {
  try {
    await clearTeacherSessionCookie();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}




