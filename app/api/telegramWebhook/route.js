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
       const msg = `🎉 *Sınav Sonucunuz Açıklandı!*\n\nMerhaba ${studentName}, Konuşma sınavınız değerlendirildi.\n\n🏆 *Verilen Puan:* ${score}\n\nDetaylı sonuçlar için [Öğrenci Panelinizi](${process.env.NEXT_PUBLIC_APP_URL}/profile) ziyaret edebilirsiniz.`;
       await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ chat_id: targetExam.telegram_chat_id, text: msg, parse_mode: 'Markdown' })
       });
    }

    // E-posta gönderimini tetikle
    if (targetExam.user_email && process.env.RESEND_API_KEY) {
      const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://sinav.turkdunyasi.uz';
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
