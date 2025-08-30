import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { data, error } = await supabaseService.rpc('get_app_period');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const period = data?.[0] || { current_term: 'First Term', current_session: '2024/2025' };
    return NextResponse.json({ term: period.current_term, session: period.current_session });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { term, session, autoCreatePaymentRecords = true } = await request.json();
    if (!term || !session) return NextResponse.json({ error: 'term and session required' }, { status: 400 });

    if (autoCreatePaymentRecords) {
      // Handle period change and automatically create payment records
      const { data, error } = await supabaseService.rpc('handle_period_change', { 
        p_term: term, 
        p_session: session 
      });
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      
      return NextResponse.json({ 
        success: true, 
        message: `Period updated and created ${data?.records_created || 0} payment records`,
        data 
      });
    } else {
      // Just update the period without creating payment records
      const { data, error } = await supabaseService.rpc('set_app_period', { p_term: term, p_session: session });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}


