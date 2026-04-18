import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

let localStore = { adminUsername: 'admin', adminPassword: 'admin' };

async function readStore() {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try { const d = await kv.get('exam_settings'); if (d) return d; } catch (_) {}
  }
  return localStore;
}

async function writeStore(data) {
  localStore = { ...localStore, ...data };
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try { await kv.set('exam_settings', localStore); } catch (_) {}
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
      // Current credentials check
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
