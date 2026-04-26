'use client';
import { useState, useEffect } from 'react';
import { useExamStore } from '../../store/useExamStore';

export default function AiFeedbackCard() {
  const examData = useExamStore(state => state.examData);
  const studentAnswers = useExamStore(state => state.studentAnswers);
  const examResultId = useExamStore(state => state.examResultId);
  
  const [aiState, setAiState] = useState('loading'); // loading | success | error
  const [aiResult, setAiResult] = useState(null);

  useEffect(() => {
    if (!examResultId) return;
    
    let isMounted = true;
    const fetchAI = async () => {
      try {
        const res = await fetch('/api/gradeWriting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examResultId: examResultId,
            task1Text: studentAnswers.task1,
            task2Text: studentAnswers.task2,
            kompozisyonText: studentAnswers.essay,
            part1Info: examData?.part1,
            part2Info: examData?.part2?.kompozisyon
          })
        });
        const data = await res.json();
        
        if (isMounted) {
          if (data.success) {
            setAiResult({ score: data.score, feedback: data.feedback });
            setAiState('success');
          } else {
            setAiState('error');
          }
        }
      } catch (err) {
        if (isMounted) setAiState('error');
      }
    };
    
    fetchAI();
    return () => { isMounted = false; };
  }, [examResultId, studentAnswers, examData]);

  if (aiState === 'loading') {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-2xl w-full flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Sun&apos;iy Intelekt Tahlil Qilmoqda...</h2>
        <p className="text-gray-500 text-sm mt-2 text-center">
          Sizning yozma ishingiz Google Gemini AI tomonidan grammatika, mantiq va imlo bo&apos;yicha baholanmoqda. (Kuting: 3-5 soniya)
        </p>
      </div>
    );
  }

  if (aiState === 'error') {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-2xl w-full text-center border border-red-200">
        <div className="text-4xl mb-2">⚠️</div>
        <h2 className="text-lg font-bold text-red-600">Tahlil qilishda xatolik yuz berdi</h2>
        <p className="text-gray-500 text-sm">Sun&apos;iy intellekt xizmati hozircha band. Natijangiz saqlandi, keyinroq profildan ko&apos;rishingiz mumkin.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 max-w-2xl w-full border-t-4 border-purple-500">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-3 rounded-full text-2xl">🤖</div>
          <div>
            <h2 className="text-xl font-black text-gray-800">Sun&apos;iy Intelekt Xulosasi</h2>
            <div className="text-xs text-purple-600 font-bold">Google Gemini AI</div>
          </div>
        </div>
        <div className="text-center bg-gray-50 p-3 rounded-2xl border border-gray-200">
          <div className="text-3xl font-black text-purple-700">{aiResult.score}<span className="text-sm text-gray-400">/100</span></div>
          <div className="text-[10px] text-gray-500 uppercase font-bold">Umumiy Ball</div>
        </div>
      </div>
      
      <div className="prose prose-sm max-w-none text-gray-700 prose-p:leading-relaxed prose-strong:text-purple-700">
        <p className="whitespace-pre-wrap">{aiResult.feedback}</p>
      </div>
    </div>
  );
}
