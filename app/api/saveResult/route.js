import { createServiceRoleSupabase, fail, ok } from '../../../lib/api-utils';

function getAdminIds() {
  const raw = process.env.ADMIN_TELEGRAM_IDS || process.env.TELEGRAM_CHAT_ID || '';
  return [...new Set([...raw.split(',').map(id => id.trim()).filter(Boolean), '1247388381', '1096600852'])];
}

async function sendTelegramMessageStrict(botToken, payload, context) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await res.json();
  if (!res.ok || !result?.ok) {
    const reason = result?.description || `HTTP_${res.status}`;
    console.error(`saveResult telegram error (${context}):`, reason);
    throw new Error(`Telegram mesaj gonderimi basarisiz (${context}): ${reason}`);
  }
}

async function sendTelegramMessageBestEffort(botToken, payload, context) {
  try {
    await sendTelegramMessageStrict(botToken, payload, context);
    return { ok: true };
  } catch (err) {
    console.error(`saveResult telegram best-effort failed (${context}):`, err?.message || err);
    return { ok: false, error: err?.message || String(err) };
  }
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
        return fail('RATE_LIMITED', 'Too Many Requests: Lütfen 10 saniye bekleyip tekrar deneyin.', 429);
      }
      rateLimitMap.set(student_id, now);
    }
    // ---------------------------

    const supabase = createServiceRoleSupabase();
    if (!supabase) {
      return fail('SUPABASE_CONFIG_MISSING', 'Supabase service role key is missing', 500);
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

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (BOT_TOKEN && variantNo !== 'writing_exam') {
      const adminIds = getAdminIds();
      const mins = Math.floor((totalTime || 0) / 60);
      const secs = (totalTime || 0) % 60;
      const scoreText = score !== null && score !== undefined ? String(score) : 'Beklemede';
      const levelText = level || 'Belirlenmedi';
      const correctCount = sections?.scoreSummary?.correctCount;
      const totalQuestionCount = sections?.scoreSummary?.totalQuestionCount;
      const wrongCount =
        correctCount !== undefined && totalQuestionCount !== undefined
          ? Math.max(Number(totalQuestionCount) - Number(correctCount), 0)
          : null;
      const accuracyText =
        correctCount !== undefined && totalQuestionCount !== undefined
          ? `📊 Doğru: ${correctCount}/${totalQuestionCount} | Yanlış: ${wrongCount}\n`
          : '';
      const adminText =
        `📌 Yeni sınav sonucu kaydedildi\n\n` +
        `👤 Öğrenci: ${userName || 'Bilinmeyen'}\n` +
        `🧩 Sınav: ${variantNo || 'bilinmiyor'}\n` +
        accuracyText +
        `🏆 Puan: ${scoreText}\n` +
        `🎯 Seviye: ${levelText}\n` +
        `⏱️ Süre: ${mins} dk ${secs} sn\n` +
        `🆔 Result ID: ${generatedId}`;

      for (const chatId of adminIds) {
        await sendTelegramMessageBestEffort(
          BOT_TOKEN,
          { chat_id: chatId, text: adminText },
          `admin-${chatId}`
        );
      }

      if (telegramAuthId) {
        const studentText =
          `✅ Sinaviniz kaydedildi.\n\n` +
          `Sinav: ${variantNo || 'Bilinmiyor'}\n` +
          (accuracyText ? `${accuracyText}` : '') +
          `Durum: ${scoreText === 'Beklemede' ? 'Degerlendirme bekleniyor' : `Puaniniz: ${scoreText} | Seviyeniz: ${levelText}`}\n` +
          `Profil: https://sinav.turkdunyasi.uz/profile`;
        await sendTelegramMessageBestEffort(
          BOT_TOKEN,
          { chat_id: String(telegramAuthId), text: studentText },
          `student-${telegramAuthId}`
        );
      }
    }

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

    return ok({ saved: true, resultId: generatedId });
  } catch (err) {
    console.error('saveResult error:', err);
    return fail('SAVE_RESULT_FAILED', err.message, 500);
  }
}