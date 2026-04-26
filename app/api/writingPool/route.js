import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// GET — fetch writing pool
export async function GET() {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ success: false, error: 'No DB config' }, { status: 500 });

  const { data, error } = await supabase
    .from('writing_pool')
    .select('pool_data, updated_at')
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, pool: data?.pool_data || null, updatedAt: data?.updated_at || null });
}

// POST — save writing pool (new schema: part1_writing_pool + part2_writing_pool)
export async function POST(request) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ success: false, error: 'No DB config' }, { status: 500 });

  try {
    const body = await request.json();
    const { poolData } = body;
    if (!poolData) return NextResponse.json({ success: false, error: 'poolData is required' }, { status: 400 });

    const { data: existing } = await supabase.from('writing_pool').select('id').limit(1).maybeSingle();

    let result;
    if (existing?.id) {
      result = await supabase
        .from('writing_pool')
        .update({ pool_data: poolData, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      result = await supabase.from('writing_pool').insert([{ pool_data: poolData }]);
    }

    if (result.error) return NextResponse.json({ success: false, error: result.error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
