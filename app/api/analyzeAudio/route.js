import { createAnonSupabase, fail, ok } from '../../../lib/api-utils';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(request) {
  try {
    const { audioLinks, resultId } = await request.json();

    if (!audioLinks || audioLinks.length === 0) {
      return fail('AUDIO_LINKS_REQUIRED', 'No audio links provided', 400);
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
      return fail('TRANSCRIPTION_EMPTY', 'Transcription failed or empty', 422);
    }

    // 2. Evaluate using Llama-3
    const evaluationPrompt = `Sen "Türk Dünyası" platformunun yapay zeka destekli Turk tili o'qituvchisisysan. 
Sening vazifang faqat baho berish emas — O'zbek tilidagi talabalarga Turk tili sertifikati (TYS, TÖMER yoki shunga o'xshash) olish uchun yo'l ko'rsatish. 

Quyida talabaning gapirish testidan yozib olingan transkripsiyasi berilgan. Uni diqqat bilan tahlil qil va quyidagi tuzilmada, O'ZBEK TILIDA, QISQA va AMALIY maslаhat ber (3-4 paragraf):

1. **Kuchli tomonlar** — Nima yaxshi chiqdi? (1-2 gap)
2. **Kamchiliklar** — Qaysi grammatik xatolar, so'z boyligi yoki talaffuz muammolari bor? Aniq misollar kel.
3. **Amaliy mashqlar** — Bu kamchilikni tuzatish uchun hoziroq bajara oladigan 2-3 ta mashq yoki til o'rganish usuli tavsiya qil (masalan: kunlik gaplashuv, audio tinglash, lug'at yodlash va h.k.)
4. **Sertifikat uchun eslatma** — Agar bu talaba TYS yoki TÖMER sertifikatiga tayyorlanayotgan bo'lsa, qanday yo'nalishga ko'proq e'tibor bersin?

MУХИМ QOIDALAR:
- Hech qachon "Yapay zeka", "AI" yoki "model" so'zlarini ishlatma — haqiqiy o'qituvchi kabi so'yla
- Agar transkripsiya bo'sh yoki tushunar bo'lmasa, sababini ayt va yana bir urinib ko'rishni tavsiya qil  
- Kelajakda qo'shiladigan Reading, Writing va Listening modullari uchun ham kerakli ko'nikmalarni eslatib o'tishingiz mumkin

Talabaning nutq transkripsiyasi:
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
    const supabase = createAnonSupabase();
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

    return ok({ aiFeedback, transcription: fullTranscription });

  } catch (err) {
    console.error('analyzeAudio error:', err);
    return fail('ANALYZE_AUDIO_FAILED', err.message, 500);
  }
}
