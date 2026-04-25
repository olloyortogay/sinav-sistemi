import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request) {
  try {
    const { userName, userEmail, totalTime, resultId, score, level } = await request.json();

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
      subject: score !== undefined ? `🎉 Seviye Tespit Sınavı Sonucu — ${userName}` : `🎉 Konuşma Sınavı Tamamlandı — ${userName}`,
      html: `
        <!DOCTYPE html>
        <html lang="tr">
        <head><meta charset="UTF-8"/></head>
        <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#fafafa">
          <div style="max-width:600px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(185,28,28,0.08)">
            
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:40px 32px;text-align:center;border-bottom:4px solid #ef4444">
              <div style="display:inline-block;background:white;color:#dc2626;font-size:12px;font-weight:900;letter-spacing:2px;padding:6px 12px;border-radius:20px;margin-bottom:16px;">TÜRK DÜNYASI SINAV MERKEZİ</div>
              <h1 style="color:white;margin:0;font-size:26px;font-weight:800">Tebrikler, ${userName}! 🎉</h1>
              <p style="color:#fecaca;margin-top:8px;font-size:16px">
                ${score !== undefined ? 'Türkçe Seviye Tespit Sınavını Başarıyla Tamamladınız' : 'Türkçe Konuşma Sınavını Başarıyla Tamamladınız'}
              </p>
            </div>

            <!-- Stats -->
            <div style="padding:36px 32px;display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
              ${score !== undefined ? `
                <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:20px 24px;text-align:center;flex:1;min-width:120px">
                  <div style="font-size:32px;font-weight:900;color:#be123c">${score} <span style="font-size:16px;color:#f43f5e">/ 100</span></div>
                  <div style="font-size:13px;color:#e11d48;margin-top:6px;font-weight:bold;text-transform:uppercase">Sınav Puanı</div>
                </div>
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px 24px;text-align:center;flex:1;min-width:120px">
                  <div style="font-size:32px;font-weight:900;color:#1d4ed8">${level || 'A1'}</div>
                  <div style="font-size:13px;color:#2563eb;margin-top:6px;font-weight:bold;text-transform:uppercase">CEFR Seviyesi</div>
                </div>
              ` : `
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 32px;text-align:center;flex:1">
                  <div style="font-size:32px;font-weight:900;color:#16a34a">3 Bölüm</div>
                  <div style="font-size:13px;color:#15803d;margin-top:6px;font-weight:bold;text-transform:uppercase">Tamamlandı</div>
                </div>
              `}
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;text-align:center;flex:1;min-width:120px">
                <div style="font-size:24px;font-weight:900;color:#334155;margin-top:6px">${timeStr}</div>
                <div style="font-size:13px;color:#64748b;margin-top:6px;font-weight:bold;text-transform:uppercase">Toplam Süre</div>
              </div>
            </div>

            <!-- CTA -->
            <div style="padding:0 32px 32px;text-align:center">
              <p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:24px;">
                Türkçenizi daha da geliştirmek ve global bir vizyona sahip olmak ister misiniz?<br/> 
                <strong>Uzman eğitmenlerimizle hızla ilerleme kaydedin.</strong>
              </p>
              <a href="https://turkdunyasi.uz/kurslar" 
                style="display:inline-block;background:#dc2626;color:white;font-weight:bold;padding:16px 36px;border-radius:12px;text-decoration:none;font-size:15px;box-shadow:0 4px 12px rgba(220,38,38,0.3)">
                Kurslara Göz Atın →
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
