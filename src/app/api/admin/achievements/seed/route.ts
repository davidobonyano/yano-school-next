import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/authz';

export async function POST(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.error as Response;

  // Only seed if table is empty
  const { data: existing, error: countErr } = await supabaseService
    .from('achievements')
    .select('id', { count: 'exact', head: true });
  if (countErr) return NextResponse.json({ error: countErr.message }, { status: 500 });
  if ((existing as any)?.length) {
    return NextResponse.json({ ok: true, message: 'Already has data; skipping seed' });
  }

  const rows = [
    { event_date: '2008-01-01', title: 'School Founded', description: 'Yano School was established with a mission to raise excellent leaders through education.', display_order: 1 },
    { event_date: '2010-07-01', title: 'Macmillan English Contest Debut', description: 'Participated in our first Macmillan English competition at the district level.', display_order: 2 },
    { event_date: '2012-06-01', title: 'Cowbellpedia Qualifiers', description: 'Reached local district finals of Cowbellpedia Mathematics Competition.', display_order: 3 },
    { event_date: '2016-05-01', title: 'Macmillan English Contest', description: 'Advanced to state-level finals, placing among the top 15 schools.', display_order: 4 },
    { event_date: '2018-06-01', title: 'Cowbellpedia District Achievement', description: 'Came 13th at the district-level Cowbellpedia competition.', display_order: 5 },
    { event_date: '2022-06-01', title: 'SEA‑Hub Entrepreneurship Competition', description: 'Alimosho Senior Grammar School won at the Lagos state entrepreneurship challenge.', display_order: 6 },
    { event_date: '2024-07-01', title: 'Tolaram Science Challenge Winner (Secondary)', description: 'Won the Lagos edition of the prestigious Tolaram Science Challenge.', display_order: 7 },
    { event_date: '2024-07-01', title: 'The Consider Aromi Winners', description: 'Yano students claimed top positions in both junior and senior categories.', display_order: 8 },
    { event_date: '2024-10-01', title: 'Lagos Governor’s Quiz Competition', description: 'Secured 14th place among over 100 participating schools across Lagos.', display_order: 9 },
    { event_date: '2025-03-01', title: 'The Athletics School Games (TASG)', description: 'Excelled in the Lagos-wide athletics games, securing medals in relay and long jump.', display_order: 10 },
  ];

  const { error } = await supabaseService.from('achievements').insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, inserted: rows.length });
}






