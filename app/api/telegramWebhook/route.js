import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// E-posta doğrudan Resend API ile gönder (kendi API'sine HTTP çağrısı değil)
async function sendEmailViaResend({ userName, userEmail, totalTime, score }) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY || !userEmail) return;

  const mins = Math.floor(totalTime / 60);
  const secs = totalTime % 60;
  const timeStr = mins > 0 ? `${mins} daqiqa ${secs} soniya` : `${secs} soniya`;

  const html = `
    <!DOCTYPE html>
    <html lang="uz">
    <head><meta charset="UTF-8"/></head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#fafafa">
      <div style="max-width:600px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(185,28,28,0.08)">
        <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:40px 32px;text-align:center">
          <div style="display:inline-block;background:white;color:#dc2626;font-size:12px;font-weight:900;letter-spacing:2px;padding:6px 12px;border-radius:20px;margin-bottom:16px;">TÜRK DÜNYASI IMTIHON MARKAZI</div>
          <h1 style="color:white;margin:0;font-size:26px;font-weight:800">Tabriklaymiz, ${userName}! 🎉</h1>
          <p style="color:#fecaca;margin-top:8px;font-size:16px">Turk tili gapirish imtihonini muvaffaqiyatli yakunladingiz</p>
        </div>
        <div style="padding:36px 32px;display:flex;gap:16px;justify-content:center">
          <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:20px 32px;text-align:center;flex:1">
            <div style="font-size:40px;font-weight:900;color:#be123c">${score}</div>
            <div style="font-size:13px;color:#e11d48;margin-top:6px;font-weight:bold;text-transform:uppercase">Ball</div>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 32px;text-align:center;flex:1">
            <div style="font-size:28px;font-weight:900;color:#334155">${timeStr}</div>
            <div style="font-size:13px;color:#64748b;margin-top:6px;font-weight:bold;text-transform:uppercase">Umumiy vaqt</div>
          </div>
        </div>
        <div style="padding:0 32px 24px;text-align:center">
          <p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:20px;">
            Natijangizni batafsil ko'rish va rivojlanish tavsiyalari uchun shaxsiy kabinetingizni tekshiring.<br/>
            <strong>Turk tilini yanada chuqur o'rganing!</strong>
          </p>
          <a href="https://sinav.turkdunyasi.uz/profile"
            style="display:inline-block;background:#dc2626;color:white;font-weight:bold;padding:16px 36px;border-radius:12px;text-decoration:none;font-size:15px;">
            Shaxsiy Kabinetni Ko'rish →
          </a>
        </div>
        <div style="margin:0 32px 32px;background:#fef9c3;border:1px solid #fbbf24;border-radius:12px;padding:20px;text-align:center">
          <p style="font-weight:700;color:#92400e;margin:0 0 8px">🎁 Sizga maxsus taklif</p>
          <p style="color:#78350f;margin:0;font-size:14px">
            Turk tili kurslariga <strong>15% chegirma</strong> bilan yozing. Kod: <strong>SINAV15</strong>
          </p>
        </div>
        <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
          <p style="color:#9ca3af;font-size:12px;margin:0">Türk Dünyası | turkdunyasi.uz | sinav@turkdunyasi.uz</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Türk Dünyası <sinav@turkdunyasi.uz>',
        to: [userEmail],
        subject: `🎉 Sinov natijangiz — ${userName} (Ball: ${score})`,
        html
      })
    });
    const result = await res.json();
    if (result.id) {
      console.log('Email sent successfully, id:', result.id);
    } else {
      console.error('Email send failed:', JSON.stringify(result));
    }
  } catch (e) {
    console.error('Email send exception:', e.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("Telegram Webhook in:", JSON.stringify(body).slice(0, 300));
    
    const message = body.message;
    if (!message || !message.text) return NextResponse.json({ ok: true });

    const replyTo = message.reply_to_message;

    // /start <email_veya_id> → Telegram hesabı bağla
    if (message.text.startsWith('/start ')) {
      const parts = message.text.split(' ');
      if (parts.length > 1) {
        const userIdOrEmail = parts[1].trim();
        const supabase = getSupabase();
        if (supabase) {
          await supabase.from('exam_results')
            .update({ telegram_chat_id: String(message.chat.id) })
            .or(`user_email.eq.${userIdOrEmail},id.eq.${userIdOrEmail}`);
            
          const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              chat_id: message.chat.id, 
              text: `✅ *Telegram hisobingiz muvaffaqiyatli ulandi!*\n\nSinov natijalaringiz va xabarnomalar endi shu bot orqali yuboriladi.`, 
              parse_mode: 'Markdown' 
            })
          });
          return NextResponse.json({ ok: true, reason: 'Account linked' });
        }
      }
    }

    if (!replyTo) return NextResponse.json({ ok: true });

    // Öğrenci adını audio performer'dan veya caption'dan al
    let studentName = null;
    let captionEmail = null;

    if (replyTo.audio?.performer) {
      studentName = replyTo.audio.performer.trim();
    } else {
      const targetText = replyTo.caption || replyTo.text || '';
      const nameMatch = targetText.match(/(?:Öğrenci Adı|Ism):\s*([^\n\r]+)/i);
      if (nameMatch) studentName = nameMatch[1].trim();
      
      // E-postayı mesajdan (caption) kurtarmaya çalışalım (db'de boş olma ihtimaline karşı)
      const emailMatch = targetText.match(/(?:E-posta|Email):\s*([^\n\r]+)/i);
      if (emailMatch) captionEmail = emailMatch[1].trim().replace(/\\/g, ''); 
    }

    // Eğer audio performer varsa, caption'u yine de asıl mesajdan kontrol edelim (aynı mesajın caption'ı)
    if (!captionEmail && replyTo.caption) {
       const emMatch = replyTo.caption.match(/(?:E-posta|Email):\s*([^\n\r]+)/i);
       if (emMatch) captionEmail = emMatch[1].trim().replace(/\\/g, ''); 
    }
    
    const scoreText = message.text.trim();
    const score = parseInt(scoreText, 10);
    
    if (!studentName || isNaN(score) || score < 0 || score > 100) {
      console.log('Skip: name=', studentName, 'score=', score);
      return NextResponse.json({ ok: true, reason: 'No student name or invalid score' });
    }

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ ok: true, reason: 'No DB' });

    // İsme göre arama — ILIKE ile büyük/küçük harf ve boşluk farkı tolere edilir
    const { data: results, error } = await supabase
      .from('exam_results')
      .select('*')
      .ilike('user_name', `%${studentName}%`)
      .order('completed_at', { ascending: false })
      .limit(1);

    if (error || !results || results.length === 0) {
      console.log('Student not found:', studentName, '| DB error:', error?.message);
      // Admin'e bilgi ver
      const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: message.chat.id, 
          text: `❌ Öğrenci bulunamadı: "${studentName}"\nDB'de kayıt yok veya isim uyuşmuyor.`,
          reply_to_message_id: message.message_id
        })
      });
      return NextResponse.json({ ok: true, reason: 'Not found in DB' });
    }
    
    const targetExam = results[0];
    console.log('Found exam:', targetExam.id, '| email:', targetExam.user_email, '| tg:', targetExam.telegram_chat_id);

    // Puanı güncelle
    const { error: updateError } = await supabase
      .from('exam_results')
      .update({ score })
      .eq('id', targetExam.id);

    if (updateError) {
      console.error('Score update failed:', updateError.message);
    } else {
      console.log('Score updated to', score, 'for exam', targetExam.id);
    }

    // Öğrenciye Telegram bildirimi
    if (targetExam.telegram_chat_id) {
      const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      const profileUrl = 'https://sinav.turkdunyasi.uz/profile';
      const msg = `🎉 *Sinov natijangiz e'lon qilindi!*\n\nSalom ${targetExam.user_name}, gapirish sinovingiz baholandi.\n\n🏆 *Berilgan ball:* ${score}\n\nBatafsil natijalar uchun [Shaxsiy kabinetingizni](${profileUrl}) ko'ring.`;
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: targetExam.telegram_chat_id, text: msg, parse_mode: 'Markdown' })
      }).catch(e => console.log('TG student notify err:', e.message));
    }

    // E-posta doğrudan Resend ile gönder (db'de yoksa ama mesajda varsa oradan al)
    const emailToSend = targetExam.user_email || captionEmail;
    
    if (emailToSend) {
      await sendEmailViaResend({
        userName: targetExam.user_name,
        userEmail: emailToSend,
        totalTime: targetExam.total_time,
        score
      });
      
      // Eğer DB'de yoktuysa ama caption'da bulduysak, eksik veriyi DB'de onar
      if (!targetExam.user_email) {
        await supabase.from('exam_results').update({ user_email: emailToSend }).eq('id', targetExam.id);
      }
    }

    // Admin'e onay mesajı
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const foundEmail = emailToSend ? `✉️ ${emailToSend}` : '(email yok)';
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: message.chat.id, 
        text: `✅ Puan verildi! (${targetExam.user_name}: ${score}) 🏆\n${foundEmail}`, 
        reply_to_message_id: message.message_id 
      })
    });

    return NextResponse.json({ ok: true, success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ ok: false, error: error.message });
  }
}
