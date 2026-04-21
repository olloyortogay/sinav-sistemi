import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { user, provider } = await request.json();
    
    // Telegram ve Elitedu Tokenleri
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; 
    const ELITEDU_BOT_TOKEN = process.env.ELITEDU_BOT_TOKEN;
    const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // 1) Admin'e Bildirim Gönder (Elitedu üzerinden)
    if (ELITEDU_BOT_TOKEN && ADMIN_CHAT_ID) {
      const adminText = `🔔 *Yangi o'quvchi tizimga kirdi!*\n\n👤 Ism: *${user.name}*\n🔑 Usul: *${provider === 'telegram' ? '✈️ Telegram' : '🇬 Google'}*\n${user.email ? `✉️ Email: ${user.email}\n` : ''}${user.telegramUsername ? `🔗 Username: ${user.telegramUsername}\n` : ''}${provider === 'telegram' && user.id ? `🆔 Chat ID: \`${user.id}\`\n` : ''}⏰ Vaqt: ${new Date().toLocaleString('uz-UZ')}`;
      
      await fetch(`https://api.telegram.org/bot${ELITEDU_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text: adminText,
          parse_mode: 'Markdown'
        })
      }).catch(err => console.log('Admin notify error (elitedu):', err));
    }

    // 2) Öğrenciye Direkt Hoşgeldin Mesajı Gönder (Eğer Telegram hesabıyla girdiyse)
    if (provider === 'telegram' && user.id && TELEGRAM_BOT_TOKEN) {
      const welcomeText = `Salom, *${user.name}*! 👋\n\nSiz *Türk Dünyası Sinav* platformiga xush kelibsiz.\n\nSinov natijalari va bildirishnomalar ushbu bot orqali yuboriladi. Hech narsa qilishingiz shart emas — biz siz bilan bog'lanamiz! 🎓`;
      
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: user.id,
          text: welcomeText,
          parse_mode: 'Markdown'
        })
      }).catch(err => console.log('Student welcome notify error:', err));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('NotifyLogin Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
