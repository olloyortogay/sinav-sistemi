import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("Telegram Webhook in:", body);
    
    // Yalnızca mesajları al
    const message = body.message;
    if (!message || !message.text) return NextResponse.json({ ok: true });

    // Hedef mesajın bir "reply" (yanıt) olduğundan emin ol
    const replyTo = message.reply_to_message;

    // EĞER KULLANICI PROFİLDEN "/start <user_id>" İLE GELDİYSE HESABI BAĞLA
    if (message.text && message.text.startsWith('/start ')) {
      const parts = message.text.split(' ');
      if (parts.length > 1) {
        const userIdOrEmail = parts[1].trim();
        const supabase = getSupabase();
        if (supabase) {
          // Öğrencinin girmiş olduğu ve telegram_chat_id'si boş olan kayıtlarına telegram ID ekleyelim
          // Profil sayfası userId veya email'e göre çalışabilir. Biz userEmail veya userID üzerinden güncelleme yapmalıyız.
          // Güvenlik ve basitlik açısından son 1 günde oluşturulmuş kayıtlarını da bağlayabiliriz.
          await supabase.from('exam_results')
            .update({ telegram_chat_id: String(message.chat.id) })
            .or(`user_email.eq.${userIdOrEmail},id.eq.${userIdOrEmail}`)
            
          const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              chat_id: message.chat.id, 
              text: `✅ *Telegram hisobingiz muvaffaqiyatli ulandi!*\n\nSizning sinov natijalaringiz va xabarnomalar endi shu bot orqali yuboriladi. / Telegram hesabınız başarıyla bağlandı! Sonuçlarınız buradan iletilecektir.`, 
              parse_mode: 'Markdown' 
            })
          });
          return NextResponse.json({ ok: true, reason: 'Account linked' });
        }
      }
    }

    if (!replyTo) return NextResponse.json({ ok: true });

    // 1) Telefondan veya PC'den albümdeki sese reply yapıldığında
    //    Eğer yanıtlanan mesaj bir "audio" ise, "performer" içinde öğrenci adı vardır!
    let studentName = null;
    if (replyTo.audio && replyTo.audio.performer) {
      studentName = replyTo.audio.performer.trim();
    } else {
      // 2) Eğer caption'a metin reply edilmişse (eski sistem fallback)
      const targetText = replyTo.caption || replyTo.text || "";
      const nameMatch = targetText.match(/Öğrenci Adı:\s*([^\n\r]+)/i);
      if (nameMatch) {
         studentName = nameMatch[1].trim();
      }
    }
    
    // Mesaj testini geç: Sadece sayı da girilmiş olabilir
    const scoreText = message.text.trim();
    const score = parseInt(scoreText, 10);
    
    if (!studentName || isNaN(score)) {
       return NextResponse.json({ ok: true, reason: 'No student name or invalid score' });
    }

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ ok: true, reason: 'No DB' });

    // Puan girilmemiş en son sınavını bul
    const { data: results, error } = await supabase
      .from('exam_results')
      .select('*')
      .eq('user_name', studentName)
      .order('completed_at', { ascending: false })
      .limit(1);

    if (error || !results || results.length === 0) {
      console.log("Student not found for score update:", studentName);
      return NextResponse.json({ ok: true, reason: 'Not found in DB' });
    }
    
    const targetExam = results[0];

    // Puanı güncelle
    await supabase.from('exam_results').update({ score }).eq('id', targetExam.id);

    // Öğrenciye Telegram üzerinden bildirim at (Eğer telegram hesabı bağlıysa)
    if (targetExam.telegram_chat_id) {
       const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
       const profileUrl = 'https://sinav.turkdunyasi.uz/profile';
       const msg = `🎉 *Sinov natijangiz e'lon qilindi!*\n\nSalom ${studentName}, gapirish sinovingiz baholandi.\n\n🏆 *Berilgan ball:* ${score}\n\nBatafsil natijalar uchun [Shaxsiy kabinetingizni](${profileUrl}) ko'ring.`;
       await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ chat_id: targetExam.telegram_chat_id, text: msg, parse_mode: 'Markdown' })
       });
    }

    // E-posta gönderimini tetikle (her zaman sabit URL kullan, origin header webhook'ta boş olabilir)
    if (targetExam.user_email && process.env.RESEND_API_KEY) {
      const baseUrl = 'https://sinav.turkdunyasi.uz';
      await fetch(`${baseUrl}/api/sendResultEmail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           userName: studentName, 
           userEmail: targetExam.user_email, 
           totalTime: targetExam.total_time, 
           score 
        })
      }).catch(e => console.log("Webhook Email Err:", e));
    }

    // Puan başarıyla verildiğinde admine Geri Dönüş
    if (message.chat.id) {
      const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
             chat_id: message.chat.id, 
             text: `Puan başarıyla verildi! (${studentName}: ${score}) 🏆`, 
             reply_to_message_id: message.message_id 
         })
       });
    }

    return NextResponse.json({ ok: true, success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ ok: false, error: error.message });
  }
}
