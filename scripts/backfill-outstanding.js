/*
  Usage: node scripts/backfill-outstanding.js "First" "2024/2025"
  For each student, computes outstanding from legacy payments (if any) and writes a CarryForward entry.
*/
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const term = process.argv[2];
  const session = process.argv[3];
  if (!term || !session) {
    console.error('Provide term and session, e.g., node scripts/backfill-outstanding.js "First" "2024/2025"');
    process.exit(1);
  }

  const { data: students, error: sErr } = await supabase.from('school_students').select('student_id').eq('is_active', true);
  if (sErr) throw sErr;

  let created = 0;
  for (const s of students || []) {
    // If balance already exists, skip
    const { data: bal, error: bErr } = await supabase.rpc('get_student_balance', {
      p_student_id: s.student_id,
      p_term: term,
      p_session: session
    });
    if (bErr) throw bErr;
    const balanceNow = Array.isArray(bal) ? Number(bal?.[0]) : Number(bal);
    if (Number.isFinite(balanceNow) && balanceNow > 0) continue;

    // Example: import legacy outstanding = 0 (placeholder). Adjust to your legacy source.
    const legacyOutstanding = 0;
    if (legacyOutstanding > 0) {
      const { error: insErr } = await supabase.from('payment_ledgers').insert({
        student_id: s.student_id,
        term,
        session,
        entry_type: 'CarryForward',
        amount: legacyOutstanding,
        description: 'Legacy outstanding backfill'
      });
      if (insErr) throw insErr;
      created++;
    }
  }

  console.log(JSON.stringify({ success: true, created }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});








