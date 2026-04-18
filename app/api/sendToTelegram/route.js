import { NextResponse } from 'next/server';

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
      return NextResponse.json({ error: "Ses dosyası bulunamadı." }, { status: 400 });
    }

    // Telegram'a gönderilecek veriyi hazırla
    const telegramFormData = new FormData();
    telegramFormData.append('chat_id', TELEGRAM_CHAT_ID);
    
    const safeSectionName = (sectionName || 'Soru').replace(/[^a-zA-Z0-9 ığüşöçİĞÜŞÖÇ]/g, "");
    const safeStudentName = (studentName || 'Ogrenci').replace(/[^a-zA-Z0-9 ığüşöçİĞÜŞÖÇ]/g, "");
    const fileName = `${safeStudentName} - ${safeSectionName}.webm`;
    
    telegramFormData.append('document', audioBlob, fileName);
    telegramFormData.append('caption', `🎓 Öğrenci: ${studentName}\n📌 Bölüm: ${sectionName}`);

    console.log(`Telegrama gonderiliyor: chatId=${TELEGRAM_CHAT_ID}, file size=${audioBlob.size}`);

    // Telegram API'ye gönder
    const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
      method: 'POST',
      body: telegramFormData,
    });

    const result = await telegramResponse.json();

    if (result.ok) {
      return NextResponse.json({ success: true, message: "Telegram'a başarıyla gönderildi" });
    } else {
      throw new Error(result.description);
    }

  } catch (error) {
    console.error("Backend Hatası:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}