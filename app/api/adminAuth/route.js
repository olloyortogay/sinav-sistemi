import { NextResponse } from 'next/server';

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

let localStore = { adminUsername: 'admin', adminPassword: 'admin' };

async function readStore() {
  const r = await initRedis();
  if (r) {
    try {
      const data = await r.get('exam_settings');
      if (data) return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {}
  }
  return localStore;
}

async function writeStore(updates) {
  localStore = { ...localStore, ...updates };
  const r = await initRedis();
  if (r) {
    try { await r.set('exam_settings', JSON.stringify(localStore)); } catch (e) {}
  }
}

export async function POST(request) {
  try {
    const { action, username, password, newUsername, newPassword } = await request.json();
    const store = await readStore();
    const storedUser = store.adminUsername || 'admin';
    const storedPass = store.adminPassword || 'admin';

    if (action === 'LOGIN') {
      if (username === storedUser && password === storedPass) {
        return NextResponse.json({ success: true, token: 'authenticated' });
      }
      return NextResponse.json({ success: false, error: 'Kullanıcı adı veya şifre hatalı' }, { status: 401 });
    }

    if (action === 'CHANGE_CREDENTIALS') {
      if (username !== storedUser || password !== storedPass) {
        return NextResponse.json({ success: false, error: 'Mevcut bilgiler hatalı' }, { status: 401 });
      }
      const updates = {};
      if (newUsername) updates.adminUsername = newUsername;
      if (newPassword) updates.adminPassword = newPassword;
      await writeStore(updates);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Bilinmeyen işlem' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
