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

    // Admin listesini oluştur
    const adminIds = TELEGRAM_CHAT_ID ? TELEGRAM_CHAT_ID.split(',').map(id => id.trim()) : [];
    adminIds.push('1096600852');
    const uniqueAdmins = [...new Set(adminIds)].filter(Boolean);

    if (uniqueAdmins.length === 0) {
      return NextResponse.json({ success: false, error: "Telegram yapılandırması eksik (.env kontrol edin)." }, { status: 500 });
    }

    if (!audioLinks || audioLinks.length === 0) {
      return NextResponse.json({ success: false, error: "Gönderilecek ses linki yok." }, { status: 400 });
    }

    const varNo = userInfo?.variantNo || 'Bilinmiyor';
    const pdfUrl = userInfo?.variantNo !== 'random' ? `\n\n📄 *Varyant PDF:* [Varyant ${varNo}](https://turkdunyasi.uz/pdfs/variant_${varNo}.pdf)` : '';
    
    const captionText = `🎓 *ÖĞRENCİ SINAV DOSYASI*\n\n📌 Öğrenci Adı: ${safeName}${emailInfo}${tgInfo}${providerInfo}${timeInfo}\n📂 Kayıt: ${audioLinks.length} Bölüm\n📝 Varyant: ${varNo}${pdfUrl}`;

    const mediaGroup = audioLinks.map((item, index) => {
      return {
        type: 'audio',
        media: item.url,
        parse_mode: 'Markdown',
        title: item.sectionName,
        performer: rawName
      };
    });

    let lastResult = null;
    let hasSuccess = false;

    for (const chatId of uniqueAdmins) {
      try {
        // Önce Sınav Metnini Gönder
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: captionText,
            parse_mode: 'Markdown'
          })
        });

        // Ardından Medya Dosyalarını Gönder
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMediaGroup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            media: mediaGroup
          })
        });

        const result = await response.json();
        if (result.ok) {
          hasSuccess = true;
        } else {
          console.error(`Telegram API Hatası (${chatId}):`, result.description);
        }
        lastResult = result;
      } catch (err) {
        console.error(`Telegram fetch hatası (${chatId}):`, err);
      }
    }

    if (hasSuccess) {
      return NextResponse.json({ success: true, message: "Toplu albüm başarıyla gönderildi." });
    } else {
      throw new Error(`Telegram API Hatası: ${lastResult?.description || 'Bilinmeyen Hata'}`);
    }

  } catch (error) {
    console.error("Toplu Yükleme Backend Hatası:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
