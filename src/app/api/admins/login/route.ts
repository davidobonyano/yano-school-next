import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { createAdminSessionToken, setAdminSessionCookie } from '@/lib/admin-session';

export async function POST(request: Request) {
	try {
		const { email, password } = await request.json();
		if (!email || !password) {
			return NextResponse.json({ error: 'email and password required' }, { status: 400 });
		}

		const { data: admin, error } = await supabase
			.from('admins')
			.select('id, name, email, password, is_active')
			.eq('email', email)
			.maybeSingle();
		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}
		if (!admin || admin.is_active === false) {
			return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
		}

		const ok = await bcrypt.compare(password, admin.password);
		if (!ok) {
			return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
		}

		// Create session and set cookie
		const token = await createAdminSessionToken({ adminId: admin.id, email: admin.email, name: admin.name || undefined });
		await setAdminSessionCookie(token);

		return NextResponse.json({ success: true, admin: { id: admin.id, name: admin.name, email: admin.email } });
	} catch (err: any) {
		return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
	}
}
