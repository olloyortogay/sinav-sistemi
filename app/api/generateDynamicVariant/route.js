import { examBank } from '../../data/questions';
import { createServiceRoleSupabase, fail, ok } from '../../../lib/api-utils';

export async function GET(request) {
  try {
    const supabase = createServiceRoleSupabase();
    if (!supabase) return fail('SUPABASE_CONFIG_MISSING', 'Supabase service role key is missing', 500);

    const { data, error } = await supabase.from('question_pools').select('pool_data').limit(1).maybeSingle();
    
    if (error || !data || !data.pool_data) {
      return fail('DYNAMIC_POOL_NOT_FOUND', 'Havuz bulunamadı veya boş.', 404);
    }

    const pool = data.pool_data;

    // Helper for random selection
    const getRandomItem = (arr) => arr && arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

    const q1 = getRandomItem(pool.part1_q1_pool) || "Örnek Soru 1 (Havuz Boş)";
    const q2 = getRandomItem(pool.part1_q2_pool) || "Örnek Soru 2 (Havuz Boş)";
    const q3 = getRandomItem(pool.part1_q3_pool) || "Örnek Soru 3 (Havuz Boş)";
    const p3Package = getRandomItem(pool.part3_pool) || { Konu: "Örnek Konu", Lehine: "Örnek Argüman", Aleyhine: "Örnek Argüman" };

    // Part 1.2 and Part 2 Random from existing static examBank
    const p12Scenario = getRandomItem(examBank.part1_2);
    const p2Scenario = getRandomItem(examBank.part2);

    // Build the Variant Array
    const finalQuestions = [];
    let globalId = 1;

    // --- 1. BÖLÜM ---
    finalQuestions.push({ type: 'transition', id: globalId++, title: '1. Bölüm' });
    [q1, q2, q3].forEach((q, idx) => {
      finalQuestions.push({
        type: 'question', id: globalId++, section: `1. Bölüm ${idx + 1}. Soru`,
        question: q, prepTime: 5, speakTime: 30, hasAudioBtn: true,
      });
    });

    // --- 1.2. BÖLÜM ---
    finalQuestions.push({ type: 'transition', id: globalId++, title: '1.2. Bölüm' });
    p12Scenario.questions.forEach((qData, idx) => {
      finalQuestions.push({
        type: 'question', id: globalId++, section: `1.2. Bölüm ${idx + 4}. Soru`,
        question: qData.q, image_url: idx === 0 ? p12Scenario.image_url : null,
        prepTime: 10, speakTime: 45, hasAudioBtn: true,
      });
    });

    // --- 2. BÖLÜM ---
    finalQuestions.push({ type: 'transition', id: globalId++, title: '2. Bölüm' });
    finalQuestions.push({
      type: 'question', id: globalId++, section: '2. Bölüm',
      image_url: p2Scenario.image_url, bullets: p2Scenario.bullets,
      prepTime: 60, speakTime: 120, hasAudioBtn: false,
    });

    // --- 3. BÖLÜM ---
    finalQuestions.push({ type: 'transition', id: globalId++, title: '3. Bölüm' });
    // Convert package to the old format
    const lists = {
      lehine: p3Package.Lehine.split('\n').map(s => s.trim()).filter(Boolean),
      aleyhine: p3Package.Aleyhine.split('\n').map(s => s.trim()).filter(Boolean)
    };

    finalQuestions.push({
      type: 'question', id: globalId++, section: '3. Bölüm',
      question: p3Package.Konu, lists: lists,
      prepTime: 60, speakTime: 120, hasAudioBtn: false,
    });

    return ok({
      questions: finalQuestions,
      rawVariant: {
        variantNo: 'dynamic',
        part1Questions: [{question: q1}, {question: q2}, {question: q3}],
        part1_2Scenario: p12Scenario,
        part2Scenario: p2Scenario,
        part3Question: { question: p3Package.Konu, lists: lists }
      }
    });
  } catch (error) {
    return fail('GENERATE_DYNAMIC_VARIANT_FAILED', error.message, 500);
  }
}
