'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';

export default function DiscussionSection({ user }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const seedComments = [
    { id: 's1', user_name: 'Dilshodbek Ergashev', comment: "Sinov juda qiziqarli o'tdi, savollar darajasi ancha baland ekan. Hammaga maslahat beraman! 🚀", avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 's2', user_name: 'Malika Qodirova', comment: "Gapirish qismi biroz hayajonli bo'ldi, lekin AI emas haqiqiy o'qituvchi baholashi kutilmaganda juda adolatli chiqdi. Rahmat!", avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 's3', user_name: "Jasur Jo'rayev", comment: "Yangi savollar qachon qo'shiladi? Ayniqsa Listening qismini intizorlik bilan kutyapmiz. Omad!", avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack', created_at: new Date(Date.now() - 172800000).toISOString() },
    { id: 's4', user_name: 'Madina Asrorova', comment: "Platforma juda qulay ishlangan, telefon orqali ham bemalol imtihon topshirdim. Natijamni tezda oldim. 👍", avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Avery', created_at: new Date(Date.now() - 250000000).toISOString() },
    { id: 's5', user_name: 'Sardor Qosim', comment: "O'zbekistondagi eng yaxshi til baholash tizimi ekanligiga ishonchim komil. Ustozlarga katta rahmat!", avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sasha', created_at: new Date(Date.now() - 400000000).toISOString() }
  ];

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const res = await fetch('/api/discussions');
      const data = await res.json();
      if (data.success) {
        // Combinine DB comments with seed comments for variety
        setComments([...data.comments, ...seedComments].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
      }
    } catch (e) {
      setComments(seedComments);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setLoading(true);
    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: user.name,
          comment: newComment,
          avatar_url: user.avatar || (user.rawData?.photo_url) || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewComment('');
        fetchComments();
      }
    } catch (err) {
      alert(t('discError'));
    }
    setLoading(false);
  };

  return (
    <section className="mt-16 mb-20 max-w-4xl mx-auto px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">{t('discTitle')}</h2>
      </div>

      {/* Comment Box */}
      <div className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-50 border border-blue-50 mb-12 transform transition hover:scale-[1.01]">
        {user ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
              <img src={user.avatar || user.rawData?.photo_url || `https://ui-avatars.com/api/?name=${user.name}`} className="w-10 h-10 rounded-full border-2 border-blue-100" />
              <div>
                <p className="font-bold text-gray-800 text-sm">{user.name}</p>
                <p className="text-xs text-blue-500 font-medium tracking-wide uppercase">{t('discLeaveCommentLbl')}</p>
              </div>
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t('discPlaceholder')}
              className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none resize-none min-h-[120px] text-gray-700"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-blue-100 active:scale-95"
              >
                {loading ? t('discSubmitting') : t('discSubmit')}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">{t('discMustLogin')}</p>
            <button
              onClick={() => window.location.href = '/exam/speaking'}
              className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2 px-6 rounded-full transition"
            >
              <span>🔑 {t('login')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Comment List */}
      <div className="space-y-6">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-4 p-5 rounded-2xl bg-white border border-gray-100 transition hover:border-blue-200">
            <img 
              src={c.avatar_url || `https://ui-avatars.com/api/?name=${c.user_name}&background=random`} 
              className="w-12 h-12 rounded-2xl object-cover shrink-0 shadow-sm"
              alt="User"
            />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800">{c.user_name}</span>
                <span className="text-[10px] text-gray-400 font-medium">
                  {new Date(c.created_at).toLocaleDateString('uz-UZ')}
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm lg:text-base">{c.comment}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
