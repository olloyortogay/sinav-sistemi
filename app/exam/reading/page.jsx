'use client';

import { useEffect, useRef, useState } from 'react';
import AuthGate from '../../../components/AuthGate';
import Navbar from '../../../components/Navbar';
import ReadingSection from '../../../components/ReadingSection';
import { supabase } from '../../../lib/supabase';

// Geçici mod: local test için kayıt zorunluluğunu kaldırır.
const TEMP_ALLOW_GUEST_READING = false;

export default function ReadingExamPage() {
  const [appState, setAppState] = useState('LOGIN');
  const [sessionUser, setSessionUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);
  const startRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSessionUser({
          provider: 'google',
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email,
          email: session.user.email,
        });
        setAppState('READY');
        return;
      }
      try {
        const raw = localStorage.getItem('tg_session');
        if (raw) {
          setSessionUser(JSON.parse(raw));
          setAppState('READY');
          return;
        }
      } catch {}

      if (TEMP_ALLOW_GUEST_READING) {
        setSessionUser({
          provider: 'guest',
          id: 'guest-reading-local',
          name: 'Misafir Kullanici',
          email: null,
        });
        setAppState('READY');
      }
    };
    init();
  }, []);

  const onAuthSuccess = (user) => {
    setSessionUser(user);
    setAppState('READY');
  };

  const onStart = () => {
    startRef.current = Date.now();
    setAppState('EXAM');
  };

  const onSubmitExam = async ({ sections, exited = false, score, level, correctCount, totalQuestionCount }) => {
    if (exited) {
      setUploadError(null);
      setUploading(false);
      setSubmitted(false);
      setResultSummary(null);
      startRef.current = null;
      setAppState('READY');
      return;
    }
    if (submitted) return;
    setSubmitted(true);
    setUploading(true);
    setUploadError(null);

    const totalTime = startRef.current ? Math.floor((Date.now() - startRef.current) / 1000) : 0;
    try {
      const res = await fetch('/api/saveResult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: sessionUser?.name || 'Bilinmeyen',
          userEmail: sessionUser?.email || null,
          telegramAuthId: sessionUser?.provider === 'telegram' ? sessionUser.id : null,
          telegramUsername: sessionUser?.telegramUsername || null,
          variantNo: 'reading_exam',
          totalTime,
          score,
          level,
          sections,
          student_id: sessionUser?.student_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.message || 'Okuma sınavı kaydedilemedi.');

      if (sessionUser?.email) {
        try {
          await fetch('/api/sendResultEmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userName: sessionUser?.name || 'Bilinmeyen',
              userEmail: sessionUser.email,
              totalTime,
              score,
              level,
              correctCount,
              totalQuestionCount,
              examType: 'reading',
            }),
          });
        } catch (mailErr) {
          console.error('Reading sonucu e-posta hatası (devam ediyoruz):', mailErr);
        }
      }

      setResultSummary({
        correctCount,
        totalQuestionCount,
        wrongCount: Math.max((totalQuestionCount || 35) - (correctCount || 0), 0),
        score,
        level,
      });
      setAppState('FINISHED');
    } catch (e) {
      setUploadError(e.message);
      setSubmitted(false);
    } finally {
      setUploading(false);
    }
  };

  if (appState === 'LOGIN') {
    return (
      <AuthGate
        onSuccess={onAuthSuccess}
        redirectTo="/exam/reading"
        title="Okuma Sınavı"
        subtitle="Okuma sınavına başlamak için giriş yapın"
      />
    );
  }

  if (appState === 'READY') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 max-w-xl w-full text-center shadow-2xl">
          <h1 className="text-3xl font-black text-gray-900 mb-3">Okuma Sınavı</h1>
          <p className="text-gray-600 mb-8">Hazır olduğunuzda sınavı başlatın. Süre 60 dakikadır.</p>
          <button onClick={onStart} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl">
            Sınavı Başlat
          </button>
        </div>
      </div>
    );
  }

  if (appState === 'FINISHED') {
    return (
      <div className="min-h-screen bg-[#FDFDFD]">
        <Navbar />
        <div className="max-w-3xl mx-auto p-8">
          <div className="bg-white border rounded-3xl p-10 text-center shadow">
            <div className="text-6xl mb-3">✅</div>
            <h2 className="text-2xl font-black mb-2">Okuma sınavı tamamlandı</h2>
            <p className="text-gray-600">Sonuç kaydı oluşturuldu ve Telegram/E-posta bildirimleri işlendi.</p>
            {resultSummary && (
              <div className="mt-4 inline-flex items-center gap-2 bg-indigo-50 text-indigo-800 text-sm font-bold px-3 py-2 rounded-xl border border-indigo-200 shadow-sm">
                📊 Doğru: {resultSummary.correctCount}/{resultSummary.totalQuestionCount} | Yanlış: {resultSummary.wrongCount} | Puan: {resultSummary.score} | Seviye: {resultSummary.level}
              </div>
            )}
            <a href="/profile" className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl">Natijalarim</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <Navbar />
      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        {uploadError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{uploadError}</div>
        )}
        {uploading && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl">Kaydediliyor...</div>
        )}
        <ReadingSection onSubmit={onSubmitExam} disabled={uploading} />
      </main>
    </div>
  );
}
