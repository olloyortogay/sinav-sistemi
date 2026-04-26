import { createServiceRoleSupabase, fail, getAuthenticatedUserByToken, getBearerToken, ok, verifyAdminToken } from '../../../lib/api-utils';

export async function POST(request) {
  try {
    const supabase = createServiceRoleSupabase();
    if (!supabase) return fail('SUPABASE_CONFIG_MISSING', 'Supabase service role key is missing', 500);

    const body = await request.json();
    const { email, telegram_id } = body;
    const token = getBearerToken(request);
    const isAdmin = await verifyAdminToken(token);
    const authUser = await getAuthenticatedUserByToken(token, supabase);

    if (!email && !telegram_id) {
      return fail('IDENTITY_REQUIRED', 'Kimlik bilgisi eksik', 400);
    }

    if (!isAdmin) {
      if (!authUser) {
        return fail('NOT_AUTHORIZED', 'Not authorized', 401);
      }

      const authEmail = (authUser.email || '').toLowerCase();
      const requestedEmail = email ? String(email).toLowerCase() : null;
      const authTelegramId = authUser.user_metadata?.telegram_id
        ? String(authUser.user_metadata.telegram_id)
        : null;

      if (requestedEmail && requestedEmail !== authEmail) {
        return fail('NOT_AUTHORIZED', 'Not authorized', 403);
      }
      if (telegram_id && (!authTelegramId || String(telegram_id) !== authTelegramId)) {
        return fail('NOT_AUTHORIZED', 'Not authorized', 403);
      }
    }

    let query = supabase.from('exam_results').delete();

    if (email && telegram_id) {
      query = query.or(`user_email.eq.${email},telegram_chat_id.eq.${telegram_id}`);
    } else if (email) {
      query = query.eq('user_email', email);
    } else {
      query = query.eq('telegram_chat_id', telegram_id);
    }

    const { error } = await query;
    
    if (error) throw error;

    return ok({ deleted: true });
  } catch(err) {
    return fail('DELETE_RESULTS_FAILED', err.message, 500);
  }
}
