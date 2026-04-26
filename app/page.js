'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import DiscussionSection from '../components/DiscussionSection';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';

export default function LandingPage() {
  const [user, setUser] = useState(null);
  const { t, lang } = useLanguage();

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
        const tgSession = localStorage.getItem('tg_session');
        if (tgSession) setUser(JSON.parse(tgSession));
      }
    };
    checkUser();
  }, []);

  const examModules = [
    { 
      id: 'placement', 
      title: t('modPlacementTitle'), 
      desc: t('modPlacementDesc'), 
      icon: '🎯', 
      active: true, 
      path: '/exam/placement',
      color: 'green'
    },
    { 
      id: 'speaking', 
      title: t('modSpeakingTitle'), 
      desc: t('modSpeakingDesc'), 
      icon: '🎤', 
      active: true, 
      path: '/exam/speaking',
      color: 'blue'
    },
    { 
      id: 'listening', 
      title: t('modListeningTitle'), 
      desc: t('modListeningDesc'), 
      icon: '🎧', 
      active: true, 
      color: 'teal',
      path: '/exam/listening'
    },
    { 
      id: 'reading', 
      title: t('modReadingTitle'), 
      desc: t('modReadingDesc'), 
      icon: '📖', 
      active: true, 
      color: 'indigo',
      path: '/exam/reading'
    },
    { 
      id: 'writing', 
      title: t('modWritingTitle'), 
      desc: t('modWritingDesc'), 
      icon: '✍️', 
      active: true, 
      color: 'purple',
      path: '/exam/writing'
    },
  ];

  const socialLinks = [
    { 
      name: 'Telegram Kanal', 
      icon: <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.686c.223-.204-.054-.31-.35-.116l-6.405 4.027-2.75-.86c-.598-.184-.61-.592.126-.883l10.73-4.136c.49-.18.918.118.784.88z"/></svg>, 
      url: 'https://t.me/turkdunyasi_on', 
      color: 'bg-[#229ED9]' 
    },
    { 
      name: 'Instagram', 
      icon: <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>, 
      url: 'https://www.instagram.com/turkdunyasi2026/', 
      color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]' 
    },
    { 
      name: 'Admin İletişim', 
      icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>, 
      url: 'https://t.me/Marjona_ustoz', 
      color: 'bg-[#5b21b6]' 
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          <h1 className="text-5xl sm:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight">
            {t('heroTitlePart1')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">{t('heroTitlePart2')}</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-gray-600 mb-10 leading-relaxed">
            {t('heroDesc')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/exam/placement" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-2xl transition shadow-xl shadow-blue-100 hover:scale-105 active:scale-95">
              {lang === 'uz' ? 'Daraja aniqlash imtihoni' : 'Seviye Tespit Sınavı'}
            </Link>
            <Link href="/profile" className="w-full sm:w-auto bg-white border-2 border-gray-100 hover:border-gray-200 text-gray-700 font-bold py-4 px-10 rounded-2xl transition hover:shadow-lg">
              {t('btnResults')}
            </Link>
          </div>
        </div>
      </section>

      {/* Sınav Modülleri */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white sm:rounded-[3rem] shadow-sm border border-gray-50">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div className="text-left">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{t('modulesTitle')}</h2>
            <p className="text-gray-500 font-medium">{t('modulesDesc')}</p>
          </div>
          <div className="text-blue-600 font-bold text-sm bg-blue-50 px-4 py-2 rounded-xl">
            {t('activeModuleNum')} 5
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {examModules.map((mod) => (
            <div key={mod.id} className={`group relative p-8 rounded-[2rem] border transition-all duration-300 ${
              mod.active 
              ? 'bg-white border-blue-100 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-50' 
              : 'bg-gray-50 border-gray-100 opacity-80'
            }`}>
              {!mod.active && (
                <div className="absolute top-4 right-4 bg-gray-200 text-gray-500 text-[10px] font-black px-2.5 py-1 rounded-full tracking-widest">
                  {t('soon')}
                </div>
              )}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner ${
                mod.active ? 'bg-blue-50' : 'bg-white'
              }`}>
                {mod.icon}
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">{mod.title}</h3>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium">{mod.desc}</p>
              
              {mod.active ? (
                <Link href={mod.path} className="flex items-center gap-2 text-blue-600 font-bold group-hover:gap-3 transition-all">
                  <span>{t('startModule')}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              ) : (
                <span className="text-gray-400 text-sm font-bold">{t('soon')}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Discussion Section */}
      <DiscussionSection user={user} />

      {/* Footer / Social Section */}
      <footer className="bg-gray-900 text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16 items-center">
            <div className="text-center md:text-left">
              <img src="/images/logo.webp" alt="Logo" className="w-16 h-16 mx-auto md:mx-0 mb-4 opacity-90" />
              <h3 className="text-2xl font-bold mb-2 tracking-tight">Türk Dünyası</h3>
              <p className="text-gray-400 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: t('footerDesc') }} />
            </div>

            <div className="flex flex-col items-center gap-4">
              <p className="text-gray-400 font-bold text-xs tracking-widest mb-2">{t('footerContactTitle')}</p>
              <div className="flex flex-wrap justify-center gap-4">
                {socialLinks.map((link) => (
                  <a 
                    key={link.name} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`${link.color} p-4 rounded-2xl hover:scale-110 transition-transform shadow-lg flex items-center justify-center`}
                    title={link.name}
                  >
                    <span className="text-xl">{link.icon}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="text-gray-400 text-sm mb-4">{t('footerAlert')}</p>
              <a href="https://www.turkdunyasi.uz/register" target="_blank" rel="noopener noreferrer" className="inline-block bg-white text-gray-900 font-black py-3 px-8 rounded-xl hover:bg-blue-50 transition">
                {t('footerAction')}
              </a>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-xs tracking-widest font-medium">
              {t('footerCopyright')}
            </p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}