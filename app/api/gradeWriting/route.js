import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { createServiceRoleSupabase, fail, ok } from '../../../lib/api-utils';

export async function POST(request) {
  // GEÇİCİ OLARAK DURDURULDU
  return ok({ 
    score: 0, 
    feedback: "AI değerlendirmesi şu anda geçici olarak kapalıdır. Yazılarınız öğretmenler tarafından incelenecektir." 
  });

  try {
    const body = await request.json();
    const { examResultId, task1Text, task2Text, kompozisyonText, part1Info, part2Info } = body;

    if (!process.env.GEMINI_API_KEY) {
      return fail('GEMINI_KEY_MISSING', 'GEMINI_API_KEY eksik', 500);
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
    const supabase = createServiceRoleSupabase();
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

    return ok({
      score: aiData.totalScore,
      feedback: aiData.feedback_uz
    });
  } catch (e) {
    console.error('gradeWriting error:', e);
    return fail('GRADE_WRITING_FAILED', e.message, 500);
  }
}
