'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import TelegramLoginWidget from './TelegramLoginWidget';
import { processAuthSession, buildGoogleUser, upsertAndEnrich } from '../lib/useAuth';
import { useRouter } from 'next/navigation';

/**
 * Merkezi giriş bileşeni — Google OAuth + Telegram Login.
 *
 * Props:
 *   onSuccess(user)  — Başarılı giriş sonrası çağrılır
 *   redirectTo       — Google OAuth sonrası dönülecek path (ör: '/exam/placement')
 *   title            — Başlık metni
 *   subtitle         — Alt başlık metni
 */
export default function AuthGate({ onSuccess, redirectTo, title, subtitle }) {
  const router = useRouter();
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState(null);

  // Google OAuth redirect sonrası → session kontrol et
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const enriched = await processAuthSession(session.user, null, null);
        onSuccess(enriched);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleLogin = async () => {
    setOauthLoading(true);
    setError(null);
    try {
      const callbackUrl = window.location.origin + '/login'; // Kesin kural: /login rotasına dön
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl },
      });
      if (err) throw err;
    } catch (e) {
      setError(e.message);
      setOauthLoading(false);
    }
  };

  const handleTelegramAuth = async (telegramUser) => {
    const userObj = {
      provider: 'telegram',
      id: telegramUser.id,
      name: [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' '),
      email: null,
      telegramUsername: telegramUser.username ? '@' + telegramUser.username : null,
      avatar: telegramUser.photo_url || null,
      rawData: telegramUser,
    };
    
    // Telegram için manuel zenginleştirme (processAuthSession Google içindir)
    const enriched = await upsertAndEnrich(userObj);
    localStorage.setItem('tg_session', JSON.stringify(enriched));
    onSuccess(enriched);
  };

  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || 'TurkDunyasiSinavBot';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 p-4 relative overflow-hidden">
      {/* Arka plan dekorasyonları */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute -top-48 -right-48 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-cyan-500/5 rounded-full blur-2xl" />
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Logo + Marka */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo.webp" alt="Türk Dünyası" className="w-16 h-16 object-contain" />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 backdrop-blur-sm text-blue-200 text-xs font-bold px-4 py-2 rounded-full mb-4 tracking-widest uppercase">
            🎓 Türk Dünyası Sinav Sistemi
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight leading-tight">
            {title || 'Xush Kelibsiz'}
          </h1>
          <p className="text-blue-200/80 font-medium text-sm px-4">
            {subtitle || 'Sınava başlamak için hesabınızla giriş yapın'}
          </p>
        </div>

        {/* Giriş Kartı */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-8 shadow-2xl">
          <p className="text-white/40 text-xs text-center mb-6 uppercase tracking-widest font-bold">
            Giriş Yöntemini Seçin
          </p>

          <div className="space-y-4">
            {/* Google Butonu */}
            <button
              onClick={handleGoogleLogin}
              disabled={oauthLoading}
              id="auth-google-btn"
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-wait text-gray-800 font-bold py-4 px-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-base">{oauthLoading ? 'Yönlendiriliyor...' : 'Google ile Giriş Yap'}</span>
            </button>

            {/* Ayraç */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/15" />
              <span className="text-white/30 text-xs font-bold uppercase tracking-widest">VEYA</span>
              <div className="flex-1 h-px bg-white/15" />
            </div>

            {/* Telegram Widget */}
            <div className="w-full flex flex-col items-center gap-3">
              <div className="flex justify-center w-full py-1">
                <TelegramLoginWidget botName={botName} onAuth={handleTelegramAuth} />
              </div>
              <p className="text-white/30 text-xs text-center">
                Telegram hesabınızla anında giriş yapın
              </p>
            </div>
          </div>

          {/* Hata mesajı */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl text-red-200 text-sm text-center">
              ⚠️ {error}
            </div>
          )}

          {/* Alt bilgi */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-white/25 text-xs text-center leading-relaxed">
              Giriş yaparak platformun kullanım şartlarını kabul etmiş olursunuz.
              Bilgileriniz güvende saklanır.
            </p>
          </div>
        </div>

        {/* Telegram Bot linki */}
        <div className="mt-6 text-center">
          <a
            href={`https://t.me/${botName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-300/70 hover:text-blue-200 text-xs font-medium transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.11.03-1.84 1.18-5.2 3.45-.49.34-.94.51-1.34.5-.44-.01-1.28-.24-1.9-.45-.77-.25-1.38-.38-1.33-.8.02-.22.33-.45.92-.69 3.61-1.57 6.02-2.61 7.23-3.1 3.44-1.42 4.15-1.68 4.62-1.69.1 0 .33.02.46.12.11.08.13.19.14.28z" />
            </svg>
            Sonuçlarınızı Telegram&apos;dan takip edin → @{botName}
          </a>
        </div>
      </div>
    </div>
  );
}

// Yardımcı fonksiyonlar artık lib/useAuth.js üzerinden merkezi olarak yönetilmektedir.

