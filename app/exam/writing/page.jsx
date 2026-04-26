'use client';
import { useState, useEffect, useRef } from 'react';
import Navbar from '../../../components/Navbar';
import { supabase } from '../../../lib/supabase';

// ─── SVG ICONS ───────────────────────────────────────────────────────────────
const IconMail = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const IconClock = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconStar = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);
const IconDocument = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// ─── START MODAL ─────────────────────────────────────────────────────────────
function StartModal({ onStart }) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) setScrolledToBottom(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #1B52B3 50%, #24243e 100%)' }}>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="absolute rounded-full opacity-10"
            style={{
              width: `${Math.random() * 200 + 50}px`, height: `${Math.random() * 200 + 50}px`,
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              background: 'radial-gradient(circle, #60A5FA, transparent)',
              animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }} />
        ))}
      </div>

      <div className="relative w-full max-w-3xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-full text-sm font-black mb-4 shadow-lg">
            🇹🇷 TÜRK DÜNYASI — YOZMA IMTIHONI
          </div>
          <h1 className="text-4xl font-black text-white mb-2 leading-tight">
            🎯 Diqqat, Bo&apos;lajak <span className="text-yellow-400">Til Bilimdoni!</span>
          </h1>
          <p className="text-blue-200 text-lg">Yozma (Yazma) bo&apos;limida seni nimalar kutmoqda?</p>
        </div>

        <div ref={scrollRef} onScroll={handleScroll}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl overflow-y-auto shadow-2xl"
          style={{ maxHeight: '60vh' }}>
          <div className="p-6 space-y-4">

            {/* Card 1 — Tasks */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-500 text-white p-2 rounded-xl"><IconMail /></div>
                <h2 className="text-white font-black text-lg">✉️ 1-QISM: Xat / Elektron Maktub</h2>
              </div>
              <p className="text-blue-100 text-sm mb-4">Sizga umumiy bir <strong className="text-yellow-300">Ortak Metin (Vaziyat)</strong> beriladi. Keyin ikki xil xat yozishingiz talab etiladi.</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-green-500/20 border border-green-400/30 rounded-xl p-4">
                  <span className="text-2xl">🟢</span>
                  <div>
                    <div className="text-green-300 font-black text-sm mb-1">Görev 1.1 — Norasmiy Xat (~50 so&apos;z)</div>
                    <p className="text-green-100 text-sm">Do&apos;stingga yoziladigan qisqacha e-mail. Eng oson ball olinadigan qism!</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-blue-500/20 border border-blue-400/30 rounded-xl p-4">
                  <span className="text-2xl">🔵</span>
                  <div>
                    <div className="text-blue-300 font-black text-sm mb-1">Görev 1.2 — Rasmiy Xat (120–150 so&apos;z)</div>
                    <p className="text-blue-100 text-sm">Rasmiy shaxs yoki muassasaga jiddiy uslubdagi javob xati. Asosiy ball shu yerdan keladi!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 — Part 2 */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-orange-500 text-white p-2 rounded-xl"><IconDocument /></div>
                <h2 className="text-white font-black text-lg">📝 2-QISM: Kompozisyon (Insho)</h2>
              </div>
              <p className="text-blue-100 text-sm">Berilgan mavzuda <strong className="text-white">250–300 so&apos;z</strong>lik kompozisyon (insho) yozasiz. Fikrlaringizni mantiqiy tartibda, to&apos;g&apos;ri grammatika bilan ifodalang.</p>
            </div>

            {/* Card 3 — Time */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-500 text-white p-2 rounded-xl"><IconClock /></div>
                <h2 className="text-white font-black text-lg">⏳ Vaqt Taqsimoti</h2>
              </div>
              <p className="text-blue-100 text-sm mb-3">Jami <strong className="text-yellow-400">1 soat (60 daqiqa)</strong>. Tavsiya etilgan taqsimot:</p>
              <div className="grid grid-cols-3 gap-3">
                {[['8–10', 'daqiqa', 'Görev 1.1'], ['18–25', 'daqiqa', 'Görev 1.2'], ['~40', 'daqiqa', 'Kompozisyon']].map(([num, unit, label]) => (
                  <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="text-yellow-400 text-xl font-black">{num}</div>
                    <div className="text-white text-xs">{unit}</div>
                    <div className="text-blue-200 text-xs mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 4 — Grading */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-500 text-white p-2 rounded-xl"><IconStar /></div>
                <h2 className="text-white font-black text-lg">🥇 Baholash Mezonlari</h2>
              </div>
              <div className="space-y-2">
                {[
                  ['1️⃣', "Topshiriq shartini to'g'ri tushundingizmi?"],
                  ['2️⃣', 'Grammatik qoidalarga rioya qildingizmi?'],
                  ['3️⃣', "So'z boyligingiz (Leksika) qanday?"],
                  ['4️⃣', "Fikrlar bir-biriga mantiqan bog'langanmi?"],
                  ['5️⃣', 'Tinish belgilari va imlo xatolarsizmi?'],
                ].map(([n, text]) => (
                  <div key={n} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                    <span className="text-xl">{n}</span>
                    <span className="text-blue-100 text-sm">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {!scrolledToBottom && (
              <div className="text-center text-blue-300 text-xs py-2 animate-bounce">
                ↓ Barcha ma&apos;lumotlarni o&apos;qish uchun pastga skroll qiling
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button onClick={onStart} disabled={!scrolledToBottom}
            className="w-full rounded-2xl font-black text-xl py-5 transition-all duration-300 shadow-2xl text-white"
            style={{
              background: scrolledToBottom ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #4B5563, #374151)',
              cursor: scrolledToBottom ? 'pointer' : 'not-allowed',
              opacity: scrolledToBottom ? 1 : 0.7,
            }}>
            {scrolledToBottom ? "Tushundim, Imtihonni Boshlash →" : "Avval barcha qoidalarni o'qing ↓"}
          </button>
          {scrolledToBottom && (
            <p className="text-center text-green-400 text-sm mt-2 font-medium animate-pulse">
              ✅ Barcha qoidalar o&apos;qildi. Boshlashga tayyorsiz!
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.2); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}

// ─── WORD COUNT ───────────────────────────────────────────────────────────────
function wordCount(text) {
  return text?.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

// ─── WRITING EXAM PAGE ────────────────────────────────────────────────────────
export default function WritingExamPage() {
  const [sessionUser, setSessionUser] = useState(null);
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [examData, setExamData] = useState(null);
  const [loadingVariant, setLoadingVariant] = useState(false);
  const [variantError, setVariantError] = useState(null);

  const [task1Text, setTask1Text] = useState('');
  const [task2Text, setTask2Text] = useState('');
  const [kompozisyonText, setKompozisyonText] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const startTimeRef = useRef(null);

  // Read user session
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSessionUser({
          provider: 'google',
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email,
          email: session.user.email,
        });
      } else if (typeof window !== 'undefined') {
        const tgUser = localStorage.getItem('tg_session');
        if (tgUser) {
          setSessionUser(JSON.parse(tgUser));
        } else {
          const sysUserStr = localStorage.getItem('user_name');
          if (sysUserStr) {
            setSessionUser({ name: sysUserStr });
          }
        }
      }
    };
    checkUser();
  }, []);

  // Fetch variant on start
  const handleStart = async () => {
    setLoadingVariant(true);
    setVariantError(null);
    try {
      const res = await fetch('/api/generateWritingVariant');
      const d = await res.json();
      if (d.success) {
        setExamData(d.variant);
        setExamStarted(true);
        startTimeRef.current = Date.now();
      } else {
        setVariantError(d.error || 'Sınav verisi yüklenemedi.');
      }
    } catch (e) {
      setVariantError('Sunucuya bağlanılamadı: ' + e.message);
    }
    setLoadingVariant(false);
  };

  // Timer
  useEffect(() => {
    if (!examStarted || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [examStarted, timeLeft]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const timeColor = timeLeft < 600 ? 'text-red-400 animate-pulse' : timeLeft < 1800 ? 'text-orange-400' : 'text-green-400';

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const totalTime = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;

    try {
      await fetch('/api/sendWritingResult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: sessionUser?.name || 'Bilinmeyen',
          userEmail: sessionUser?.email || null,
          telegramAuthId: sessionUser?.id || null,
          telegramUsername: sessionUser?.telegramUsername || null,
          provider: sessionUser?.provider || 'bilinmiyor',
          totalTime,
          task1Text,
          task2Text,
          kompozisyonText,
          part1Info: examData?.part1,
          part2Info: examData?.part2?.kompozisyon,
        })
      });
      setSubmitted(true);
    } catch (e) {
      alert('Gönderim hatası: ' + e.message);
    }
    setSubmitting(false);
  };

  // ── SUBMITTED STATE ──
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl p-10 text-center max-w-md w-full">
          <div className="text-7xl mb-4">✅</div>
          <h1 className="text-2xl font-black text-gray-800 mb-2">Imtihon Topshirildi!</h1>
          <p className="text-gray-500 mb-6">Yozma imtihoniz muvaffaqiyatli yuborildi. Natijalar tez orada e&apos;lon qilinadi.</p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left text-sm text-green-700 space-y-1">
            <div>🟢 Görev 1.1: <strong>{wordCount(task1Text)} so&apos;z</strong></div>
            <div>🔵 Görev 1.2: <strong>{wordCount(task2Text)} so&apos;z</strong></div>
            <div>📝 Kompozisyon: <strong>{wordCount(kompozisyonText)} so&apos;z</strong></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {!examStarted && (
        <div className="relative">
          <StartModal onStart={handleStart} />
          {loadingVariant && (
            <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-8 text-center">
                <div className="text-4xl mb-3 animate-spin">⚙️</div>
                <p className="font-bold text-gray-700">Sınav hazırlanıyor...</p>
              </div>
            </div>
          )}
          {variantError && (
            <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
                <div className="text-4xl mb-3">⚠️</div>
                <p className="font-bold text-red-600 mb-4">{variantError}</p>
                <p className="text-gray-500 text-sm">Admin panelinden yozma soru havuzunu yükleyin.</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={`min-h-screen bg-gray-50 transition-all duration-500 ${!examStarted ? 'pointer-events-none select-none blur-sm' : ''}`}>
        {/* Top Bar */}
        <div className="bg-[#1B52B3] text-white px-6 py-3 flex justify-between items-center shadow-lg sticky top-0 z-10">
          <div>
            <div className="text-xs text-blue-200 font-medium">Türk Dünyası | ✍️ Writing</div>
            <div className="font-black text-lg">Yozma Imtihoni / Yazma Sınavı</div>
          </div>
          <div className="flex items-center gap-4">
            {sessionUser?.name && (
              <div className="hidden sm:block text-right text-xs text-blue-200">
                <div>{sessionUser.name}</div>
              </div>
            )}
            <div className={`text-3xl font-black tabular-nums ${examStarted ? timeColor : 'text-white'}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* ── BÖLÜM 1 ── */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-blue-700 text-white px-5 py-3">
              <span className="font-black text-lg">1-QISM: Xat / Mektup</span>
            </div>

            {/* Ortak Metin */}
            {examData?.part1?.ortakMetin && (
              <div className="p-5 bg-yellow-50 border-b border-yellow-100">
                <div className="text-xs font-black text-yellow-700 uppercase tracking-wider mb-2">📖 Ortak Metin / Umumiy Matn</div>
                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{examData.part1.ortakMetin}</p>
              </div>
            )}

            {/* Görev 1.1 */}
            <div className="p-5 border-b border-gray-100">
              {examData?.part1?.gorev1_1 && (
                <div className="mb-3 bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="text-xs font-black text-green-700 uppercase tracking-wider mb-1">🟢 Görev 1.1 — Norasmiy Xat Topshirig&apos;i</div>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{examData.part1.gorev1_1}</p>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-500 mb-2 px-1">
                <span className="font-bold text-green-700">Görev 1.1 — Norasmiy Xat (~50 so&apos;z)</span>
                <span className={wordCount(task1Text) >= 50 ? 'text-green-600 font-bold' : 'text-gray-400'}>
                  {wordCount(task1Text)} so&apos;z {wordCount(task1Text) >= 50 ? '✓' : ''}
                </span>
              </div>
              <textarea value={task1Text} onChange={e => setTask1Text(e.target.value)}
                disabled={!examStarted}
                placeholder="Norasmiy xatingizni shu yerga yozing..."
                rows={6}
                className="w-full border border-gray-200 rounded-xl p-4 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-green-400 transition disabled:bg-gray-50"
              />
            </div>

            {/* Görev 1.2 */}
            <div className="p-5">
              {examData?.part1?.gorev1_2 && (
                <div className="mb-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="text-xs font-black text-blue-700 uppercase tracking-wider mb-1">🔵 Görev 1.2 — Rasmiy Xat Topshirig&apos;i</div>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{examData.part1.gorev1_2}</p>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-500 mb-2 px-1">
                <span className="font-bold text-blue-700">Görev 1.2 — Rasmiy Xat (120–150 so&apos;z)</span>
                <span className={wordCount(task2Text) >= 120 ? 'text-blue-600 font-bold' : 'text-gray-400'}>
                  {wordCount(task2Text)} so&apos;z {wordCount(task2Text) >= 120 ? '✓' : ''}
                </span>
              </div>
              <textarea value={task2Text} onChange={e => setTask2Text(e.target.value)}
                disabled={!examStarted}
                placeholder="Rasmiy xatingizni shu yerga yozing..."
                rows={10}
                className="w-full border border-gray-200 rounded-xl p-4 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* ── BÖLÜM 2: KOMPOZİSYON ── */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-purple-700 text-white px-5 py-3">
              <span className="font-black text-lg">2-QISM: Kompozisyon (Insho)</span>
            </div>

            {examData?.part2?.kompozisyon && (
              <div className="p-5 bg-purple-50 border-b border-purple-100">
                <div className="text-xs font-black text-purple-700 uppercase tracking-wider mb-2">📝 Kompozisyon Mavzusi</div>
                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{examData.part2.kompozisyon}</p>
              </div>
            )}

            <div className="p-5">
              <div className="flex justify-between text-xs text-gray-500 mb-2 px-1">
                <span className="font-bold text-purple-700">Kompozisyon (250–300 so&apos;z)</span>
                <span className={wordCount(kompozisyonText) >= 250 ? 'text-purple-600 font-bold' : 'text-gray-400'}>
                  {wordCount(kompozisyonText)} so&apos;z {wordCount(kompozisyonText) >= 250 ? '✓' : ''}
                </span>
              </div>
              <textarea value={kompozisyonText} onChange={e => setKompozisyonText(e.target.value)}
                disabled={!examStarted}
                placeholder="Kompozisyoningizni shu yerga yozing..."
                rows={14}
                className="w-full border border-gray-200 rounded-xl p-4 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 transition disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pb-8">
            <button onClick={handleSubmit} disabled={submitting || !examStarted}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-black text-xl py-5 rounded-2xl transition shadow-xl">
              {submitting ? '⏳ Yuborilmoqda...' : '✅ Imtihonni Topshirish'}
            </button>
            <p className="text-center text-gray-400 text-xs mt-3">
              So&apos;zlar: G1.1={wordCount(task1Text)} · G1.2={wordCount(task2Text)} · Kompozisyon={wordCount(kompozisyonText)}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
