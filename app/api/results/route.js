import { createServiceRoleSupabase, fail, getBearerToken, getAuthenticatedUserByToken, ok, verifyAdminToken } from '../../../lib/api-utils';

export async function GET(request) {
  try {
    const supabase = createServiceRoleSupabase();
    if (!supabase) return fail('SUPABASE_CONFIG_MISSING', 'Supabase service role key is missing', 500);

    const token = getBearerToken(request);
    
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const telegramId = url.searchParams.get('telegram_id');
    const examType = url.searchParams.get('exam_type');
    
    const isAdmin = await verifyAdminToken(token);
    const authUser = await getAuthenticatedUserByToken(token, supabase);
    
    let query = supabase.from('exam_results').select('*').order('completed_at', { ascending: false });
    
    if (examType) {
      if (examType === 'writing') {
        query = query.or('variant_no.eq.writing_exam,sections->>exam_type.eq.writing');
      } else if (examType === 'speaking') {
        // Exclude writing and placement to get speaking
        query = query.not('variant_no', 'in', '("writing_exam","placement_exam","placement_test")');
      } else {
        query = query.eq('sections->>exam_type', examType);
      }
    }

    if (isAdmin) {
      // Admin gets all filtered by examType
    } else if (authUser) {
      const authEmail = (authUser.email || '').toLowerCase();
      const requestedEmail = email ? email.toLowerCase() : null;
      const authTelegramId = authUser.user_metadata?.telegram_id
        ? String(authUser.user_metadata.telegram_id)
        : null;

      if (requestedEmail && requestedEmail !== authEmail) {
        return fail('NOT_AUTHORIZED', 'Not authorized', 403);
      }
      if (telegramId && (!authTelegramId || String(telegramId) !== authTelegramId)) {
        return fail('NOT_AUTHORIZED', 'Not authorized', 403);
      }

      if (requestedEmail) {
        query = query.eq('user_email', requestedEmail);
      } else if (telegramId) {
        query = query.eq('telegram_chat_id', telegramId);
      } else if (authEmail) {
        query = query.eq('user_email', authEmail);
      } else {
        return fail('NOT_AUTHORIZED', 'Not authorized', 401);
      }
    } else if (email || telegramId) {
      if (email) query = query.eq('user_email', email.toLowerCase());
      if (telegramId) query = query.eq('telegram_chat_id', String(telegramId));
    } else {
      return fail('NOT_AUTHORIZED', 'Not authorized', 401);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return ok(data);
  } catch(err) {
    return fail('RESULTS_FETCH_FAILED', err.message, 500);
  }
}
