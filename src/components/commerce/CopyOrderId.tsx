"use client";

/**
 * Tiny copy-to-clipboard button for an order id. Used on the order
 * confirmation page next to the prominently displayed id.
 */
import { useRef, useState } from "react";
import { toast } from "@/lib/events";

export function CopyOrderId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      toast("Order ID copied");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      toast("Couldn't copy — please select the ID manually");
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy order ID ${id}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ink-3 px-3 py-1.5 text-xs text-muted transition-colors duration-300 hover:border-gold/50 hover:text-champagne cursor-pointer"
    >
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-success">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
      <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
