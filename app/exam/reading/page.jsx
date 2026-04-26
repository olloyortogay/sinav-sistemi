'use client';

import Navbar from '../../../components/Navbar';

export default function ReadingExamPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <Navbar />
      <main className="max-w-3xl mx-auto p-6 sm:p-10">
        <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center shadow-sm">
          <div className="text-6xl mb-4">📖</div>
          <h1 className="text-3xl font-black text-gray-900 mb-3">Okuma Sınavı</h1>
          <p className="text-gray-600">Okuma sınavı modülü aktif edildi. Soru akışı bir sonraki adımda eklenecek.</p>
        </div>
      </main>
    </div>
  );
}
