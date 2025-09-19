import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('id, event_date, title, description, display_order')
      .order('display_order', { ascending: true })
      .order('event_date', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ achievements: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch achievements' }, { status: 500 });
  }
}






