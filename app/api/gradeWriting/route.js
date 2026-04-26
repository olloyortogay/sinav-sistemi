import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { examResultId, task1Text, task2Text, kompozisyonText, part1Info, part2Info } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY eksik' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            totalScore: { type: SchemaType.INTEGER },
            feedback_uz: { type: SchemaType.STRING },
          },
          required: ["totalScore", "feedback_uz"],
        },
      }
    });

    const prompt = `Sen zorlu ve adil bir Türkçe dili sınav gözetmenisin.
Öğrencinin metnini şu 5 kritere göre değerlendir: 1) Görevin tamamlanması, 2) Gramer, 3) Kelime Dağarcığı, 4) Bütünlük ve Bağlam, 5) İmla ve Noktalama.
Öğrenciye eksiklerini ve nasıl gelişebileceğini anlatan yapıcı bir geribildirim yaz.
DİL KURALI: Çıktı (Feedback ve açıklamalar) %100 ÖZBEKÇE olacaktır! Sadece terimler Türkçe kalabilir.

Soru Senaryoları:
Bölüm 1 Ortak Metin: ${part1Info?.ortakMetin || 'Yok'}
Görev 1.1: ${part1Info?.gorev1_1 || 'Yok'}
Görev 1.2: ${part1Info?.gorev1_2 || 'Yok'}
Kompozisyon: ${part2Info || 'Yok'}

Öğrencinin Yazdığı Metinler:
Görev 1.1: ${task1Text || 'Yazılmamış'}
Görev 1.2: ${task2Text || 'Yazılmamış'}
Kompozisyon: ${kompozisyonText || 'Yazılmamış'}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const aiData = JSON.parse(responseText);

    // Veritabanını Güncelle
    const supabase = getSupabase();
    if (supabase && examResultId) {
      const { error } = await supabase
        .from('exam_results')
        .update({
          ai_score: aiData.totalScore,
          ai_feedback: aiData.feedback_uz
        })
        .eq('id', examResultId);
        
      if (error) console.error("AI Save Error:", error);
    }

    return NextResponse.json({
      success: true,
      score: aiData.totalScore,
      feedback: aiData.feedback_uz
    });
  } catch (e) {
    console.error('gradeWriting error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
