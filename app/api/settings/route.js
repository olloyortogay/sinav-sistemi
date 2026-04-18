import { NextResponse } from 'next/server';

// Upstash Redis - sadece env var'lar varsa aktif olur, yoksa local memory kullanılır
let redis = null;
const initRedis = async () => {
  if (!redis && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = await import('@upstash/redis');
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
};

// Local memory fallback (Redis yoksa)
let localStore = { activeVariant: 'random', adminUsername: 'admin', adminPassword: 'admin' };

async function readStore() {
  const r = await initRedis();
  if (r) {
    try {
      const data = await r.get('exam_settings');
      if (data) return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
      console.warn('Redis read error, using local store:', e.message);
    }
  }
  return localStore;
}

async function writeStore(updates) {
  localStore = { ...localStore, ...updates };
  const r = await initRedis();
  if (r) {
    try {
      await r.set('exam_settings', JSON.stringify(localStore));
    } catch (e) {
      console.warn('Redis write error:', e.message);
    }
  }
}

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ activeVariant: store.activeVariant || 'random' });
}

export async function POST(request) {
  try {
    const { variant } = await request.json();
    await writeStore({ activeVariant: String(variant) });
    return NextResponse.json({ success: true, activeVariant: variant });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
