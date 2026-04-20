import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { randomUUID } from 'crypto';

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

let localStore = { adminUsername: 'admin', adminPassword: 'admin' };

async function readStore() {
  const redis = getRedis();
  if (redis) {
    try {
      const data = await redis.get('exam_settings');
      if (data) return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {}
  }
  return localStore;
}

async function writeStore(updates) {
  localStore = { ...localStore, ...updates };
  const redis = getRedis();
  if (redis) {
    try { await redis.set('exam_settings', JSON.stringify(localStore)); } catch (e) {}
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
        const token = randomUUID();
        const activeSessions = store.adminSessions || [];
        activeSessions.push(token);
        await writeStore({ adminSessions: activeSessions });
        return NextResponse.json({ success: true, token });
      }
      return NextResponse.json({ success: false, error: 'Kullanıcı adı veya şifre hatalı' }, { status: 401 });
    }

    if (action === 'CHANGE_CREDENTIALS') {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.split(' ')[1];
      const activeSessions = store.adminSessions || [];
      
      if (!token || !activeSessions.includes(token)) {
         return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

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
