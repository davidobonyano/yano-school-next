import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
	try {
		const { data, error } = await supabase
			.from('admins')
			.select('id, name, email, is_active, created_at, updated_at')
			.order('created_at', { ascending: false });
		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}
		return NextResponse.json({ admins: data ?? [] });
	} catch (err: any) {
		return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
	}
}
