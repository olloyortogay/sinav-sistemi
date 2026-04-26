import { createServiceRoleSupabase, fail, ok } from '../../../lib/api-utils';

// GET — fetch writing pool
export async function GET() {
  const supabase = createServiceRoleSupabase();
  if (!supabase) return fail('SUPABASE_CONFIG_MISSING', 'Supabase service role key is missing', 500);

  const { data, error } = await supabase
    .from('writing_pool')
    .select('pool_data, updated_at')
    .limit(1)
    .maybeSingle();

  if (error) return fail('WRITING_POOL_FETCH_FAILED', error.message, 500);
  return ok({ pool: data?.pool_data || null, updatedAt: data?.updated_at || null });
}

// POST — save writing pool (new schema: part1_writing_pool + part2_writing_pool)
export async function POST(request) {
  const supabase = createServiceRoleSupabase();
  if (!supabase) return fail('SUPABASE_CONFIG_MISSING', 'Supabase service role key is missing', 500);

  try {
    const body = await request.json();
    const { poolData } = body;
    if (!poolData) return fail('POOL_DATA_REQUIRED', 'poolData is required', 400);

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

    if (result.error) return fail('WRITING_POOL_SAVE_FAILED', result.error.message, 500);
    return ok({ saved: true });
  } catch (e) {
    return fail('WRITING_POOL_SAVE_FAILED', e.message, 500);
  }
}
