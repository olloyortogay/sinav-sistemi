'use client';
import { useEffect } from 'react';

export default function TelegramLoginWidget({ onAuth }) {
  useEffect(() => {
    const handleMessage = (event) => {
      // Sadece kendi Telegram iframe'imizden gelen verileri alıyoruz
      if (event.data && event.data.type === 'TELEGRAM_AUTH') {
        if (onAuth) {
          onAuth(event.data.user);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onAuth]);

  return (
    <div className="flex justify-center w-full my-2">
      {/* 
        Next.js'in "Bot domain invalid" hatasını aşmak için 
        sorunsuz çalışan test-tg.html dosyasını Iframe olarak çekiyoruz 
      */}
      <iframe 
        src="/test-tg.html" 
        width="260" 
        height="45" 
        frameBorder="0" 
        scrolling="no" 
        style={{ border: 'none', overflow: 'hidden', background: 'transparent' }}
      ></iframe>
    </div>
  );
}
