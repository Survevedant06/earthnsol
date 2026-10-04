const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function inspect() {
  const { data: deals, error: dErr } = await supabase.from('deals').select('*');
  console.log('=== DEALS ===');
  console.log(deals);
  if (dErr) console.error(dErr);

  const { data: marquee, error: mErr } = await supabase.from('marquee').select('*').limit(10);
  console.log('=== MARQUEE ===');
  console.log(marquee);
  if (mErr) console.error(mErr);
}

inspect();
