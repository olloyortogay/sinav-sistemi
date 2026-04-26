import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    } catch (e) { console.warn('Supabase read error:', e.message); }
  }
  return defaultStore;
}

export async function GET(request) {
  try {
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ success: false, error: 'No DB' }, { status: 500 });

    const { data, error } = await supabase.from('question_pools').select('pool_data').limit(1).maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, pool: data?.pool_data || null });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Basic admin auth check
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ success: false, error: 'No DB' }, { status: 500 });

    const store = await readStore();
    const sessions = store.adminSessions || [];
    if (!sessions.includes(token)) {
      return NextResponse.json({ success: false, error: 'Unauthorized token' }, { status: 401 });
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
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
