import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { FeedbackToast } from '../types';

interface ToastContainerProps {
  toasts: FeedbackToast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div id="toast-container" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          id={`toast-${toast.id}`}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl transition-all duration-300 transform translate-y-0 ${
            toast.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900 shadow-emerald-900/10'
              : toast.type === 'error'
              ? 'bg-rose-50/95 border-rose-200 text-rose-900 shadow-rose-900/10'
              : 'bg-sky-50/95 border-sky-200 text-sky-900 shadow-sky-900/10'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-sky-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold leading-tight">{toast.title}</h4>
            <p className="text-xs mt-1 text-slate-600 leading-relaxed break-words">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
