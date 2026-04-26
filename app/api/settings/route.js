import { createServiceRoleSupabase, fail, getBearerToken, ok } from '../../../lib/api-utils';

const defaultStore = { activeVariant: 'random', adminUsername: null, adminPassword: null, adminSessions: [] };

// Supabase'den ayarları oku
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

// Supabase'e ayarları yaz (Upsert)
async function writeStore(updates) {
  const supabase = createServiceRoleSupabase();
  const current = await readStore();
  const nextStore = { ...current, ...updates };

  if (supabase) {
    const { error } = await supabase.from('app_settings').upsert([{ id: 1, data: nextStore }]);
    if (error) {
      console.error('Supabase write error:', error);
      throw error;
    }
  }
}

export async function GET() {
  const store = await readStore();
  return ok({ activeVariant: store.activeVariant || 'random' });
}

export async function POST(request) {
  try {
    const token = getBearerToken(request);
    
    const store = await readStore();
    const sessions = store.adminSessions || [];
    
    if (!token || !sessions.includes(token)) {
      return fail('UNAUTHORIZED', 'Unauthorized', 401);
    }

    const { variant } = await request.json();
    await writeStore({ activeVariant: String(variant) });
    return ok({ activeVariant: variant });
  } catch (err) {
    return fail('SETTINGS_UPDATE_FAILED', err.message, 500);
  }
}
