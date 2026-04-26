import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export function ok(data = {}, init = {}) {
  return NextResponse.json({ success: true, data, ...data }, init);
}

export function fail(code, message, status = 500, details) {
  const payload = {
    success: false,
    error: { code, message },
    message,
  };
  if (details !== undefined) payload.error.details = details;
  return NextResponse.json(payload, { status });
}

export function getBearerToken(request) {
  const authHeader = request.headers.get('authorization') || '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

export function createServiceRoleSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export function createAnonSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function verifyAdminToken(token, supabase = null) {
  if (!token) return false;
  const db = supabase || createServiceRoleSupabase();
  if (!db) return false;
  try {
    const { data, error } = await db.from('app_settings').select('data').eq('id', 1).single();
    if (!error && data?.data?.adminSessions) return data.data.adminSessions.includes(token);
  } catch (_) {}
  return false;
}

export async function getAuthenticatedUserByToken(token, supabase = null) {
  if (!token) return null;
  const db = supabase || createServiceRoleSupabase();
  if (!db) return null;
  const { data, error } = await db.auth.getUser(token);
  if (error) return null;
  return data?.user || null;
}

export function ensureServiceRoleSupabase() {
  const db = createServiceRoleSupabase();
  if (!db) return { errorResponse: fail('SUPABASE_CONFIG_MISSING', 'Supabase service role key is missing', 500) };
  return { supabase: db };
}

export function toApiError(error, fallbackCode = 'INTERNAL_ERROR', fallbackMessage = 'Unexpected server error') {
  if (error?.error?.code && error?.error?.message) return error;
  return fail(fallbackCode, error?.message || fallbackMessage, 500);
}
