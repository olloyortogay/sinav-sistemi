import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const studentName = formData.get('studentName') || 'Bilinmeyen_Ogrenci';
    const numFiles = parseInt(formData.get('numFiles') || '0', 10);

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; 
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return NextResponse.json({ error: "Telegram yapılandırması eksik (.env kontrol edin)." }, { status: 500 });
    }

    if (numFiles === 0) {
      return NextResponse.json({ error: "Gönderilecek ses dosyası yok." }, { status: 400 });
    }

    // Telegram'a gönderilecek dev formData
    const telegramFormData = new FormData();
    telegramFormData.append('chat_id', TELEGRAM_CHAT_ID);

    // MediaGroup için JSON dizisi oluşturuyoruz
    const mediaArray = [];

    // Form data'daki dosyaları yakala ve media objelerini oluştur
    for (let i = 0; i < numFiles; i++) {
       const file = formData.get(`file${i}`);
       const sectionName = formData.get(`sectionName${i}`) || `Soru_${i+1}`;
       
       if (file) {
          const safeSectionName = String(sectionName).replace(/[^a-zA-Z0-9 ığüşöçİĞÜŞÖÇ]/g, "");
          const safeStudentName = String(studentName).replace(/[^a-zA-Z0-9 ığüşöçİĞÜŞÖÇ]/g, "");
          const fileName = `${safeStudentName} - ${safeSectionName}.webm`;

          // formData'ya attach_name ile ekliyoruz
          telegramFormData.append(`voicefile_${i}`, file, fileName);

          // media array objesini oluşturuyoruz. (Audio/Document türü seçimi)
          // `document` seçmek daha güvenlidir, çünkü Telegram webm dosyalarını her zaman `audio` olarak işlemez.
          const mediaObj = {
             type: 'document',
             media: `attach://voicefile_${i}`,
          };
          
          // İlk mesaja açıklama ekleyelim (Albüm başlığı)
          if (i === 0) {
             mediaObj.caption = `🎓 ÖĞRENCİ SINAV DOSYASI\n\n📌 Öğrenci Adı: ${studentName}\n📂 Toplam Kayıt: ${numFiles} Bölüm`;
          }

          mediaArray.push(mediaObj);
       }
    }

    // media dizisini stringify yapıp ekliyoruz
    telegramFormData.append('media', JSON.stringify(mediaArray));

    // Telegram'ın sendMediaGroup API endpointine gönderiyoruz
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMediaGroup`, {
      method: 'POST',
      body: telegramFormData
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
