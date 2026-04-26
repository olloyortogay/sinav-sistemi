'use client';
import { useState, useRef } from 'react';
import { useExamStore } from '../../store/useExamStore';

export default function StartModal({ onStart }) {
  const user = useExamStore(state => state.user);
  const userName = user?.name || "O'quvchi";

  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) {
      setScrolledToBottom(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #1B52B3 50%, #24243e 100%)' }}>
      <div className="relative w-full max-w-3xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-full text-sm font-black mb-4 shadow-lg">
            🇹🇷 TÜRK DÜNYASI — YOZMA IMTIHONI
          </div>
          <h1 className="text-3xl font-black text-white mb-2">
            👋 Xush kelibsiz, <span className="text-yellow-400">{userName}!</span>
          </h1>
          <p className="text-blue-200">Boshlashdan oldin qoidalarni o&apos;qib chiqing</p>
        </div>
        <div ref={scrollRef} onScroll={handleScroll}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl overflow-y-auto shadow-2xl"
          style={{ maxHeight: '55vh' }}>
          <div className="p-6 space-y-4">
            <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
              <h2 className="text-white font-black text-lg mb-3">✉️ 1-QISM: Xat / Elektron Maktub</h2>
              <div className="space-y-3">
                <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4">
                  <div className="text-green-300 font-black text-sm mb-1">🟢 Görev 1.1 — Norasmiy Xat (~50 so&apos;z)</div>
                  <p className="text-green-100 text-sm">Do&apos;stingga yoziladigan qisqacha e-mail.</p>
                </div>
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4">
                  <div className="text-blue-300 font-black text-sm mb-1">🔵 Görev 1.2 — Rasmiy Xat (120–150 so&apos;z)</div>
                  <p className="text-blue-100 text-sm">Rasmiy shaxsga jiddiy uslubdagi javob xati.</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
              <h2 className="text-white font-black text-lg mb-2">📝 2-QISM: Kompozisyon (250–300 so&apos;z)</h2>
              <p className="text-blue-100 text-sm">Berilgan mavzuda mantiqiy, grammatik to&apos;g&apos;ri kompozisyon yozing.</p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
              <h2 className="text-white font-black text-lg mb-3">⏳ Jami vaqt: 1 soat (60 daqiqa)</h2>
              <div className="grid grid-cols-3 gap-3">
                {[['8–10', 'daqiqa', 'Görev 1.1'], ['18–25', 'daqiqa', 'Görev 1.2'], ['~25', 'daqiqa', 'Kompozisyon']].map(([n, u, l]) => (
                  <div key={l} className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="text-yellow-400 text-xl font-black">{n}</div>
                    <div className="text-white text-xs">{u}</div>
                    <div className="text-blue-200 text-xs mt-1">{l}</div>
                  </div>
                ))}
              </div>
            </div>
            {!scrolledToBottom && (
              <div className="text-center text-blue-300 text-xs py-2 animate-bounce">↓ Barcha ma&apos;lumotlarni o&apos;qish uchun pastga skroll qiling</div>
            )}
          </div>
        </div>
        <div className="mt-6">
          <button onClick={onStart} disabled={!scrolledToBottom}
            className="w-full rounded-2xl font-black text-xl py-5 transition-all duration-300 shadow-2xl text-white"
            style={{
              background: scrolledToBottom ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#4B5563,#374151)',
              cursor: scrolledToBottom ? 'pointer' : 'not-allowed',
              opacity: scrolledToBottom ? 1 : 0.7,
            }}>
            {scrolledToBottom ? 'Tushundim, Imtihonni Boshlash →' : "Avval barcha qoidalarni o'qing ↓"}
          </button>
          {scrolledToBottom && (
            <p className="text-center text-green-400 text-sm mt-2 font-medium animate-pulse">✅ Boshlashga tayyorsiz!</p>
          )}
        </div>
      </div>
    </div>
  );
}
