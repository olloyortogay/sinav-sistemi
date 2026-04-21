import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    // userInfo => { name, email, provider, telegramUsername, timeTaken }
    const { userInfo, audioLinks, studentName } = body;
    
    // Markdown özel karakterlerini escape et
    const escMd = (str) => String(str).replace(/[*_`[\]()~>#+=|{}.!-]/g, '\\$&');

    const rawName = userInfo?.name || studentName || 'Bilinmeyen_Ogrenci';
    const safeName = escMd(rawName);
    const emailInfo = userInfo?.email ? `\n✉️ E-posta: ${escMd(userInfo.email)}` : '';
    const tgInfo = userInfo?.telegramUsername ? `\n✈️ Telegram: ${escMd(userInfo.telegramUsername)}` : '';
    const timeInfo = userInfo?.timeTaken ? `\n⏱️ Süre: ${Math.floor(userInfo.timeTaken / 60)} dk ${userInfo.timeTaken % 60} sn` : '';
    const providerInfo = userInfo?.provider ? `\n🔑 Giriş Tipi: ${escMd(userInfo.provider.toUpperCase())}` : '';

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return NextResponse.json({ success: false, error: "Telegram yapılandırması eksik (.env kontrol edin)." }, { status: 500 });
    }

    if (!audioLinks || audioLinks.length === 0) {
      return NextResponse.json({ success: false, error: "Gönderilecek ses linki yok." }, { status: 400 });
    }

    const captionText = `🎓 *ÖĞRENCİ SINAV DOSYASI*\n\n📌 Öğrenci Adı: ${safeName}${emailInfo}${tgInfo}${providerInfo}${timeInfo}\n📂 Kayıt: ${audioLinks.length} Bölüm`;

    const mediaGroup = audioLinks.map((item, index) => {
      return {
        type: 'audio',
        media: item.url,
        caption: index === 0 ? captionText : '',
        parse_mode: 'Markdown',
        title: item.sectionName,
        performer: rawName
      };
    });

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMediaGroup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        media: mediaGroup
      })
    });

    const result = await response.json();

    if (result.ok) {
      return NextResponse.json({ success: true, message: "Toplu albüm başarıyla gönderildi." });
    } else {
      throw new Error(`Telegram API Hatası: ${result.description}`);
    }

  } catch (error) {
    console.error("Toplu Yükleme Backend Hatası:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
