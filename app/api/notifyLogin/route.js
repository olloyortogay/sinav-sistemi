import { fail, ok } from '../../../lib/api-utils';

/**
 * Tüm admin Telegram ID'lerini ADMIN_TELEGRAM_IDS env değişkeninden okur.
 * Virgülle ayrılmış format: "1247388381,1096600852"
 */
function getAdminIds() {
  const raw = process.env.ADMIN_TELEGRAM_IDS || process.env.TELEGRAM_CHAT_ID || '';
  return [...new Set([...raw.split(',').map(id => id.trim()).filter(Boolean), '1247388381', '1096600852'])];
}

async function sendTelegramMessageStrict(botToken, payload, context) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let result = null;
  try {
    result = await response.json();
  } catch (parseError) {
    console.error(`[notifyLogin] ${context} json parse failed`, parseError);
    throw new Error(`${context}: Telegram response parse failed`);
  }

  if (!response.ok || !result?.ok) {
    const reason = result?.description || `HTTP_${response.status}`;
    console.error(`[notifyLogin] ${context} failed`, {
      status: response.status,
      statusText: response.statusText,
      reason,
      result,
    });
    throw new Error(`${context}: ${reason}`);
  }

  return result;
}

export async function POST(request) {
  try {
    const { user, provider } = await request.json();

    const BOT_TOKEN = process.env.ELITEDU_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const MAIN_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const adminIds = getAdminIds();

    // ── 1. Tüm adminlere bildirim ──────────────────────────────────────────
    if (BOT_TOKEN && adminIds.length > 0) {
      let extraInfo = '';
      if (user.rawData) {
        if (provider === 'google') {
          const uMeta = user.rawData.user_metadata || {};
          if (user.rawData.created_at) {
            extraInfo += `📅 Kayıt: ${new Date(user.rawData.created_at).toLocaleString('uz-UZ')}\n`;
          }
          if (user.rawData.phone) extraInfo += `📱 Tel: ${user.rawData.phone}\n`;
          if (uMeta.email_verified) extraInfo += `✅ E-posta doğrulanmış\n`;
          if (uMeta.avatar_url) extraInfo += `🖼️ [Avatar](${uMeta.avatar_url})\n`;
        } else if (provider === 'telegram') {
          if (user.rawData.photo_url) extraInfo += `🖼️ [Profil Resmi](${user.rawData.photo_url})\n`;
        }
      }

      const adminText =
        `🔔 *Yangi o'quvchi tizimga kirdi!*\n\n` +
        `👤 Ism: *${user.name}*\n` +
        `🔑 Usul: *${provider === 'telegram' ? '✈️ Telegram' : '🇬 Google'}*\n` +
        (user.email ? `✉️ Email: ${user.email}\n` : '') +
        (user.telegramUsername ? `🔗 Username: ${user.telegramUsername}\n` : '') +
        (provider === 'telegram' && user.id ? `🆔 Chat ID: \`${user.id}\`\n` : '') +
        (extraInfo ? `\n*Detaylar:*\n${extraInfo}` : '') +
        `\n⏰ Vaqt: ${new Date().toLocaleString('uz-UZ')}`;

      await Promise.all(
        adminIds.map((chatId) =>
          sendTelegramMessageStrict(
            BOT_TOKEN,
            { chat_id: chatId, text: adminText, parse_mode: 'Markdown' },
            `admin-notify chat_id=${chatId}`
          )
        )
      );
    }

    // ── 2. Telegram kullanıcısına hoşgeldin mesajı ─────────────────────────
    if (provider === 'telegram' && user.id && MAIN_BOT_TOKEN) {
      const welcomeText =
        `Salom, *${user.name}*! 👋\n\n` +
        `Siz *Türk Dünyası Sinav* platformiga xush kelibsiz.\n\n` +
        `Sinov natijalari va bildirishnomalar ushbu bot orqali yuboriladi. ` +
        `Hech narsa qilishingiz shart emas — biz siz bilan bog'lanamiz! 🎓`;

      await sendTelegramMessageStrict(
        MAIN_BOT_TOKEN,
        { chat_id: user.id, text: welcomeText, parse_mode: 'Markdown' },
        `welcome-notify chat_id=${user.id}`
      );
    }

    return ok({ notified: true });
  } catch (err) {
    console.error('notifyLogin error:', err);
    return fail('NOTIFY_LOGIN_FAILED', err.message, 500);
  }
}
