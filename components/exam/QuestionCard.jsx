'use client';
import { useExamStore } from '../../store/useExamStore';

/**
 * QuestionCard
 * 
 * @param {string} title - Örn: "Görev 1.1 — Norasmiy Xat"
 * @param {string} description - Soru metni
 * @param {string} field - Store'daki karşılığı: 'task1' | 'task2' | 'essay'
 * @param {number} minWords - Minimum kelime sayısı
 * @param {string} theme - 'green' | 'blue' | 'purple'
 * @param {number} rows - textarea satır sayısı
 */
export default function QuestionCard({ title, description, field, minWords, theme = 'blue', rows = 6 }) {
  const answerText = useExamStore(state => state.studentAnswers[field]);
  const updateAnswer = useExamStore(state => state.updateAnswer);

  const wordCount = answerText?.trim() ? answerText.trim().split(/\s+/).filter(Boolean).length : 0;
  const isSatisfied = wordCount >= minWords;

  // Tema renk haritası
  const themeStyles = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: '🟢',
      ring: 'focus:ring-green-400',
      success: 'text-green-600'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: '🔵',
      ring: 'focus:ring-blue-400',
      success: 'text-blue-600'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      icon: '📝',
      ring: 'focus:ring-purple-400',
      success: 'text-purple-600'
    }
  };

  const ts = themeStyles[theme];

  return (
    <div className="p-5 border-b border-gray-100 last:border-0">
      {/* Soru Açıklaması */}
      {description && (
        <div className={`mb-3 ${ts.bg} border ${ts.border} rounded-xl p-4`}>
          <div className={`text-xs font-black ${ts.text} uppercase tracking-wider mb-1`}>
            {ts.icon} {title}
          </div>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{description}</p>
        </div>
      )}

      {/* Sayaç ve Başlık Bilgisi */}
      <div className="flex justify-between items-end text-xs text-gray-500 mb-2 px-1">
        <span className={`font-bold ${ts.text}`}>{title} — ~{minWords} so&apos;z</span>
        <span className={isSatisfied ? `${ts.success} font-bold` : 'text-gray-400'}>
          {wordCount} / {minWords} so&apos;z {isSatisfied ? '✓' : ''}
        </span>
      </div>

      {/* Yazı Alanı */}
      <textarea 
        value={answerText} 
        onChange={e => updateAnswer(field, e.target.value)}
        placeholder="Javobingizni shu yerga yozing..."
        rows={rows}
        className={`w-full border border-gray-200 rounded-xl p-4 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 ${ts.ring} transition`} 
      />
    </div>
  );
}
