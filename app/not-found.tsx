'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex items-center justify-center p-6">
      <section className="w-full max-w-2xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl p-8 text-center">
        <p className="text-blue-200 text-sm font-bold tracking-widest uppercase mb-3">404</p>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Sahifa topilmadi</h1>
        <p className="text-blue-100/85 mb-8 leading-relaxed">
          Kechirasiz, qidirgan sahifangiz mavjud emas yoki manzil o&apos;zgargan bo&apos;lishi mumkin.
          Bosh sahifaga qaytib imtihon bo&apos;limlarini davom ettirishingiz mumkin.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 transition"
          >
            Bosh sahifaga qaytish
          </Link>
          <Link
            href="/profile"
            className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 transition"
          >
            Profilimni ochish
          </Link>
        </div>
      </section>
    </main>
  );
}
