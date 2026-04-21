import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side client with anon key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('discussions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return NextResponse.json({ success: true, comments: data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_name, comment, avatar_url } = body;

    if (!user_name || !comment) {
      return NextResponse.json({ success: false, error: 'Name and comment required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('discussions')
      .insert([{ user_name, comment, avatar_url }])
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, comment: data[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
