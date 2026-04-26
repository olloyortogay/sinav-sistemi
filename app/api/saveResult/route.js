import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function getAdminIds() {
  const raw = process.env.ADMIN_TELEGRAM_IDS || process.env.TELEGRAM_CHAT_ID || '';
  return [...new Set(raw.split(',').map(id => id.trim()).filter(Boolean))];
}

// Basit In-Memory Rate Limiter (10 Saniye)
const rateLimitMap = new Map();

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      userName, userEmail, telegramAuthId, telegramUsername,
      variantNo, totalTime, sections,
      score,       // number | null
      level,       // string | null
      student_id   // UUID | null — students tablosu FK
    } = body;

    // --- RATE LIMIT KONTROLÜ ---
    if (student_id) {
      const now = Date.now();
      const lastRequest = rateLimitMap.get(student_id);
      if (lastRequest && now - lastRequest < 10000) {
        return NextResponse.json(
          { success: false, error: 'Too Many Requests: Lütfen 10 saniye bekleyip tekrar deneyin.' },
          { status: 429 }
        );
      }
      rateLimitMap.set(student_id, now);
    }
    // ---------------------------

    const supabase = getSupabase();
    if (!supabase) {
      console.warn('Supabase yapılandırılmamış — sonuç kaydedilmedi');
      return NextResponse.json({ success: true, saved: false });
    }

    const generatedId = crypto.randomUUID();

    // 1. Supabase'e kaydet
    // score: null ile 0'ı ayırt ediyoruz — null = değerlendirilmedi, 0 = gerçek sıfır puan
    const { error } = await supabase.from('exam_results').insert([{
      id: generatedId,
      student_id: student_id || null,        // ← FK: students tablosu
      user_name: userName || 'Bilinmeyen',
      user_email: userEmail || null,
      telegram_chat_id: telegramAuthId ? String(telegramAuthId) : null,
      variant_no: variantNo || 'placement_test',
      total_time: totalTime || 0,
      score: score !== undefined && score !== null ? score : null,
      level: level || null,
      sections: sections || {},
      completed_at: new Date().toISOString(),
    }]);

    if (error) throw error;

    // 2. n8n Webhook (placement/speaking sınavları için)
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nUrl && variantNo !== 'writing_exam') {
      fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'exam_completed',
          student: userName || 'Bilinmiyor',
          userEmail: userEmail || 'Yok',
          telegramAuthId: telegramAuthId || null,
          telegramUsername: telegramUsername || null,
          variantNo: variantNo || null,
          score: score !== null && score !== undefined ? score : 'Beklemede',
          level: level || null,
          totalTime: totalTime || 0,
          resultId: generatedId,
        }),
      }).catch(err => console.error('n8n webhook hatası:', err));
    }

    return NextResponse.json({ success: true, saved: true, resultId: generatedId });
  } catch (err) {
    console.error('saveResult error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}