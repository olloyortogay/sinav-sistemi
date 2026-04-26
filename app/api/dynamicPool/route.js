import { createServiceRoleSupabase, fail, getBearerToken, ok } from '../../../lib/api-utils';

const defaultStore = { activeVariant: 'random', adminUsername: null, adminPassword: null, adminSessions: [] };

async function readStore() {
  const supabase = createServiceRoleSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('app_settings').select('data').eq('id', 1).single();
      if (!error && data && data.data) {
        return { ...defaultStore, ...data.data };
      }
    } catch (e) { console.warn('Supabase read error:', e.message); }
  }
  return defaultStore;
}

export async function GET(request) {
  try {
    const supabase = createServiceRoleSupabase();
    if (!supabase) return fail('SUPABASE_CONFIG_MISSING', 'Supabase service role key is missing', 500);

    const { data, error } = await supabase.from('question_pools').select('pool_data').limit(1).maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      return fail('POOL_FETCH_FAILED', error.message, 500);
    }

    return ok({ pool: data?.pool_data || null });
  } catch (error) {
    return fail('POOL_FETCH_FAILED', error.message, 500);
  }
}

export async function POST(request) {
  try {
    // Basic admin auth check
    const token = getBearerToken(request);
    
    if (!token) {
      return fail('UNAUTHORIZED', 'Unauthorized', 401);
    }

    const supabase = createServiceRoleSupabase();
    if (!supabase) return fail('SUPABASE_CONFIG_MISSING', 'Supabase service role key is missing', 500);

    const store = await readStore();
    const sessions = store.adminSessions || [];
    if (!sessions.includes(token)) {
      return fail('UNAUTHORIZED', 'Unauthorized token', 401);
    }

    const { poolData } = await request.json();

    // Upsert the data (we'll just use a fixed ID or truncate)
    // Since we want exactly one pool, let's delete all and insert one, or upsert by a fixed ID 'pool-1' (requires id to be text or uuid)
    // Let's first check if there's any record
    const { data: existingRecords } = await supabase.from('question_pools').select('id').limit(1);
    
    let dbError;
    if (existingRecords && existingRecords.length > 0) {
      const { error } = await supabase.from('question_pools').update({ pool_data: poolData, updated_at: new Date().toISOString() }).eq('id', existingRecords[0].id);
      dbError = error;
    } else {
      const { error } = await supabase.from('question_pools').insert([{ pool_data: poolData }]);
      dbError = error;
    }

    if (dbError) {
      return fail('POOL_SAVE_FAILED', dbError.message, 500);
    }

    return ok({ saved: true });
  } catch (error) {
    return fail('POOL_SAVE_FAILED', error.message, 500);
  }
}
