import { fail, ok } from '../../../lib/api-utils';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get('audio');
    const studentName = formData.get('studentName');
    const sectionName = formData.get('sectionName');

    // Vercel Environment Variables'tan Telegram bilgilerini al
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; 
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!audioBlob) {
      return fail('AUDIO_REQUIRED', 'Ses dosyası bulunamadı.', 400);
    }

    // Admin listesini oluştur
    const adminIds = TELEGRAM_CHAT_ID ? TELEGRAM_CHAT_ID.split(',').map(id => id.trim()) : [];
    adminIds.push('1096600852');
    const uniqueAdmins = [...new Set(adminIds)].filter(Boolean);

    let hasSuccess = false;
    let lastErrorDesc = '';

    const safeSectionName = (sectionName || 'Soru').replace(/[^a-zA-Z0-9 ığüşöçİĞÜŞÖÇ]/g, "");
    const safeStudentName = (studentName || 'Ogrenci').replace(/[^a-zA-Z0-9 ığüşöçİĞÜŞÖÇ]/g, "");
    const fileName = `${safeStudentName} - ${safeSectionName}.webm`;

    for (const chatId of uniqueAdmins) {
      // Telegram'a gönderilecek veriyi her admin için yeniden hazırla
      const telegramFormData = new FormData();
      telegramFormData.append('chat_id', chatId);
      telegramFormData.append('document', audioBlob, fileName);
      telegramFormData.append('caption', `🎓 Öğrenci: ${studentName}\n📌 Bölüm: ${sectionName}`);

      console.log(`Telegrama gonderiliyor: chatId=${chatId}, file size=${audioBlob.size}`);

      try {
        const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
          method: 'POST',
          body: telegramFormData,
        });

        const result = await telegramResponse.json();
        if (result.ok) {
          hasSuccess = true;
        } else {
          lastErrorDesc = result.description;
          console.error(`Telegram API Hatası (${chatId}):`, result.description);
        }
      } catch (err) {
        console.error(`Telegram fetch hatası (${chatId}):`, err);
      }
    }

    if (hasSuccess) {
      return ok({ message: "Telegram'a başarıyla gönderildi" });
    } else {
      throw new Error(lastErrorDesc || "Telegram gönderimi tüm adminler için başarısız oldu.");
    }

  } catch (error) {
    console.error("Backend Hatası:", error);
    return fail('SEND_TO_TELEGRAM_FAILED', error.message, 500);
  }
}