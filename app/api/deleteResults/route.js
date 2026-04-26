import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request) {
  try {
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ success: false, error: 'No db' }, { status: 500 });

    const body = await request.json();
    const { email, telegram_id } = body;

    if (!email && !telegram_id) {
      return NextResponse.json({ success: false, error: 'Kimlik bilgisi eksik' }, { status: 400 });
    }

    let query = supabase.from('exam_results').delete();

    if (email && telegram_id) {
      query = query.or(`user_email.eq.${email},telegram_chat_id.eq.${telegram_id}`);
    } else if (email) {
      query = query.eq('user_email', email);
    } else {
      query = query.eq('telegram_chat_id', telegram_id);
    }

    const { error } = await query;
    
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch(err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
