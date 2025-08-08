
import React, { useState, useEffect } from 'react';
import { IconX, IconCheckCircle, IconAlertTriangle, IconInfo } from './Icon'; 

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // in ms
}

interface ToastProps extends ToastMessage {
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 5000, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  let bgColor = 'bg-slate-800';
  let textColor = 'text-white';
  let IconComponent;

  switch (type) {
    case 'success':
      bgColor = 'bg-green-500';
      textColor = 'text-white';
      IconComponent = <IconCheckCircle className="w-5 h-5 mr-2" />;
      break;
    case 'error':
      bgColor = 'bg-red-600';
      textColor = 'text-white';
      IconComponent = <IconAlertTriangle className="w-5 h-5 mr-2" />;
      break;
    case 'warning':
      bgColor = 'bg-yellow-400';
      textColor = 'text-yellow-900';
      IconComponent = <IconAlertTriangle className="w-5 h-5 mr-2" />;
      break;
    case 'info':
      bgColor = 'bg-sky-500';
      textColor = 'text-white';
      IconComponent = <IconInfo className="w-5 h-5 mr-2" />;
      break;
  }

  return (
    <div 
      className={`fixed bottom-5 right-5 md:bottom-10 md:right-10 z-[200] p-4 rounded-lg shadow-xl ${bgColor} ${textColor} flex items-center max-w-sm animate-toastIn`}
      role="alert"
      aria-live="assertive"
    >
      {IconComponent}
      <span className="flex-grow text-sm">{message}</span>
      <button 
        onClick={() => onDismiss(id)} 
        className={`ml-3 -mr-1 p-1 rounded-md hover:bg-black/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white`}
        aria-label="Fechar notificação"
      >
        <IconX />
      </button>
      <style>{`
        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-toastIn {
          animation: toastIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export const ToastContainer: React.FC<{ toasts: ToastMessage[]; onDismiss: (id: string) => void }> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-0 right-0 p-4 space-y-2 z-[200]">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

// Hook for managing toasts
export const useToasts = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastType, duration?: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  return { toasts, addToast, removeToast };
};

export default Toast;