'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import TelegramLoginWidget from '../../components/TelegramLoginWidget';

export default function ProfilePage() {
  const [sessionUser, setSessionUser] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSessionUser({
          provider: 'google',
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email,
          email: session.user.email,
        });
      } else {
        const tgData = localStorage.getItem('tg_user');
        if (tgData) {
          const user = JSON.parse(tgData);
          setSessionUser({
            provider: 'telegram',
            id: String(user.id),
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            telegram_username: user.username,
          });
        }
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
    localStorage.removeItem('tg_user');
    window.location.href = '/';
  };

  const handleTelegramAuth = (user) => {
    // If they link telegram, save it
    localStorage.setItem('tg_user', JSON.stringify(user));
    window.location.reload();
  };

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center font-sans">Yükleniyor...</div>;
  }

  if (!sessionUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Giriş Yapın</h2>
        <p className="mb-6 text-gray-600 border px-4 py-2 bg-white rounded shadow-sm">Öğrenci panelini görmek için ana sayfadan giriş yapmalısınız.</p>
        <a href="/" className="bg-blue-600 text-white px-6 py-2 rounded font-bold">Ana Sayfaya Dön</a>
      </div>
    );
  }

  const hasTelegramLinked = sessionUser.provider === 'telegram';

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 sm:p-10 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">Öğrenci Paneli</h1>
            <p className="text-blue-100 text-sm">Sınav geçmişiniz ve sonuçlarınız</p>
          </div>
          <button onClick={handleLogout} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-bold text-sm transition">
            Çıkış Yap
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
              <h3 className="font-bold text-yellow-800 mb-2">Telegram Hesabınızı Bağlayın</h3>
              <p className="text-yellow-700 text-sm mb-4">Sınav puanlarınızı görebilmek ve sistemden otomatik bildirim alabilmek için Telegram hesabınızı bağlamanız zorunludur.</p>
              <TelegramLoginWidget onAuth={handleTelegramAuth} />
            </div>
          )}

          {/* RESULTS */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Sınav Geçmişiniz</h2>
            {results.length === 0 ? (
              <p className="text-gray-500 bg-gray-50 p-6 text-center rounded-xl border border-dashed border-gray-300">Henüz girdiğiniz bir sınav kaydı bulunmuyor.</p>
            ) : (
              <div className="space-y-4">
                {results.map(r => (
                  <div key={r.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition">
                    <div>
                       <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          {new Date(r.completed_at).toLocaleString('tr-TR')}
                       </span>
                       <h4 className="font-bold text-gray-800">Konuşma Sınavı (Varyant {r.variant_no})</h4>
                       <p className="text-sm text-gray-500 mt-1">Süre: {Math.floor(r.total_time / 60)}:{(r.total_time % 60).toString().padStart(2,'0')}</p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex items-center justify-end">
                       {!hasTelegramLinked ? (
                         <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                           <span>🔒 Gizli Puan</span>
                         </div>
                       ) : (
                         <div className={`px-5 py-2 rounded-lg font-extrabold text-lg text-white ${r.score !== null ? 'bg-green-500 shadow-green-200 shadow-lg' : 'bg-orange-400 shadow-orange-200 shadow-md'}`}>
                           {r.score !== null ? `${r.score} Puan` : 'Not Bekleniyor'}
                         </div>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
