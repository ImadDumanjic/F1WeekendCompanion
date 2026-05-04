import { CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl glass-card border animate-fade-up min-w-[260px] max-w-sm shadow-xl pointer-events-auto
            ${toast.type === 'error'
              ? 'border-destructive/40 bg-destructive/10'
              : 'border-success/40 bg-success/10'
            }`}
        >
          {toast.type === 'error'
            ? <XCircle className="w-5 h-5 text-destructive shrink-0" />
            : <CheckCircle className="w-5 h-5 text-success shrink-0" />
          }
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
