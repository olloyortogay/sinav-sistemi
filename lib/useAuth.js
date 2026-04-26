'use client';
import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useRouter } from 'next/navigation';

/**
 * Merkezi kimlik doğrulama hook'u.
 * Google OAuth ve Telegram localStorage oturumunu birleştirir.
 * @returns {{ user, loading, setUser, logout }}
 */
export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // 1. Google (Supabase) oturumu kontrol et
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        if (mounted) {
          setUser(buildGoogleUser(session.user));
          setLoading(false);
        }
        return;
      }

      // 2. Telegram oturumu kontrol et (localStorage)
      try {
        const raw = localStorage.getItem('tg_session');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (mounted) {
            setUser(parsed);
            setLoading(false);
          }
          return;
        }
      } catch (_) {}

      if (mounted) setLoading(false);
    };

    init();

    // Supabase auth state değişikliklerini dinle (OAuth redirect sonrası)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        // OAuth dönüşü veya giriş anı: zenginleştir ve yönlendir
        await processAuthSession(session.user, router, setUser);
        setLoading(false);
      } else if (session?.user) {
        setUser(buildGoogleUser(session.user));
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    if (user?.provider === 'google') {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('tg_session');
    setUser(null);
  };

  return { user, loading, setUser, logout };
}

// ── Yardımcılar ──────────────────────────────────────────────────────────────

export async function upsertAndEnrich(user) {
  try {
    const res = await fetch('/api/upsertStudent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider:          user.provider,
        id:                user.id,
        name:              user.name,
        email:             user.email || null,
        telegramUsername:  user.telegramUsername || null,
        avatar:            user.avatar || null,
      }),
    });
    const json = await res.json();
    if (json.success && json.student_id) {
      return { ...user, student_id: json.student_id };
    }
  } catch (err) {
    console.error('upsertAndEnrich error:', err);
  }
  return user;
}

export function buildGoogleUser(supabaseUser) {
  return {
    provider: 'google',
    id: supabaseUser.id,
    name: supabaseUser.user_metadata?.full_name || supabaseUser.email,
    email: supabaseUser.email,
    avatar: supabaseUser.user_metadata?.avatar_url || null,
    rawData: supabaseUser,
  };
}

export async function processAuthSession(supabaseUser, router, setUser) {
  const userObj = buildGoogleUser(supabaseUser);
  const enriched = await upsertAndEnrich(userObj);
  notifyFirstLogin(enriched);
  if (setUser) setUser(enriched);
  if (router) router.push('/profile');
  return enriched;
}

export function notifyFirstLogin(user) {
  if (typeof window === 'undefined' || !user?.id) return;
  const key = `notified_v3_${user.id}`;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, '1');
  fetch('/api/notifyLogin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, provider: user.provider }),
  }).catch(() => {});
}
