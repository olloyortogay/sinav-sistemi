'use client';
import { useState, useEffect, useRef } from 'react';
import Navbar from '../../../components/Navbar';
import AuthGate from '../../../components/AuthGate';
import { supabase } from '../../../lib/supabase';
import { EXAM_STATUS, useExamStore } from '../../../store/useExamStore';
import ExamTimer from '../../../components/exam/ExamTimer';
import StartModal from '../../../components/exam/StartModal';
import QuestionCard from '../../../components/exam/QuestionCard';
import AiFeedbackCard from '../../../components/exam/AiFeedbackCard';

export default function WritingExamPage() {
  const {
    user,
    examStatus,
    examData,
    submitError,
    setUser,
    setExamStatus,
    setExamData,
    tickTimer,
    getSubmitPayload,
    getWordCounts,
    setSubmitError,
    setExamResultId
  } = useExamStore();

  const [isChecking, setIsChecking] = useState(examStatus === EXAM_STATUS.IDLE);
  const startTimeRef = useRef(null);

  async function handleSubmit() {
    const totalTimeSpent = startTimeRef.current 
      ? Math.floor((Date.now() - startTimeRef.current) / 1000) 
      : 0;
      
    const payload = getSubmitPayload(totalTimeSpent);

    try {
      const res = await fetch('/api/sendWritingResult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error('Sunucu hatası');
      
      setExamResultId(data.examResultId);
      setExamStatus(EXAM_STATUS.FINISHED);
    } catch (e) {
      setSubmitError('Gönderim hatası: ' + e.message);
      alert('Gönderim hatası: ' + e.message);
    }
  }

  // ── 1. Oturum Kontrolü ──
  useEffect(() => {
    if (examStatus !== EXAM_STATUS.IDLE) {
      return;
    }

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const u = {
          provider: 'google',
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email,
          email: session.user.email,
          avatar: session.user.user_metadata?.avatar_url || null,
          rawData: session.user,
        };
        setUser(u);
      } else {
        try {
          const raw = localStorage.getItem('tg_session');
          if (raw) {
            setUser(JSON.parse(raw));
          }
        } catch {}
      }
      setIsChecking(false);
    };
    
    checkSession();
  }, [examStatus, setUser]);

  // ── 2. Timer Loop ──
  useEffect(() => {
    if (examStatus !== EXAM_STATUS.RUNNING) return;
    const t = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(t);
  }, [examStatus, tickTimer]);

  // Süre bittiğinde submit
  useEffect(() => {
    // Sınav bitmişse handle submit (Zustand timer 0 olunca submitting yapıyor)
    if (examStatus === EXAM_STATUS.SUBMITTING) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examStatus]);

  // ── Auth Handlers ──
  const handleAuthSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleStart = async () => {
    setExamStatus(EXAM_STATUS.LOADING_VARIANT);
    try {
      const res = await fetch('/api/generateWritingVariant');
      const d = await res.json();
      if (d.success) {
        setExamData(d.variant, 3600); // 60 dk
        startTimeRef.current = Date.now();
      } else {
        alert(d.error || 'Sınav verisi yüklenemedi.');
        setExamStatus(EXAM_STATUS.RULES_READING);
      }
    } catch (e) {
      alert('Sunucuya bağlanılamadı: ' + e.message);
      setExamStatus(EXAM_STATUS.RULES_READING);
    }
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (examStatus === EXAM_STATUS.IDLE) {
    return (
      <AuthGate
        onSuccess={handleAuthSuccess}
        redirectTo="/exam/writing"
        title="Yozma Imtihon"
        subtitle="Yazma sınavına başlamak için giriş yapın"
      />
    );
  }

  if (examStatus === EXAM_STATUS.RULES_READING || examStatus === EXAM_STATUS.LOADING_VARIANT) {
    return (
      <>
        <StartModal onStart={handleStart} />
        {examStatus === EXAM_STATUS.LOADING_VARIANT && (
          <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3 animate-spin">⚙️</div>
              <p className="font-bold text-gray-700">Sınav hazırlanıyor...</p>
            </div>
          </div>
        )}
      </>
    );
  }

  if (examStatus === EXAM_STATUS.FINISHED) {
    const counts = getWordCounts();
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          <div className="bg-white rounded-3xl shadow-2xl p-10 text-center max-w-2xl w-full">
            <div className="text-7xl mb-4">✅</div>
            <h1 className="text-2xl font-black text-gray-800 mb-2">Imtihon Topshirildi!</h1>
            <p className="text-gray-500 mb-6">Yozma imtihoningiz muvaffaqiyatli yuborildi. Natijalar tez orada e&apos;lon qilinadi.</p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left text-sm text-green-700 space-y-1 mb-6 flex justify-between items-center">
              <div>🟢 Görev 1.1: <strong>{counts.task1} so&apos;z</strong></div>
              <div>🔵 Görev 1.2: <strong>{counts.task2} so&apos;z</strong></div>
              <div>📝 Kompozisyon: <strong>{counts.essay} so&apos;z</strong></div>
            </div>
            <a href="/profile" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition">
              Profilimni Ko&apos;rish →
            </a>
          </div>

          <AiFeedbackCard />
        </div>
      </div>
    );
  }

  // ── EXAM (running, submitting) ──────────────────────────────────────────────
  const counts = getWordCounts();
  const isSubmitting = examStatus === EXAM_STATUS.SUBMITTING;

  return (
    <div className="min-h-screen bg-gray-50">
      <ExamTimer title="Yozma Imtihon / Yazma Sınavı" />

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* BÖLÜM 1 */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-blue-700 text-white px-5 py-3 font-black text-lg">1-QISM: Xat / Mektup</div>
          {examData?.part1?.ortakMetin && (
            <div className="p-5 bg-yellow-50 border-b border-yellow-100">
              <div className="text-xs font-black text-yellow-700 uppercase tracking-wider mb-2">📖 Ortak Metin / Umumiy Matn</div>
              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{examData.part1.ortakMetin}</p>
            </div>
          )}
          
          {examData?.part1?.gorev1_1 && (
            <QuestionCard 
              title="Görev 1.1 — Norasmiy Xat"
              description={examData.part1.gorev1_1}
              field="task1"
              minWords={50}
              theme="green"
              rows={6}
            />
          )}

          {examData?.part1?.gorev1_2 && (
            <QuestionCard 
              title="Görev 1.2 — Rasmiy Xat"
              description={examData.part1.gorev1_2}
              field="task2"
              minWords={120}
              theme="blue"
              rows={10}
            />
          )}
        </div>

        {/* BÖLÜM 2 */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-purple-700 text-white px-5 py-3 font-black text-lg">2-QISM: Kompozisyon (Insho)</div>
          
          {examData?.part2?.kompozisyon && (
            <QuestionCard 
              title="Kompozisyon (250–300 so'z)"
              description={`📝 Kompozisyon Mavzusi\n\n${examData.part2.kompozisyon}`}
              field="essay"
              minWords={250}
              theme="purple"
              rows={14}
            />
          )}
        </div>

        {/* Submit */}
        <div className="pb-8">
          {submitError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-xl text-center font-bold">
              {submitError}
            </div>
          )}
          <button onClick={() => setExamStatus(EXAM_STATUS.SUBMITTING)} disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-black text-xl py-5 rounded-2xl transition shadow-xl">
            {isSubmitting ? '⏳ Yuborilmoqda...' : '✅ Imtihonni Topshirish'}
          </button>
          <p className="text-center text-gray-400 text-xs mt-3">
            So&apos;zlar: G1.1={counts.task1} · G1.2={counts.task2} · Kompozisyon={counts.essay}
          </p>
        </div>
      </div>
    </div>
  );
}
