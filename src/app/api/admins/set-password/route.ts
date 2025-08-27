import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
	try {
		const { email, name, password } = await request.json();
		if (!email || !password) {
			return NextResponse.json({ error: 'email and password required' }, { status: 400 });
		}

		const passwordHash = await bcrypt.hash(password, 10);

		// Check if admin exists
		const { data: existing, error: findErr } = await supabase
			.from('admins')
			.select('id')
			.eq('email', email)
			.maybeSingle();
		if (findErr) {
			return NextResponse.json({ error: findErr.message }, { status: 500 });
		}

		if (existing) {
			const { error: updErr } = await supabase
				.from('admins')
				.update({
					password: passwordHash,
					name: name ?? undefined,
					updated_at: new Date().toISOString(),
				})
				.eq('id', existing.id);
			if (updErr) {
				return NextResponse.json({ error: updErr.message }, { status: 500 });
			}
			return NextResponse.json({ success: true, action: 'updated' });
		}

		const { error: insErr } = await supabase
			.from('admins')
			.insert({
				id: crypto.randomUUID(),
				name: name ?? email.split('@')[0],
				email,
				password: passwordHash,
				is_active: true,
			})
			.select('id')
			.maybeSingle();
		if (insErr) {
			return NextResponse.json({ error: insErr.message }, { status: 500 });
		}

		return NextResponse.json({ success: true, action: 'created' });
	} catch (err: any) {
		return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
	}
}
