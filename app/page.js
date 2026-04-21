'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import DiscussionSection from '../components/DiscussionSection';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';

export default function LandingPage() {
  const [user, setUser] = useState(null);
  const { t } = useLanguage();

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
      active: false, 
      color: 'gray'
    },
    { 
      id: 'reading', 
      title: t('modReadingTitle'), 
      desc: t('modReadingDesc'), 
      icon: '📖', 
      active: false, 
      color: 'gray'
    },
    { 
      id: 'writing', 
      title: t('modWritingTitle'), 
      desc: t('modWritingDesc'), 
      icon: '✍️', 
      active: false, 
      color: 'gray'
    },
  ];

  const socialLinks = [
    { name: 'Telegram Kanal', icon: '✈️', url: 'https://t.me/turkdunyasi_on', color: 'bg-[#229ED9]' },
    { name: 'Instagram', icon: '📸', url: 'https://www.instagram.com/turkdunyasi2026/', color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]' },
    { name: 'Admin İletişim', icon: '👤', url: 'https://t.me/Marjona_ustoz', color: 'bg-[#0088cc]' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-1.5 rounded-full mb-8 border border-blue-100 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-xs font-bold text-blue-700 tracking-wider uppercase">{t('heroBadge')}</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight">
            {t('heroTitlePart1')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">{t('heroTitlePart2')}</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-gray-600 mb-10 leading-relaxed">
            {t('heroDesc')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/exam/speaking" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-2xl transition shadow-xl shadow-blue-100 hover:scale-105 active:scale-95">
              {t('btnStart')}
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
            {t('activeModuleNum')} 1
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
                <div className="absolute top-4 right-4 bg-gray-200 text-gray-500 text-[10px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase">
                  Yaqinda
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
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">{t('footerContactTitle')}</p>
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
              <Link href="/exam/speaking" className="inline-block bg-white text-gray-900 font-black py-3 px-8 rounded-xl hover:bg-blue-50 transition">
                {t('footerAction')}
              </Link>
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