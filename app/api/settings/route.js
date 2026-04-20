import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const defaultStore = { activeVariant: 'random', adminUsername: 'admin', adminPassword: 'admin', adminSessions: [] };

// Supabase'den ayarları oku
async function readStore() {
  const supabase = getSupabase();
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
  const supabase = getSupabase();
  const current = await readStore();
  const nextStore = { ...current, ...updates };

  if (supabase) {
    try {
      await supabase.from('app_settings').upsert([{ id: 1, data: nextStore }]);
    } catch (e) {
      console.warn('Supabase write error:', e.message);
    }
  }
}

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ activeVariant: store.activeVariant || 'random' });
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    const store = await readStore();
    const sessions = store.adminSessions || [];
    
    if (!token || !sessions.includes(token)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { variant } = await request.json();
    await writeStore({ activeVariant: String(variant) });
    return NextResponse.json({ success: true, activeVariant: variant });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
