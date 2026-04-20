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

    // Yanıtlanan mesajda "📌 Öğrenci Adı:" ifadesini ara
    const targetText = replyTo.caption || replyTo.text || "";
    const nameMatch = targetText.match(/📌 Öğrenci Adı:\s*(.*)/);
    
    if (!nameMatch) return NextResponse.json({ ok: true });
    
    const studentName = nameMatch[1].trim();
    const scoreText = message.text.trim();
    const score = parseInt(scoreText, 10);
    
    if (isNaN(score)) {
       return NextResponse.json({ ok: true, reason: 'NaN score' });
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

    // Admin'e işlemi onaylayan yanıt dön (Mesajına geri reply)
    if (message.chat.id) {
      const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
             chat_id: message.chat.id, 
             text: `✅ ${studentName} adlı öğrenciye ${score} puan işlendi ve bildirimleri (Mail/TG) yollandı!`, 
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
