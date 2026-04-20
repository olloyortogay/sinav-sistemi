import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const payload = await request.json();
    console.log("Incoming Email Payload:", payload);

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn("Telegram bot token or chat ID is missing");
      return NextResponse.json({ success: false, reason: 'No telegram config' });
    }

    // Resend Inbound Webhook payload structure
    const from = payload.from || "Bilinmeyen Gönderici";
    const subject = payload.subject || "Konusuz";
    const textContext = payload.text || payload.html || "İçerik Yok";
    
    // Telegram'da çok uzun mesajları keselim
    const shortText = textContext.length > 500 ? textContext.slice(0, 500) + '...' : textContext;

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
