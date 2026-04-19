import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userName, userEmail, variantNo, totalTime } = body;

    const supabase = getSupabase();
    if (!supabase) {
      console.warn('Supabase not configured — result not saved');
      return NextResponse.json({ success: true, saved: false });
    }

    const { data, error } = await supabase
      .from('exam_results')
      .insert([{
        user_name:    userName  || 'Bilinmeyen',
        user_email:   userEmail || null,
        variant_no:   variantNo || 'random',
        total_time:   totalTime || 0,
        completed_at: new Date().toISOString(),
      }])
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, saved: true, resultId: data.id });
  } catch (err) {
    console.error('saveResult error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
