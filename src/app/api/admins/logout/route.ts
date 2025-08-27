import { NextResponse } from 'next/server';
import { clearAdminSessionCookie } from '@/lib/admin-session';

export async function POST() {
	clearAdminSessionCookie();
	return NextResponse.json({ success: true });
}
