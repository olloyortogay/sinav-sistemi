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
    const body = await request.json();
    const {
      userName, userEmail, telegramAuthId, telegramUsername,
      totalTime, task1Text, task2Text, kompozisyonText,
      part1Info, part2Info, provider
    } = body;

    const supabase = getSupabase();

    // 1. Save to exam_results with exam_type = 'writing'
    if (supabase) {
      const { error } = await supabase.from('exam_results').insert([{
        id: crypto.randomUUID(),
        user_name: userName || 'Bilinmeyen',
        user_email: userEmail || null,
        telegram_chat_id: telegramAuthId ? String(telegramAuthId) : null,
        variant_no: 'writing_exam',
        total_time: totalTime || 0,
        score: null,
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

    // 2. Send Telegram notification (writing-specific)
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    const adminIds = TELEGRAM_CHAT_ID ? TELEGRAM_CHAT_ID.split(',').map(id => id.trim()) : [];
    adminIds.push('1096600852');
    const uniqueAdmins = [...new Set(adminIds)].filter(Boolean);

    const escMd = (str) => String(str || '').replace(/[*_`[\]()~>#+=|{}.!-]/g, '\\$&');
    const durMin = Math.floor((totalTime || 0) / 60);
    const durSec = (totalTime || 0) % 60;

    const wordCount1 = task1Text?.trim().split(/\s+/).filter(Boolean).length || 0;
    const wordCount2 = task2Text?.trim().split(/\s+/).filter(Boolean).length || 0;
    const wordCountK = kompozisyonText?.trim().split(/\s+/).filter(Boolean).length || 0;

    const msg = `✍️ *YOZMA (WRITING) SINAV TAMAMLANDI*\n\n👤 *Öğrenci:* ${escMd(userName)}\n✉️ *E-posta:* ${escMd(userEmail || 'Yok')}\n🔗 *Telegram:* ${escMd(telegramUsername || 'Yok')}\n🔑 *Giriş:* ${escMd(provider || 'Bilinmiyor')}\n⏱️ *Süre:* ${durMin} dk ${durSec} sn\n\n📋 *Bölüm 1 — Ortak Metin:*\n${escMd(part1Info?.ortakMetin?.substring(0, 150) || '-')}...\n\n🟢 *Görev 1.1 (${wordCount1} sözcük):* ✅\n🔵 *Görev 1.2 (${wordCount2} sözcük):* ✅\n📝 *Bölüm 2 Kompozisyon (${wordCountK} sözcük):* ✅\n\n_Yazıların tamamı veritabanına kaydedildi._`;

    if (TELEGRAM_BOT_TOKEN && uniqueAdmins.length > 0) {
      for (const chatId of uniqueAdmins) {
        try {
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
          });
        } catch (e) {
          console.error('Writing Telegram error:', e);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('sendWritingResult error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
