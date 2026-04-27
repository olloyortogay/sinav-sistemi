'use client';

import { useEffect, useRef, useState } from 'react';
import AuthGate from '../../../components/AuthGate';
import Navbar from '../../../components/Navbar';
import ListeningSection from '../../../components/ListeningSection';
import { supabase } from '../../../lib/supabase';
import { listeningAnswerKey } from '../../../src/data/listeningQuestions';

// Geçici mod: local test için kayıt zorunluluğunu kaldırır.
// Test bitince false yaparak eski davranışı geri alabilirsiniz.
const TEMP_ALLOW_GUEST_LISTENING = false;

function extractChoiceLetter(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).toUpperCase();
  const match = text.match(/[A-H]/);
  return match ? match[0] : null;
}

export default function ListeningExamPage() {
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
        }
      } catch {}

      if (TEMP_ALLOW_GUEST_LISTENING) {
        setSessionUser({
          provider: 'guest',
          id: 'guest-listening-local',
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

  const onSubmitExam = async ({ sections, exited = false }) => {
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
    const rawDetailedResults = sections?.detailedResults || [];
    const detailedResults = rawDetailedResults.map((item) => {
      const questionNo = Number(item?.questionId);
      const userLetter = extractChoiceLetter(item?.userAnswer);
      const correctLetter = listeningAnswerKey[questionNo] || null;
      const isCorrect = Boolean(userLetter && correctLetter && userLetter === correctLetter);
      return {
        ...item,
        correctAnswer: correctLetter,
        isCorrect,
      };
    });
    const correctCount = detailedResults.filter((item) => item.isCorrect).length;
    const totalQuestionCount = detailedResults.length || 35;
    const score = Math.round((correctCount / Math.max(totalQuestionCount, 1)) * 100);

    let level = 'A1';
    if (score >= 21 && score <= 40) level = 'A2';
    else if (score >= 41 && score <= 60) level = 'B1';
    else if (score >= 61 && score <= 80) level = 'B2';
    else if (score >= 81 && score <= 100) level = 'C1';

    const scoredSections = {
      ...(sections || {}),
      detailedResults,
      scoreSummary: {
        correctCount,
        totalQuestionCount,
      },
    };

    try {
      const res = await fetch('/api/saveResult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: sessionUser?.name || 'Bilinmeyen',
          userEmail: sessionUser?.email || null,
          telegramAuthId: sessionUser?.provider === 'telegram' ? sessionUser.id : null,
          telegramUsername: sessionUser?.telegramUsername || null,
          variantNo: 'listening_exam',
          totalTime,
          score,
          level,
          sections: scoredSections,
          student_id: sessionUser?.student_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.message || 'Dinleme sınavı kaydedilemedi.');

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
              examType: 'listening',
            }),
          });
        } catch (mailErr) {
          console.error('Listening sonucu e-posta hatası (devam ediyoruz):', mailErr);
        }
      }

      setResultSummary({ correctCount, totalQuestionCount, score, level });
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
        redirectTo="/exam/listening"
        title="Dinleme Sınavı"
        subtitle="Dinleme sınavına başlamak için giriş yapın"
      />
    );
  }

  if (appState === 'READY') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 max-w-xl w-full text-center shadow-2xl">
          <h1 className="text-3xl font-black text-gray-900 mb-3">Dinleme Sınavı</h1>
          <p className="text-gray-600 mb-8">Hazır olduğunuzda sınavı başlatın. Ses bitince 10 dakikalık cevap süresi başlayacaktır.</p>
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
            <h2 className="text-2xl font-black mb-2">Dinleme sınavı tamamlandı</h2>
            <p className="text-gray-600">Sonuç kaydı oluşturuldu ve Telegram bildirimleri gönderildi.</p>
            {resultSummary && (
              <div className="mt-4 inline-flex items-center gap-2 bg-indigo-50 text-indigo-800 text-sm font-bold px-3 py-2 rounded-xl border border-indigo-200 shadow-sm">
                📊 Doğru: {resultSummary.correctCount}/{resultSummary.totalQuestionCount} | Puan: {resultSummary.score} | Seviye: {resultSummary.level}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <a 
                href="/exam/speaking"
                className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-4 px-6 rounded-2xl transition shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Sonraki Sınav (Konuşma)</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </a>
              <a 
                href="/profile"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl transition shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Natijalarim (Profil)</span>
              </a>
              <a 
                href="/"
                className="flex-1 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-4 px-6 rounded-2xl transition active:scale-95 flex items-center justify-center"
              >
                Ana Sayfaya Dön
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <Navbar />
      <main className="max-w-5xl mx-auto p-4 sm:p-6">
        {uploadError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{uploadError}</div>
        )}
        {uploading && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl">Kaydediliyor...</div>
        )}
        <ListeningSection onSubmit={onSubmitExam} disabled={uploading} />
      </main>
    </div>
  );
}
