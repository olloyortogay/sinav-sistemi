'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';
import { placementQuestions } from '../../../src/data/placementQuestions';
import { supabase, getPublicUrl } from '../../../lib/supabase';
import TelegramLoginWidget from '../../../components/TelegramLoginWidget';
import Navbar from '../../../components/Navbar';

export default function PlacementExamPage() {
  const router = useRouter();

  // ── App State Machine ──────────────────────────────────────────────────────
  // States: LOGIN | GATEWAY | EXAM | UPLOADING | FINISHED
  const [appState, setAppState] = useState('LOGIN');

  // User Session Handling
  const [sessionUser, setSessionUser] = useState(null); // { id, name, email, provider, rawData }
  const isPreloadedAuthRef = useRef(false);

  // Exam States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [examResult, setExamResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const hasSavedRef = useRef(false);
  
  const [totalElapsed, setTotalElapsed] = useState(0);
  const totalTimerRef = useRef(null);
  const [showExitModal, setShowExitModal] = useState(false);

  // ── Initialization (Auth) ─────────────────────────────────────────
  useEffect(() => {
    // Supabase Google (OAuth) Oturum Kontrolü
    const checkSupabaseSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        isPreloadedAuthRef.current = true;
        setSessionUser({
          provider: 'google',
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email,
          email: session.user.email,
          rawData: session.user
        });
      }
    };
    checkSupabaseSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionUser({
          provider: 'google',
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email,
          email: session.user.email,
          rawData: session.user
        });
      }
    });

    try {
      const tgUser = localStorage.getItem('tg_session');
      if (tgUser) {
        isPreloadedAuthRef.current = true;
        setSessionUser(JSON.parse(tgUser));
      }
    } catch (e) { }

    return () => subscription.unsubscribe();
  }, []);

  // Giriş akışı kontrolü
  useEffect(() => {
    if (!sessionUser || appState !== 'LOGIN') return;

    const notifyKey = `notified_login_placement_${sessionUser.id}`;
    const alreadyNotified = localStorage.getItem(notifyKey);

    if (isPreloadedAuthRef.current) {
      setAppState('GATEWAY');
    } else {
      if (!alreadyNotified) {
        localStorage.setItem(notifyKey, 'true');
        fetch('/api/notifyLogin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: sessionUser, provider: sessionUser.provider })
        }).catch(() => {}).finally(() => {
          setAppState('GATEWAY');
        });
      } else {
        setAppState('GATEWAY');
      }
    }
  }, [sessionUser, appState]);

  // ── Auth Handlers ────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin + '/exam/placement' : ''
      }
    });
    if (error) alert("Google ile giriş yapılamadı: " + error.message);
  };

  const handleTelegramAuth = (telegramUser) => {
    const userObj = {
      provider: 'telegram',
      id: telegramUser.id,
      name: telegramUser.first_name + (telegramUser.last_name ? ' ' + telegramUser.last_name : ''),
      email: null,
      telegramUsername: telegramUser.username ? '@' + telegramUser.username : null,
      rawData: telegramUser
    };
    setSessionUser(userObj);
    localStorage.setItem('tg_session', JSON.stringify(userObj));
  };

  const handleLogout = async () => {
    if (sessionUser?.provider === 'google') {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('tg_session');
    setSessionUser(null);
    setAppState('LOGIN');
  };

  // ── SÜRE KONTROLÜ (2 SAAT) ────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState(7200); // 2 saat = 7200 saniye
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    if (appState !== 'EXAM' || isTimeUp) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [appState, isTimeUp]);

  // Süre dolduğunda otomatik bitir
  useEffect(() => {
    if (isTimeUp && appState === 'EXAM') {
      finishAndUploadExam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimeUp, appState]);

  // ── SORULARI 3'LÜ GRUPLAMA ────────────────────────────────────────────────
  const chunkedQuestions = useMemo(() => {
    const result = [];
    let currentGroup = [];

    placementQuestions.forEach((q) => {
      const isSingle = q.type === 'multiple_choice' || q.type === 'true_false' || (!q.type && q.options);
      
      if (isSingle) {
        currentGroup.push(q);
        if (currentGroup.length === 3) {
          result.push({
            id: `grouped_${result.length}`,
            type: 'question_group',
            questions: currentGroup
          });
          currentGroup = [];
        }
      } else {
        if (currentGroup.length > 0) {
          result.push({
            id: `grouped_${result.length}`,
            type: 'question_group',
            questions: currentGroup
          });
          currentGroup = [];
        }
        result.push(q);
      }
    });

    if (currentGroup.length > 0) {
      result.push({
        id: `grouped_${result.length}`,
        type: 'question_group',
        questions: currentGroup
      });
    }
    return result;
  }, []);

  const currentQuestion = chunkedQuestions[currentIndex];
  const totalQuestions = chunkedQuestions.length;

  // Dinleme kısıtlaması (Audio play tracking)
  const [audioPlayCounts, setAudioPlayCounts] = useState({});
  const audioRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioHasEnded, setAudioHasEnded] = useState(false);

  // ── Anti-Copy Kalkanı ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'u')) || 
        e.key === 'F12'
      ) {
        e.preventDefault();
        alert("⚠️ BU SAYFADA KOPYALAMA VE KAYNAK KODU GÖRÜNTÜLEME YASAKTIR!");
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // ── Ses Durumu Sıfırlama ──────────────────────────────────────────────────
  useEffect(() => {
    setIsPlaying(false);
    setAudioProgress(0);
    setAudioCurrentTime(0);
    setAudioDuration(0);
    setAudioHasEnded(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load(); // Force load the new source
    }
  }, [currentIndex]);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "00:00";
    const m = Math.floor(time / 60).toString().padStart(2, '0');
    const s = Math.floor(time % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatTimer = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return h === '00' ? `${m}:${s}` : `${h}:${m}:${s}`;
  };

  // ── Soru Yükleme Hatası / Sentry ──────────────────────────────────────────
  useEffect(() => {
    if (!currentQuestion && appState === 'EXAM' && chunkedQuestions.length > 0) {
      const error = new Error(`Soru yüklenemedi: index ${currentIndex}`);
      console.error(error);
      Sentry.captureException(error);
    }
  }, [currentQuestion, currentIndex, appState, chunkedQuestions]);

  // ── Audio Oynatma Sınırı ──────────────────────────────────────────────────
  const handlePlayAudio = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    const currentCount = audioPlayCounts[currentQuestion?.id] || 0;
    
    if (audioCurrentTime === 0 || audioHasEnded) {
      if (currentCount >= 2) return;
      
      setAudioPlayCounts(prev => ({
        ...prev,
        [currentQuestion.id]: currentCount + 1
      }));
      
      audioRef.current.currentTime = 0;
      setAudioHasEnded(false);
    }
    
    audioRef.current.play().catch(e => {
      console.error("Audio play hatası:", e);
      Sentry.captureException(e);
    });
    setIsPlaying(true);
  };

  const playCount = audioPlayCounts[currentQuestion?.id] || 0;
  const maxPlays = 2;

  // ── Cevaplama ─────────────────────────────────────────────────────────────
  const handleAnswerSelect = (qId, value) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: value
    }));
  };

  // ── İleri Geçiş Kontrolü ──────────────────────────────────────────────────
  const canGoNext = () => {
    if (!currentQuestion) return false;
    const type = currentQuestion.type;
    
    if (type === 'reading_group' || type === 'audio_group' || type === 'visual_group' || type === 'question_group') {
      return currentQuestion.questions.every(q => answers[q.id] !== undefined && answers[q.id] !== '');
    }
    
    if (type === 'cloze_test') {
      const blanks = currentQuestion.segments.filter(seg => seg.options);
      return blanks.every(b => answers[b.id] !== undefined && answers[b.id] !== '');
    }
    
    if (type === 'multiple_choice' || type === 'true_false') {
      return answers[currentQuestion.id] !== undefined && answers[currentQuestion.id] !== '';
    }
    
    if (type === 'matching') {
      const matchingAnswers = answers[currentQuestion.id] || {};
      return currentQuestion.pairs.every((_, idx) => matchingAnswers[idx] !== undefined && matchingAnswers[idx] !== '');
    }

    return false;
  };

  const handleNext = () => {
    if (!canGoNext()) {
      alert("Lütfen ilerlemeden önce tüm soruları cevaplayın!");
      return;
    }
    if (currentIndex < chunkedQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      finishAndUploadExam();
    }
  };

  const startExamContent = () => {
    setAppState('EXAM');
    totalTimerRef.current = setInterval(() => setTotalElapsed(p => p + 1), 1000);
  };

  // ── Puan Hesaplama ve Veritabanı Kaydı ──────────────────────────────────────
  const finishAndUploadExam = async () => {
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;
    
    setAppState('UPLOADING');
    setUploadError(null);

    // Puan Hesaplama Modülü (1 Soru = 1 Puan, Toplam 100)
    let score = 0;
    const detailedResults = []; // Hangi soruda hata yapıldığını tutmak için

    placementQuestions.forEach(q => {
      if (q.type === 'reading_group' || q.type === 'audio_group' || q.type === 'visual_group') {
        q.questions.forEach(subQ => {
          const isCorrect = answers[subQ.id] === subQ.correctAnswer;
          if (isCorrect) score += 1;
          detailedResults.push({ questionId: subQ.id, questionText: subQ.question, userAnswer: answers[subQ.id], correctAnswer: subQ.correctAnswer, isCorrect });
        });
      } else if (q.type === 'cloze_test') {
        q.segments.forEach(seg => {
          if (seg.options) {
            const isCorrect = answers[seg.id] === seg.correctAnswer;
            if (isCorrect) score += 1;
            detailedResults.push({ questionId: seg.id, questionText: `Boşluk Doldurma (${q.id})`, userAnswer: answers[seg.id], correctAnswer: seg.correctAnswer, isCorrect });
          }
        });
      } else if (q.type === 'multiple_choice' || q.type === 'true_false') {
        const isCorrect = answers[q.id] === q.correctAnswer;
        if (isCorrect) score += 1;
        detailedResults.push({ questionId: q.id, questionText: q.question, userAnswer: answers[q.id], correctAnswer: q.correctAnswer, isCorrect });
      } else if (q.type === 'matching') {
        q.pairs.forEach((pair, idx) => {
          const isCorrect = answers[q.id] && answers[q.id][idx] === pair.a;
          if (isCorrect) score += 1;
          detailedResults.push({ questionId: `${q.id}_${idx}`, questionText: pair.q, userAnswer: answers[q.id]?.[idx], correctAnswer: pair.a, isCorrect });
        });
      }
    });

    // CEFR Seviye Belirleme (0-20: A1, 21-40: A2, 41-60: B1, 61-80: B2, 81-100: C1)
    let level = 'A1';
    if (score >= 21 && score <= 40) level = 'A2';
    else if (score >= 41 && score <= 60) level = 'B1';
    else if (score >= 61 && score <= 80) level = 'B2';
    else if (score >= 81 && score <= 100) level = 'C1';

    setExamResult({ score, level });

    try {
      const rawUserName = sessionUser?.name || 'Bilinmeyen_Ogrenci';
      const userEmail = sessionUser?.email || null;
      
      const payload = {
        userName: rawUserName,
        userEmail: userEmail,
        telegramAuthId: sessionUser?.provider === 'telegram' ? sessionUser.id : null,
        telegramUsername: sessionUser?.telegramUsername || null,
        variantNo: 'placement_exam',
        totalTime: totalElapsed,
        score: score,
        level: level,
        sections: { answers, detailedResults }
      };

      const res = await fetch('/api/saveResult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error("Sınav sonucu kaydedilirken veritabanı hatası oluştu.");
      }

      // E-posta bildirimi (Google ile girilmişse)
      if (userEmail) {
        try {
          await fetch('/api/sendResultEmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userName: rawUserName,
              userEmail: userEmail,
              totalTime: totalElapsed,
              score: score,
              level: level
            }),
          });
        } catch (mailErr) {
          console.error("E-posta gönderim hatası (devam ediyoruz):", mailErr);
        }
      }

    } catch (error) {
      console.error("Kayıt hatası:", error);
      Sentry.captureException(error);
      setUploadError(error.message);
    }

    setAppState('FINISHED');
  };

  // ── Render Helpers (Soru İçeriği) ─────────────────────────────────────────
  const renderSingleQuestion = (q) => {
    const type = q.type || (q.options && q.options.length === 2 && q.options.includes('Doğru') ? 'true_false' : 'multiple_choice');

    if (type === 'multiple_choice') {
      return (
        <div className="space-y-3 mt-2">
          {q.question && <p className="font-extrabold text-gray-800 mb-4 text-lg">{q.question}</p>}
          {q.options.map((option, idx) => (
            <label key={idx} className="flex items-center gap-3 p-4 border rounded-xl hover:bg-blue-50 cursor-pointer transition">
              <input 
                type="radio" 
                name={`q-${q.id}`} 
                value={option}
                checked={answers[q.id] === option}
                onChange={() => handleAnswerSelect(q.id, option)}
                className="w-5 h-5 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 font-medium">{option}</span>
            </label>
          ))}
        </div>
      );
    }

    if (type === 'true_false') {
      return (
        <div className="mt-2">
          {q.question && <p className="font-extrabold text-gray-800 mb-4 text-lg">{q.question}</p>}
          <div className="flex gap-4">
            <button 
              onClick={() => handleAnswerSelect(q.id, 'Doğru')}
              className={`flex-1 py-4 font-bold rounded-xl transition ${answers[q.id] === 'Doğru' ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-green-100'}`}
            >
              Doğru
            </button>
            <button 
              onClick={() => handleAnswerSelect(q.id, 'Yanlış')}
              className={`flex-1 py-4 font-bold rounded-xl transition ${answers[q.id] === 'Yanlış' ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-red-100'}`}
            >
              Yanlış
            </button>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const renderQuestionContent = () => {
    if (!currentQuestion) return null;
    const type = currentQuestion.type;

    if (type === 'reading_group' || type === 'audio_group' || type === 'visual_group' || type === 'question_group') {
      return (
        <div className="space-y-6 mt-4">
          {currentQuestion.questions.map((subQ) => (
            <div key={subQ.id} className="p-6 bg-gray-50/50 rounded-2xl border shadow-sm">
              {renderSingleQuestion(subQ)}
            </div>
          ))}
        </div>
      );
    }

    if (type === 'cloze_test') {
      return (
        <div className="p-8 bg-white rounded-2xl border shadow-sm leading-loose text-xl text-gray-800 mt-4">
          {currentQuestion.segments.map((seg, idx) => {
            if (seg.options) {
              return (
                <select 
                  key={seg.id || idx}
                  className={`mx-2 p-2 border-2 rounded-lg font-bold outline-none cursor-pointer transition ${answers[seg.id] ? 'border-green-400 bg-green-50 text-green-800' : 'border-blue-400 bg-blue-50 text-blue-800 focus:ring-2 focus:ring-blue-500'}`}
                  value={answers[seg.id] || ''}
                  onChange={(e) => handleAnswerSelect(seg.id, e.target.value)}
                >
                  <option value="" disabled>Seçiniz</option>
                  {seg.options.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              );
            }
            return <span key={idx}>{seg.text}</span>;
          })}
        </div>
      );
    }

    if (type === 'multiple_choice' || type === 'true_false') {
      return (
        <div className="mt-4">
           {renderSingleQuestion(currentQuestion)}
        </div>
      );
    }

    if (type === 'matching') {
      return (
        <div className="mt-4 space-y-4">
          {currentQuestion.question && <p className="font-extrabold text-gray-800 mb-4">{currentQuestion.question}</p>}
          {currentQuestion.pairs.map((pair, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl border">
              <span className="font-semibold text-gray-700">{pair.q}</span>
              <select 
                className={`p-2 border-2 rounded-lg outline-none transition ${answers[currentQuestion.id]?.[idx] ? 'border-green-400 bg-green-50 font-bold' : 'bg-white'}`}
                value={(answers[currentQuestion.id] || {})[idx] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setAnswers(prev => {
                    const currentMatching = prev[currentQuestion.id] || {};
                    return {
                      ...prev,
                      [currentQuestion.id]: {
                        ...currentMatching,
                        [idx]: val
                      }
                    };
                  });
                }}
              >
                <option value="">Seçiniz...</option>
                {currentQuestion.pairs.map((p, i) => (
                  <option key={i} value={p.a}>{p.a}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      );
    }

    return <p className="text-gray-500 mt-4">Bu soru tipi desteklenmiyor.</p>;
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  if (appState === 'LOGIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-blue-100">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo.webp" alt="Türk Dünyası" className="w-24 h-24 object-contain" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-800 mb-1">Seviye Tespit Sınavı</h1>
            <p className="text-blue-600 font-semibold">Türk Dünyası Türkçe Yeterlilik</p>
            <p className="text-sm text-gray-400 mt-1">Sınava başlamak için giriş yapın</p>
          </div>

          <div className="space-y-4 flex flex-col items-center">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 active:scale-95 text-gray-700 font-semibold py-3 px-4 rounded-xl text-lg transition-all shadow-sm"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                <path fill="none" d="M1 1h22v22H1z" />
              </svg>
              Google ile Giriş
            </button>

            <div className="w-full flex items-center gap-3 my-4 opacity-70">
              <div className="h-px bg-gray-300 flex-1"></div>
              <span className="text-gray-400 text-sm font-semibold uppercase">veya</span>
              <div className="h-px bg-gray-300 flex-1"></div>
            </div>

            <TelegramLoginWidget
              botName={process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || 'turkdunyasi_bot'}
              onAuth={handleTelegramAuth}
            />

            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl w-full text-center">
              <p className="text-sm text-blue-800 font-semibold mb-2">
                Natijalarni Telegram orqali olish uchun botimizni ishga tushiring:<br/>
                <span className="text-xs text-blue-600 font-normal">Sonuçları Telegram'dan almak için botumuzu başlatın:</span>
              </p>
              <a href="https://t.me/TurkDunyasiSinavBot" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#2AABEE] hover:bg-[#229ED9] text-white font-bold py-2 px-4 rounded-lg transition shadow-sm text-sm">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.11.03-1.84 1.18-5.2 3.45-.49.34-.94.51-1.34.5-.44-.01-1.28-.24-1.9-.45-.77-.25-1.38-.38-1.33-.8.02-.22.33-.45.92-.69 3.61-1.57 6.02-2.61 7.23-3.1 3.44-1.42 4.15-1.68 4.62-1.69.1 0 .33.02.46.12.11.08.13.19.14.28z"/></svg>
                @TurkDunyasiSinavBot
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── GATEWAY ─────────────────────────────────────────────────────────────
  if (appState === 'GATEWAY') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col font-sans relative">
        <header className="px-4 sm:px-6 py-4 flex justify-between items-center w-full max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-white font-bold text-lg sm:text-xl tracking-wide">
            <span className="bg-white text-blue-700 rounded-lg px-2 py-1 text-sm">TD</span>
            <span className="hidden sm:inline">Türk Dünyası</span>
          </div>
          <div className="flex gap-2 sm:gap-3 text-sm sm:text-base">
            <a href="/" className="bg-blue-800/40 hover:bg-blue-800/60 border border-blue-500/30 text-white font-semibold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition backdrop-blur-sm">
              Ana Sayfa
            </a>
            <a href="/profile" className="bg-white hover:bg-blue-50 text-blue-700 font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-md transition">
              Profilim
            </a>
            <button onClick={handleLogout} className="bg-red-500/80 hover:bg-red-500 border border-red-400 text-white font-semibold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition backdrop-blur-sm">
              Çıkış
            </button>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 text-center">
          <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-2xl max-w-lg w-full border border-gray-100 relative">
            <div className="text-6xl mb-6">🎯</div>
            <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Hazır mısınız?</h2>
            <p className="text-gray-600 mb-6 font-medium text-lg">
              Hoş geldiniz, <strong>{sessionUser?.name}</strong>!
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-8 text-left text-sm text-blue-800 space-y-3">
              <p>• Bu sınav toplam <strong>100 sorudan</strong> oluşmaktadır.</p>
              <p>• Sınav süresi <strong>2 Saattir (120 dakika)</strong>.</p>
              <p>• Sınav bitiminde sonuçlarınız ve CEFR seviyeniz anında hesaplanıp ekranda gösterilecektir.</p>
              <p>• Lütfen kopya çekmeyiniz; sayfa değişikliği ve kopyalama kısıtlanmıştır.</p>
            </div>
            <button
              onClick={startExamContent}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-8 rounded-2xl text-xl shadow-lg hover:shadow-blue-300 hover:scale-105 active:scale-95 transition-all"
            >
              Sınava Başla
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── UPLOADING ─────────────────────────────────────────────────────────────
  if (appState === 'UPLOADING') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md w-full text-center border border-blue-100">
          <div className="text-6xl mb-6 animate-pulse">⚙️</div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-3">Sonuçlar Hesaplanıyor...</h2>
          <p className="text-gray-500 mb-8">Lütfen bekleyin, verileriniz kaydediliyor.</p>
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
          <p className="text-sm text-gray-400 font-medium">Bu işlem birkaç saniye sürebilir, sayfayı kapatmayın.</p>
        </div>
      </div>
    );
  }

  // ── FINISHED ──────────────────────────────────────────────────────────────
  if (appState === 'FINISHED') {
    return (
      <div className="min-h-screen flex flex-col bg-[#FDFDFD] font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 max-w-2xl w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-br from-blue-500 to-purple-600 -z-10 opacity-10"></div>
          
          <div className="animate-fade-in relative z-10">
            <div className="mb-6 inline-block">
              <span className="text-7xl drop-shadow-md">🏆</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Sınav Tamamlandı!</h1>
            <p className="text-gray-500 mb-10 font-medium text-lg">Türk Dünyası Seviye Tespit Sınavı sonuçlarınız başarıyla kaydedildi.</p>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2rem] p-8 mb-10 border border-blue-100 shadow-sm relative overflow-hidden">
              <div className="absolute -top-10 -right-10 text-blue-100 opacity-50 rotate-12">
                <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              
              <p className="text-sm font-bold text-blue-800 tracking-widest uppercase mb-2 relative z-10">TÜRKÇE SEVİYENİZ</p>
              <div className="text-[5rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-6 drop-shadow-sm relative z-10">
                {examResult?.level || 'A1'}
              </div>
              
              <div className="w-full bg-blue-100/50 rounded-full h-4 mb-3 overflow-hidden border border-blue-100/50 relative z-10 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${examResult?.score || 0}%` }}
                >
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-white/30 blur-md"></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center px-1 relative z-10">
                <span className="text-sm font-bold text-gray-400">0</span>
                <span className="text-xl font-extrabold text-blue-900 bg-white px-4 py-1 rounded-full shadow-sm">{examResult?.score || 0} / 100 Doğru</span>
                <span className="text-sm font-bold text-gray-400">100</span>
              </div>
            </div>

            {uploadError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-600 text-left">
                <strong>Hata:</strong> {uploadError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => router.push('/exam/speaking')}
                className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-4 px-8 rounded-2xl transition shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Konuşma Sınavına Geç</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
              <button 
                onClick={() => router.push('/profile')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl transition shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Natijalarim (Profil)</span>
              </button>
              <button 
                onClick={() => router.push('/')}
                className="flex-1 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-4 px-8 rounded-2xl transition active:scale-95"
              >
                Ana Sayfaya Dön
              </button>
            </div>
          </div>
          <style jsx>{`
            @keyframes fade-in {
              from { opacity: 0; transform: scale(0.95) translateY(10px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .animate-fade-in {
              animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
        </div>
        </div>
      </div>
    );
  }

  // ── EXAM (ANA SINAV EKRANI) ───────────────────────────────────────────────
  if (!currentQuestion) {
    return <div className="p-10 text-center font-bold text-gray-500">Soru yükleniyor...</div>;
  }

  const progressPercentage = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <div 
      className="min-h-screen bg-gray-100 flex flex-col font-sans select-none"
      style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none' }}
    >
      {/* ── Çıkış Uyarı Modalı ────────────────────────────────────────────── */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border border-gray-100">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-3">Sınavdan Çıkmak İstiyor musunuz?</h3>
            <p className="text-gray-500 font-medium mb-8">
              Eğer çıkış yaparsanız tüm ilerlemeniz ve verdiğiniz cevaplar tamamen iptal edilecek ve kaydedilmeyecektir.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all active:scale-95"
              >
                İptal Et
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-red-200 transition-all active:scale-95"
              >
                Evet, Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="w-full bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="h-2 w-full bg-gray-200">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-out" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="px-6 py-3 flex justify-between items-center max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <span className="font-bold text-blue-800 text-lg hidden sm:block">Sınav Motoru</span>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded hidden sm:inline-block">
              {sessionUser?.name}
            </span>
          </div>
          
          <div className="flex gap-4 items-center w-full sm:w-auto justify-between sm:justify-end">
            <button 
              onClick={() => setShowExitModal(true)}
              className="font-bold px-4 py-1 rounded-full text-sm flex items-center gap-2 bg-red-100 text-red-600 hover:bg-red-200 transition"
            >
              Sınavdan Çık
            </button>
            <span className={`font-bold px-4 py-1 rounded-full text-sm flex items-center gap-2 ${timeLeft < 300 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-700'}`}>
              ⏳ {formatTimer(timeLeft)}
            </span>
            <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Bölüm {currentIndex + 1} / {totalQuestions}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 mt-4">
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
          
          {(currentQuestion.instruction || currentQuestion.context) && (
            <div className="bg-amber-50 p-6 border-b border-amber-100">
              {currentQuestion.instruction && (
                <p className="text-amber-800 font-bold mb-3">{currentQuestion.instruction}</p>
              )}
              {currentQuestion.context && (
                <div className="bg-white p-5 rounded-xl shadow-inner text-gray-800 leading-relaxed text-lg border border-amber-200">
                  {currentQuestion.context}
                </div>
              )}
            </div>
          )}

          {currentQuestion.mediaType === 'image' && currentQuestion.mediaUrl && (
            <div className="w-full bg-gray-50 border-b flex justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={getPublicUrl(currentQuestion.mediaUrl)} 
                alt="Soru Görseli" 
                className="max-h-80 object-contain rounded-lg shadow-sm"
              />
            </div>
          )}

          {currentQuestion.mediaType === 'audio' && currentQuestion.mediaUrl && (
            <div className="w-full bg-blue-50 border-b p-6 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
              </div>
              <audio 
                ref={audioRef} 
                src={getPublicUrl(currentQuestion.mediaUrl)}
                className="hidden" 
                onTimeUpdate={(e) => {
                  const curr = e.target.currentTime;
                  const dur = e.target.duration || 1;
                  setAudioCurrentTime(curr);
                  setAudioProgress((curr / dur) * 100);
                }}
                onLoadedMetadata={(e) => setAudioDuration(e.target.duration)}
                onEnded={() => {
                  setIsPlaying(false);
                  setAudioHasEnded(true);
                }}
              />
              
              <div className="w-full max-w-md bg-white rounded-2xl p-4 shadow-sm border mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-gray-500 w-10 text-right">{formatTime(audioCurrentTime)}</span>
                  <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-200 ease-linear"
                      style={{ width: `${audioProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-500 w-10">{formatTime(audioDuration)}</span>
                </div>
              </div>

              <button
                onClick={handlePlayAudio}
                disabled={!isPlaying && audioHasEnded && playCount >= maxPlays}
                className={`px-8 py-3 rounded-full font-bold text-lg shadow-md transition-all flex items-center gap-3 ${
                  (!isPlaying && audioHasEnded && playCount >= maxPlays)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isPlaying 
                      ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isPlaying ? (
                  <>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    Duraklat
                  </>
                ) : (!isPlaying && audioHasEnded && playCount >= maxPlays) ? (
                  <>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                    Dinleme Hakkınız Bitti
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    Ses Kaydını Dinle
                  </>
                )}
              </button>
              <p className="text-sm font-semibold text-gray-500 mt-4">
                Kalan dinleme hakkı: <span className="text-blue-600">{Math.max(0, maxPlays - playCount)}</span>
              </p>
            </div>
          )}

          <div className="p-6 sm:p-10">
            {renderQuestionContent()}
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 pb-10">
          <div></div>
          
          <button 
            onClick={handleNext}
            disabled={!canGoNext()}
            className={`font-bold text-lg px-12 py-4 rounded-xl shadow-lg transition-all flex items-center gap-2 ${
              canGoNext() 
                ? 'bg-gray-800 hover:bg-gray-900 text-white active:scale-95' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={!canGoNext() ? 'Lütfen önce tüm soruları cevaplayın' : ''}
          >
            {currentIndex === chunkedQuestions.length - 1 ? 'Sınavı Bitir' : 'İleri'}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
