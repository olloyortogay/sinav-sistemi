/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║           PROJE TİTAN — AŞAMA 2                                 ║
 * ║           store/useExamStore.js                                 ║
 * ║                                                                  ║
 * ║  Merkezi Global State (Zustand)                                  ║
 * ║  Tüm sınav oturumu, kullanıcı kimliği ve cevaplar bu store'da   ║
 * ║  RAM'de tutulur. localStorage ameleliği yoktur.                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ─── Sabitler ─────────────────────────────────────────────────────────────────

/**
 * examStatus geçerli değerleri:
 *   'idle'          → Sayfa yüklendi, henüz oturum yok
 *   'rules_reading' → Kullanıcı giriş yaptı, kuralları okuyor (StartModal)
 *   'running'       → Sınav aktif, sayaç çalışıyor
 *   'submitting'    → Gönderim API çağrısı sürüyor (Anti-spam kilidi)
 *   'finished'      → Sınav tamamlandı, sonuç ekranı gösteriliyor
 */

/** Boş cevap şablonu — resetStore ve başlangıç state'i için */
const EMPTY_ANSWERS = {
  task1: '',   // Görev 1.1 — Norasmiy Xat
  task2: '',   // Görev 1.2 — Rasmiy Xat
  essay: '',   // Kompozisyon / Insho
};

