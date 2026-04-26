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
      totalTime, task1Text, task2Text, kompozisyonText,
      part1Info, part2Info, provider,
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

    // 1. Veritabanına kaydet
    const generatedId = crypto.randomUUID();
    if (supabase) {
      const { error } = await supabase.from('exam_results').insert([{
        id: generatedId,
        student_id: student_id || null,        // ← FK: students tablosu
        user_name: userName || 'Bilinmeyen',
        user_email: userEmail || null,
        telegram_chat_id: telegramAuthId ? String(telegramAuthId) : null,
        variant_no: 'writing_exam',
        total_time: totalTime || 0,
        score: null, // Yazma sınavı elle değerlendirilir
        sections: {
          exam_type: 'writing',
          task1: task1Text,
          task2: task2Text,
          kompozisyon: kompozisyonText,
          part1Info,
          part2Info,
        },
        completed_at: new Date().toISOString(),
      }]);
      if (error) console.error('Writing saveResult error:', error);
    }

    // 2. Adminlere Telegram bildirimi
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const adminIds = getAdminIds();

    const escMd = (str) => String(str || '').replace(/[*_`[\]()~>#+=|{}.!-]/g, '\\$&');
    const durMin = Math.floor((totalTime || 0) / 60);
    const durSec = (totalTime || 0) % 60;
    const wc1 = task1Text?.trim().split(/\s+/).filter(Boolean).length || 0;
    const wc2 = task2Text?.trim().split(/\s+/).filter(Boolean).length || 0;
    const wcK = kompozisyonText?.trim().split(/\s+/).filter(Boolean).length || 0;

    const adminMsg =
      `✍️ *YOZMA (WRITING) SINAV TAMAMLANDI*\n\n` +
      `👤 *Öğrenci:* ${escMd(userName)}\n` +
      `✉️ *E-posta:* ${escMd(userEmail || 'Yok')}\n` +
      `🔗 *Telegram:* ${escMd(telegramUsername || 'Yok')}\n` +
      `🆔 *TG Chat ID:* ${telegramAuthId ? `\`${telegramAuthId}\`` : 'Yok'}\n` +
      `🔑 *Giriş:* ${escMd(provider || 'Bilinmiyor')}\n` +
      `⏱️ *Süre:* ${durMin} dk ${durSec} sn\n\n` +
      `📋 *Bölüm 1 — Ortak Metin:*\n${escMd(part1Info?.ortakMetin?.substring(0, 120) || '-')}...\n\n` +
      `🟢 *Görev 1.1* (${wc1} sözcük): ✅\n` +
      `🔵 *Görev 1.2* (${wc2} sözcük): ✅\n` +
      `📝 *Kompozisyon* (${wcK} sözcük): ✅\n\n` +
      `_Yazıların tamamı veritabanına kaydedildi._`;

    if (BOT_TOKEN && adminIds.length > 0) {
      for (const chatId of adminIds) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: adminMsg, parse_mode: 'Markdown' }),
        }).catch(e => console.error(`sendWritingResult admin TG (${chatId}):`, e));
      }
    }

    // 3. Öğrenciye Telegram bildirimi (TG ile giriş yaptıysa)
    if (BOT_TOKEN && telegramAuthId) {
      const studentMsg =
        `✍️ *Yozma imtihoniz qabul qilindi!*\n\n` +
        `Salom, *${escMd(userName)}*!\n\n` +
        `Yozma bo'lim javoblaringiz muvaffaqiyatli yuborildi va baholanish uchun o'qituvchiga jo'natildi.\n\n` +
        `🟢 Görev 1.1: ${wc1} so'z\n` +
        `🔵 Görev 1.2: ${wc2} so'z\n` +
        `📝 Kompozisyon: ${wcK} so'z\n\n` +
        `Natija e'lon qilingandan so'ng sizga xabar yuboriladi. 🎓`;

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: String(telegramAuthId), text: studentMsg, parse_mode: 'Markdown' }),
      }).catch(e => console.error('sendWritingResult student TG:', e));
    }

    return NextResponse.json({ success: true, examResultId: generatedId });
  } catch (e) {
    console.error('sendWritingResult error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
