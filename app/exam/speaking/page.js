'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { generateExam } from '../../data/questions';
import { supabase } from '../../../lib/supabase';
import TelegramLoginWidget from '../../../components/TelegramLoginWidget';
import { useLanguage } from '../../../lib/LanguageContext';

export default function ExamInterface() {
  // ── App State Machine ──────────────────────────────────────────────────────
  // States: LOGIN | MIC_CHECK | GATEWAY | EXAM | UPLOADING | FINISHED
  const [appState, setAppState] = useState('LOGIN');

  // User Session Handling
  const [sessionUser, setSessionUser] = useState(null); // { id, name, email, provider, rawData }
  const { t } = useLanguage();

  // ── Exam State ─────────────────────────────────────────────────────────────
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase] = useState('prep'); // 'prep' | 'speak'
  const [timeLeft, setTimeLeft] = useState(0);
  const [fontSizeRatio, setFontSizeRatio] = useState(1);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [activeVariant, setActiveVariant] = useState('random');
  const [isOffline, setIsOffline] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ── Dark Mode Katmanı ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('app-dark-mode');
    } else {
      document.documentElement.classList.remove('app-dark-mode');
    }
  }, [isDarkMode]);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const allRecordingsRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const totalTimerRef = useRef(null);


  // ── Initialization (Auth & Variant) ─────────────────────────────────────────
  useEffect(() => {
    // 1. Backendden ayarları al
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        const v = data.activeVariant || 'random';
        setActiveVariant(v);
        setQuestions(generateExam(v));
      })
      .catch(() => setQuestions(generateExam('random')));

    // 2. Supabase Google (OAuth) Oturum Kontrolü
    const checkSupabaseSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
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

    // Oturum değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionUser({
          provider: 'google',
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email,
          email: session.user.email,
          rawData: session.user
        });
      } else {
        // Eğer Telegram ile girmişse onu silmeme adına burada state'i temizlemiyoruz,
        // SignOut istenirse özel bir fonksiyonla temizlenmeli.
      }
    });

    // 3. Telegram Local Storage kontrolü (sayfa yenilenince Telegram oturumu kalsın diye)
    try {
      const tgUser = localStorage.getItem('tg_session');
      if (tgUser) {
        setSessionUser(JSON.parse(tgUser));
      }
    } catch (e) { }

    return () => subscription.unsubscribe();
  }, []);

  // Eğer session User varsa ve LOGIN ekranındaysak, otomatik olarak MIC_CHECK'e geçebiliriz.
  useEffect(() => {
    if (sessionUser && appState === 'LOGIN') {
      // Giriş bildirimi gönder
      const notifyKey = `notified_login_v2_${sessionUser.id}`;
      if (!localStorage.getItem(notifyKey)) {
        fetch('/api/notifyLogin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: sessionUser, provider: sessionUser.provider })
        }).catch(()=>{});
        localStorage.setItem(notifyKey, 'true');
      }
      
      setAppState('MIC_CHECK');
    }
  }, [sessionUser, appState]);


  // ── Auth Handlers ────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    // Supabase ile Google login başlat
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : ''
      }
    });
    if (error) alert("Google ile giriş yapılamadı: " + error.message);
  };

  const handleTelegramAuth = (telegramUser) => {
    // telegramUser = { id, first_name, username, hash, ... }
    const userObj = {
      provider: 'telegram',
      id: telegramUser.id,
      name: telegramUser.first_name + (telegramUser.last_name ? ' ' + telegramUser.last_name : ''),
      email: null, // Sahte email yok
      telegramUsername: telegramUser.username ? '@' + telegramUser.username : null,
      rawData: telegramUser
    };
    setSessionUser(userObj);
    // Sayfa yenilenmesine karşı tarayıcıya kaydet
    localStorage.setItem('tg_session', JSON.stringify(userObj));
    
    // Yönlendirme (window.location.href) veya bildirim (notifyLogin) BURADAN KALDIRILDI.
    // Çünkü useEffect içerisinde hem state tespiti yapılıp bildirim atılacak, hem de MIC_CHECK'e geçecek.
  };

  const handleLogout = async () => {
    if (sessionUser?.provider === 'google') {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('tg_session');
    setSessionUser(null);
    setAppState('LOGIN');
  };


  const currentItem = questions.length > 0 ? questions[currentQuestionIndex] : null;
  const activeSection = (() => {
    if (!currentItem) return 1;
    const s = currentItem.section || currentItem.title || '';
    if (s.startsWith('3.')) return 3;
    if (s.startsWith('2.')) return 2;
    return 1;
  })();

  // ── Countdown Timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (appState !== 'EXAM' || !currentItem || currentItem.type === 'transition') return;
    if (timeLeft <= 0) {
      if (phase === 'prep') {
        setPhase('speak');
        setTimeLeft(currentItem.speakTime);
        startRecording();
      } else if (phase === 'speak') {
        stopRecording();
      }
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase, appState, currentItem]);

  // ── Auto Advance for Transition ────────────────────────────────────────────
  useEffect(() => {
    if (appState !== 'EXAM' || !currentItem) return;
    if (currentItem.type === 'transition' || currentItem.type === 'video' || currentItem.type === 'audio_listen') {
      const timer = setTimeout(() => {
        goToNextItem();
      }, 5000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState, currentQuestionIndex]);

  // ── Sayfa Yenileme & Offline Koruması ──────────────────────────────────────
  useEffect(() => {
    const setOff = () => setIsOffline(true);
    const setOn = () => setIsOffline(false);
    window.addEventListener('offline', setOff);
    window.addEventListener('online', setOn);
    if (typeof navigator !== 'undefined' && !navigator.onLine) setIsOffline(true);

    const guard = (e) => {
      if (appState === 'EXAM' || appState === 'UPLOADING') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', guard);

    return () => {
      window.removeEventListener('offline', setOff);
      window.removeEventListener('online', setOn);
      window.removeEventListener('beforeunload', guard);
    };
  }, [appState]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const playTing = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1);
    } catch (_) { }
  };

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'tr-TR';
    utt.rate = 0.9;
    window.speechSynthesis.speak(utt);
  };

  // ── Microphone Test ────────────────────────────────────────────────────────
  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setAppState('GATEWAY');
    } catch (_) {
      alert('Mikrofon izni alınamadı!');
    }
  };

  // ── Visualizer ─────────────────────────────────────────────────────────────
  const drawVisualizer = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const buf = new Uint8Array(analyserRef.current.frequencyBinCount);
    let time = 0;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteTimeDomainData(buf);
      let sq = 0;
      buf.forEach(v => { const n = (v / 128) - 1; sq += n * n; });
      const amp = Math.max(2, Math.sqrt(sq / buf.length) * 200);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.05;

      const wave = (offset, shift, alpha, freq) => {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
        for (let i = 0; i < canvas.width; i++) {
          const env = Math.sin((Math.PI * i) / canvas.width);
          const y = canvas.height / 2 + Math.sin(i * freq + time + shift) * amp * env * offset;
          i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
        }
        ctx.stroke();
      };

      wave(1.0, 0, 0.7, 0.015);
      wave(0.6, 2, 0.4, 0.025);
      wave(-0.8, 4, 0.5, 0.02);
      wave(-0.4, 1, 0.3, 0.03);

      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };
    draw();
  }, []);

  // ── Recording ──────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioCtx();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      audioContextRef.current.createMediaStreamSource(stream).connect(analyserRef.current);
      drawVisualizer();

      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (audioContextRef.current) audioContextRef.current.close();

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        allRecordingsRef.current.push({ blob, sectionName: currentItem?.section || 'Soru' });
        audioChunksRef.current = [];
        goToNextItem();
      };

      recorder.start();
    } catch (_) { }
  };

  const stopRecording = () => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.stop();
      rec.stream.getTracks().forEach(t => t.stop());
    }
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goToNextItem = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      const next = questions[nextIndex];
      setCurrentQuestionIndex(nextIndex);
      if (next.type === 'question') {
        setPhase('prep');
        setTimeLeft(next.prepTime);
        playTing();
      }
    } else {
      finishAndUploadExam();
    }
  };

  const startExamContent = () => {
    setCurrentQuestionIndex(0);
    const first = questions[0];
    if (first?.type === 'question') {
      setPhase('prep');
      setTimeLeft(first.prepTime);
      playTing();
    }
    setTotalElapsed(0);
    totalTimerRef.current = setInterval(() => setTotalElapsed(p => p + 1), 1000);
    setAppState('EXAM');
  };

  // ── Finish & Upload ────────────────────────────────────────────────────────
  // ── Finish & Upload (Jilet Gibi Yeni Mimari) ─────────────────────────────
  const finishAndUploadExam = async () => {
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    setUploadError(null);
    setAppState('UPLOADING');

    // 1. İsimleri temizle (Türkçe karakter ve boşlukları jiletle)
    const rawUserName = sessionUser?.name || 'Bilinmeyen_Ogrenci';
    const userEmail = sessionUser?.email || null;

    // Karakter temizleme fonksiyonu (Türkçe karakterleri güvenli ascii karakterlere dönüştürür ve özel karakterleri siler)
    const cleanStr = (str) => {
      let s = str.replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
                 .replace(/ü/g, 'u').replace(/Ü/g, 'U')
                 .replace(/ş/g, 's').replace(/Ş/g, 'S')
                 .replace(/ö/g, 'o').replace(/Ö/g, 'O')
                 .replace(/ç/g, 'c').replace(/Ç/g, 'C')
                 .replace(/ı/g, 'i').replace(/İ/g, 'I');
      return s.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/_$/, '');
    };
    const safeStudentName = cleanStr(rawUserName);

    try {
      const audioLinks = [];

      for (let i = 0; i < allRecordingsRef.current.length; i++) {
        const rec = allRecordingsRef.current[i];
        const safeSectionName = cleanStr(rec.sectionName || `Section_${i}`);

        // 2. MÜKEMMEL İSİMLENDİRME: "Soru_Adi_Ogrenci_Adi_Zaman.webm"
        // Bu sayede Telegram'da dosyalar alfabetik ve okunabilir dizilir.
        const fileName = `${safeSectionName}_${safeStudentName}_${Date.now().toString().slice(-4)}.webm`;

        // Supabase'e fırlat
        const { data, error: uploadError } = await supabase.storage
          .from('exam-audios')
          .upload(fileName, rec.blob, {
            contentType: 'audio/webm',
            upsert: true // Eğer aynı isimde dosya varsa üzerine yazar, hata vermez.
          });

        if (uploadError) throw new Error(`Ses ${i} yüklenemedi: ` + uploadError.message);

        // Herkese açık URL'yi al
        const { data: { publicUrl } } = supabase.storage
          .from('exam-audios')
          .getPublicUrl(fileName);

        audioLinks.push({
          sectionName: rec.sectionName,
          url: publicUrl
        });
      }

      // 3. Telegram API'ye gönder (Audio linkleri toplu gönder)
      try {
        const userInfo = {
          name: rawUserName,
          email: userEmail,
          provider: sessionUser?.provider || 'Bilinmiyor',
          telegramUsername: sessionUser?.telegramUsername || null,
          timeTaken: totalElapsed,
          variantNo: activeVariant
        };

        const telegramRes = await fetch('/api/sendToTelegramBulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userInfo, audioLinks }),
        });
        const telegramResult = await telegramRes.json();
        if (!telegramResult.success) console.error('Telegram hatası:', telegramResult.error);
        else console.log('Telegram: kayıtlar başarıyla gönderildi.');
      } catch (tgErr) {
        console.error('Telegram bağlantı hatası (devam ediyoruz):', tgErr);
      }

      // --- 1. ÖNCE E-POSTAYI ATEŞLE ---
      if (userEmail) {
        try {
          await fetch('/api/sendResultEmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userName: rawUserName,
              userEmail: userEmail,
              totalTime: totalElapsed,
            }),
          });
          console.log("E-posta başarıyla sıraya alındı.");
        } catch (mailErr) {
          console.error("E-posta gönderim hatası (ama devam ediyoruz):", mailErr);
        }
      }

      // --- 2. VERİTABANINA KAYDET ---
      let dbResultId = null;
      try {
        const dbRes = await fetch('/api/saveResult', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userName: rawUserName,
            userEmail: userEmail,
            telegramAuthId: sessionUser?.provider === 'telegram' ? sessionUser.id : null,
            variantNo: activeVariant,
            totalTime: Number(totalElapsed),
          }),
        });
        const resData = await dbRes.json();
        if (!dbRes.ok || !resData.success) {
          console.error("Veritabanı Hatası:", resData);
        } else {
          dbResultId = resData.resultId;
          console.log("Veritabanı kaydı başarılı, ID:", dbResultId);
        }
      } catch (dbErr) {
        console.error("Veritabanı bağlantı hatası:", dbErr);
      }

      // --- 3. GROQ AI HESAPLAMA TETİKLEMESİ (Arka Planda) ---
      if (dbResultId && audioLinks.length > 0) {
        fetch('/api/analyzeAudio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioLinks, resultId: dbResultId })
        }).catch(err => console.error("AI tetikleme hatası (Devam):", err));
      }

    } catch (err) {
      console.error("Kritik Genel Hata:", err);
      setUploadError(err.message);
    }

    setAppState('FINISHED');
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
            <h1 className="text-3xl font-extrabold text-gray-800 mb-1">{t('loginHeader1')}</h1>
            <p className="text-blue-600 font-semibold">{t('loginHeader2')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('loginHeader3')}</p>
          </div>

          {/* Auth Options */}
          <div className="space-y-4 flex flex-col items-center">
            {/* Supabase Google Auth Button */}
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
              {t('loginGoogle')}
            </button>

            <div className="w-full flex items-center gap-3 my-4 opacity-70">
              <div className="h-px bg-gray-300 flex-1"></div>
              <span className="text-gray-400 text-sm font-semibold uppercase">{t('loginOr')}</span>
              <div className="h-px bg-gray-300 flex-1"></div>
            </div>

            {/* Telegram Login Widget */}
            <TelegramLoginWidget
              botName={process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || 'turkdunyasi_bot'}
              onAuth={handleTelegramAuth}
            />

            <p className="text-xs text-gray-400 mt-4 text-center px-4">
              {t('loginDisclaimer')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── MIC CHECK ─────────────────────────────────────────────────────────────
  if (appState === 'MIC_CHECK') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 text-center relative">
        {/* Hızlı Çıkış (Logout) */}
        <button onClick={handleLogout} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-500 hover:text-red-500 font-medium transition text-sm sm:text-base">
          {t('logout')}
        </button>

        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl max-w-lg w-full border border-gray-100">
          <div className="text-5xl mb-4">🎙️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('micCheckTitle')}</h2>
          <p className="text-gray-500 mb-4">
            {t('micCheckWelcome')}, <strong>{sessionUser?.name}</strong>!<br />
            {t('micCheckDesc')}
          </p>
          <div className="space-y-3 mt-8">
            <button onClick={testMicrophone} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 rounded-xl text-lg transition shadow-md shadow-yellow-200">
              {t('btnMicTest')}
            </button>
            <button onClick={() => setAppState('GATEWAY')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg transition">
              {t('btnStartMic')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── GATEWAY & UPLOADING & FINISHED ... 

  if (appState === 'GATEWAY') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col items-center justify-center gap-6 relative">
        <div className="text-white text-center mb-4">
          <p className="text-blue-200 text-lg mb-1">{t('gatewayDesc')}</p>
          <p className="text-2xl font-bold">{sessionUser?.name}</p>
        </div>
        <button
          onClick={() => { playTing(); startExamContent(); }}
          className="bg-white text-blue-700 text-2xl sm:text-3xl font-extrabold py-5 sm:py-6 px-10 sm:px-20 rounded-full shadow-2xl hover:shadow-blue-400 hover:scale-105 active:scale-95 transition-all"
        >
          {t('btnGatewayStart')}
        </button>
      </div>
    );
  }

  if (appState === 'UPLOADING') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-3xl shadow-2xl max-w-md w-full text-center border border-blue-100">
          <div className="text-6xl mb-6 animate-bounce">📤</div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-3">{t('uploadingTitle')}</h2>
          <p className="text-gray-500 mb-8">{t('uploadingDesc')}</p>
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
          <p className="text-sm text-gray-400">{t('uploadingDontClose')}</p>
        </div>
      </div>
    );
  }

  if (appState === 'FINISHED') {
    const mins = Math.floor(totalElapsed / 60);
    const secs = totalElapsed % 60;
    const timeStr = mins > 0 ? `${mins} dk ${secs} sn` : `${secs} sn`;
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6 relative">
        <a href="/" className="absolute top-6 right-6 font-bold text-green-700 hover:text-green-900 transition flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          {t('finishBackHome')}
        </a>
        <div className="bg-white p-12 rounded-3xl shadow-2xl max-w-lg w-full text-center border border-green-100">
          <div className="text-7xl mb-6">🎉</div>
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">{t('finishTitle')}</h1>
          <p className="text-gray-500 text-lg mb-8">
            {t('finishCongrats')}, <span className="font-bold text-gray-700">{sessionUser?.name}</span>!<br />
            {t('finishSuccess')}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
              <p className="text-3xl font-extrabold text-blue-600">{allRecordingsRef.current.length}</p>
              <p className="text-sm text-gray-500 mt-1">{t('finishCountDone')}</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
              <p className="text-3xl font-extrabold text-green-600">{timeStr}</p>
              <p className="text-sm text-gray-500 mt-1">{t('finishTotalTime')}</p>
            </div>
          </div>
          {sessionUser?.provider === 'google' && sessionUser?.email && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm text-blue-700">
              {t('finishResultEmail')} <strong>{sessionUser.email}</strong>
            </div>
          )}
          {sessionUser?.provider === 'telegram' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm text-blue-700">
              {t('finishResultTelegram')}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="font-bold text-amber-800 mb-1">{t('finishSpecialOfferTitle')}</p>
            <p className="text-sm text-amber-700 mb-3">
              {t('finishSpecialOfferDesc1')} <strong>{t('finishSpecialOfferDesc2')}</strong>!<br />
              {t('finishSpecialOfferCode')}<strong className="bg-amber-200 px-2 py-0.5 rounded">SINAV15</strong>
            </p>
            <a
              href="https://turkdunyasi.uz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-6 rounded-lg text-sm transition"
            >
              {t('finishSpecialOfferBtn')}
            </a>
          </div>

          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
              {t('finishError')}: {uploadError}
            </div>
          )}

          <p className="text-gray-400 text-xs mt-6">{t('finishCloseStr')}</p>
        </div>
      </div>
    );
  }

  // ── EXAM (ANA SINAV EKRANI) ───────────────────────────────────────────────
  if (!currentItem) return null;

  const currentQNum = questions.slice(0, currentQuestionIndex + 1).filter(q => q.type === 'question').length;
  const totalQNum = questions.filter(q => q.type === 'question').length;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {isOffline && (
        <div className="bg-red-500 text-white text-center py-2 font-bold px-4 text-sm z-50 sticky top-0 shadow-md">
          {t('examInternetLost')}
        </div>
      )}
      <header className="px-3 sm:px-6 py-2.5 sm:py-3 flex justify-between items-center border-b bg-white shadow-sm preserve-color">
        <h1 className="text-sm sm:text-xl font-semibold text-gray-800 leading-tight">
          <span className="hidden sm:inline">Türk Dünyası | </span>
          <span className="sm:hidden">TD | </span>
          {t('examTitle')}
        </h1>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-mono font-bold text-gray-700 text-sm tracking-wider">
              {formatTime(totalElapsed)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
            {/* Avatar veya Provider Logosu */}
            {sessionUser?.rawData?.user_metadata?.avatar_url || sessionUser?.rawData?.photo_url ? (
              <img
                src={sessionUser.rawData.user_metadata?.avatar_url || sessionUser.rawData.photo_url}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-gray-200"
                alt="Avatar"
              />
            ) : (
              <>
                {sessionUser?.provider === 'google' && <span>🇬</span>}
                {sessionUser?.provider === 'telegram' && <span>✈️</span>}
              </>
            )}
            <p className="font-semibold text-gray-700 text-xs sm:text-base truncate max-w-[70px] sm:max-w-none">{sessionUser?.name}</p>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="ml-1 sm:ml-2 p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors" title="Karanlık / Aydınlık Tema">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <a href="/profile" target="_blank" rel="noopener noreferrer" className="ml-1 sm:ml-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg transition-colors">
            {t('examProfile')}
          </a>
        </div>
      </header>

      <div className="w-full py-2.5 sm:py-5 flex justify-center items-center border-b bg-gray-50">
        <div className="flex items-center">
          {[1, 2, 3].map((step, idx) => (
            <div key={idx} className="flex items-center">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-sm transition-colors ${activeSection === step ? 'bg-green-500 shadow-green-200' : 'bg-orange-400'
                }`}>
                {step}
              </div>
              {idx < 2 && (
                <div className={`w-20 h-1.5 mx-2 rounded-full ${activeSection > step ? 'bg-green-300' : 'bg-orange-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 w-full max-w-7xl mx-auto p-3 sm:p-4 gap-4 sm:gap-6">
        {currentItem.type === 'transition' ? (
          <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-6xl font-extrabold text-blue-800 mb-12 drop-shadow-sm">
              {currentItem.title}
            </h1>
            <button
              onClick={goToNextItem}
              className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-2xl py-4 px-16 rounded-full shadow-xl transition-all"
            >
              {t('examKeyingi')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col min-w-0">
              <div className="border border-blue-200 rounded-xl bg-white p-3 sm:p-5 shadow-sm">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 text-sm sm:text-base">{currentItem.section}</span>
                    {currentItem.type === 'question' && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-md">
                        {t('examSoru')} {currentQNum}/{totalQNum}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button onClick={() => setFontSizeRatio(p => Math.max(0.7, p - 0.1))}
                      className="border px-4 py-1 rounded-lg text-gray-600 font-bold hover:bg-gray-100 text-sm transition">
                      A-
                    </button>
                    <button onClick={() => setFontSizeRatio(p => Math.min(1.5, p + 0.1))}
                      className="border-2 border-blue-400 px-4 py-1 rounded-lg text-blue-500 font-bold hover:bg-blue-50 text-sm transition">
                      A+
                    </button>
                    {phase === 'prep' && (
                      <button onClick={() => {
                        let text = currentItem.question || '';
                        if (currentItem.bullets) text += ' ' + currentItem.bullets.join('. ');
                        if (currentItem.lists) {
                          if (currentItem.lists.lehine) text += ` ${t('examLehine')} durumlar. ` + currentItem.lists.lehine.join('. ');
                          if (currentItem.lists.aleyhine) text += ` ${t('examAleyhine')} durumlar. ` + currentItem.lists.aleyhine.join('. ');
                        }
                        speakText(text.trim());
                      }}
                        className="text-blue-500 hover:text-blue-700 transition" title="Soruyu Dinle">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 10v4a2 2 0 002 2h2l4 4V4L9 8H7a2 2 0 00-2 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-black" style={{ fontSize: `${1.2 * fontSizeRatio}rem` }}>
                  {currentItem.image_url && (
                    <div className="mb-5 flex justify-center">
                      <img src={currentItem.image_url} alt="Soru" className="max-h-64 object-contain rounded-lg shadow" />
                    </div>
                  )}
                  {!currentItem.lists && currentItem.question && (
                    <div className="flex items-start gap-2 font-bold">
                      <span className="text-blue-500 text-xl flex-shrink-0">•</span>
                      <p>{currentItem.question}</p>
                    </div>
                  )}
                  {currentItem.bullets && (
                    <ul className="mt-2 space-y-3">
                      {currentItem.bullets.map((b, i) => (
                        <li key={i} className="flex font-bold gap-2">
                          <span className="text-blue-500 flex-shrink-0">•</span> {b}
                        </li>
                      ))}
                    </ul>
                  )}
                  {currentItem.lists && (
                    <div className="mt-4 border-2 border-[#1B52B3] rounded-lg overflow-hidden"
                      style={{ fontSize: `${1.2 * fontSizeRatio}rem` }}>
                      {currentItem.question && (
                        <div className="p-4 border-b-2 border-[#1B52B3] bg-blue-50">
                          <h3 className="font-bold text-gray-800">{currentItem.question}</h3>
                        </div>
                      )}
                      <div className="grid grid-cols-2">
                        {[{ key: 'lehine', label: t('examLehine') }, { key: 'aleyhine', label: t('examAleyhine') }].map((col, ci) => (
                          <div key={col.key} className={ci === 0 ? 'border-r-2 border-[#1B52B3]' : ''}>
                            <div className="p-3 border-b-2 border-[#1B52B3] text-center bg-[#1B52B3]">
                              <h4 className="font-bold text-white">{col.label}</h4>
                            </div>
                            <ul className="p-4 space-y-3">
                              {currentItem.lists[col.key].map((item, i) => (
                                <li key={i} className="flex gap-2 font-medium">
                                  <span className="font-bold text-[#1B52B3] flex-shrink-0">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[420px] flex flex-col pt-1">
              <div className="border border-gray-200 rounded-xl shadow-sm bg-white p-4 sm:p-6 flex flex-col items-center gap-3 sm:gap-4">
                {phase === 'prep' ? (
                  <div className="flex flex-col items-center">
                    <p className="text-yellow-600 font-bold text-sm mb-3 uppercase tracking-wide">{t('examHazirlikSuresi')}</p>
                    <div className="relative flex items-center justify-center">
                      <svg className="w-36 h-36 -rotate-90">
                        <circle cx="72" cy="72" r="62" stroke="#f3f4f6" strokeWidth="10" fill="none" />
                        <circle cx="72" cy="72" r="62" stroke="#eab308" strokeWidth="10" fill="none"
                          strokeLinecap="round" strokeDasharray={2 * Math.PI * 62}
                          strokeDashoffset={(2 * Math.PI * 62) * (1 - timeLeft / (currentItem.prepTime || 1))}
                          className="transition-all duration-1000 ease-linear" />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-4xl font-extrabold text-yellow-600">{timeLeft}</span>
                        <span className="text-xs text-yellow-500 font-medium">{t('examSaniye')}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-center gap-3">
                    <div className="h-8 flex-1 bg-blue-600 rounded-r-full opacity-80" />
                    <span className="text-4xl font-extrabold font-mono text-gray-800 border border-gray-100 bg-white px-4 py-2 rounded-xl shadow">
                      {formatTime(timeLeft)}
                    </span>
                    <div className="h-8 flex-1 bg-blue-600 rounded-l-full opacity-80" />
                  </div>
                )}
                {phase === 'speak' && (
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                  </div>
                )}
                <div className="w-full bg-[#FCF8FB] h-16 sm:h-20 border-t border-b border-gray-100 flex items-center justify-center px-2">
                  <canvas ref={canvasRef} width={380} height={80} className="w-full h-full" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>



    </div>
  );
}
