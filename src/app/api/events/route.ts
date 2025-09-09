import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all events or filtered events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const upcoming = searchParams.get('upcoming');

    let query = supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });

    // Filter by active status if specified
    if (active !== null) {
      query = query.eq('is_active', active === 'true');
    }

    // Filter by upcoming events if specified
    if (upcoming === 'true') {
      const now = new Date().toISOString();
      query = query.gte('event_date', now);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Error in events GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new event (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, event_date, location, created_by } = body;

    // Basic validation
    if (!title || !event_date) {
      return NextResponse.json({ error: 'Title and event date are required' }, { status: 400 });
    }

    const { data: event, error } = await supabase
      .from('events')
      .insert([{
        title: title.trim(),
        description: description?.trim(),
        event_date,
        location: location?.trim(),
        created_by
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    console.error('Error in events POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
