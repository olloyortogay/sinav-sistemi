import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// @Elitedu_arizalarbot — Kullanıcı veri toplama webhook'u
// Google ve Telegram ile giriş yapan tüm öğrencileri @olloyortogay'a raporlar.

const ELITEDU_BOT_TOKEN = process.env.ELITEDU_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // @olloyortogay

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function sendToAdmin(text) {
  const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const adminIds = ADMIN_CHAT_ID ? ADMIN_CHAT_ID.split(',').map(id => id.trim()) : [];
  adminIds.push('1096600852');
  const uniqueAdmins = [...new Set(adminIds)].filter(Boolean);

  if (!ELITEDU_BOT_TOKEN || uniqueAdmins.length === 0) return;

  const adminPromises = uniqueAdmins.map(chatId =>
    fetch(`https://api.telegram.org/bot${ELITEDU_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    }).catch(err => console.log(`Admin notify error for ${chatId}:`, err))
  );

  await Promise.all(adminPromises);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const message = body.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat?.id;
    const firstName = message.chat?.first_name || message.from?.first_name || '';
    const lastName = message.chat?.last_name || message.from?.last_name || '';
    const username = message.chat?.username || message.from?.username || '';
    const fullName = `${firstName} ${lastName}`.trim();

    // /start komutuna otomatik karşılık ver
    if (message.text === '/start') {
      await fetch(`https://api.telegram.org/bot${ELITEDU_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `Salom, *${firstName}*! 👋\n\nSiz *Türk Dünyası Sinav* platformiga xush kelibsiz.\n\nSinov natijalari va bildirishnomalar ushbu bot orqali yuboriladi. Hech narsa qilishingiz shart emas — biz siz bilan bog'lanamiz! 🎓`,
          parse_mode: 'Markdown'
        })
      });

      // Admin'e yeni kullanıcı bildirimi gönder
      const text = `🆕 *Yangi foydalanuvchi!*\n\n👤 Ism: *${fullName}*\n🔗 Username: ${username ? '@' + username : 'Yoq'}\n🆔 Chat ID: \`${chatId}\`\n📱 Platforma: Telegram\n⏰ Vaqt: ${new Date().toLocaleString('uz-UZ')}`;
      await sendToAdmin(text);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Elitedu Webhook Error:', err);
    return NextResponse.json({ ok: false, error: err.message });
  }
}

// Bu endpoint aynı zamanda kullanıcı kayıt bildirimlerini de alabilir.
// Sınav tamamlandığında bu bota da bildirim gönderilmesi için
// app/exam/speaking/page.js içinden çağrılabilir.
export async function GET() {
  return NextResponse.json({ ok: true, bot: 'Elitedu_arizalarbot', status: 'active' });
}
