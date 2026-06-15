"use client";

/** Minimal toast stack — listens for EV_TOAST window events (lib/events). */
import { useEffect, useState } from "react";
import { EV_TOAST } from "@/lib/events";

interface Toast { id: number; message: string }

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let n = 0;
    const onToast = (e: Event) => {
      const message = (e as CustomEvent<{ message: string }>).detail?.message;
      if (!message) return;
      const id = ++n;
      setToasts((t) => [...t, { id, message }].slice(-3));
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
    };
    window.addEventListener(EV_TOAST, onToast);
    return () => window.removeEventListener(EV_TOAST, onToast);
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 flex-col items-center gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="glass rounded-full border border-gold/25 px-5 py-2.5 text-sm text-champagne shadow-[var(--shadow-gold)] animate-[toast-in_0.45s_var(--ease-lux)]"
        >
          {t.message}
        </div>
      ))}
      <style>{`@keyframes toast-in { from { opacity: 0; transform: translateY(12px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
    </div>
  );
}
