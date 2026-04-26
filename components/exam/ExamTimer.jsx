'use client';
import { useExamStore } from '../../store/useExamStore';

export default function ExamTimer({ title = "Yozma Imtihoni / Yazma Sınavı" }) {
  const user = useExamStore(state => state.user);
  const getFormattedTime = useExamStore(state => state.getFormattedTime);
  const isTimeWarning = useExamStore(state => state.isTimeWarning);

  const timeColor = 
    isTimeWarning() === 'danger' ? 'text-red-400 animate-pulse' :
    isTimeWarning() === 'warning' ? 'text-orange-400' : 
    'text-green-400';

  return (
    <div className="bg-[#1B52B3] text-white px-6 py-3 flex justify-between items-center shadow-lg sticky top-0 z-10">
      <div>
        <div className="text-xs text-blue-200 font-medium">Türk Dünyası | ✍️ Writing</div>
        <div className="font-black text-lg">{title}</div>
      </div>
      <div className="flex items-center gap-4">
        {user?.name && (
          <div className="hidden sm:block text-right text-xs text-blue-200">{user.name}</div>
        )}
        <div className={`text-3xl font-black tabular-nums ${timeColor}`}>
          {getFormattedTime()}
        </div>
      </div>
    </div>
  );
}
