'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import CustomAlertModal from './CustomAlertModal';
import {
  listeningDistribution,
  listeningFinishNote,
  listeningIntroText,
  listeningReferenceChoices,
  listeningSections,
} from '../src/data/listeningQuestions';

const LISTENING_AUDIO_URL = 'https://oracvhqkmtclkkujqcrh.supabase.co/storage/v1/object/public/assets/ses/dinleme-sinavi/ses-v2.m4a';
const LISTENING_MAP_URL = 'https://oracvhqkmtclkkujqcrh.supabase.co/storage/v1/object/public/assets/ses/harita1.png';

const allQuestions = listeningSections.flatMap((section) => section.questions);

export default function ListeningSection({ onSubmit, disabled = false }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showStopWarning, setShowStopWarning] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);

  const allAnswered = useMemo(
    () => allQuestions.every((q) => answers[q.id] !== undefined && answers[q.id] !== ''),
    [answers]
  );

  function setSingleAnswer(id, value) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function handleSubmit() {
    if (disabled) return;
    const sections = {
      exam_type: 'listening',
      answers,
      detailedResults: allQuestions.map((q) => ({
        questionId: q.questionNo,
        questionText: q.question,
        userAnswer: answers[q.id] || null,
        correctAnswer: null,
        isCorrect: null,
      })),
      audioEnded,
      countdownStarted: audioEnded,
    };
    onSubmit?.({ sections, answers, audioEnded });
  }

  useEffect(() => {
    if (!audioEnded || timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [audioEnded, timeLeft]);

  useEffect(() => {
    if (audioEnded && timeLeft === 0) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioEnded, timeLeft]);

  async function toggleAudio() {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setShowStopWarning(true);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Listening audio play failed:', error);
    }
  }

  function handleEnded() {
    setIsPlaying(false);
    setAudioEnded(true);
    if (timeLeft === 0) setTimeLeft(600);
  }

  function handleExitExam() {
    const audio = audioRef.current;
    if (audio) audio.pause();
    setIsPlaying(false);
    setAudioEnded(false);
    setTimeLeft(0);
    setAnswers({});
    setShowExitWarning(false);
    onSubmit?.({ exited: true });
  }

  function renderQuestion(q, isCompactHorizontal = false) {
    const options = q.type === 'true_false' ? ['A) Doğru', 'B) Yanlış'] : q.options;
    return (
      <div key={q.id} className="bg-white border rounded-2xl p-5">
        {q.groupTitle ? <p className="text-sm font-bold text-blue-700 mb-2">{q.groupTitle}</p> : null}
        <p className="font-bold text-gray-900 mb-3">{q.question}</p>
        <div className={isCompactHorizontal ? 'flex flex-wrap gap-2' : 'space-y-2'}>
          {options.map((opt) => (
            <label
              key={opt}
              className={`${isCompactHorizontal ? 'inline-flex' : 'flex'} items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent ${answers[q.id] === opt ? 'bg-blue-50 border-blue-200' : ''}`}
            >
              <input type="radio" name={q.id} checked={answers[q.id] === opt} onChange={() => setSingleAnswer(q.id, opt)} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <h3 className="font-black text-gray-900 mb-3">Dinleme Sınavı Bilgilendirme</h3>
        <div className="space-y-2 text-sm text-gray-800">
          {listeningIntroText.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className="mt-4">
          <p className="font-bold text-gray-900 mb-2">Dinleme Metinleri ve Soruların Dağılımı:</p>
          <ul className="space-y-1 text-sm text-gray-800">
            {listeningDistribution.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="sticky top-24 z-30 bg-white border border-blue-100 rounded-2xl p-4 shadow-sm">
        <audio ref={audioRef} src={LISTENING_AUDIO_URL} onEnded={handleEnded} className="hidden" preload="auto" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex w-full sm:w-auto gap-2">
            <button
              onClick={toggleAudio}
              disabled={disabled}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white transition ${isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isPlaying ? 'Sınavı Durdur' : 'Sınavı Başlat'}
            </button>
            <button
              onClick={() => setShowExitWarning(true)}
              disabled={disabled}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white transition bg-red-600 hover:bg-red-700 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Sınavdan Çıkış
            </button>
          </div>
          <div className="text-sm font-semibold text-gray-700">
            {audioEnded
              ? `Süre: ${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`
              : 'Ses bitince 10 dakikalık cevap süresi başlayacak'}
          </div>
        </div>
        {showExitWarning ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-semibold text-red-800">
              Sınavdan çıkarsanız mevcut işaretlemeleriniz silinecektir. Çıkmak istediğinize emin misiniz?
            </p>
            <div className="mt-2 flex gap-2">
              <button onClick={handleExitExam} className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700">
                Evet, Çık ve Sil
              </button>
              <button onClick={() => setShowExitWarning(false)} className="px-4 py-2 rounded-lg bg-white border font-semibold hover:bg-gray-50">
                Vazgeç
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {listeningSections.map((section) => (
        <section key={section.id} className="space-y-4 rounded-3xl border-2 border-indigo-100 bg-gradient-to-b from-white to-indigo-50/30 p-4 sm:p-5">
          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <div className="inline-flex items-center rounded-full bg-indigo-100 text-indigo-700 px-3 py-1 text-xs font-black tracking-wide mb-3">
              YENI METIN BLOĞU
            </div>
            <h3 className="font-black text-gray-900 text-lg">{section.title}</h3>
            <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{section.instruction}</p>
            {section.subInstruction ? (
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{section.subInstruction}</p>
            ) : null}
            {section.sample ? (
              <div className="mt-4 bg-gray-50 border rounded-xl p-4">
                <p className="font-bold text-gray-900 mb-2">Örneğin:</p>
                <p className="font-semibold">{section.sample.text}</p>
                <div className="space-y-1 mt-2 text-sm">
                  {section.sample.options.map((opt) => (
                    <p key={opt}>{opt}</p>
                  ))}
                </div>
                <p className="font-bold text-emerald-700 mt-2">{section.sample.answer}</p>
              </div>
            ) : null}
          </div>

          {section.id === 'section3' ? (
            <div className="bg-white border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="align-top">
                    <td className="w-[40%] border-r p-4 bg-gray-50">
                      <div className="space-y-4">
                        {section.questions.map((q) => (
                          <div key={q.id}>
                            <p className="font-bold text-gray-900 mb-2">{q.question}</p>
                            <div className="flex flex-wrap gap-2">
                              {q.options.map((opt) => (
                                <label key={`${q.id}-${opt}`} className="px-3 py-1 border rounded-lg cursor-pointer hover:bg-blue-50">
                                  <input
                                    type="radio"
                                    name={q.id}
                                    checked={answers[q.id] === opt}
                                    onChange={() => setSingleAnswer(q.id, opt)}
                                    className="mr-1"
                                  />
                                  {opt}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        {Object.entries(listeningReferenceChoices).map(([key, value]) => (
                          <p key={key} className="leading-relaxed">
                            <strong>{key})</strong> {value}
                          </p>
                        ))}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}

          {section.id === 'section4' ? (
            <div className="bg-white border rounded-2xl p-5">
              <h4 className="font-bold text-gray-900 mb-3">Harita</h4>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LISTENING_MAP_URL} alt="Dinleme sınavı haritası" className="w-full max-h-[560px] object-contain rounded-xl border" />
            </div>
          ) : null}

          {section.id !== 'section3' &&
            section.questions.map((q) => renderQuestion(q, section.id === 'section4'))}
        </section>
      ))}

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="font-bold text-amber-900">{listeningFinishNote}</p>
      </div>

      <div className="pb-10">
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || disabled}
          className={`w-full py-4 rounded-2xl font-black text-white ${!allAnswered || disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
        >
          Dinleme Sınavını Bitir
        </button>
      </div>

      <CustomAlertModal
        isOpen={showStopWarning}
        title="Dikkat"
        message="🚨 DİKKAT! Gerçek sınavda sesi durdurma lüksün YOKTUR! Disiplinli ol ve sınava devam et!"
        type="warning"
        onClose={() => setShowStopWarning(false)}
      />
    </div>
  );
}

