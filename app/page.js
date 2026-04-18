'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { generateExam } from './data/questions';

export default function ExamInterface() {
  const [appState, setAppState] = useState('LOGIN'); // LOGIN, MIC_CHECK, GATEWAY, EXAM, FINISHED
  const [studentName, setStudentName] = useState('');
  
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    // Backendden aktif varyantı al ve ona göre sınavı oluştur
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        const activeVariant = data.activeVariant || 'random';
        setQuestions(generateExam(activeVariant));
      })
      .catch((err) => {
        // Hata durumunda rastgele devam et
        setQuestions(generateExam('random'));
      });
  }, []);
  const [phase, setPhase] = useState('prep'); // 'prep' veya 'speak'
  const [timeLeft, setTimeLeft] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Font Büyüklüğü
  const [fontSizeRatio, setFontSizeRatio] = useState(1);
  // Toplam sınav kronometre
  const [totalElapsed, setTotalElapsed] = useState(0);
  const totalTimerRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const allRecordingsRef = useRef([]); // Tüm soruların kayıtlarını tutar
  
  // Visualizer Referansları
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const currentItem = questions.length > 0 ? questions[currentQuestionIndex] : null;

  // Aktif Bölümü Bul (1, 2 veya 3)
  const getActiveSection = () => {
    if (!currentItem) return 1;
    if (currentItem.section?.includes("1.")) return 1;
    if (currentItem.section?.includes("2.")) return 2;
    if (currentItem.section?.includes("3.")) return 3;
    if (currentItem.title?.includes("1.")) return 1;
    if (currentItem.title?.includes("2.")) return 2;
    if (currentItem.title?.includes("3.")) return 3;
    return 1;
  };

  const activeSection = getActiveSection();

  const playTing = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1);
  };

  // Yapay Zeka Metin Okuma (TTS)
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (appState !== 'EXAM' || isUploading || errorMsg || !currentItem || currentItem.type === 'transition') return;

    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      if (phase === 'prep') {
        setPhase('speak');
        setTimeLeft(currentItem.speakTime);
        startRecording();
      } else if (phase === 'speak') {
        stopRecording();
      }
    }
  }, [timeLeft, phase, appState, isUploading, errorMsg, currentItem]);

  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setAppState('GATEWAY');
    } catch (err) {
      alert("Mikrofon izni alınamadı!");
    }
  };

  const startRecording = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      // Dalga formu için Time Domain verisi alınacak
      analyserRef.current.fftSize = 2048; 
      drawVisualizer();

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        
        // Ses Blob'unu bitince kaydet, hemen GÖNDERME
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        allRecordingsRef.current.push({
           blob: audioBlob,
           sectionName: currentItem.section || "Soru"
        });
        audioChunksRef.current = [];
        
        goToNextItem();
      };
      
      mediaRecorderRef.current.start();
    } catch (err) {
      setErrorMsg("Kayıt başlatılamadı. Mikrofon iznini kontrol edin.");
    }
  };

  const drawVisualizer = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Kayan dalgalar için zaman değişkeni
    let time = 0;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteTimeDomainData(dataArray);

      // RMS hesapla (sesin şiddeti)
      let sumSquares = 0;
      for (let i = 0; i < bufferLength; i++) {
        let normalized = (dataArray[i] / 128.0) - 1.0;
        sumSquares += normalized * normalized;
      }
      let rms = Math.sqrt(sumSquares / bufferLength);
      // Sensitivite ayarı, RMS max ~0.5 civarıdır seste
      let amplitude = rms * 200; 
      if (amplitude < 2) amplitude = 2; // Sabit min dalgalanma

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.05;

      const drawWave = (offset, phaseShift, alpha, widthMulti) => {
        ctx.beginPath();
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
        
        for (let i = 0; i < canvas.width; i++) {
          const x = i;
          const envelope = Math.sin((Math.PI * x) / canvas.width); 
          const y = (canvas.height / 2) + Math.sin((x * widthMulti) + time + phaseShift) * amplitude * envelope * offset;
          
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };

      // 4 Farklı birbiriyle kesişen ince siyah/gri yumuşak dalga
      drawWave(1.0, 0, 0.7, 0.015);
      drawWave(0.6, 2, 0.4, 0.025);
      drawWave(-0.8, 4, 0.5, 0.02);
      drawWave(-0.4, 1, 0.3, 0.03);
      
      // Merkezi ana yatay siyah düz çizgi
      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

    };
    draw();
  }, [phase]);

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const finishAndUploadExam = async () => {
    // Kronometreyi durdur
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    setAppState('UPLOADING');
    
    try {
      // Tüm kayıtları TEK FORMDATA içine koy
      const bulkFormData = new FormData();
      bulkFormData.append('studentName', studentName || 'Bilinmeyen_Ogrenci');
      bulkFormData.append('numFiles', String(allRecordingsRef.current.length));

      allRecordingsRef.current.forEach((rec, i) => {
        bulkFormData.append(`file${i}`, rec.blob, 'kayit.webm');
        bulkFormData.append(`sectionName${i}`, rec.sectionName);
      });

      // Tek istekte tüm albümü Telegram'a gönder
      const res = await fetch('/api/sendToTelegramBulk', {
        method: 'POST',
        body: bulkFormData,
      });
      const result = await res.json();
      if (!result.success) {
        console.error("Telegram Toplu Gönderim Hatası:", result.error);
      }
    } catch (err) {
      console.error("Toplu yükleme hatası:", err);
    }

    setAppState('FINISHED');
  };

  const goToNextItem = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      const nextItem = questions[currentQuestionIndex + 1];
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      
      if (nextItem.type === 'question') {
        setPhase('prep');
        setTimeLeft(nextItem.prepTime);
      }
    } else {
      finishAndUploadExam();
    }
  };

  const goToPrevItem = () => {
    if (currentQuestionIndex > 0) {
       stopRecording(); // Eğer kayıt varsa durdurur, array'e atar. Geçmişe dönüldüğünde eski ses birikir (Geliştirici aracı olduğu için problem değil)
       const prevItem = questions[currentQuestionIndex - 1];
       setCurrentQuestionIndex(currentQuestionIndex - 1);
       if (prevItem.type === 'question') {
         setPhase('prep');
         setTimeLeft(prevItem.prepTime);
       }
    }
  };

  const startExamContent = () => {
    setCurrentQuestionIndex(0);
    if (questions.length > 0) {
      const first = questions[0];
      if (first.type === 'question') {
        setPhase('prep');
        setTimeLeft(first.prepTime);
      }
    }
    setAppState('EXAM');
    // Toplam sınav kronometresini başlat
    setTotalElapsed(0);
    totalTimerRef.current = setInterval(() => setTotalElapsed(prev => prev + 1), 1000);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- RENDER ---
  if (appState === 'LOGIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Türk dünyası konuşma sinavı</h1>
            <p className="text-md text-gray-500 font-medium">by Marjona hoca</p>
          </div>
          <div className="space-y-4">
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-lg border border-blue-400 focus:ring-2 focus:ring-blue-600 outline-none text-black"
              placeholder="Ismingiz ve Familiyangiz"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />
            <button 
              onClick={() => studentName.trim() ? setAppState('MIC_CHECK') : alert("Ad soyad zorunludur")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
            >
              Kirish
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appState === 'MIC_CHECK') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full">
          <button onClick={testMicrophone} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 rounded-xl mb-4 text-lg">
            Mikrofonni tekshirish
          </button>
          <button onClick={() => setAppState('GATEWAY')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg">
            İmtihonni boshlash
          </button>
        </div>
      </div>
    );
  }

  if (appState === 'GATEWAY') {
    return (
      <div className="min-h-screen bg-blue-600 flex items-center justify-center">
        <button 
          onClick={() => { playTing(); startExamContent(); }}
          className="bg-white text-blue-700 text-3xl font-bold py-6 px-16 rounded-full shadow-2xl"
        >
          Kirish
        </button>
      </div>
    );
  }

  if (appState === 'FINISHED') {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-3xl">Sınav Bitti</div>
    );
  }

  // --- ANA SINAV EKRANI ---
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      
      {/* BAŞLİK */}
      <header className="px-6 py-3 flex justify-between items-center border-b bg-white">
        <h1 className="text-xl font-medium text-gray-800">
          Türk dünyası | Konuşma sınavı
        </h1>
        <div className="flex items-center space-x-6">
          {/* Toplam Sınav Süresi Kronometresi */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span className="font-mono font-bold text-gray-700 text-sm tracking-wider">
              {formatTime(totalElapsed)}
            </span>
          </div>
          <p className="font-medium text-gray-800">{studentName}</p>
        </div>
      </header>

      {/* İLERLEME ÇUBUĞU (Stepper) */}
      <div className="w-full py-6 flex justify-center items-center">
        <div className="flex items-center">
          {/* Adımlar (1, 2, 3) */}
          {[1, 2, 3].map((step, idx) => (
             <div key={idx} className="flex items-center">
               <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white ${activeSection === step ? 'bg-green-400' : 'bg-orange-400'}`}>
                 {step}
               </div>
               {idx < 2 && (
                 <div className="w-24 h-1.5 bg-orange-200 mx-2"></div>
               )}
             </div>
          ))}
        </div>
      </div>

      {/* İÇERİK - İKİ KOLONLU DÜZEN */}
      <div className="flex flex-1 w-full max-w-7xl mx-auto p-4 gap-8">
        
        {currentItem.type === 'transition' ? (
          // TRANSITION EKRANI
          <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-6xl font-extrabold text-blue-800 mb-12 drop-shadow-sm">{currentItem.title}</h1>
            <button 
               onClick={goToNextItem} 
               className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-2xl py-4 px-16 rounded-full shadow-xl transition-transform transform hover:scale-105"
            >
               Keyingi
            </button>
          </div>
        ) : (
          <>
            {/* SOL KOLON - SORU */}
            <div className="flex-1 flex flex-col min-w-0">
               <div className="border border-blue-200 rounded-lg mb-4 bg-white p-4 shadow-sm relative">
                  
                  {/* Soru Başlığı ve Ses İkonu */}
                  <div className="flex justify-between items-center border-b pb-2 mb-4">
                     <div className="font-bold text-black">{currentItem.section}</div>
                     <div className="flex items-center space-x-2 text-blue-500">
                        {/* Ses İkonu (Sadece Hazırlık Aşamasında ve Seçenek Olarak Varsa) */}
                        {currentItem.hasAudioBtn !== false && phase === 'prep' && (
                           <svg className="w-6 h-6 cursor-pointer hover:text-blue-700 transition" onClick={() => speakText(currentItem.question || "")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 10v4a2 2 0 002 2h2l4 4V4L9 8H7a2 2 0 00-2 2z"></path>
                           </svg>
                        )}
                     </div>
                  </div>

                  {/* Font Büyütme Küçültme */}
                  <div className="flex justify-center space-x-4 mb-6">
                    <button onClick={() => setFontSizeRatio(prev => Math.max(0.7, prev - 0.1))} className="border px-6 py-1 rounded text-gray-600 font-bold hover:bg-gray-100">A-</button>
                    <button onClick={() => setFontSizeRatio(prev => Math.min(1.5, prev + 0.1))} className="border-2 border-blue-400 px-6 py-1 rounded text-blue-500 font-bold hover:bg-blue-50">A+</button>
                  </div>

                  {/* Soru İçeriği */}
                  <div className="mt-4 text-black" style={{ fontSize: `${1.2 * fontSizeRatio}rem` }}>
                     {currentItem.image_url && (
                        <div className="mb-4 flex justify-center">
                          <img src={currentItem.image_url} alt="Soru" className="max-h-64 object-contain rounded" />
                        </div>
                     )}
                     
                     {/* Soru İçeriği (Tabloda olmayanlar için) */}
                     <div className="font-bold flex items-start space-x-2">
                       {!currentItem.lists && currentItem.question && (
                          <div className="flex"><span className="mr-2 text-blue-500">&bull;</span> <p>{currentItem.question}</p></div>
                       )}
                     </div>

                     {currentItem.bullets && (
                        <ul className="mt-4 space-y-2 text-left">
                           {currentItem.bullets.map((b, i) => <li key={i} className="flex font-bold"><span className="mr-2 text-blue-500">&bull;</span> {b}</li>)}
                        </ul>
                     )}

                     {currentItem.lists && (
                        <div className="mt-8 border-2 border-[#1B52B3] bg-white w-full max-w-4xl mx-auto text-black" style={{ fontSize: `${1.2 * fontSizeRatio}rem` }}>
                           {currentItem.question && (
                             <div className="p-4 border-b-2 border-[#1B52B3]">
                                <h3 className="font-bold text-xl text-left pl-2">{currentItem.question}</h3>
                             </div>
                           )}
                           <div className="grid grid-cols-2">
                              {/* Lehine Sütunu */}
                              <div className="border-r-2 border-[#1B52B3]">
                                 <div className="p-3 border-b-2 border-[#1B52B3] text-center bg-white">
                                    <h4 className="font-bold text-lg">Lehine</h4>
                                 </div>
                                 <div className="p-4 text-left">
                                    <ul className="mt-2 space-y-3 pl-2">
                                       {currentItem.lists.lehine.map((item, i) => (
                                          <li key={i} className="flex font-medium text-lg">
                                            <span className="mr-3 font-bold">•</span>
                                            <span className="flex-1">{item}</span>
                                          </li>
                                       ))}
                                    </ul>
                                 </div>
                              </div>
                              {/* Aleyhine Sütunu */}
                              <div>
                                 <div className="p-3 border-b-2 border-[#1B52B3] text-center bg-white">
                                    <h4 className="font-bold text-lg">Aleyhine</h4>
                                 </div>
                                 <div className="p-4 text-left">
                                    <ul className="mt-2 space-y-3 pl-2">
                                       {currentItem.lists.aleyhine.map((item, i) => (
                                          <li key={i} className="flex font-medium text-lg">
                                            <span className="mr-3 font-bold">•</span>
                                            <span className="flex-1">{item}</span>
                                          </li>
                                       ))}
                                    </ul>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* SAĞ KOLON - KAYIT ALANI */}
            <div className="w-[450px] flex flex-col pt-4">
               <div className="border border-gray-300 rounded-lg shadow-sm bg-white overflow-hidden p-6 relative h-72 flex flex-col items-center">
                  
                  {/* Zamanlayıcı Bar veya Hazırlık Dairesi */}
                  {phase === 'prep' ? (
                     <div className="flex flex-col items-center justify-center mb-8 w-full relative">
                        <div className="text-yellow-600 font-bold text-xl mb-4">Hazırlık Süresi</div>
                        <div className="relative flex items-center justify-center">
                           <svg className="w-40 h-40 transform -rotate-90">
                              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-gray-100" />
                              <circle 
                                 cx="80" cy="80" r="70" 
                                 stroke="currentColor" strokeWidth="10" fill="transparent" 
                                 strokeDasharray={2 * Math.PI * 70} 
                                 strokeDashoffset={(2 * Math.PI * 70) - ((timeLeft / (currentItem.prepTime || 1)) * (2 * Math.PI * 70))} 
                                 className="text-yellow-500 transition-all duration-1000 ease-linear" 
                                 strokeLinecap="round"
                              />
                           </svg>
                           <div className="absolute flex flex-col items-center justify-center">
                              <span className="text-4xl font-extrabold text-yellow-600">{timeLeft}</span>
                              <span className="text-sm font-medium text-yellow-500">saniye</span>
                           </div>
                        </div>
                     </div>
                  ) : (
                     <div className="w-full flex items-center justify-center space-x-4 mb-4">
                        <div className="h-8 flex-1 bg-blue-600 rounded-r-full"></div>
                        <div className="text-4xl font-extrabold font-mono tracking-wide text-black bg-white rounded-lg px-4 py-2 shadow-md border border-gray-100">
                           {formatTime(timeLeft)}
                        </div>
                        <div className="h-8 flex-1 bg-blue-600 rounded-l-full"></div>
                     </div>
                  )}

                  {/* Record Indicator (Görsel Uyarısı) */}
                  <div className="mb-4 flex flex-col items-center">
                     {phase === 'prep' ? null : (
                       <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center shadow-[inset_0px_0px_10px_rgba(239,68,68,0.1)] border border-red-100">
                          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-md"></div>
                       </div>
                     )}
                  </div>

                  {/* Kesişen Dalgalar Görselleştirici (Canvas) */}
                  <div className="w-full bg-[#FCF8FB] flex-1 border-t border-b border-gray-100 flex items-center justify-center p-2">
                    <canvas 
                       ref={canvasRef} 
                       width="400" 
                       height="100" 
                       className="w-full h-full opacity-100" 
                    />
                  </div>

               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}