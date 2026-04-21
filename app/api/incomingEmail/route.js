import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Resend inbound: Content-Type form-data veya JSON olabilir
    let payload = {};
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        payload[key] = value;
      }
    } else {
      // Fallback: JSON dene
      try { payload = await request.json(); } catch { payload = {}; }
    }

    console.log("Incoming Email Payload keys:", Object.keys(payload));

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn("Telegram bot token or chat ID is missing");
      return NextResponse.json({ success: false, reason: 'No telegram config' });
    }

    // Resend Inbound farklı field isimlerini kullanabilir
    const from = payload.from || payload.sender || payload.From || "Bilinmeyen Gönderici";
    const subject = payload.subject || payload.Subject || "Konusuz";
    // text, html veya body alanlarından al
    const textContent = payload.text || payload.plain || payload.body || payload.html || null;
    
    // HTML varsa, tag'leri temizle
    const cleanText = textContent 
      ? textContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      : null;
      
    const shortText = cleanText 
      ? (cleanText.length > 600 ? cleanText.slice(0, 600) + '...' : cleanText)
      : '⚠️ E-posta içeriği parse edilemedi. Ham payload: ' + JSON.stringify(payload).slice(0, 200);

    const msg = `📧 *YENİ E-POSTA GELDİ!*\n\n*Kimden:* ${from}\n*Kime:* sinav@turkdunyasi.uz\n*Konu:* ${subject}\n\n*Mesaj:* \n${shortText}`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: TELEGRAM_CHAT_ID, 
        text: msg, 
        parse_mode: 'Markdown' 
      })
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('incomingEmail error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
