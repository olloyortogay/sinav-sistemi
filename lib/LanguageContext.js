'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  uz: {
    // Navbar
    navHome: 'Bosh sahifa',
    navProfile: 'Mening Profilim',
    login: 'Tizimga kirish',
    logout: 'Chiqish',
    
    // Landing Page
    heroBadge: 'Platformasi',
    heroTitlePart1: 'Til Bilish Darajangizni',
    heroTitlePart2: 'Sifatli Aniqlang',
    heroDesc: "Zamonaviy AI texnologiyasi va haqiqiy o'qituvchilar yordamida nutq, eshitish va yozish ko'nikmalaringizni tekshiring.",
    btnStart: '🚀 Sinovga Kirish',
    btnResults: '📊 Natijalarim',
    
    modulesTitle: 'Sinov Modullari',
    modulesDesc: "Barcha yo'nalishlarda har tomonlama baholash",
    activeModuleNum: 'Faol Modul:',
    soon: "Yaqinda...",
    startModule: "Boshlash",
    
    // Modules
    modSpeakingTitle: 'Gapirish (Speaking)',
    modSpeakingDesc: "AI emas, haqiqiy o'qituvchi baholaydi",
    modListeningTitle: 'Eshittirish (Listening)',
    modListeningDesc: "Audio tahlil va tushunish",
    modReadingTitle: "O'qish (Reading)",
    modReadingDesc: 'Matn tahlili va savollar',
    modWritingTitle: 'Yozish (Writing)',
    modWritingDesc: 'Insho va matn tahriri',

    // Discussion Section
    discTitle: 'Muhokama & Fikrlar',
    discLeaveCommentLbl: 'Fikr qoldirish',
    discPlaceholder: "Sinov haqida fikrlaringizni yozing...",
    discSubmit: 'Yuborish',
    discSubmitting: "Yuborilmoqda...",
    discMustLogin: "Fikr qoldirish uchun tizimga kirishingiz kerak.",
    discError: "Yoxud xatolik yuz berdi!",

    // Footer
    footerDesc: "Zamonaviy til o'qitish standartlari va innovate texnologiyalar markazi.",
    footerContactTitle: "Biz bilan bog'laning",
    footerAlert: "Hozirgi barcha sinovlar bepul taqdim etiladi.",
    footerAction: "Hozir Ro'yxatdan O'ting!",
    footerCopyright: "© 2026 TÜRK DÜNYASI PLATFORMASI. BARCHA HUQUQLAR HIMOYA QILINGAN.",

    // Profile
    profTitle: 'Mening Profilim',
    profWelcome: 'Xush kelibsiz',
    profEmail: 'Elektron pochta',
    profDesc: "Ushbu sahifada ilgarigi sinov natijalari va hisobingiz haqidagi ma'lumotlarni ko'rishingiz mumkin.",
    profLinkTgTitle: "Telegram hisobingizni ulang (Ixtiyoriy)",
    profLinkTgDesc: "Telegram hisobingizni ulab, sinov natijalarini to'g'ridan-to'g'ri Telegram orqali ham olishingiz mumkin.",
    profLinkBtn: "Telegram hisobini ulash",
    profHistory: "Sinov Tarixi",
    profNoExam: "Hali hech qanday sinovda qatnashmadingiz.",
    profExamVariant: "Variant",
    profDate: "Sana",
    profDuration: "Davomiyligi",
    profPending: "Kutilmoqda",
    profPoints: "Ball",

    // Exam App State General
    examTitle: "Gapirish sinovi",
    examInternetLost: "⚠️ Internet aloqangiz uzildi! Iltimos, aloqangizni tekshiring, aks holda sinovingiz to'xtab qolishi mumkin.",
    examProfile: "Profilim",
    
    // Login Screen
    loginHeader1: "Turk dunyosi",
    loginHeader2: "Imtihon markazi",
    loginHeader3: "Sinovni boshlash uchun tizimga kiring",
    loginGoogle: "Google orqali kiring",
    loginOr: "YOKI",
    loginDisclaimer: "Xavfsizligingiz uchun tizimga kirish talab qilinadi. Sizning yechimlaringiz profilingizda saqlanadi.",
    
    // Mic Check
    micCheckTitle: "Mikrofon Testi",
    micCheckWelcome: "Xush kelibsiz",
    micCheckDesc: "Sinovni boshlashdan oldin mikrofoningiz ishlayotganligiga ishonch hosil qiling.",
    btnMicTest: "🔍 Mikrofonni Test Qilish",
    btnStartMic: "▶ Sinovni Boshlash",
    
    // Gateway
    gatewayDesc: "Tayyor bo'lganingizda boshlang",
    btnGatewayStart: "▶ Kirish",
    
    // Uploading
    uploadingTitle: "Audio fayllar yuborilmoqda",
    uploadingDesc: "Iltimos, kuting. Yozuvlaringiz xavfsiz tarzda yuborilmoqda...",
    uploadingDontClose: "Bu oynani yopmang",
    
    // Finished
    finishBackHome: "Bosh sahifaga qaytish",
    finishTitle: "Sinov yakunlandi!",
    finishCongrats: "Tabriklaymiz",
    finishSuccess: "Gapirish sinovini muvaffaqiyatli yakunladingiz.",
    finishCountDone: "Yozib Olish Yakunlandi",
    finishTotalTime: "Umumiy Vaqt",
    finishResultEmail: "📬 Natija hisobotingiz ushbu manzilga yuboriladi:",
    finishResultTelegram: "📬 Sinov natijalari Telegram botimiz orqali to'g'ridan-to'g'ri sizga yuboriladi.",
    finishSpecialOfferTitle: "🎁 Sizga Maxsus Taklif",
    finishSpecialOfferDesc1: "Turk tili kurslariga",
    finishSpecialOfferDesc2: "chegirmadan foydalaning!",
    finishSpecialOfferCode: "Kod: ",
    finishSpecialOfferBtn: "Kurslarni Ko'ring →",
    finishError: "⚠️ Xatolik",
    finishCloseStr: "🏛️ Türk Dünyası | Oynani yopishingiz mumkin.",
    
    // Exam Board
    examSoru: "Savol",
    examHazirlikSuresi: "Tayyorgarlik vaqti",
    examSaniye: "soniya",
    examKeyingi: "Keyingi →",
    examLehine: "Lehine",
    examAleyhine: "Aleyhine",
    aiAnalysis: "AI Tahlili (Sun'iy intellekt baholashi)"
  },
  tr: {
    // Navbar
    navHome: 'Ana Sayfa',
    navProfile: 'Profilim',
    login: 'Giriş Yap',
    logout: 'Çıkış Yap',
    
    // Landing Page
    heroBadge: 'Platforması',
    heroTitlePart1: 'Dil Yeterlilik Seviyenizi',
    heroTitlePart2: 'Sıfır Hata İle Ölçün',
    heroDesc: "Modern yapay zeka teknolojisi ve gerçek eğitmenler uzmanlığıyla konuşma, dinleme ve yazma becerilerinizi Türk Dünyası standartlarında değerlendirin.",
    btnStart: '🚀 Sınava Gir',
    btnResults: '📊 Sonuçlarım',
    
    modulesTitle: 'Sınav Modülleri',
    modulesDesc: "Tüm beceri alanlarında kapsamlı değerlendirme",
    activeModuleNum: 'Aktif Modül:',
    soon: "Yakında...",
    startModule: "Başla",
    
    // Modules
    modSpeakingTitle: 'Konuşma (Speaking)',
    modSpeakingDesc: "AI değil, gerçek öğretmen puanlar",
    modListeningTitle: 'Dinleme (Listening)',
    modListeningDesc: "Duyduğunu anlama ve analiz",
    modReadingTitle: 'Okuma (Reading)',
    modReadingDesc: 'Metin analizi ve anlama',
    modWritingTitle: 'Yazma (Writing)',
    modWritingDesc: 'Kompozisyon ve metin üretimi',

    // Discussion Section
    discTitle: 'Tartışma & Yorumlar',
    discLeaveCommentLbl: 'Yorum Bırak',
    discPlaceholder: "Sınav hakkında düşüncelerinizi yazın...",
    discSubmit: 'Gönder',
    discSubmitting: "Gönderiliyor...",
    discMustLogin: "Yorum bırakmak için giriş yapmalısınız.",
    discError: "Bir hata oluştu!",

    // Footer
    footerDesc: "Modern dil öğretim standartları ve yenilikçi teknolojiler merkezi.",
    footerContactTitle: "Bizimle İletişime Geçin",
    footerAlert: "Şu andaki tüm deneme sınavlarımız ücretsizdir.",
    footerAction: "Hemen Kayıt Olun!",
    footerCopyright: "© 2026 TÜRK DÜNYASI PLATFORMU. TÜM HAKLARI SAKLIDIR.",

    // Profile
    profTitle: 'Profilim',
    profWelcome: 'Hoş geldiniz',
    profEmail: 'E-posta',
    profDesc: "Bu sayfada geçmiş sınav sonuçlarınızı ve hesabınızla ilgili detayları görüntüleyebilirsiniz.",
    profLinkTgTitle: "Telegram Hesabınızı Bağlayın (İsteğe Bağlı)",
    profLinkTgDesc: "Telegram hesabınızı bağlayarak sınav sonuçlarınızı doğrudan Telegram üzerinden de alabilirsiniz.",
    profLinkBtn: "Telegram Hesabını Bağla",
    profHistory: "Sınav Geçmişi",
    profNoExam: "Henüz hiçbir sınava katılmadınız.",
    profExamVariant: "Varyant",
    profDate: "Tarih",
    profDuration: "Süre",
    profPending: "Bekliyor",
    profPoints: "Puan",
    
    // Exam App State General
    examTitle: "Konuşma Sınavı",
    examInternetLost: "⚠️ İnternet bağlantınız koptu! Lütfen bağlantınızı kontrol edin, sınavınız kesintiye uğrayabilir.",
    examProfile: "Profilim",
    
    // Login Screen
    loginHeader1: "Türk Dünyası",
    loginHeader2: "Konuşma Sınavı",
    loginHeader3: "Sınava başlamak için lütfen giriş yapın",
    loginGoogle: "Google ile Devam Et",
    loginOr: "YADA",
    loginDisclaimer: "Güvenliğiniz için giriş yapmanız istenmektedir. Çözümleriniz profilinizde saklanacaktır.",
    
    // Mic Check
    micCheckTitle: "Mikrofon Testi",
    micCheckWelcome: "Hoş geldiniz",
    micCheckDesc: "Sınava başlamadan önce mikrofonunuzun çalıştığını doğrulayın.",
    btnMicTest: "🔍 Mikrofonu Test Et",
    btnStartMic: "▶ Sınava Başla",
    
    // Gateway
    gatewayDesc: "Hazır olduğunuzda başlayın",
    btnGatewayStart: "▶ Giriş",
    
    // Uploading
    uploadingTitle: "Ses Dosyaları Gönderiliyor",
    uploadingDesc: "Lütfen bekleyin. Kayıtlarınız güvenle iletiliyor...",
    uploadingDontClose: "Bu pencereyi kapatmayın",
    
    // Finished
    finishBackHome: "Ana Sayfaya Dön",
    finishTitle: "Sınav Tamamlandı!",
    finishCongrats: "Tebrikler",
    finishSuccess: "Konuşma sınavını başarıyla tamamladınız.",
    finishCountDone: "Kayıt Tamamlandı",
    finishTotalTime: "Toplam Süre",
    finishResultEmail: "📬 Sonuç raporunuz e-posta adresinize gönderilecektir:",
    finishResultTelegram: "📬 Sınav sonucunuz Telegram botumuz üzerinden size doğrudan iletilecektir.",
    finishSpecialOfferTitle: "🎁 Size Özel Teklif",
    finishSpecialOfferDesc1: "Türkçe kurslarda",
    finishSpecialOfferDesc2: "%15 indirim fırsatını kaçırmayın!",
    finishSpecialOfferCode: "Kod: ",
    finishSpecialOfferBtn: "Kurslara Göz At →",
    finishError: "⚠️ Hata",
    finishCloseStr: "🏛️ Türk Dünyası | Sayfa kapatılabilir.",
    
    // Exam Board
    examSoru: "Soru",
    examHazirlikSuresi: "Hazırlık Süresi",
    examSaniye: "saniye",
    examKeyingi: "Sonraki →",
    examLehine: "Lehine",
    examAleyhine: "Aleyhine",
    aiAnalysis: "AI Analizi (Yapay Zeka Değerlendirmesi)"
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('uz');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('appLang');
    if (saved === 'uz' || saved === 'tr') {
      setLang(saved);
    }
  }, []);

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('appLang', newLang);
  };

  const t = (key) => translations[lang][key] || key;

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
