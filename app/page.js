'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { generateExam } from './data/questions';

export default function ExamInterface() {
  // ── App State Machine ──────────────────────────────────────────────────────
  // States: LOGIN | MIC_CHECK | GATEWAY | EXAM | UPLOADING | FINISHED
  const [appState, setAppState]       = useState('LOGIN');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [emailError, setEmailError]   = useState('');

  // ── Exam State ─────────────────────────────────────────────────────────────
  const [questions, setQuestions]             = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase]                     = useState('prep'); // 'prep' | 'speak'
  const [timeLeft, setTimeLeft]               = useState(0);
  const [fontSizeRatio, setFontSizeRatio]     = useState(1);
  const [totalElapsed, setTotalElapsed]       = useState(0);
  const [uploadError, setUploadError]         = useState(null);
  const [activeVariant, setActiveVariant]     = useState('random');

  // ── Refs ───────────────────────────────────────────────────────────────────
  const mediaRecorderRef  = useRef(null);
  const audioChunksRef    = useRef([]);
  const allRecordingsRef  = useRef([]);
  const audioContextRef   = useRef(null);
  const analyserRef       = useRef(null);
  const canvasRef         = useRef(null);
  const animationRef      = useRef(null);
  const totalTimerRef     = useRef(null);

  // ── Load Variant From Backend ──────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        const v = data.activeVariant || 'random';
        setActiveVariant(v);
        setQuestions(generateExam(v));
      })
      .catch(() => setQuestions(generateExam('random')));
  }, []);

  const currentItem = questions.length > 0 ? questions[currentQuestionIndex] : null;

  // ── Active Section (for stepper) ──────────────────────────────────────────
  const activeSection = (() => {
    if (!currentItem) return 1;
    const s = currentItem.section || currentItem.title || '';
    if (s.includes('3.')) return 3;
    if (s.includes('2.')) return 2;
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

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const playTing = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx  = new AudioCtx();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1);
    } catch (_) {}
  };

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang  = 'tr-TR';
    utt.rate  = 0.9;
    window.speechSynthesis.speak(utt);
  };

  // ── Login validation ───────────────────────────────────────────────────────
  const handleLogin = () => {
    if (!studentName.trim()) { alert('Ad soyad zorunludur'); return; }
    if (!validateEmail(studentEmail)) {
      setEmailError('Lütfen geçerli bir e-posta adresi girin');
      return;
    }
    setEmailError('');
    setAppState('MIC_CHECK');
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
    const ctx    = canvas.getContext('2d');
    const buf    = new Uint8Array(analyserRef.current.frequencyBinCount);
    let   time   = 0;

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
        ctx.lineWidth   = 1;
        ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
        for (let i = 0; i < canvas.width; i++) {
          const env = Math.sin((Math.PI * i) / canvas.width);
          const y   = canvas.height / 2 + Math.sin(i * freq + time + shift) * amp * env * offset;
          i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
        }
        ctx.stroke();
      };

      wave(1.0, 0,  0.7, 0.015);
      wave(0.6, 2,  0.4, 0.025);
      wave(-0.8, 4, 0.5, 0.02);
      wave(-0.4, 1, 0.3, 0.03);

      ctx.beginPath();
      ctx.lineWidth   = 1.5;
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
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioCtx();
      analyserRef.current     = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      audioContextRef.current.createMediaStreamSource(stream).connect(analyserRef.current);
      drawVisualizer();

      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        if (animationRef.current)    cancelAnimationFrame(animationRef.current);
        if (audioContextRef.current) audioContextRef.current.close();

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        allRecordingsRef.current.push({ blob, sectionName: currentItem?.section || 'Soru' });
        audioChunksRef.current = [];
        goToNextItem();
      };

      recorder.start();
    } catch (_) {}
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
      }
    } else {
      finishAndUploadExam();
    }
  };

  // ── Exam Start ─────────────────────────────────────────────────────────────
  const startExamContent = () => {
    setCurrentQuestionIndex(0);
    const first = questions[0];
    if (first?.type === 'question') {
      setPhase('prep');
      setTimeLeft(first.prepTime);
    }
    setTotalElapsed(0);
    totalTimerRef.current = setInterval(() => setTotalElapsed(p => p + 1), 1000);
    setAppState('EXAM');
  };

  // ── Finish & Upload ────────────────────────────────────────────────────────
  const finishAndUploadExam = async () => {
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    setUploadError(null);
    setAppState('UPLOADING');

    try {
      // 1. Ses dosyalarını Telegram'a gönder
      const form = new FormData();
      form.append('studentName', studentName || 'Bilinmeyen_Ogrenci');
      form.append('numFiles',    String(allRecordingsRef.current.length));
      allRecordingsRef.current.forEach((rec, i) => {
        form.append(`file${i}`,        rec.blob, 'kayit.webm');
        form.append(`sectionName${i}`, rec.sectionName);
      });
      const telegramRes = await fetch('/api/sendToTelegramBulk', { method: 'POST', body: form });
      const telegramResult = await telegramRes.json();
      if (!telegramResult.success) setUploadError(telegramResult.error || 'Telegram hatası');

      // 2. Sonucu Supabase'e kaydet
      const dbRes = await fetch('/api/saveResult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName:   studentName,
          userEmail:  studentEmail,
          variantNo:  activeVariant,
          totalTime:  totalElapsed,
        }),
      });
      const dbResult = await dbRes.json();

      // 3. Sonuç emaili gönder (Resend yapılandırıldıysa)
      if (studentEmail && dbResult.resultId) {
        await fetch('/api/sendResultEmail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userName:   studentName,
            userEmail:  studentEmail,
            totalTime:  totalElapsed,
            resultId:   dbResult.resultId,
          }),
        });
      }
    } catch (err) {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border border-blue-100">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo.webp" alt="Türk Dünyası" className="w-24 h-24 object-contain" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-800 mb-1">Türk Dünyası</h1>
            <p className="text-blue-600 font-semibold">Konuşma Sınavı</p>
            <p className="text-sm text-gray-400 mt-1">by Marjona hoca</p>
          </div>
          <div className="space-y-4">
            <div>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-black text-lg transition"
                placeholder="Ismingiz va Familiyangiz"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
              />
            </div>
            <div>
              <input
                type="email"
                className={`w-full px-4 py-3 rounded-xl border-2 ${emailError ? 'border-red-400' : 'border-blue-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-black text-lg transition`}
                placeholder="E-posta adresiniz"
                value={studentEmail}
                onChange={e => { setStudentEmail(e.target.value); setEmailError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              {emailError && (
                <p className="text-red-500 text-sm mt-1 pl-1">{emailError}</p>
              )}
              <p className="text-xs text-gray-400 mt-1 pl-1">
                📬 Sonuç raporunuz bu adrese gönderilecektir
              </p>
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-3 rounded-xl text-lg transition-all shadow-lg shadow-blue-200"
            >
              Kirish →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MIC CHECK ─────────────────────────────────────────────────────────────
  if (appState === 'MIC_CHECK') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full border border-gray-100">
          <div className="text-5xl mb-4">🎙️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Mikrofon Testi</h2>
          <p className="text-gray-500 mb-8">Sınava başlamadan önce mikrofonunuzun çalıştığını doğrulayın.</p>
          <div className="space-y-3">
            <button onClick={testMicrophone} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 rounded-xl text-lg transition shadow-md shadow-yellow-200">
              🔍 Mikrofonni tekshirish
            </button>
            <button onClick={() => setAppState('GATEWAY')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg transition">
              İmtihonni boshlash
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── GATEWAY ───────────────────────────────────────────────────────────────
  if (appState === 'GATEWAY') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col items-center justify-center gap-6">
        <div className="text-white text-center mb-4">
          <p className="text-blue-200 text-lg mb-1">Hazır olduğunuzda başlayın</p>
          <p className="text-2xl font-bold">{studentName}</p>
        </div>
        <button
          onClick={() => { playTing(); startExamContent(); }}
          className="bg-white text-blue-700 text-3xl font-extrabold py-6 px-20 rounded-full shadow-2xl hover:shadow-blue-400 hover:scale-105 active:scale-95 transition-all"
        >
          ▶ Kirish
        </button>
      </div>
    );
  }

  // ── UPLOADING ─────────────────────────────────────────────────────────────
  if (appState === 'UPLOADING') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-3xl shadow-2xl max-w-md w-full text-center border border-blue-100">
          <div className="text-6xl mb-6 animate-bounce">📤</div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-3">Ses Dosyaları Gönderiliyor</h2>
          <p className="text-gray-500 mb-8">Lütfen bekleyin. Kayıtlarınız güvenle iletiliyor...</p>
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
          <p className="text-sm text-gray-400">Bu pencereyi kapatmayın</p>
        </div>
      </div>
    );
  }

  // ── FINISHED ──────────────────────────────────────────────────────────────
  if (appState === 'FINISHED') {
    const mins = Math.floor(totalElapsed / 60);
    const secs = totalElapsed % 60;
    const timeStr = mins > 0 ? `${mins} dk ${secs} sn` : `${secs} sn`;
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-3xl shadow-2xl max-w-lg w-full text-center border border-green-100">
          <div className="text-7xl mb-6">🎉</div>
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Sınav Tamamlandı!</h1>
          <p className="text-gray-500 text-lg mb-8">
            Tebrikler, <span className="font-bold text-gray-700">{studentName}</span>!<br/>
            Konuşma sınavını başarıyla tamamladınız.
          </p>

          {/* İstatistikler */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
              <p className="text-3xl font-extrabold text-blue-600">{allRecordingsRef.current.length}</p>
              <p className="text-sm text-gray-500 mt-1">Kayıt Tamamlandı</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
              <p className="text-3xl font-extrabold text-green-600">{timeStr}</p>
              <p className="text-sm text-gray-500 mt-1">Toplam Süre</p>
            </div>
          </div>

          {/* E-posta bildirimi */}
          {studentEmail && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm text-blue-700">
              📬 Sonuç raporunuz <strong>{studentEmail}</strong> adresine gönderilecektir
            </div>
          )}

          {/* Kurs teklifi */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="font-bold text-amber-800 mb-1">🎁 Size Özel Teklif</p>
            <p className="text-sm text-amber-700 mb-3">
              Türkçe kurslarda <strong>%15 indirim</strong> fırsatını kaçırmayın!<br/>
              Kod: <strong className="bg-amber-200 px-2 py-0.5 rounded">SINAV15</strong>
            </p>
            <a
              href="https://turkdunyasi.uz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-6 rounded-lg text-sm transition"
            >
              Kurslara Göz At →
            </a>
          </div>

          {/* Hata bilgisi */}
          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
              ⚠️ Hata: {uploadError}. Lütfen sınav gözetmenine bildirin.
            </div>
          )}

          <p className="text-gray-400 text-xs mt-6">🏛️ Türk Dünyası | Sayfa kapatılabilir.</p>
        </div>
      </div>
    );
  }

  // ── EXAM (ANA SINAV EKRANI) ───────────────────────────────────────────────
  if (!currentItem) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">

      {/* HEADER */}
      <header className="px-6 py-3 flex justify-between items-center border-b bg-white shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800">
          Türk Dünyası | Konuşma Sınavı
        </h1>
        <div className="flex items-center gap-4">
          {/* Kronometre */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span className="font-mono font-bold text-gray-700 text-sm tracking-wider">
              {formatTime(totalElapsed)}
            </span>
          </div>
          <p className="font-semibold text-gray-700">{studentName}</p>
        </div>
      </header>

      {/* STEPPER */}
      <div className="w-full py-5 flex justify-center items-center border-b bg-gray-50">
        <div className="flex items-center">
          {[1, 2, 3].map((step, idx) => (
            <div key={idx} className="flex items-center">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-sm transition-colors ${
                activeSection === step ? 'bg-green-500 shadow-green-200' : 'bg-orange-400'
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

      {/* İÇERİK */}
      <div className="flex flex-1 w-full max-w-7xl mx-auto p-4 gap-8">

        {currentItem.type === 'transition' ? (
          /* BÖLÜM GEÇİŞ EKRANI */
          <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-6xl font-extrabold text-blue-800 mb-12 drop-shadow-sm">
              {currentItem.title}
            </h1>
            <button
              onClick={goToNextItem}
              className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-2xl py-4 px-16 rounded-full shadow-xl transition-all"
            >
              Keyingi →
            </button>
          </div>
        ) : (
          <>
            {/* SOL KOLON — SORU */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="border border-blue-200 rounded-xl bg-white p-5 shadow-sm">

                {/* Başlık Satırı */}
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <span className="font-bold text-gray-800">{currentItem.section}</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setFontSizeRatio(p => Math.max(0.7, p - 0.1))}
                      className="border px-4 py-1 rounded-lg text-gray-600 font-bold hover:bg-gray-100 text-sm transition">
                      A-
                    </button>
                    <button onClick={() => setFontSizeRatio(p => Math.min(1.5, p + 0.1))}
                      className="border-2 border-blue-400 px-4 py-1 rounded-lg text-blue-500 font-bold hover:bg-blue-50 text-sm transition">
                      A+
                    </button>
                    {currentItem.hasAudioBtn !== false && phase === 'prep' && (
                      <button onClick={() => speakText(currentItem.question || '')}
                        className="text-blue-500 hover:text-blue-700 transition" title="Soruyu Dinle">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 10v4a2 2 0 002 2h2l4 4V4L9 8H7a2 2 0 00-2 2z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Soru İçeriği */}
                <div className="text-black" style={{ fontSize: `${1.2 * fontSizeRatio}rem` }}>
                  {/* Fotoğraf */}
                  {currentItem.image_url && (
                    <div className="mb-5 flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={currentItem.image_url} alt="Soru görseli"
                        className="max-h-64 object-contain rounded-lg shadow" />
                    </div>
                  )}

                  {/* Tek soru metni */}
                  {!currentItem.lists && currentItem.question && (
                    <div className="flex items-start gap-2 font-bold">
                      <span className="text-blue-500 text-xl flex-shrink-0">•</span>
                      <p>{currentItem.question}</p>
                    </div>
                  )}

                  {/* Madde madde (bullets) */}
                  {currentItem.bullets && (
                    <ul className="mt-2 space-y-3">
                      {currentItem.bullets.map((b, i) => (
                        <li key={i} className="flex font-bold gap-2">
                          <span className="text-blue-500 flex-shrink-0">•</span> {b}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Lehine / Aleyhine Tablosu */}
                  {currentItem.lists && (
                    <div className="mt-4 border-2 border-[#1B52B3] rounded-lg overflow-hidden"
                      style={{ fontSize: `${1.2 * fontSizeRatio}rem` }}>
                      {currentItem.question && (
                        <div className="p-4 border-b-2 border-[#1B52B3] bg-blue-50">
                          <h3 className="font-bold text-gray-800">{currentItem.question}</h3>
                        </div>
                      )}
                      <div className="grid grid-cols-2">
                        {[
                          { key: 'lehine',   label: 'Lehine' },
                          { key: 'aleyhine', label: 'Aleyhine' },
                        ].map((col, ci) => (
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

            {/* SAĞ KOLON — KAYIT */}
            <div className="w-[420px] flex flex-col pt-1">
              <div className="border border-gray-200 rounded-xl shadow-sm bg-white p-6 flex flex-col items-center gap-4 h-72">

                {/* Hazırlık Dairesi */}
                {phase === 'prep' ? (
                  <div className="flex flex-col items-center">
                    <p className="text-yellow-600 font-bold text-sm mb-3 uppercase tracking-wide">Hazırlık Süresi</p>
                    <div className="relative flex items-center justify-center">
                      <svg className="w-36 h-36 -rotate-90">
                        <circle cx="72" cy="72" r="62" stroke="#f3f4f6" strokeWidth="10" fill="none"/>
                        <circle cx="72" cy="72" r="62"
                          stroke="#eab308" strokeWidth="10" fill="none"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 62}
                          strokeDashoffset={(2 * Math.PI * 62) * (1 - timeLeft / (currentItem.prepTime || 1))}
                          className="transition-all duration-1000 ease-linear"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-4xl font-extrabold text-yellow-600">{timeLeft}</span>
                        <span className="text-xs text-yellow-500 font-medium">saniye</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Kayıt Zamanlayıcısı */
                  <div className="w-full flex items-center justify-center gap-3">
                    <div className="h-8 flex-1 bg-blue-600 rounded-r-full opacity-80" />
                    <span className="text-4xl font-extrabold font-mono text-gray-800 border border-gray-100 bg-white px-4 py-2 rounded-xl shadow">
                      {formatTime(timeLeft)}
                    </span>
                    <div className="h-8 flex-1 bg-blue-600 rounded-l-full opacity-80" />
                  </div>
                )}

                {/* Kayıt İndikatörü */}
                {phase === 'speak' && (
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                  </div>
                )}

                {/* Ses Dalgası Canvas */}
                <div className="w-full bg-[#FCF8FB] flex-1 border-t border-b border-gray-100 flex items-center justify-center px-2">
                  <canvas ref={canvasRef} width={380} height={90} className="w-full h-full" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}