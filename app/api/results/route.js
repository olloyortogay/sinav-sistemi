import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Sunucu tarafında service_role key kullan (RLS'i atlar)
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function verifyAdminToken(token) {
  if (!token) return false;
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.from('app_settings').select('data').eq('id', 1).single();
    if (!error && data?.data?.adminSessions) {
      return data.data.adminSessions.includes(token);
    }
  } catch (e) { }
  return false;
}

export async function GET(request) {
  try {
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ success: false, error: 'No db' }, { status: 500 });
    
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const telegramId = url.searchParams.get('telegram_id');
    const examType = url.searchParams.get('exam_type');
    
    const isAdmin = await verifyAdminToken(token);
    
    let query = supabase.from('exam_results').select('*').order('completed_at', { ascending: false });
    
    if (examType) {
      if (examType === 'writing') {
        query = query.or('variant_no.eq.writing_exam,sections->>exam_type.eq.writing');
      } else if (examType === 'speaking') {
        // Exclude writing and placement to get speaking
        query = query.not('variant_no', 'in', '("writing_exam","placement_exam","placement_test")');
      } else {
        query = query.eq('sections->>exam_type', examType);
      }
    }

    if (isAdmin) {
      // Admin gets all filtered by examType
    } else if (email || telegramId) {
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
