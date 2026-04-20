import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function GET(request) {
  try {
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ success: false, error: 'No db' }, { status: 500 });
    
    // Check if it's admin or user request
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const telegramId = url.searchParams.get('telegram_id');
    
    // Check Admin Token
    let isAdmin = false;
    if (token) {
      const redis = getRedis();
      if (redis) {
         try {
           const data = await redis.get('exam_settings');
           const store = typeof data === 'string' ? JSON.parse(data) : (data || {});
           if (store.adminSessions && store.adminSessions.includes(token)) {
             isAdmin = true;
           }
         } catch(e){}
      }
    }
    
    let query = supabase.from('exam_results').select('*').order('completed_at', { ascending: false });
    
    if (isAdmin) {
      // Admin gets all.
    } else if (email || telegramId) {
      // User request
      if (email && telegramId) {
        query = query.or(`user_email.eq.${email},telegram_chat_id.eq.${telegramId}`);
      } else if (email) {
        query = query.eq('user_email', email);
      } else {
        query = query.eq('telegram_chat_id', telegramId);
      }
    } else {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 401 });
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch(err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
