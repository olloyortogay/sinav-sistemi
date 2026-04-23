import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { user, provider } = await request.json();
    
    // Telegram ve Elitedu Tokenleri
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; 
    const ELITEDU_BOT_TOKEN = process.env.ELITEDU_BOT_TOKEN || TELEGRAM_BOT_TOKEN; // Fallback
    const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    // Admin listesini oluştur (çevre değişkeni + yeni eklenen sabit ID)
    const adminIds = ADMIN_CHAT_ID ? ADMIN_CHAT_ID.split(',').map(id => id.trim()) : [];
    adminIds.push('1096600852'); // İstenen yeni admin ID'si
    const uniqueAdmins = [...new Set(adminIds)].filter(Boolean);

    // 1) Admin'e Bildirim Gönder (Elitedu üzerinden)
    if (ELITEDU_BOT_TOKEN && uniqueAdmins.length > 0) {
      // Ekstra bilgileri topla (Supabase'den gelen rawData içindeki veriler)
      let extraInfo = '';
      if (user.rawData) {
        if (provider === 'google') {
          const uMeta = user.rawData.user_metadata || {};
          if (user.rawData.created_at) {
            const createdDate = new Date(user.rawData.created_at).toLocaleString('uz-UZ');
            extraInfo += `📅 Kayıt Tarihi: ${createdDate}\n`;
          }
          if (user.rawData.phone) extraInfo += `📱 Telefon: ${user.rawData.phone}\n`;
          if (uMeta.email_verified) extraInfo += `✅ E-posta Doğrulanmış\n`;
          if (uMeta.avatar_url) extraInfo += `🖼️ [Avatar Linki](${uMeta.avatar_url})\n`;
        } else if (provider === 'telegram') {
          if (user.rawData.photo_url) extraInfo += `🖼️ [Profil Resmi](${user.rawData.photo_url})\n`;
        }
      }

      const extraText = extraInfo ? `\n*Ekstra Bilgiler:*\n${extraInfo}` : '';

      const adminText = `🔔 *Yangi o'quvchi tizimga kirdi!*\n\n👤 Ism: *${user.name}*\n🔑 Usul: *${provider === 'telegram' ? '✈️ Telegram' : '🇬 Google'}*\n${user.email ? `✉️ Email: ${user.email}\n` : ''}${user.telegramUsername ? `🔗 Username: ${user.telegramUsername}\n` : ''}${provider === 'telegram' && user.id ? `🆔 Chat ID: \`${user.id}\`\n` : ''}${extraText}\n⏰ Vaqt: ${new Date().toLocaleString('uz-UZ')}`;
      
      const adminPromises = uniqueAdmins.map(chatId => 
        fetch(`https://api.telegram.org/bot${ELITEDU_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: adminText,
            parse_mode: 'Markdown'
          })
        }).catch(err => console.log(`Admin notify error (elitedu) for ${chatId}:`, err))
      );
      
      await Promise.all(adminPromises);
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
