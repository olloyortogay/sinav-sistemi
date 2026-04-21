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
             <div className="text-4xl">{sessionUser.provider === 'google' ? '🇬' : '✈️'}</div>
             <div>
               <h3 className="font-bold text-gray-800 text-lg">{sessionUser.name}</h3>
               {sessionUser.email && <p className="text-gray-500 text-sm">{sessionUser.email}</p>}
             </div>
          </div>

          {!hasTelegramLinked && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 sm:p-6 rounded-xl">
              <h3 className="font-bold text-yellow-800 mb-2">{t('profLinkTgTitle')}</h3>
              <p className="text-yellow-700 text-sm mb-4">{t('profLinkTgDesc')}</p>
              <TelegramLoginWidget botName={process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME} onAuth={handleTelegramAuth} />
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
                        AI Analizi (Yapay Zeka Değerlendirmesi)
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
