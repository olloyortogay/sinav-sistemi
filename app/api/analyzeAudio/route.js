import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(request) {
  try {
    const { audioLinks, resultId } = await request.json();

    if (!audioLinks || audioLinks.length === 0) {
      return NextResponse.json({ success: false, error: "No audio links provided" });
    }

    let fullTranscription = "";

    // 1. Download and Transcribe each audio
    for (const item of audioLinks) {
      if (!item.url) continue;

      try {
        // Download blob
        const audioRes = await fetch(item.url);
        if (!audioRes.ok) continue;
        const blob = await audioRes.blob();

        // Convert to File/FormData for Groq
        const formData = new FormData();
        formData.append("file", blob, "audio.webm");
        formData.append("model", "whisper-large-v3");
        formData.append("language", "tr");

        const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`
          },
          body: formData
        });

        const groqData = await groqRes.json();
        if (groqData.text) {
          fullTranscription += `[${item.sectionName}]: ${groqData.text}\n`;
        }
      } catch (e) {
        console.error("Transcribe error for url:", item.url, e);
      }
    }

    if (!fullTranscription.trim()) {
      return NextResponse.json({ success: false, error: "Transcription failed or empty" });
    }

    // 2. Evaluate using Llama-3
    const evaluationPrompt = `Sen profesyonel bir Türkçe Dil Sınavı eğitmenisin. Öğrencinin konuştuğu aşağıdaki transkripti incele. 
Gramer hatalarını, kelime eksikliklerini ve genel ifade yeteneğini O'zbek tilida (Özbekçe) nazik bir dille değerlendir. Kısa, net ve yapıcı (2-3 paragraf) bir rapor hazırla. Asla yapay zeka olduğundan bahsetme, gerçek bir hoca gibi konuş.

Öğrencinin Konuşması:
${fullTranscription}`;

    const completionRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // Daha hızlı ve kararlı
        messages: [{ role: "user", content: evaluationPrompt }],
        temperature: 0.5
      })
    });

    const completionData = await completionRes.json();
    const aiFeedback = completionData.choices?.[0]?.message?.content || ("Analiz jarayonida xatolik: " + (completionData.error?.message || "xato (limit tugagan bo'lishi mumkin)"));

    // 3. Save to Supabase exam_results exactly into the 'ai_feedback' column if it exists,
    // otherwise we save it as ai_feedback inside 'sections' JSONB to be safe from Schema errors.
    const supabase = getSupabase();
    if (supabase && resultId) {
      // First fetch the old sections to merge
      const { data: oldData } = await supabase.from('exam_results').select('sections').eq('id', resultId).single();
      const updatedSections = { ...(oldData?.sections || {}), ai_feedback: aiFeedback, transcription: fullTranscription };
      
      const { error } = await supabase
        .from('exam_results')
        .update({ sections: updatedSections })
        .eq('id', resultId);

      if (error) console.error("Could not save ai_feedback to DB:", error);
    }

    return NextResponse.json({ success: true, aiFeedback, transcription: fullTranscription });

  } catch (err) {
    console.error('analyzeAudio error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
