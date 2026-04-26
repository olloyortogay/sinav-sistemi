import { createAnonSupabase, fail, ok } from '../../../lib/api-utils';

// Server-side client with anon key
const supabase = createAnonSupabase();

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('discussions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return ok({ comments: data });
  } catch (error) {
    return fail('DISCUSSIONS_FETCH_FAILED', error.message, 500);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_name, comment, avatar_url } = body;

    if (!user_name || !comment) {
      return fail('VALIDATION_ERROR', 'Name and comment required', 400);
    }

    const { data, error } = await supabase
      .from('discussions')
      .insert([{ user_name, comment, avatar_url }])
      .select();

    if (error) throw error;
    return ok({ comment: data[0] });
  } catch (error) {
    return fail('DISCUSSION_CREATE_FAILED', error.message, 500);
  }
}
