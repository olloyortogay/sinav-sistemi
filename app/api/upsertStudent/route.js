import { createServiceRoleSupabase, fail, ok } from '../../../lib/api-utils';

/**
 * POST /api/upsertStudent
 *
 * Her girişte çağrılır. students tablosunu günceller/oluşturur.
 * Döndürdüğü student_id, sınav sonuçlarında FK olarak kullanılır.
 *
 * Body: { provider, id, name, email, telegramUsername, avatar }
 * Response: { success: true, student_id: "uuid" }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { provider, id, name, email, telegramUsername, avatar } = body;

    // Zorunlu alan kontrolü
    if (!provider || !id || !name) {
      return fail('VALIDATION_ERROR', 'provider, id ve name zorunludur.', 400);
    }

    const supabase = createServiceRoleSupabase();
    if (!supabase) {
      return fail('SUPABASE_CONFIG_MISSING', 'Supabase service role key is missing', 500);
    }

    // PostgreSQL upsert_student() fonksiyonu çağrısı
    const { data: studentId, error } = await supabase.rpc('upsert_student', {
      p_google_id:         provider === 'google'    ? String(id) : null,
      p_telegram_id:       provider === 'telegram'  ? String(id) : null,
      p_name:              name || 'Bilinmeyen',
      p_email:             email || null,
      p_telegram_username: telegramUsername || null,
      p_avatar_url:        avatar || null,
      p_provider:          provider,
    });

    if (error) throw error;

    return ok({ student_id: studentId });
  } catch (err) {
    console.error('upsertStudent error:', err);
    return fail('UPSERT_STUDENT_FAILED', err.message, 500);
  }
}
