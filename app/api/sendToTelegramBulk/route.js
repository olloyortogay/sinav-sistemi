import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { studentName, audioLinks } = body;

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return NextResponse.json({ success: false, error: "Telegram yapılandırması eksik (.env kontrol edin)." }, { status: 500 });
    }

    if (!audioLinks || audioLinks.length === 0) {
      return NextResponse.json({ success: false, error: "Gönderilecek ses linki yok." }, { status: 400 });
    }

    const mediaGroup = audioLinks.map((item, index) => {
      return {
        type: 'audio',
        media: item.url,
        caption: index === 0 ? `🎓 ÖĞRENCİ SINAV DOSYASI\n\n📌 Öğrenci Adı: ${studentName}\n📂 Toplam Kayıt: ${audioLinks.length} Bölüm` : '',
        parse_mode: 'HTML',
        title: item.sectionName,
        performer: studentName
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
