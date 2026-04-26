'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { generateAllVariants, examBank } from '../data/questions';

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

  const [activeTab, setActiveTab] = useState('speaking');
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Speaking Dynamic Pool States
  const [dynamicPoolStats, setDynamicPoolStats] = useState(null);
  const [dynamicPoolData, setDynamicPoolData] = useState(null); // Excel'den okunan
  const [rawDbPoolData, setRawDbPoolData] = useState(null); // Veritabanından gelen tam veri
  const [savingPool, setSavingPool] = useState(false);
  const fileInputRef = useRef(null);

  // Speaking sub-tab
  const [speakingSubTab, setSpeakingSubTab] = useState('variants');

  // Writing states
  const [writingSubTab, setWritingSubTab] = useState('pool');
  const [writingPoolData, setWritingPoolData] = useState(null);
  const [writingPoolStats, setWritingPoolStats] = useState(null);
  const [rawDbWritingPool, setRawDbWritingPool] = useState(null);
  const [savingWritingPool, setSavingWritingPool] = useState(false);
  const [writingResults, setWritingResults] = useState([]);
  const [loadingWritingResults, setLoadingWritingResults] = useState(false);
  const writingFileInputRef = useRef(null);

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
      const res = await fetch('/api/results?exam_type=speaking', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const d = await res.json();
      if (d.success) setResults(d.data || []);
    } catch (err) {}
    setLoadingResults(false);
  }, []);

  const fetchDynamicPool = useCallback(async () => {
    try {
      const res = await fetch('/api/dynamicPool');
      const d = await res.json();
      if (d.success && d.pool) {
        setRawDbPoolData(d.pool);
      }
    } catch (e) { console.error("Havuz okunamadı", e); }
  }, []);

  const fetchWritingPool = useCallback(async () => {
    try {
      const res = await fetch('/api/writingPool');
      const d = await res.json();
      if (d.success && d.pool) {
        setRawDbWritingPool(d.pool);
      }
    } catch (e) { console.error("Writing havuzu okunamadı", e); }
  }, []);

  const fetchWritingResults = useCallback(async () => {
    setLoadingWritingResults(true);
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch('/api/results?exam_type=writing', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const d = await res.json();
      if (d.success) setWritingResults(d.data || []);
    } catch (err) { console.error(err); }
    setLoadingWritingResults(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsAuth(true);
      fetchSettings();
      fetchResults();
      fetchDynamicPool();
      fetchWritingPool();
    }
  }, [fetchSettings, fetchResults, fetchDynamicPool, fetchWritingPool]);

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
      showToast('PDF oluşturma hatası: ' + err.message, 'error');
    }
    setPdfLoadingId(null);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { B1_Soru_1: "Örnek Soru 1.1", B1_Soru_2: "Örnek Soru 2.1", B1_Soru_3: "Örnek Soru 3.1", B3_Konu: "Örnek Konu", B3_Lehine: "Lehine 1\nLehine 2", B3_Aleyhine: "Aleyhine 1\nAleyhine 2" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Soru Havuzu");
    XLSX.writeFile(wb, "dinamik_havuz_sablonu.xlsx");
  };

  const exportAllSystemPool = () => {
    const rows = [];
    const p1 = examBank?.part1 || [];
    const p3 = examBank?.part3 || [];

    // 1. Statik soruları dizilere ayır
    const staticQ1 = [], staticQ2 = [], staticQ3 = [];
    for (let i = 0; i < p1.length; i++) {
       if (i % 3 === 0) staticQ1.push(p1[i].question);
       else if (i % 3 === 1) staticQ2.push(p1[i].question);
       else staticQ3.push(p1[i].question);
    }
    
    const staticB3 = p3.map(item => ({
       Konu: item.question || "",
       Lehine: item.lists?.lehine?.join("\n") || "",
       Aleyhine: item.lists?.aleyhine?.join("\n") || ""
    }));

    // 2. Dinamik havuz verileriyle birleştir
    const allQ1 = [...staticQ1, ...(rawDbPoolData?.part1_q1_pool || [])];
    const allQ2 = [...staticQ2, ...(rawDbPoolData?.part1_q2_pool || [])];
    const allQ3 = [...staticQ3, ...(rawDbPoolData?.part1_q3_pool || [])];
    const allB3 = [...staticB3, ...(rawDbPoolData?.part3_pool || [])];

    // 3. Excel satırlarına dönüştür
    const maxLen = Math.max(allQ1.length, allQ2.length, allQ3.length, allB3.length);

    for (let i = 0; i < maxLen; i++) {
      rows.push({
        B1_Soru_1: allQ1[i] || "",
        B1_Soru_2: allQ2[i] || "",
        B1_Soru_3: allQ3[i] || "",
        B3_Konu: allB3[i]?.Konu || "",
        B3_Lehine: allB3[i]?.Lehine || "",
        B3_Aleyhine: allB3[i]?.Aleyhine || ""
      });
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tüm Sorular");
    XLSX.writeFile(wb, "tum_sistem_sorulari.xlsx");
    
    showToast("Tüm sistem soruları (Statik + Dinamik) indirildi!", "success");
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const arrayBuffer = evt.target.result;
        const wb = XLSX.read(arrayBuffer, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        console.log("Excel'den okunan veri:", data);

        const pool = {
          part1_q1_pool: [],
          part1_q2_pool: [],
          part1_q3_pool: [],
          part3_pool: []
        };

        data.forEach(row => {
          // Object.keys ile whitespace trimleyerek güvenli arama yapabiliriz
          const safeRow = {};
          for (let key in row) {
             safeRow[key.trim()] = row[key];
          }

          if (safeRow.B1_Soru_1) pool.part1_q1_pool.push(safeRow.B1_Soru_1);
          if (safeRow.B1_Soru_2) pool.part1_q2_pool.push(safeRow.B1_Soru_2);
          if (safeRow.B1_Soru_3) pool.part1_q3_pool.push(safeRow.B1_Soru_3);
          
          if (safeRow.B3_Konu || safeRow.B3_Lehine || safeRow.B3_Aleyhine) {
            pool.part3_pool.push({
              Konu: safeRow.B3_Konu || "",
              Lehine: safeRow.B3_Lehine || "",
              Aleyhine: safeRow.B3_Aleyhine || ""
            });
          }
        });

        setDynamicPoolData(pool);
        setDynamicPoolStats({
          b1q1: pool.part1_q1_pool.length,
          b1q2: pool.part1_q2_pool.length,
          b1q3: pool.part1_q3_pool.length,
          b3: pool.part3_pool.length
        });
      } catch (err) {
        console.error("Excel parse error:", err);
        showToast("Excel dosyası okunurken hata oluştu. Şablon formatında olduğundan emin olun.", "error");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleWritingExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        // dense: true ile satır başlıkları dahil tam al
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
        
        const part1Pool = [];
        const part2Pool = [];
        
        for (const row of rows) {
          const ortakMetin = String(row['B1_Ortak_Metin'] || '').trim();
          const gorev1_1 = String(row['B1_Gorev_1_1'] || '').trim();
          const gorev1_2 = String(row['B1_Gorev_1_2'] || '').trim();
          const kompozisyon = String(row['B2_Kompozisyon'] || '').trim();
          
          // Bölüm 1: satır bazlı (kilitli paket)
          if (ortakMetin || gorev1_1 || gorev1_2) {
            part1Pool.push({ ortakMetin, gorev1_1, gorev1_2 });
          }
          
          // Bölüm 2: bağımsız havuz
          if (kompozisyon) {
            part2Pool.push(kompozisyon);
          }
        }
        
        if (part1Pool.length === 0 && part2Pool.length === 0) {
          showToast("Excel'de geçerli satır bulunamadı. Sütunlar: B1_Ortak_Metin | B1_Gorev_1_1 | B1_Gorev_1_2 | B2_Kompozisyon", 'error');
          return;
        }
        
        const poolData = { part1_writing_pool: part1Pool, part2_writing_pool: part2Pool };
        setWritingPoolData(poolData);
        setWritingPoolStats({ part1: part1Pool.length, part2: part2Pool.length });
        showToast(`${part1Pool.length} paket ve ${part2Pool.length} kompozisyon başarıyla okundu!`, 'success');
      } catch (err) {
        console.error('Writing Excel parse error:', err);
        showToast('Excel dosyası okunurken hata oluştu.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const saveWritingPool = async () => {
    if (!writingPoolData) return;
    setSavingWritingPool(true);
    try {
      const res = await fetch('/api/writingPool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poolData: writingPoolData })
      });
      const d = await res.json();
      if (d.success) {
        showToast('Yazma havuzu başarıyla kaydedildi!', 'success');
        setWritingPoolData(null);
        setWritingPoolStats(null);
        if (writingFileInputRef.current) writingFileInputRef.current.value = '';
        fetchWritingPool();
      } else {
        showToast('Hata: ' + d.error, 'error');
      }
    } catch (e) {
      showToast('Bağlantı hatası: ' + e.message, 'error');
    }
    setSavingWritingPool(false);
  };

  const downloadWritingTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        B1_Ortak_Metin: "Siz do'stingizdan elektron pochta xat oldingiz. Unda u sizni tug'ilgan kuningiz bilan tabriklab, kech qolganligini kechirim so'raydi va buning sababini tushuntiradi. Bundan tashqari, u kecha siz bilan gaplasha olmaganligini aytib, tez orada uchrashuv tashkil qilishni taklif qiladi.",
        B1_Gorev_1_1: "Do'stingizga javob yozing:\n- Xatini olganliningizni bildiring\n- Kayfiyatingizni so'rang\n- Uchrashuvga tayyorligingizni bildiring",
        B1_Gorev_1_2: "Ishtirok etmoqchi bo'lgan konferensiya tashkilotchilariga rasmiy xat yozing:\n- Qatnashishga qiziqishingizni bildiring\n- O'zingiz va mutaxassisligingiz haqida ma'lumot bering\n- Ro'yxatdan o'tish tartibi haqida so'rang",
        B2_Kompozisyon: "Zamonaviy texnologiyalarning yoshlar hayotiga ta'siri. Siz ushbu mavzu bo'yicha o'z fikr-mulohazalaringizni bayon qiling. Texnologiyalarning ijobiy va salbiy tomonlarini ko'rsating, o'zingizning xulosangizni bildiring."
      },
      {
        B1_Ortak_Metin: "Siz muhtoj bolalarga yordam beruvchi xayriya tashkilotidan xat oldingiz. Xatda tashkilot o'z faoliyati haqida ma'lumot beradi va ko'ngilli sifatida ishtirok etishingizni so'raydi.",
        B1_Gorev_1_1: "Tashkilotning taklifiga qiziqish bildirgan do'stingizga yozing:\n- Bu haqda nima deb o'ylayotganingizni bildiring\n- Birgalikda ishtirok etishni taklif qiling",
        B1_Gorev_1_2: "Xayriya tashkilotiga rasmiy javob xati yozing:\n- Takliflarini minnatdorchilik bilan qabul qiling\n- O'zingiz haqida qisqacha ma'lumot bering\n- Qachon va qanday yordam bera olishingizni bildiring",
        B2_Kompozisyon: "Ko'ngillilik (volontyorlik) harakati jamiyat uchun nima beradi? Ushbu mavzuda o'z fikringizni bayon eting, misollar keltiring va xulosangizni bildiring."
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Yozma Topshiriqlari');
    XLSX.writeFile(wb, 'yozma_imtihon_sablonu.xlsx');
    showToast('Yozma imtihon şablonu indirildi!', 'success');
  };

  const exportWritingPool = () => {
    if (!rawDbWritingPool?.part1_writing_pool?.length && !rawDbWritingPool?.part2_writing_pool?.length) {
      showToast('Aktif yozma havuzu bulunamadı.', 'error');
      return;
    }
    const p1 = rawDbWritingPool?.part1_writing_pool || [];
    const p2 = rawDbWritingPool?.part2_writing_pool || [];
    const maxLen = Math.max(p1.length, p2.length);
    const rows = [];
    for (let i = 0; i < maxLen; i++) {
      rows.push({
        B1_Ortak_Metin: p1[i]?.ortakMetin || '',
        B1_Gorev_1_1: p1[i]?.gorev1_1 || '',
        B1_Gorev_1_2: p1[i]?.gorev1_2 || '',
        B2_Kompozisyon: p2[i] || '',
      });
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mevcut Yozma Havuzu');
    XLSX.writeFile(wb, 'yozma_havuz_yedek.xlsx');
    showToast('Yozma havuzu indirildi!', 'success');
  };

  const saveDynamicPool = async () => {
    if (!dynamicPoolData) return;
    setSavingPool(true);
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch('/api/dynamicPool', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ poolData: dynamicPoolData })
      });
      const d = await res.json();
      if (d.success) {
        showToast("Havuz başarıyla kaydedildi!", "success");
        setDynamicPoolData(null);
        setDynamicPoolStats(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchDynamicPool(); // Yeniden veritabanından çek (export için)
      } else {
        showToast("Hata: " + d.error, "error");
      }
    } catch (e) {
      showToast("Bağlantı hatası: " + e.message, "error");
    }
    setSavingPool(false);
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
    <div className="min-h-screen bg-gray-50 font-sans text-black relative overflow-x-hidden">
      
      {/* TOAST NOTIFICATION */}
      <div className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${toast.type === 'success' ? 'bg-green-600 border-green-700' : 'bg-red-600 border-red-700'} text-white`}>
          <span className="text-xl">{toast.type === 'success' ? '✅' : '❌'}</span>
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      </div>

      {/* Top Nav */}
      <div className="bg-[#1B52B3] text-white px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold">🏛️ Sınav Yönetim Paneli</h1>
          <p className="text-blue-200 text-xs mt-0.5">Türk Dünyası | Sınav Yönetim Merkezi</p>
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
        
        {/* MODULE TABS */}
        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'speaking', label: '🎙️ Speaking', sub: 'Konuşma' },
            { id: 'writing',  label: '✍️ Writing',  sub: 'Yazma' },
            { id: 'listening',label: '🎧 Listening', sub: 'Dinleme' },
            { id: 'reading',  label: '📖 Reading',   sub: 'Okuma' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center px-6 py-3 font-bold text-sm transition whitespace-nowrap border-b-4 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-800 bg-blue-50 rounded-t-lg'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}>
              <span>{tab.label}</span>
              <span className={`text-xs font-medium ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`}>{tab.sub}</span>
            </button>
          ))}
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

        {/* ═══════════════ SPEAKING KONUŞMA ═══════════════ */}
        {activeTab === 'speaking' && (
          <div className="space-y-4">
            {/* Speaking Sub-tabs */}
            <div className="flex gap-3 border-b border-gray-200">
              {[
                { id: 'variants', label: 'Soru Varyantları' },
                { id: 'dynamic-pool', label: '🔄 Dinamik Havuz' },
                { id: 'results', label: '📊 Sonuçlar' },
              ].map(st => (
                <button key={st.id} onClick={() => { setSpeakingSubTab(st.id); if (st.id === 'results') fetchResults(); }}
                  className={`pb-2 font-bold text-sm px-2 transition border-b-2 ${
                    speakingSubTab === st.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}>{st.label}</button>
              ))}
            </div>

            {speakingSubTab === 'variants' && (
              <div className="bg-white rounded-xl shadow border p-6">
                <h2 className="text-lg font-extrabold text-gray-800 mb-1">Speaking Konuşma — Soru Varyantları</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Bir varyantı <strong>aktif</strong> etmek için kartına tıklayın. PDF indirmek için o kartın 📄 düğmesine tıklayın.
                </p>
                {isSaving && <div className="text-blue-600 font-bold text-sm mb-4 animate-pulse">💾 Kaydediliyor...</div>}

            {/* Rastgele ve Dinamik Kartlar */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-4">
              <div onClick={() => saveVariant('random')}
                className={`p-4 border-2 rounded-xl cursor-pointer transition ${activeVariant === 'random' ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-2xl">🎲</span>
                  {activeVariant === 'random' && <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">Aktif</span>}
                </div>
                <h3 className="font-bold text-gray-800 text-sm">Rastgele (Statik)</h3>
                <p className="text-gray-400 text-xs mt-1">Sabit 50 varyanttan biri</p>
              </div>
              
              <div onClick={() => saveVariant('dynamic')}
                className={`p-4 border-2 rounded-xl cursor-pointer transition ${activeVariant === 'dynamic' ? 'border-purple-600 bg-purple-50 shadow-md' : 'border-gray-200 hover:border-purple-300'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-2xl">🔄</span>
                  {activeVariant === 'dynamic' && <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">Aktif</span>}
                </div>
                <h3 className="font-bold text-purple-900 text-sm">Dinamik Mod</h3>
                <p className="text-gray-500 text-xs mt-1">Havuzdan anlık eşsiz üretim</p>
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

            {speakingSubTab === 'results' && (
              <div className="bg-white rounded-xl shadow border p-0 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-800">Speaking — Sınav Sonuçları</h2>
                    <p className="text-gray-500 text-sm mt-1">Konuşma sınavını tamamlayan öğrenciler.</p>
                  </div>
                  <button onClick={fetchResults} className="bg-blue-50 text-blue-600 px-4 py-2 font-bold rounded-lg text-sm hover:bg-blue-100 transition">🔄 Yenile</button>
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

            {/* Dynamic Pool Sub-Tab */}
            {speakingSubTab === 'dynamic-pool' && (
              <div className="bg-white rounded-xl shadow border p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-800">Speaking — Dinamik Soru Havuzu</h2>
                    <p className="text-gray-500 text-sm mt-1">Excel şablonunu doldurun ve sisteme yükleyin.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={exportAllSystemPool} className="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-lg font-bold text-sm transition">
                      📤 Sistem Sorularını İndir
                    </button>
                    <button onClick={downloadTemplate} className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-lg font-bold text-sm transition">
                      📥 Şablonu İndir
                    </button>
                  </div>
                </div>
                <div className="mb-6 bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center">
                  <span className="text-4xl mb-3">📁</span>
                  <p className="text-gray-600 font-bold mb-4">Doldurduğunuz Excel (XLSX) dosyasını seçin</p>
                  <input type="file" accept=".xlsx" ref={fileInputRef} onChange={handleExcelUpload} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="bg-white border-2 border-purple-600 text-purple-700 hover:bg-purple-50 px-6 py-2 rounded-lg font-bold transition">
                    Excel Seç ve Yükle
                  </button>
                </div>
                {(dynamicPoolData || dynamicPoolStats) && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                    <h3 className="font-bold text-purple-900 text-lg mb-4">Yeni Yüklenen Havuz Önizlemesi</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {[['Bölüm 1 - S1', dynamicPoolStats?.b1q1], ['Bölüm 1 - S2', dynamicPoolStats?.b1q2], ['Bölüm 1 - S3', dynamicPoolStats?.b1q3], ['Bölüm 3 Paket', dynamicPoolStats?.b3]].map(([label, val]) => (
                        <div key={label} className="bg-white p-4 rounded-lg shadow-sm border border-purple-100 text-center">
                          <div className="text-xs text-gray-500 font-bold uppercase mb-1">{label}</div>
                          <div className="text-2xl font-black text-purple-700">{val || 0}</div>
                        </div>
                      ))}
                    </div>
                    <button onClick={saveDynamicPool} disabled={savingPool} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50">
                      {savingPool ? 'Kaydediliyor...' : '✅ Veritabanına Kaydet'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ WRITING YAZMA ═══════════════ */}
        {activeTab === 'writing' && (
          <div className="space-y-4">
            <div className="flex gap-3 border-b border-gray-200">
              {[{ id: 'pool', label: '📚 Soru Havuzu' }, { id: 'results', label: '📊 Sonuçlar' }].map(st => (
                <button key={st.id} onClick={() => { setWritingSubTab(st.id); if (st.id === 'results') fetchWritingResults(); }}
                  className={`pb-2 font-bold text-sm px-2 transition border-b-2 ${writingSubTab === st.id ? 'border-green-600 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {st.label}
                </button>
              ))}
            </div>

            {writingSubTab === 'pool' && (
              <div className="bg-white rounded-xl shadow border p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-800">✍️ Writing Yazma — Soru Havuzu</h2>
                    <p className="text-gray-500 text-sm mt-1">Yazma görevlerini Excel şablonuyla yükleyin.</p>
                  </div>
                  <div className="flex gap-2">
                    {(rawDbWritingPool?.part1_writing_pool?.length > 0 || rawDbWritingPool?.part2_writing_pool?.length > 0) && (
                      <button onClick={exportWritingPool} className="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-lg font-bold text-sm transition">
                        📤 Havuzu İndir
                      </button>
                    )}
                    <button onClick={downloadWritingTemplate} className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-lg font-bold text-sm transition">
                      📥 Şablonu İndir
                    </button>
                  </div>
                </div>

                {(rawDbWritingPool?.part1_writing_pool?.length > 0 || rawDbWritingPool?.part2_writing_pool?.length > 0) && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">✅</span>
                      <div className="font-bold text-green-800">Aktif Yozma Havuzu</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-green-100 text-center">
                        <div className="text-xs text-gray-500 font-bold uppercase mb-1">Bölüm 1 Paketleri</div>
                        <div className="text-2xl font-black text-green-700">{rawDbWritingPool.part1_writing_pool?.length || 0}</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-green-100 text-center">
                        <div className="text-xs text-gray-500 font-bold uppercase mb-1">Bölüm 2 Kompozisyon</div>
                        <div className="text-2xl font-black text-green-700">{rawDbWritingPool.part2_writing_pool?.length || 0}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-6 bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center">
                  <span className="text-4xl mb-3">📁</span>
                  <p className="text-gray-600 font-bold mb-1">Yazma görevi Excel dosyasını seçin</p>
                  <p className="text-gray-400 text-xs mb-4">Sütunlar: <strong>B1_Ortak_Metin</strong> | <strong>B1_Gorev_1_1</strong> | <strong>B1_Gorev_1_2</strong> | <strong>B2_Kompozisyon</strong></p>
                  <input type="file" accept=".xlsx" ref={writingFileInputRef} onChange={handleWritingExcelUpload} className="hidden" />
                  <button onClick={() => writingFileInputRef.current?.click()} className="bg-white border-2 border-green-600 text-green-700 hover:bg-green-50 px-6 py-2 rounded-lg font-bold transition">
                    Excel Seç ve Yükle
                  </button>
                </div>

                {(writingPoolData || writingPoolStats) && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <h3 className="font-bold text-green-900 text-lg mb-4">Yeni Yüklenen Yozma Havuzu Önizlemesi</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-4 border border-green-100 text-center">
                        <div className="text-xs text-gray-500 font-bold uppercase mb-1">Bölüm 1 Paketleri</div>
                        <div className="text-3xl font-black text-green-700">{writingPoolStats?.part1 || 0}</div>
                        <div className="text-xs text-gray-400">(Ortak Metin + Görev 1.1 + Görev 1.2)</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-green-100 text-center">
                        <div className="text-xs text-gray-500 font-bold uppercase mb-1">Bölüm 2 Kompozisyon</div>
                        <div className="text-3xl font-black text-green-700">{writingPoolStats?.part2 || 0}</div>
                        <div className="text-xs text-gray-400">(Bağımsız Havuz)</div>
                      </div>
                    </div>
                    <button onClick={saveWritingPool} disabled={savingWritingPool} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50">
                      {savingWritingPool ? 'Kaydediliyor...' : '✅ Yazma Havuzunu Kaydet'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {writingSubTab === 'results' && (
              <div className="bg-white rounded-xl shadow border p-0 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-800">Writing — Sınav Sonuçları</h2>
                    <p className="text-gray-500 text-sm mt-1">Yazma sınavını tamamlayan öğrenciler.</p>
                  </div>
                  <button onClick={fetchWritingResults} className="bg-green-50 text-green-600 px-4 py-2 font-bold rounded-lg text-sm hover:bg-green-100 transition">🔄 Yenile</button>
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
                      {loadingWritingResults ? (
                        <tr><td colSpan="6" className="text-center py-8 text-gray-500">Yükleniyor...</td></tr>
                      ) : writingResults.length === 0 ? (
                        <tr><td colSpan="6" className="text-center py-8 text-gray-500 font-medium">Henüz yazma sınavı kaydı bulunmuyor.</td></tr>
                      ) : (
                        writingResults.map(r => (
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
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md font-bold text-xs">Puan Bekliyor</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-gray-400 text-xs">
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
        )}

        {/* ═══════════════ LISTENING DİNLEME ═══════════════ */}
        {activeTab === 'listening' && (
          <div className="bg-white rounded-xl shadow border p-8 text-center">
            <div className="text-6xl mb-4">🎧</div>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Listening Dinleme</h2>
            <p className="text-gray-500 mb-6">Dinleme sınavı altyapısı hazırlanıyor.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-left max-w-md mx-auto">
              <h3 className="font-bold text-blue-800 mb-3">🔧 Teknik Altyapı (Hazır)</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li>✅ Supabase Storage: <code className="bg-blue-100 px-1 rounded">listening-audio</code> bucket</li>
                <li>✅ API rotası: <code className="bg-blue-100 px-1 rounded">/api/listeningPool</code></li>
                <li>⏳ Ses dosyası yükleme UI</li>
                <li>⏳ Soru-ses eşleştirme sistemi</li>
              </ul>
            </div>
            <div className="mt-4 inline-block bg-yellow-100 text-yellow-800 text-xs font-black px-4 py-1.5 rounded-full">🚧 YAKINDA</div>
          </div>
        )}

        {/* ═══════════════ READING OKUMA ═══════════════ */}
        {activeTab === 'reading' && (
          <div className="bg-white rounded-xl shadow border p-8 text-center">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Reading Okuma</h2>
            <p className="text-gray-500 mb-6">Okuma sınavı modülü geliştirme aşamasında.</p>
            <div className="mt-4 inline-block bg-yellow-100 text-yellow-800 text-xs font-black px-4 py-1.5 rounded-full">🚧 YAKINDA</div>
          </div>
        )}

      </div>
    </div>
  );
}
