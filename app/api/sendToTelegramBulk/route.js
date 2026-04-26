import { NextResponse } from 'next/server';

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
      return NextResponse.json({ success: false, error: 'TELEGRAM_BOT_TOKEN eksik.' }, { status: 500 });
    }
    if (adminIds.length === 0) {
      return NextResponse.json({ success: false, error: 'ADMIN_TELEGRAM_IDS yapılandırması eksik.' }, { status: 500 });
    }
    if (!audioLinks || audioLinks.length === 0) {
      return NextResponse.json({ success: false, error: 'Gönderilecek ses linki yok.' }, { status: 400 });
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

    let hasSuccess = false;
    let lastError = null;

    for (const chatId of adminIds) {
      try {
        // Önce bilgi mesajı
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: captionText, parse_mode: 'Markdown' }),
        });

        // Ardından ses dosyaları
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, media: mediaGroup }),
        });
        const result = await res.json();
        if (result.ok) {
          hasSuccess = true;
        } else {
          lastError = result.description;
          console.error(`sendToTelegramBulk Telegram API Hatası (${chatId}):`, result.description);
        }
      } catch (err) {
        lastError = err.message;
        console.error(`sendToTelegramBulk fetch hatası (${chatId}):`, err);
      }
    }

    if (hasSuccess) {
      return NextResponse.json({ success: true, message: 'Ses dosyaları başarıyla gönderildi.' });
    }
    throw new Error(`Telegram API Hatası: ${lastError || 'Bilinmeyen hata'}`);
  } catch (error) {
    console.error('sendToTelegramBulk hatası:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
