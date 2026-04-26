import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const defaultStore = { activeVariant: 'random', adminUsername: 'admin', adminPassword: 'admin', adminSessions: [] };

async function readStore() {
  const supabase = getSupabase();
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
  const supabase = getSupabase();
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
    const storedUser = store.adminUsername || 'admin';
    const storedPass = store.adminPassword || 'admin';

    if (action === 'LOGIN') {
      if (username === storedUser && password === storedPass) {
        const token = randomUUID();
        const activeSessions = store.adminSessions || [];
        activeSessions.push(token);
        await writeStore({ adminSessions: activeSessions });
        return NextResponse.json({ success: true, token });
      }
      return NextResponse.json({ success: false, error: 'Kullanıcı adı veya şifre hatalı' }, { status: 401 });
    }

    if (action === 'CHANGE_CREDENTIALS') {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.split(' ')[1];
      const activeSessions = store.adminSessions || [];
      
      if (!token || !activeSessions.includes(token)) {
         return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      if (username !== storedUser || password !== storedPass) {
        return NextResponse.json({ success: false, error: 'Mevcut bilgiler hatalı' }, { status: 401 });
      }
      const updates = {};
      if (newUsername) updates.adminUsername = newUsername;
      if (newPassword) updates.adminPassword = newPassword;
      await writeStore(updates);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Bilinmeyen işlem' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
