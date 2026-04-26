import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const getRandom = (arr) => arr && arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

export async function GET() {
  try {
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ success: false, error: 'No DB' }, { status: 500 });

    const { data, error } = await supabase
      .from('writing_pool')
      .select('pool_data')
      .limit(1)
      .maybeSingle();

    if (error || !data?.pool_data) {
      return NextResponse.json({ success: false, error: 'Yazma havuzu bulunamadı.' }, { status: 404 });
    }

    const pool = data.pool_data;
    const part1 = getRandom(pool.part1_writing_pool);
    const part2 = getRandom(pool.part2_writing_pool);

    if (!part1 || !part2) {
      return NextResponse.json({ success: false, error: 'Havuzda yeterli veri yok.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      variant: {
        part1: {
          ortakMetin: part1.ortakMetin,
          gorev1_1: part1.gorev1_1,
          gorev1_2: part1.gorev1_2,
        },
        part2: {
          kompozisyon: part2,
        }
      }
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
