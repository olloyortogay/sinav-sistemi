import { createServiceRoleSupabase, fail, ok } from '../../../lib/api-utils';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

function getAdminIds() {
  const raw = process.env.ADMIN_TELEGRAM_IDS || process.env.TELEGRAM_CHAT_ID || '';
  return [...new Set(raw.split(',').map(id => id.trim()).filter(Boolean))];
}

async function sendTelegramMessageStrict(botToken, payload, context) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok || !result?.ok) {
    const reason = result?.description || `HTTP_${response.status}`;
    console.error(`sendWritingResult Telegram hata (${context}):`, reason);
    throw new Error(`Telegram send failed (${context}): ${reason}`);
  }
}

async function sendTelegramDocumentStrict(botToken, { chatId, fileName, pdfBytes, caption }, context) {
  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append('document', new Blob([pdfBytes], { type: 'application/pdf' }), fileName);
  if (caption) form.append('caption', caption);

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
    method: 'POST',
    body: form,
  });
  const result = await response.json();
  if (!response.ok || !result?.ok) {
    const reason = result?.description || `HTTP_${response.status}`;
    console.error(`sendWritingResult Telegram dokuman hatasi (${context}):`, reason);
    throw new Error(`Telegram document send failed (${context}): ${reason}`);
  }
}

let notoSansBytesPromise = null;
async function getNotoSansBytes() {
  if (!notoSansBytesPromise) {
    // Runtime'da indirilen font UTF-8/Türkçe karakterleri PDF'e doğru gömer.
    notoSansBytesPromise = fetch(
      'https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf'
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`Font download failed: ${res.status}`);
        const ab = await res.arrayBuffer();
        return new Uint8Array(ab);
      });
  }
  return notoSansBytesPromise;
}

function normalizePdfText(value) {
  return String(value || '').replace(/\r\n/g, '\n').trim();
}

function wrapText(text, font, size, maxWidth) {
  const lines = [];
  for (const paragraph of String(text || '').split('\n')) {
    if (!paragraph.trim()) {
      lines.push('');
      continue;
    }
    const words = paragraph.split(/\s+/);
    let current = words[0] || '';
    for (let i = 1; i < words.length; i += 1) {
      const candidate = `${current} ${words[i]}`;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = words[i];
      }
    }
    lines.push(current);
  }
  return lines;
}

async function buildWritingExamPdf({
  userName,
  userEmail,
  totalTime,
  task1Text,
  task2Text,
  kompozisyonText,
  part1Info,
  part2Info,
}) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = await getNotoSansBytes();
  const font = await pdfDoc.embedFont(fontBytes, { subset: true });

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 48;
  const usableWidth = pageWidth - margin * 2;
  const titleSize = 16;
  const headingSize = 12;
  const bodySize = 10.5;
  const lineHeight = 15;
  const paragraphGap = 8;
  const sectionGap = 14;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const ensureSpace = (need) => {
    if (y - need < margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  const drawLines = (text, size = bodySize, color = rgb(0.1, 0.1, 0.1), gap = paragraphGap) => {
    const lines = wrapText(text, font, size, usableWidth);
    for (const line of lines) {
      ensureSpace(lineHeight);
      page.drawText(line, { x: margin, y, size, font, color });
      y -= lineHeight;
    }
    y -= gap;
  };

  const drawSection = (title, content) => {
    const normalized = normalizePdfText(content) || '-';
    ensureSpace(lineHeight * 2);
    page.drawText(title, { x: margin, y, size: headingSize, font, color: rgb(0.08, 0.25, 0.52) });
    y -= lineHeight;
    drawLines(normalized);
    y -= sectionGap;
  };

  const mins = Math.floor((totalTime || 0) / 60);
  const secs = (totalTime || 0) % 60;

  page.drawText('Yazma Sinavi - Soru Cevap Dokumu', {
    x: margin,
    y,
    size: titleSize,
    font,
    color: rgb(0.03, 0.2, 0.45),
  });
  y -= lineHeight * 1.5;

  drawLines(
    [
      `Ogrenci: ${normalizePdfText(userName) || 'Bilinmeyen'}`,
      `E-posta: ${normalizePdfText(userEmail) || 'Yok'}`,
      `Sure: ${mins} dk ${secs} sn`,
      `Olusturma Tarihi: ${new Date().toLocaleString('tr-TR')}`,
    ].join('\n'),
    bodySize,
    rgb(0.2, 0.2, 0.2),
    sectionGap
  );

  drawSection('Soru 1: Ortak Metin', part1Info?.ortakMetin);
  drawSection('Soru 2: Gorev 1.1', part1Info?.gorev1_1);
  drawSection('Cevap 2: Gorev 1.1 Ogrenci Cevabi', task1Text);
  drawSection('Soru 3: Gorev 1.2', part1Info?.gorev1_2);
  drawSection('Cevap 3: Gorev 1.2 Ogrenci Cevabi', task2Text);
  drawSection('Soru 4: Kompozisyon Konusu', part2Info);
  drawSection('Cevap 4: Kompozisyon Ogrenci Cevabi', kompozisyonText);

  return pdfDoc.save();
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
        return fail('RATE_LIMITED', 'Too Many Requests: Lütfen 10 saniye bekleyip tekrar deneyin.', 429);
      }
      rateLimitMap.set(student_id, now);
    }
    // ---------------------------

    const supabase = createServiceRoleSupabase();

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
    const pdfBytes = await buildWritingExamPdf({
      userName,
      userEmail,
      totalTime,
      task1Text,
      task2Text,
      kompozisyonText,
      part1Info,
      part2Info,
    });
    const safeName = (userName || 'ogrenci').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'ogrenci';
    const pdfFileName = `writing_${safeName}_${generatedId.slice(0, 8)}.pdf`;

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
        await sendTelegramMessageStrict(
          BOT_TOKEN,
          { chat_id: chatId, text: adminMsg, parse_mode: 'Markdown' },
          `admin-${chatId}`
        );
        await sendTelegramDocumentStrict(
          BOT_TOKEN,
          {
            chatId,
            fileName: pdfFileName,
            pdfBytes,
            caption: 'Yazma sinavi soru-cevap PDF dosyasi',
          },
          `admin-pdf-${chatId}`
        );
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

      await sendTelegramMessageStrict(
        BOT_TOKEN,
        { chat_id: String(telegramAuthId), text: studentMsg, parse_mode: 'Markdown' },
        `student-${telegramAuthId}`
      );
      await sendTelegramDocumentStrict(
        BOT_TOKEN,
        {
          chatId: String(telegramAuthId),
          fileName: pdfFileName,
          pdfBytes,
          caption: 'Sinavinizin soru-cevap PDF ozeti',
        },
        `student-pdf-${telegramAuthId}`
      );
    }

    return ok({ examResultId: generatedId });
  } catch (e) {
    console.error('sendWritingResult error:', e);
    return fail('SEND_WRITING_RESULT_FAILED', e.message, 500);
  }
}
