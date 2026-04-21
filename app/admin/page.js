'use client';
import { useState, useEffect, useCallback } from 'react';
import { generateAllVariants } from '../data/questions';

// ─── HTML → PDF (Türkçe karakter + resim desteği) ──────────────────────────
async function downloadSingleVariantPDF(variant) {
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  // Gizli render konteyneri oluştur
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 794px; background: white; font-family: Arial, sans-serif;
    padding: 40px; box-sizing: border-box; color: #111;
  `;

  const imgSrc = variant.part1_2Scenario?.image_url;
  const p2ImgSrc = variant.part2Scenario?.image_url;

  container.innerHTML = `
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; }
      .header { background: #1B52B3; color: white; padding: 10px 20px; margin: -40px -40px 24px; display: flex; justify-content: space-between; align-items: center; }
      .header h1 { font-size: 14px; margin: 0; }
      .header .vno { font-size: 14px; font-weight: bold; }
      .section-title { background: #E6F0FF; font-size: 13px; font-weight: bold; padding: 6px 10px; margin: 18px 0 10px; border-left: 4px solid #1B52B3; }
      .question { display: flex; gap: 6px; margin: 6px 0; font-size: 11px; line-height: 1.5; }
      .q-num { font-weight: bold; min-width: 20px; }
      .q-text { flex: 1; }
      .debate-title { background: #C8D8FA; padding: 8px 10px; font-size: 11px; font-weight: bold; border: 2px solid #1B52B3; margin-bottom: 0; }
      .debate-table { width: 100%; border-collapse: collapse; border: 2px solid #1B52B3; }
      .debate-table th { background: #1B52B3; color: white; padding: 6px; text-align: center; font-size: 11px; width: 50%; }
      .debate-table td { padding: 6px 8px; font-size: 10px; vertical-align: top; width: 50%; border: 1px solid #1B52B3; line-height: 1.5; word-break: break-word; }
      .scenario-img { max-width: 340px; max-height: 200px; object-fit: contain; display: block; margin: 8px auto 12px; border-radius: 6px; }
      .bullets { list-style: disc; padding-left: 20px; margin: 6px 0; font-size: 11px; line-height: 1.6; }
    </style>

    <div class="header">
      <h1>Türk Dünyası | Konuşma Sınavı</h1>
      <span class="vno">Varyant ${variant.variantNo}</span>
    </div>

    <div class="section-title">1. Bölüm — Günlük Yaşam Soruları</div>
    ${variant.part1Questions.map((q, i) => `
      <div class="question"><span class="q-num">${i + 1}.</span><span class="q-text">${q.question}</span></div>
    `).join('')}

    <div class="section-title">1.2. Bölüm — Fotoğraf Yorumlama</div>
    ${imgSrc ? `<img class="scenario-img" src="${window.location.origin}${imgSrc}" crossorigin="anonymous"/>` : ''}
    ${variant.part1_2Scenario.questions.map((q, i) => `
      <div class="question"><span class="q-num">${i + 4}.</span><span class="q-text">${q.q}</span></div>
    `).join('')}

    <div class="section-title">2. Bölüm — Görsel & Tartışma</div>
    ${p2ImgSrc ? `<img class="scenario-img" src="${window.location.origin}${p2ImgSrc}" crossorigin="anonymous"/>` : ''}
    <ul class="bullets">
      ${variant.part2Scenario.bullets.map(b => `<li>${b}</li>`).join('')}
    </ul>

    <div class="section-title">3. Bölüm — Lehine / Aleyhine</div>
    <div class="debate-title">${variant.part3Question.question}</div>
    <table class="debate-table">
      <thead><tr><th>Lehine</th><th>Aleyhine</th></tr></thead>
      <tbody>
        ${variant.part3Question.lists.lehine.map((l, i) => `
          <tr>
            <td>• ${l}</td>
            <td>• ${variant.part3Question.lists.aleyhine[i] || ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  document.body.appendChild(container);

  // Resimlerin yüklenmesini bekle
  await new Promise(r => setTimeout(r, 800));

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pdfW = 210;
    const pdfH = (canvas.height * pdfW) / canvas.width;

    // Çok uzunsa sayfalara böl
    const pageHeight = 297;
    if (pdfH <= pageHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
    } else {
      let yOffset = 0;
      while (yOffset < canvas.height) {
        const sliceHeight = Math.min((pageHeight * canvas.width) / pdfW, canvas.height - yOffset);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;
        const ctx = sliceCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, -yOffset);
        const sliceImg = sliceCanvas.toDataURL('image/jpeg', 0.92);
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(sliceImg, 'JPEG', 0, 0, pdfW, (sliceHeight * pdfW) / canvas.width);
        yOffset += sliceHeight;
      }
    }

    pdf.save(`Varyant_${variant.variantNo}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

// ─── ADMIN PAGE ─────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [isAuth, setIsAuth] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeVariant, setActiveVariant] = useState('random');
  const [isSaving, setIsSaving] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState(null); // hangi varyant yükleniyor
  const [showCreds, setShowCreds] = useState(false);
  const [curUser, setCurUser] = useState('');
  const [curPass, setCurPass] = useState('');
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [credsMsg, setCredsMsg] = useState('');

  const [activeTab, setActiveTab] = useState('variants');
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const allVariants = generateAllVariants();

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const d = await res.json();
      if (d.activeVariant) setActiveVariant(d.activeVariant);
    } catch (_) {}
  }, []);

  const fetchResults = useCallback(async () => {
    setLoadingResults(true);
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch('/api/results', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const d = await res.json();
      if (d.success) setResults(d.data || []);
    } catch (err) {}
    setLoadingResults(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsAuth(true);
      fetchSettings();
      fetchResults();
    }
  }, [fetchSettings, fetchResults]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/adminAuth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'LOGIN', username, password }),
    });
    const d = await res.json();
    if (d.success) {
      localStorage.setItem('admin_token', d.token); // Gerçek UUID token kullan
      setIsAuth(true);
      fetchSettings();
      fetchResults();
    } else {
      setLoginError(d.error);
    }
  };

  const saveVariant = async (variant) => {
    setIsSaving(true);
    const token = localStorage.getItem('admin_token');
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ variant }),
    });
    setActiveVariant(variant);
    setIsSaving(false);
  };

  const handleChangeCreds = async (e) => {
    e.preventDefault();
    setCredsMsg('');
    const token = localStorage.getItem('admin_token');
    const res = await fetch('/api/adminAuth', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        action: 'CHANGE_CREDENTIALS',
        username: curUser, password: curPass,
        newUsername: newUser || undefined, newPassword: newPass || undefined,
      }),
    });
    const d = await res.json();
    if (d.success) {
      setCredsMsg('✅ Bilgiler güncellendi. Yeniden giriş yapın.');
      setTimeout(() => { localStorage.removeItem('admin_token'); setIsAuth(false); }, 2000);
    } else {
      setCredsMsg(`❌ ${d.error}`);
    }
  };

  const handlePdfDownload = async (variant) => {
    setPdfLoadingId(variant.variantNo);
    try {
      await downloadSingleVariantPDF(variant);
    } catch (err) {
      alert('PDF oluşturma hatası: ' + err.message);
    }
    setPdfLoadingId(null);
  };

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  if (!isAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-6 font-sans text-black">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-gray-100">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🏛️</div>
            <h2 className="text-2xl font-extrabold text-blue-800">Admin Girişi</h2>
            <p className="text-gray-400 text-sm mt-1">Türk Dünyası Sınav Yönetim Paneli</p>
          </div>
          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">{loginError}</div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Kullanıcı Adı</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-black"
                placeholder="Kullanıcı adınız" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Şifre</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                placeholder="••••••••" required />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition">
              Giriş Yap
            </button>
          </form>
          <div className="mt-4 text-center">
            <a href="mailto:otogay1@gmail.com?subject=Admin%20sifre%20sifirla"
              className="text-sm text-gray-400 hover:text-blue-500 underline">Şifremi Unuttum</a>
          </div>
        </div>
      </div>
    );
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-black">
      {/* Top Nav */}
      <div className="bg-[#1B52B3] text-white px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold">🏛️ Sınav Yönetim Paneli</h1>
          <p className="text-blue-200 text-xs mt-0.5">Türk Dünyası | Konuşma Sınavı</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCreds(!showCreds)}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-bold transition">
            ⚙️ Hesap Ayarları
          </button>
          <button onClick={() => { localStorage.removeItem('admin_token'); setIsAuth(false); }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition">
            Çıkış
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        
        {/* TABS */}
        <div className="flex gap-4 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('variants')}
            className={`pb-3 font-bold text-lg px-2 transition ${activeTab === 'variants' ? 'border-b-4 border-blue-600 text-blue-800' : 'text-gray-400 hover:text-gray-700 border-transparent'}`}>
            Sınav Varyantları
          </button>
          <button 
            onClick={() => setActiveTab('results')}
            className={`pb-3 font-bold text-lg px-2 transition ${activeTab === 'results' ? 'border-b-4 border-blue-600 text-blue-800' : 'text-gray-400 hover:text-gray-700 border-transparent'}`}>
            Sınav Sonuçları
          </button>
        </div>

        {/* Credentials Panel */}
        {showCreds && (
          <div className="bg-white rounded-xl shadow border p-6">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Kullanıcı Adı & Şifre Değiştir</h3>
            {credsMsg && <div className="mb-4 p-3 rounded bg-blue-50 border border-blue-200 text-blue-700 text-sm">{credsMsg}</div>}
            <form onSubmit={handleChangeCreds} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">Mevcut Kullanıcı Adı</label>
                <input type="text" value={curUser} onChange={e => setCurUser(e.target.value)}
                  placeholder="Mevcut kullanıcı adı" className="w-full border p-2 rounded-lg text-sm text-black" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">Mevcut Şifre</label>
                <input type="password" value={curPass} onChange={e => setCurPass(e.target.value)}
                  placeholder="Mevcut şifre" className="w-full border p-2 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">Yeni Kullanıcı Adı <span className="text-gray-400">(opsiyonel)</span></label>
                <input type="text" value={newUser} onChange={e => setNewUser(e.target.value)}
                  placeholder="Yeni kullanıcı adı" className="w-full border p-2 rounded-lg text-sm text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">Yeni Şifre <span className="text-gray-400">(opsiyonel)</span></label>
                <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
                  placeholder="Yeni şifre" className="w-full border p-2 rounded-lg text-sm" />
              </div>
              <div className="col-span-2">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm transition">
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Variant Grid Tab */}
        {activeTab === 'variants' && (
          <div className="bg-white rounded-xl shadow border p-6">
            <h2 className="text-lg font-extrabold text-gray-800 mb-1">Soru Varyantları</h2>
            <p className="text-gray-500 text-sm mb-6">
              Bir varyantı <strong>aktif</strong> etmek için kartına tıklayın. PDF indirmek için o kartın 📄 düğmesine tıklayın.
            </p>
            {isSaving && <div className="text-blue-600 font-bold text-sm mb-4 animate-pulse">💾 Kaydediliyor...</div>}

            {/* Rastgele kart */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-4">
              <div onClick={() => saveVariant('random')}
                className={`p-4 border-2 rounded-xl cursor-pointer transition ${activeVariant === 'random' ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-2xl">🎲</span>
                  {activeVariant === 'random' && <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">Aktif</span>}
                </div>
                <h3 className="font-bold text-gray-800 text-sm">Rastgele</h3>
                <p className="text-gray-400 text-xs mt-1">Her öğrenciye benzersiz sınav</p>
              </div>
            </div>

            {/* 50 Varyant */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {allVariants.map(v => {
                const isActive = activeVariant === String(v.variantNo);
                const isPdfLoading = pdfLoadingId === v.variantNo;

                return (
                  <div key={v.variantNo}
                    className={`p-4 border-2 rounded-xl transition ${isActive ? 'border-green-600 bg-green-50 shadow-md' : 'border-gray-200 hover:border-green-300'}`}>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="font-extrabold text-gray-700 text-xl">V{v.variantNo}</span>
                        {isActive && <span className="ml-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">Aktif</span>}
                      </div>
                    </div>

                    {/* Preview mini */}
                    <div className="text-xs text-gray-500 space-y-0.5 mb-3 truncate">
                      <p className="truncate">📝 {v.part1Questions[0]?.question?.slice(0, 32)}…</p>
                      <p className="truncate">🖼 {v.part2Scenario?.bullets?.[0]?.slice(0, 32)}…</p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveVariant(String(v.variantNo))}
                        className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition ${isActive ? 'bg-green-100 text-green-700 cursor-default' : 'bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700'}`}>
                        {isActive ? '✓ Aktif' : 'Seç'}
                      </button>
                      <button
                        onClick={() => handlePdfDownload(v)}
                        disabled={isPdfLoading}
                        className="flex-1 text-xs font-bold py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition disabled:opacity-50">
                        {isPdfLoading ? '⏳' : '📄 PDF'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="bg-white rounded-xl shadow border p-0 overflow-hidden">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-800">Son Sınav Kayıtları</h2>
                  <p className="text-gray-500 text-sm mt-1">Sınavı tamamlayan öğrencilerin veritabanı kayıtları (En yeni en üstte).</p>
                </div>
                <button onClick={fetchResults} className="bg-blue-50 text-blue-600 px-4 py-2 font-bold rounded-lg text-sm hover:bg-blue-100 transition">
                  🔄 Yenile
                </button>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 uppercase font-bold border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Öğrenci Adı</th>
                      <th className="px-6 py-4">E-posta</th>
                      <th className="px-6 py-4 text-center">Varyant</th>
                      <th className="px-6 py-4 text-center">Süre</th>
                      <th className="px-6 py-4 text-center">Puan</th>
                      <th className="px-6 py-4">Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingResults ? (
                      <tr><td colSpan="6" className="text-center py-8 text-gray-500">Yükleniyor...</td></tr>
                    ) : results.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-8 text-gray-500 font-medium">Henüz bir sınav kaydı bulunmuyor.</td></tr>
                    ) : (
                      results.map(r => (
                        <tr key={r.id} className="border-b last:border-b-0 hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-bold text-gray-900">{r.user_name}</td>
                          <td className="px-6 py-4 text-gray-500">{r.user_email || '-'}</td>
                          <td className="px-6 py-4 text-center font-mono font-bold">{r.variant_no}</td>
                          <td className="px-6 py-4 text-center font-mono">
                             {Math.floor(r.total_time / 60)}:{(r.total_time % 60).toString().padStart(2,'0')}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {r.score !== null ? (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md font-bold text-xs">{r.score}</span>
                            ) : (
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md font-medium text-xs">Puan Bekliyor</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs">
                            {new Date(r.completed_at).toLocaleString('tr-TR')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
