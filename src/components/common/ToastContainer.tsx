import React from 'react';
import { createPortal } from 'react-dom';
import { useCrm } from '../../context/CrmContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useCrm();

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-5 right-5 z-[120] flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
          info: <Info className="w-5 h-5 text-brand-500 shrink-0" />,
        };

        const borders = {
          success: 'border-emerald-200 bg-white/95',
          error: 'border-rose-200 bg-white/95',
          info: 'border-brand-200 bg-white/95',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all animate-fade-in ${borders[toast.type]}`}
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900">{toast.title}</h4>
              {toast.message && <p className="text-xs text-slate-600 mt-0.5">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 rounded p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
};
