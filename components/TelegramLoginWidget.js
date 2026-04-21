'use client';
import { useEffect, useRef } from 'react';

export default function TelegramLoginWidget({ onAuth, botName }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Component yüklendiğinde callback fonksiyonunu tanımla
    window.onTelegramAuth = (user) => {
      if (onAuth) onAuth({ provider: 'telegram', ...user });
    };

    // Script'in sadece bir kez eklenmesini sağla
    if (containerRef.current && containerRef.current.children.length === 0) {
      // Dil ayarını localStorage veya varsayılan uz al
      const sysLang = typeof window !== 'undefined' ? (localStorage.getItem('appLang') || 'uz') : 'uz';
      
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', botName);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '15');
      script.setAttribute('data-userpic', 'true');
      script.setAttribute('data-lang', sysLang === 'tr' ? 'tr' : 'uz'); // Dili zorla
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.async = true;
      containerRef.current.appendChild(script);
    }

    return () => {
      // Temizlik (component unmount olursa)
      // window.onTelegramAuth bırakılabilir veya undefined yapılabilir
      // window.onTelegramAuth = undefined;
    };
  }, [botName, onAuth]);

  return <div ref={containerRef} className="flex justify-center w-full min-h-[40px]"></div>;
}
