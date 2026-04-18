import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url   = process.env.SUPABASE_URL;
  const token = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !token) return null;
  return createClient(url, token);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, userName, userEmail, variantNo, totalTime, sections } = body;

    const supabase = getSupabase();
    if (!supabase) {
      // Supabase yoksa sadece logla
      console.warn('Supabase not configured — result not saved to DB');
      return NextResponse.json({ success: true, saved: false });
    }

    const { data, error } = await supabase
      .from('exam_results')
      .insert([{
        user_id:      userId,
        user_name:    userName,
        user_email:   userEmail,
        variant_no:   variantNo,
        total_time:   totalTime,
        sections:     sections,
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