/** Store'un sıfır (başlangıç) hali */
const INITIAL_STATE = {
  // Kimlik
  user: null,              // { id, name, email, provider, student_id, telegramUsername, avatar, ... }

  // Sınav durumu
  examStatus: 'idle',      // 'idle' | 'rules_reading' | 'running' | 'submitting' | 'finished'

  // Sayaç (saniye)
  timeRemaining: 3600,     // Varsayılan: 60 dakika. setExamData veya başlatma anında override edilir.

  // Soru paketi (Supabase'den gelen varyant)
  examData: null,          // { part1: { ortakMetin, gorev1_1, gorev1_2 }, part2: { kompozisyon } }

  // Öğrenci cevapları
  studentAnswers: { ...EMPTY_ANSWERS },

  // Gönderim sonrası oluşan sonucun ID'si (AI puanlama için)
  examResultId: null,

  // Gönderim hatası (UI'da göstermek için)
  submitError: null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useExamStore = create(
  devtools(
    (set, get) => ({
      ...INITIAL_STATE,

      // ── Actions ─────────────────────────────────────────────────────────────

      /**
       * setUser(user)
       * AuthGate'den dönen ve student_id içeren kullanıcı objesini store'a yazar.
       * examStatus'u 'rules_reading'e taşır (giriş yapıldı, kurallar bekleniyor).
       *
       * @param {{ id, name, email, provider, student_id, telegramUsername?, avatar? }} user
       */
      setUser: (user) =>
        set(
          { user, examStatus: 'rules_reading', submitError: null },
          false,
          'setUser'
        ),

      /**
       * setExamStatus(status)
       * Durum makinesini manuel olarak ilerletir.
       * Kullanım: kurallar okundu → 'running', hata durumunda → 'idle' vb.
       *
       * @param {'idle'|'rules_reading'|'running'|'submitting'|'finished'} status
       */
      setExamStatus: (status) =>
        set({ examStatus: status }, false, `setExamStatus/${status}`),

      /**
       * tickTimer()
       * Her saniyede 1 kez çağrılır (setInterval). timeRemaining'i 1 azaltır.
       * Süre 0'a düştüğünde otomatik olarak 'submitting' durumuna geçer.
       * Not: Gerçek submit işlemi UI katmanında tetiklenir; store sadece durum bildirir.
       */
      tickTimer: () =>
        set(
          (state) => {
            if (state.timeRemaining <= 1) {
              return { timeRemaining: 0, examStatus: 'submitting' };
            }
            return { timeRemaining: state.timeRemaining - 1 };
          },
          false,
          'tickTimer'
        ),

      /**
       * setExamData(data, durationSeconds?)
       * Supabase'den veya generateWritingVariant API'sinden gelen varyantı kaydeder.
       * İsteğe bağlı olarak sınav süresini de ayarlar (varsayılan: 3600 sn = 60 dk).
       * examStatus'u 'running' yapar — sayaç bu andan itibaren başlar.
       *
       * @param {{ part1: object, part2: object }} data
       * @param {number} [durationSeconds=3600]
       */
      setExamData: (data, durationSeconds = 3600) =>
        set(
          {
            examData: data,
            timeRemaining: durationSeconds,
            examStatus: 'running',
            submitError: null,
          },
          false,
          'setExamData'
        ),

      /**
       * updateAnswer(field, value)
       * Öğrencinin yazdığı metni anlık olarak günceller.
       * field: 'task1' | 'task2' | 'essay'
       *
       * @param {'task1'|'task2'|'essay'} field
       * @param {string} value
       */
      updateAnswer: (field, value) =>
        set(
          (state) => ({
            studentAnswers: {
              ...state.studentAnswers,
              [field]: value,
            },
          }),
          false,
          `updateAnswer/${field}`
        ),

      /**
       * setSubmitError(message)
       * Gönderim sırasında oluşan hatayı store'a yazar.
       * examStatus'u tekrar 'running'e alarak kullanıcının tekrar denemesine izin verir.
       *
       * @param {string|null} message
       */
      setSubmitError: (message) =>
        set(
          { submitError: message, examStatus: message ? 'running' : 'submitting' },
          false,
          'setSubmitError'
        ),

      /**
       * setExamResultId(id)
       * Sınav gönderildiğinde dönen Supabase UUID'sini kaydeder.
       */
      setExamResultId: (id) =>
        set({ examResultId: id }, false, 'setExamResultId'),

      /**
       * resetStore()
       * Store'u sıfırdan başlatır. Kullanıcı çıkış yaptığında veya
       * sınav tamamlandıktan sonra yeni bir oturum başlatmak için kullanılır.
       * Not: user bilgisi kasıtlı olarak temizlenir — tam çıkış.
       */
      resetStore: () =>
        set({ ...INITIAL_STATE, studentAnswers: { ...EMPTY_ANSWERS } }, false, 'resetStore'),

      // ── Türetilmiş (Computed) Değerler ──────────────────────────────────────

      /**
       * getFormattedTime()
       * timeRemaining'i "MM:SS" formatında döndürür. UI'da doğrudan kullanılabilir.
       * @returns {string} "59:59"
       */
      getFormattedTime: () => {
        const { timeRemaining } = get();
        const m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
        const s = (timeRemaining % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
      },

      /**
       * getWordCounts()
       * Anlık kelime sayılarını döndürür. Sınav içi geri bildirim için.
       * @returns {{ task1: number, task2: number, essay: number }}
       */
      getWordCounts: () => {
        const { studentAnswers } = get();
        const count = (text) =>
          text?.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
        return {
          task1: count(studentAnswers.task1),
          task2: count(studentAnswers.task2),
          essay: count(studentAnswers.essay),
        };
      },

      /**
       * isTimeWarning()
       * Kalan süreye göre renk/uyarı seviyesi döndürür.
       * @returns {'normal'|'warning'|'danger'}
       */
      isTimeWarning: () => {
        const { timeRemaining } = get();
        if (timeRemaining < 600) return 'danger';   // < 10 dk: kırmızı
        if (timeRemaining < 1800) return 'warning'; // < 30 dk: turuncu
        return 'normal';                             // > 30 dk: yeşil
      },

      /**
       * getSubmitPayload()
       * Sınav gönderiminde API'ye gönderilecek tam veriyi hazırlar.
       * student_id dahil tüm kritik alanlar tek noktadan derlenir.
       * @param {number} totalTimeSpent - Başlangıçtan bu yana geçen saniye
       * @returns {object}
       */
      getSubmitPayload: (totalTimeSpent) => {
        const { user, examData, studentAnswers } = get();
        return {
          student_id:        user?.student_id      || null,
          userName:          user?.name            || 'Bilinmeyen',
          userEmail:         user?.email           || null,
          telegramAuthId:    user?.provider === 'telegram' ? String(user.id) : null,
          telegramUsername:  user?.telegramUsername || null,
          provider:          user?.provider        || 'bilinmiyor',
          totalTime:         totalTimeSpent,
          task1Text:         studentAnswers.task1,
          task2Text:         studentAnswers.task2,
          kompozisyonText:   studentAnswers.essay,
          part1Info:         examData?.part1       || null,
          part2Info:         examData?.part2?.kompozisyon || null,
        };
      },
    }),
    {
      name: 'TitanExamStore', // Redux DevTools'da görünecek isim
    }
  )
);
