import { createServiceRoleSupabase, fail, ok } from '../../../lib/api-utils';

const getRandom = (arr) => arr && arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

export async function GET() {
  try {
    const supabase = createServiceRoleSupabase();
    if (!supabase) return fail('SUPABASE_CONFIG_MISSING', 'Supabase service role key is missing', 500);

    const { data, error } = await supabase
      .from('writing_pool')
      .select('pool_data')
      .limit(1)
      .maybeSingle();

    if (error || !data?.pool_data) {
      return fail('WRITING_POOL_NOT_FOUND', 'Yazma havuzu bulunamadı.', 404);
    }

    const pool = data.pool_data;
    const part1 = getRandom(pool.part1_writing_pool);
    const part2 = getRandom(pool.part2_writing_pool);

    if (!part1 || !part2) {
      return fail('WRITING_POOL_INSUFFICIENT', 'Havuzda yeterli veri yok.', 404);
    }

    return ok({
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
    return fail('GENERATE_WRITING_VARIANT_FAILED', e.message, 500);
  }
}
