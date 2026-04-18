import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

let localStore = { activeVariant: 'random', adminUsername: 'admin', adminPassword: 'admin' };

// ---- HELPERS ----
async function readStore() {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const data = await kv.get('exam_settings');
      if (data) return data;
    } catch (_) {}
  }
  return localStore;
}

async function writeStore(data) {
  localStore = { ...localStore, ...data };
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try { await kv.set('exam_settings', localStore); } catch (_) {}
  }
}

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ activeVariant: store.activeVariant || 'random' });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { variant } = body;
    await writeStore({ activeVariant: String(variant) });
    return NextResponse.json({ success: true, activeVariant: variant });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
