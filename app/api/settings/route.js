import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Vercel KV (Upstash) entegrasyonu - birden fazla env var adını destekle
function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// Local memory fallback (Redis yoksa veya bağlanamazsa)
let localStore = { activeVariant: 'random', adminUsername: 'admin', adminPassword: 'admin' };

async function readStore() {
  const redis = getRedis();
  if (redis) {
    try {
      const data = await redis.get('exam_settings');
      if (data) return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
      console.warn('Redis read error, using local store:', e.message);
    }
  }
  return localStore;
}

async function writeStore(updates) {
  localStore = { ...localStore, ...updates };
  const redis = getRedis();
  if (redis) {
    try {
      await redis.set('exam_settings', JSON.stringify(localStore));
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
