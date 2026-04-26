import { fail, ok, createServiceRoleSupabase, getBearerToken } from '../../../lib/api-utils';
import { randomUUID } from 'crypto';

const defaultStore = { activeVariant: 'random', adminUsername: null, adminPassword: null, adminSessions: [] };

async function readStore() {
  const supabase = createServiceRoleSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('app_settings').select('data').eq('id', 1).single();
      if (!error && data && data.data) {
        return { ...defaultStore, ...data.data };
      }
    } catch (e) { console.warn('Supabase read:', e.message); }
  }
  return defaultStore;
}

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

export async function POST(request) {
  try {
    const { action, username, password, newUsername, newPassword } = await request.json();
    const store = await readStore();
    const storedUser = store.adminUsername;
    const storedPass = store.adminPassword;

    if (!storedUser || !storedPass) {
      return fail('ADMIN_NOT_CONFIGURED', 'Admin credentials are not configured', 503);
    }

    if (action === 'LOGIN') {
      if (username === storedUser && password === storedPass) {
        const token = randomUUID();
        const activeSessions = store.adminSessions || [];
        activeSessions.push(token);
        await writeStore({ adminSessions: activeSessions });
        return ok({ token });
      }
      return fail('INVALID_CREDENTIALS', 'Kullanıcı adı veya şifre hatalı', 401);
    }

    if (action === 'CHANGE_CREDENTIALS') {
      const token = getBearerToken(request);
      const activeSessions = store.adminSessions || [];
      
      if (!token || !activeSessions.includes(token)) {
         return fail('UNAUTHORIZED', 'Unauthorized', 401);
      }

      if (username !== storedUser || password !== storedPass) {
        return fail('INVALID_CREDENTIALS', 'Mevcut bilgiler hatalı', 401);
      }
      const updates = {};
      if (newUsername) updates.adminUsername = newUsername;
      if (newPassword) updates.adminPassword = newPassword;
      await writeStore(updates);
      return ok({ updated: true });
    }

    return fail('UNKNOWN_ACTION', 'Bilinmeyen işlem', 400);
  } catch (err) {
    return fail('ADMIN_AUTH_FAILED', err.message, 500);
  }
}
