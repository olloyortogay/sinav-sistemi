'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import TelegramLoginWidget from '../../components/TelegramLoginWidget';
import Navbar from '../../components/Navbar';
import { useLanguage } from '../../lib/LanguageContext';
import Link from 'next/link';
import React from 'react';

export default function ProfilePage() {
  const [sessionUser, setSessionUser] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setSessionUser({
            provider: 'google',
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email,
            email: session.user.email,
          });
        } else {
          const tgData = localStorage.getItem('tg_session');
          if (tgData) {
            const user = JSON.parse(tgData);
            setSessionUser({
              provider: 'telegram',
              id: String(user.id),
              name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
              telegram_username: user.telegramUsername || user.username,
            });
          }
        }
      } catch (e) {
        console.error("Session check error:", e);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    const fetchMyResults = async () => {
      if (!sessionUser) {
        setLoading(false);
        return;
      }
      try {
        const params = new URLSearchParams();
        if (sessionUser.email) params.append('email', sessionUser.email);
        if (sessionUser.provider === 'telegram' || sessionUser.telegram_id) params.append('telegram_id', sessionUser.id);

        const res = await fetch(`/api/results?${params.toString()}`);
        const d = await res.json();
        if (d.success) {
          setResults(d.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (sessionUser) fetchMyResults();
  }, [sessionUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('tg_session');
    window.location.href = '/';
  };

  const handleTelegramAuth = (user) => {
    // If they link telegram, save it
    localStorage.setItem('tg_session', JSON.stringify({ provider: 'telegram', ...user }));
    window.location.reload();
  };

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center font-sans">Yükleniyor...</div>;
  }

  if (!sessionUser) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] font-sans selection:bg-blue-100 selection:text-blue-900 flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('login')}</h2>
        <p className="mb-6 text-gray-600 border px-4 py-2 bg-white rounded shadow-sm">{t('discMustLogin')}</p>
        <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded font-bold">{t('navHome')}</Link>
      </div>
    );
  }

  const hasTelegramLinked = sessionUser.provider === 'telegram';

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6 transition">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          {t('navHome')} (Bosh sahifa)
        </Link>
        <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden border border-gray-100">
          <div className="bg-blue-50/50 p-6 sm:p-10 border-b border-blue-100/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">{t('profTitle')}</h1>
              <p className="text-gray-500 font-medium text-sm">{t('profDesc')}</p>
            </div>
            <button onClick={handleLogout} className="bg-white hover:bg-gray-50 text-red-600 border border-gray-200 px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-sm hover:shadow">
              {t('logout')}
            </button>
          </div>

        <div className="p-6 sm:p-10 space-y-8">
          {/* USER INFO */}
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
             <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-sm border border-gray-200">
                {sessionUser.provider === 'google' ? (
                  <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                ) : (
                  <svg className="w-7 h-7 fill-[#2AABEE]" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.11.03-1.84 1.18-5.2 3.45-.49.34-.94.51-1.34.5-.44-.01-1.28-.24-1.9-.45-.77-.25-1.38-.38-1.33-.8.02-.22.33-.45.92-.69 3.61-1.57 6.02-2.61 7.23-3.1 3.44-1.42 4.15-1.68 4.62-1.69.1 0 .33.02.46.12.11.08.13.19.14.28z"/></svg>
                )}
             </div>
             <div>
               <h3 className="font-bold text-gray-800 text-lg">{sessionUser.name}</h3>
               {sessionUser.email && <p className="text-gray-500 text-sm">{sessionUser.email}</p>}
             </div>
          </div>

          {!hasTelegramLinked && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 sm:p-6 rounded-xl">
              <h3 className="font-bold text-yellow-800 mb-2">{t('profLinkTgTitle')}</h3>
              <p className="text-yellow-700 text-sm mb-4">{t('profLinkTgDesc')}</p>
              <a 
                href={`https://t.me/turkdunyasisinavbot?start=${sessionUser.email || sessionUser.id}`}
                target="_blank"
                onClick={() => setHasTelegramLinked(true)}
                className="inline-flex items-center gap-2 bg-[#2AABEE] hover:bg-[#229ED9] text-white font-bold py-2.5 px-5 rounded-xl transition shadow-md"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.11.03-1.84 1.18-5.2 3.45-.49.34-.94.51-1.34.5-.44-.01-1.28-.24-1.9-.45-.77-.25-1.38-.38-1.33-.8.02-.22.33-.45.92-.69 3.61-1.57 6.02-2.61 7.23-3.1 3.44-1.42 4.15-1.68 4.62-1.69.1 0 .33.02.46.12.11.08.13.19.14.28z"/></svg>
                {t('profLinkBtn')}
              </a>
            </div>
          )}

          {/* RESULTS */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('profHistory')}</h2>
            {results.length === 0 ? (
              <p className="text-gray-500 bg-gray-50 p-6 text-center rounded-xl border border-dashed border-gray-300">{t('profNoExam')}</p>
            ) : (
              <div className="space-y-4">
                {results.map(r => (
                  <React.Fragment key={r.id}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition">
                      <div>
                       <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          {new Date(r.completed_at).toLocaleString('tr-TR')}
                       </span>
                       <h4 className="font-bold text-gray-800">{t('examTitle')} ({t('profExamVariant')} {r.variant_no})</h4>
                       <p className="text-sm text-gray-500 mt-1">{t('profDuration')}: {Math.floor(r.total_time / 60)}:{(r.total_time % 60).toString().padStart(2,'0')}</p>
                       {r.score !== null && r.score >= 70 && (
                         <div className="mt-2 inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full border border-yellow-300 shadow-sm" title="Tebrikler!">
                           🏆 Oliy Daraja (Üstün Başarı)
                         </div>
                       )}
                    </div>
                    <div className="mt-4 sm:mt-0 flex items-center justify-end">
                       <div className={`px-5 py-2 rounded-lg font-extrabold text-lg text-white ${
                         r.score !== null ? 'bg-green-500 shadow-green-200 shadow-lg' : 'bg-orange-400 shadow-orange-200 shadow-md'
                       }`}>
                         {r.score !== null ? `${r.score} ${t('profPoints')}` : t('profPending')}
                       </div>
                    </div>
                  </div>
                  {r.sections?.ai_feedback && (
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mt-2 !mb-6 shadow-sm">
                      <div className="flex items-center gap-2 font-bold text-blue-800 mb-2 border-b border-blue-200 pb-2">
                        <span className="text-xl">🤖</span> 
                        {t('aiAnalysis')}
                      </div>
                      <div className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-line">
                        {r.sections.ai_feedback}
                      </div>
                    </div>
                  )}
                </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
