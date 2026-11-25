import { useCallback, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { ToastContext } from './toastContext';

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const dismiss = useCallback((id) => setItems((list) => list.filter((i) => i.id !== id)), []);
  const push = useCallback((message, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setItems((list) => [...list.slice(-2), { id, message, tone }]);
    // Long enough to read (AAA has no hard limit; the user can also close it).
    setTimeout(() => dismiss(id), 8000);
  }, [dismiss]);
  const value = useMemo(() => ({ success: (m) => push(m, 'ok'), error: (m) => push(m, 'crit') }), [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed bottom-20 left-0 right-0 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {items.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-lg border px-4 py-3 shadow-lg ${
              item.tone === 'ok' ? 'border-ok-strong bg-ok-soft text-ok' : 'border-crit-strong bg-crit-soft text-crit'
            }`}
          >
            {item.tone === 'ok' ? <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" /> : <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />}
            <p className="flex-1 font-semibold">{item.message}</p>
            <button type="button" onClick={() => dismiss(item.id)} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/60" aria-label="×">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
