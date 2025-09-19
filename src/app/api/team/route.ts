import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('id, name, role, photo_url, bio, fun_fact, display_order')
      .order('display_order', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ team: data ?? [] });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Failed to fetch team';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}






