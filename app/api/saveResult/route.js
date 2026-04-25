import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Sunucu tarafında service_role key kullan (RLS'i atlar)
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request) {
  try {
    const body = await request.json();
    // Yeni Sınav Motorundan gelen score ve level verilerini de alıyoruz
    const { userName, userEmail, telegramAuthId, telegramUsername, variantNo, totalTime, sections, score, level } = body;

    const supabase = getSupabase();
    if (!supabase) {
      console.warn('Supabase not configured — result not saved');
      return NextResponse.json({ success: true, saved: false });
    }

    const generatedId = crypto.randomUUID();

    // 1. Supabase'e Kayıt
    const { error } = await supabase
      .from('exam_results')
      .insert([{
        id: generatedId,
        user_name: userName || 'Bilinmeyen',
        user_email: userEmail || null,
        telegram_chat_id: telegramAuthId ? String(telegramAuthId) : null,
        variant_no: variantNo || 'placement_test', // Sınav türünü belirttik
        total_time: totalTime || 0,
        score: score || 0,       // Yeni DB kolonun varsa buraya yazar, yoksa sections içine gömebiliriz
        level: level || 'A1',    // Seviye bilgisini ekledik
        sections: sections || {},
        completed_at: new Date().toISOString(),
      }]);

    if (error) throw error;

    // 2. n8n ile Telegram İstihbaratı (Webhook)
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhookUrl && (variantNo === 'placement_exam' || variantNo === 'placement_test')) {
      try {
        await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'exam_completed',
            student: userName || "Bilinmiyor",
            userEmail: userEmail || "Yok",
            telegramAuthId: telegramAuthId || null,
            telegramUsername: telegramUsername || null,
            score: score || 0,
            level: level || "A1",
            totalTime: totalTime || 0
          })
        });
      } catch (webhookErr) {
        console.error('n8n Webhook hatası:', webhookErr); // Webhook çökse bile öğrenciye hata göstermeyiz
      }
    }

    return NextResponse.json({ success: true, saved: true, resultId: generatedId });
  } catch (err) {
    console.error('saveResult error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}