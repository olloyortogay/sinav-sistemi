import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request) {
  try {
    const { userName, userEmail, totalTime, resultId, score } = await request.json();

    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set — skipping email');
      return NextResponse.json({ success: true, sent: false });
    }

    const resend   = new Resend(process.env.RESEND_API_KEY);
    const mins     = Math.floor(totalTime / 60);
    const secs     = totalTime % 60;
    const timeStr  = mins > 0 ? `${mins} dakika ${secs} saniye` : `${secs} saniye`;
    const resultUrl = resultId
      ? `${process.env.NEXT_PUBLIC_APP_URL}/results/${resultId}`
      : `${process.env.NEXT_PUBLIC_APP_URL}`;

    const { error } = await resend.emails.send({
      from: 'Türk Dünyası <sinav@turkdunyasi.uz>',
      to:   [userEmail],
      subject: score !== undefined ? `🎉 Sınav Sonucu ve Puanınız — ${userName}` : `🎉 Konuşma Sınavı Tamamlandı — ${userName}`,
      html: `
        <!DOCTYPE html>
        <html lang="tr">
        <head><meta charset="UTF-8"/></head>
        <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f0f4ff">
          <div style="max-width:600px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
            
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#1B52B3,#3b82f6);padding:40px 32px;text-align:center">
              <img src="https://turkdunyasi.uz/logo.webp" width="80" style="border-radius:50%;margin-bottom:16px"/>
              <h1 style="color:white;margin:0;font-size:24px">Tebrikler, ${userName}! 🎉</h1>
              <p style="color:#bfdbfe;margin-top:8px;font-size:15px">Türkçe Konuşma Sınavını Başarıyla Tamamladınız</p>
            </div>

            <!-- Stats -->
            <div style="padding:32px;display:flex;gap:16px;justify-content:center">
              ${score !== undefined ? `
                <div style="background:#fefce8;border:1px solid #fde047;border-radius:12px;padding:20px 32px;text-align:center;flex:1">
                  <div style="font-size:28px;font-weight:900;color:#854d0e">${score}</div>
                  <div style="font-size:13px;color:#a16207;margin-top:4px">Sınav Puanı</div>
                </div>
              ` : `
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 32px;text-align:center;flex:1">
                  <div style="font-size:28px;font-weight:900;color:#16a34a">3 Bölüm</div>
                  <div style="font-size:13px;color:#6b7280;margin-top:4px">Tamamlandı</div>
                </div>
              `}
              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px 32px;text-align:center;flex:1">
                <div style="font-size:28px;font-weight:900;color:#1B52B3">${timeStr}</div>
                <div style="font-size:13px;color:#6b7280;margin-top:4px">Toplam Süre</div>
              </div>
            </div>

            <!-- CTA -->
            <div style="padding:0 32px 32px;text-align:center">
              <p style="color:#374151;font-size:15px;line-height:1.6">
                Türkçenizi daha da geliştirmek ister misiniz? 
                Özel kurslarımızla hızla ilerleme kaydedin.
              </p>
              <a href="https://turkdunyasi.uz/kurslar" 
                style="display:inline-block;background:#1B52B3;color:white;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;margin-top:8px;font-size:15px">
                Kurslara Göz At →
              </a>
            </div>

            <!-- Discount  -->  
            <div style="margin:0 32px 32px;background:#fef9c3;border:1px solid #fbbf24;border-radius:12px;padding:20px;text-align:center">
              <p style="font-weight:700;color:#92400e;margin:0 0 8px">🎁 Size Özel Teklif</p>
              <p style="color:#78350f;margin:0;font-size:14px">
                İlk ay <strong>%15 indirimle</strong> ders alın. Kod: <strong>SINAV15</strong>
              </p>
            </div>

            <!-- Footer -->
            <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
              <p style="color:#9ca3af;font-size:12px;margin:0">
                Türk Dünyası | turkdunyasi.uz | sinav@turkdunyasi.uz
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, sent: true });
  } catch (err) {
    console.error('sendResultEmail error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
