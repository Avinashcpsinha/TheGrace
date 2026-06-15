"use client";

/**
 * Order-ID lookup form for /track-order. Navigates to /track-order?id=… so the
 * server component can read the order and render its timeline. Pre-fills with
 * the current id (e.g. when arriving from an order confirmation email link).
 */
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";

export function TrackOrderForm({ defaultId = "" }: { defaultId?: string }) {
  const router = useRouter();
  const [id, setId] = useState(defaultId);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const clean = id.trim().toUpperCase();
    if (!clean) return;
    router.push(`/track-order?id=${encodeURIComponent(clean)}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label
          htmlFor="track-id"
          className="mb-1.5 block text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted"
        >
          Order ID
        </label>
        <input
          id="track-id"
          value={id}
          onChange={(e) => setId(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder="TG-XXXXXX"
          aria-label="Enter your order ID"
          className="w-full rounded-xl border border-line bg-ink-3 px-4 py-3 text-sm uppercase tracking-wide text-ivory placeholder:text-muted/50 placeholder:normal-case transition-colors duration-300 focus:border-gold/60 focus:outline-none"
        />
      </div>
      <Button type="submit" size="lg" className="shrink-0">
        Track order
      </Button>
    </form>
  );
}
