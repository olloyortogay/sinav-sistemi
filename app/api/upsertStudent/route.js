import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * POST /api/upsertStudent
 *
 * Her girişte çağrılır. students tablosunu günceller/oluşturur.
 * Döndürdüğü student_id, sınav sonuçlarında FK olarak kullanılır.
 *
 * Body: { provider, id, name, email, telegramUsername, avatar }
 * Response: { success: true, student_id: "uuid" }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { provider, id, name, email, telegramUsername, avatar } = body;

    // Zorunlu alan kontrolü
    if (!provider || !id || !name) {
      return NextResponse.json(
        { success: false, error: 'provider, id ve name zorunludur.' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Veritabanı bağlantısı kurulamadı.' },
        { status: 500 }
      );
    }

    // PostgreSQL upsert_student() fonksiyonu çağrısı
    const { data: studentId, error } = await supabase.rpc('upsert_student', {
      p_google_id:         provider === 'google'    ? String(id) : null,
      p_telegram_id:       provider === 'telegram'  ? String(id) : null,
      p_name:              name || 'Bilinmeyen',
      p_email:             email || null,
      p_telegram_username: telegramUsername || null,
      p_avatar_url:        avatar || null,
      p_provider:          provider,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, student_id: studentId });
  } catch (err) {
    console.error('upsertStudent error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
