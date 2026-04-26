import React from 'react';

export default function CustomAlertModal({ isOpen, title, message, type = 'warning', onClose }) {
  if (!isOpen) return null;

  const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : '⚠️';
  const bgColor = type === 'error' ? 'bg-red-100' : type === 'success' ? 'bg-green-100' : 'bg-yellow-100';
  const btnColor = type === 'error' ? 'bg-red-600 hover:bg-red-700' : type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border border-gray-100">
        <div className={`w-20 h-20 ${bgColor} rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner`}>
          <span className="text-4xl">{icon}</span>
        </div>
        {title && <h3 className="text-2xl font-black text-gray-900 mb-3">{title}</h3>}
        <p className="text-gray-500 mb-8 leading-relaxed font-medium whitespace-pre-wrap">
          {message}
        </p>
        <button
          onClick={onClose}
          className={`w-full px-6 py-3 ${btnColor} text-white font-bold rounded-xl transition-all shadow-lg active:scale-95`}
        >
          Tamam
        </button>
      </div>
    </div>
  );
}
