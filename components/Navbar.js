'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const { lang, changeLanguage, t } = useLanguage();

  useEffect(() => {
    // Check initial session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.email,
          avatar: session.user.user_metadata?.avatar_url,
          provider: 'google'
        });
      } else {
        // Check TG session
        const tgSession = localStorage.getItem('tg_session');
        if (tgSession) {
          setUser(JSON.parse(tgSession));
        }
      }
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.email,
          avatar: session.user.user_metadata?.avatar_url,
          provider: 'google'
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('tg_session');
    setUser(null);
    window.location.reload();
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/images/logo.webp" alt="Logo" className="w-10 h-10 object-contain transition-transform group-hover:scale-110" />
            <span className="font-bold text-xl text-gray-800 tracking-tight hidden sm:block">Türk Dünyası</span>
          </Link>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => changeLanguage(lang === 'uz' ? 'tr' : 'uz')}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition"
              title="Dili Değiştir / Tilni O'zgartirish"
            >
              {lang.toUpperCase()}
            </button>
            <Link href="/" className="text-gray-600 hover:text-blue-600 font-medium text-sm transition">
              {t('navHome')}
            </Link>
            
            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/profile" className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 transition">
                  {user.avatar || (user.rawData?.photo_url) ? (
                    <img src={user.avatar || user.rawData.photo_url} className="w-6 h-6 rounded-full border border-white shadow-sm" alt="Profile" />
                  ) : (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold uppercase">
                      {user.name?.[0] || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-gray-700 max-w-[100px] truncate">{user.name}</span>
                </Link>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition" title="Çıkış Yap">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-bold transition shadow-md shadow-blue-100">
                {t('login')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
