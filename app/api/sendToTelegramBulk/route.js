import { fail, ok } from '../../../lib/api-utils';

function getAdminIds() {
  const raw = process.env.ADMIN_TELEGRAM_IDS || process.env.TELEGRAM_CHAT_ID || '';
  return [...new Set(raw.split(',').map(id => id.trim()).filter(Boolean))];
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userInfo, audioLinks } = body;

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const adminIds = getAdminIds();

    if (!BOT_TOKEN) {
      return fail('BOT_TOKEN_MISSING', 'TELEGRAM_BOT_TOKEN eksik.', 500);
    }
    if (adminIds.length === 0) {
      return fail('ADMIN_IDS_MISSING', 'ADMIN_TELEGRAM_IDS yapılandırması eksik.', 500);
    }
    if (!audioLinks || audioLinks.length === 0) {
      return fail('AUDIO_LINKS_MISSING', 'Gönderilecek ses linki yok.', 400);
    }

    // Markdown escape
    const escMd = (str) => String(str || '').replace(/[*_`[\]()~>#+=|{}.!-]/g, '\\$&');

    const rawName = userInfo?.name || 'Bilinmeyen_Ogrenci';
    const varNo = userInfo?.variantNo || 'Bilinmiyor';

    let pdfLine = '';
    if (varNo === 'dynamic' && userInfo?.dynamicPdfUrl) {
      pdfLine = `\n\n📄 *Varyant PDF:* [Dinamik PDF İndir](${userInfo.dynamicPdfUrl})`;
    } else if (varNo !== 'random' && varNo !== 'dynamic') {
      pdfLine = `\n\n📄 *Varyant PDF:* [Varyant ${varNo}](https://turkdunyasi.uz/pdfs/variant_${varNo}.pdf)`;
    }

    const captionText =
      `🎓 *ÖĞRENCİ SINAV DOSYASI*\n\n` +
      `📌 Öğrenci Adı: ${escMd(rawName)}` +
      (userInfo?.email ? `\n✉️ E-posta: ${escMd(userInfo.email)}` : '') +
      (userInfo?.telegramUsername ? `\n✈️ Telegram: ${escMd(userInfo.telegramUsername)}` : '') +
      (userInfo?.provider ? `\n🔑 Giriş: ${escMd(userInfo.provider.toUpperCase())}` : '') +
      (userInfo?.timeTaken ? `\n⏱️ Süre: ${Math.floor(userInfo.timeTaken / 60)} dk ${userInfo.timeTaken % 60} sn` : '') +
      `\n📂 Kayıt: ${audioLinks.length} Bölüm\n📝 Varyant: ${varNo}` +
      pdfLine;

    const mediaGroup = audioLinks.map(item => ({
      type: 'audio',
      media: item.url,
      parse_mode: 'Markdown',
      title: item.sectionName,
      performer: rawName,
    }));

    const failedChats = [];

    for (const chatId of adminIds) {
      try {
        // Önce bilgi mesajı
        const infoRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: captionText, parse_mode: 'Markdown' }),
        });
        const infoJson = await infoRes.json();
        if (!infoRes.ok || !infoJson?.ok) {
          const reason = infoJson?.description || `HTTP_${infoRes.status}`;
          failedChats.push({ chatId, reason: `sendMessage:${reason}` });
          console.error(`sendToTelegramBulk info mesajı hatası (${chatId}):`, reason);
          continue;
        }

        // Ardından ses dosyaları
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, media: mediaGroup }),
        });
        const result = await res.json();
        if (!res.ok || !result?.ok) {
          const reason = result?.description || `HTTP_${res.status}`;
          failedChats.push({ chatId, reason: `sendMediaGroup:${reason}` });
          console.error(`sendToTelegramBulk Telegram API Hatası (${chatId}):`, reason);
        }
      } catch (err) {
        failedChats.push({ chatId, reason: err.message });
        console.error(`sendToTelegramBulk fetch hatası (${chatId}):`, err);
      }
    }

    if (failedChats.length > 0) {
      const reason = failedChats.map(item => `${item.chatId}:${item.reason}`).join(', ');
      throw new Error(`Telegram API Hatası: ${reason}`);
    }
    return ok({ message: 'Ses dosyaları başarıyla gönderildi.' });
  } catch (error) {
    console.error('sendToTelegramBulk hatası:', error);
    return fail('SEND_TO_TELEGRAM_BULK_FAILED', error.message, 500);
  }
}
