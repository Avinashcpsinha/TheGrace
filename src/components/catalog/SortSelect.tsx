"use client";

/**
 * Sort control — styled native <select> that writes ?sort= to the URL via
 * router.replace({ scroll: false }) in a transition. Resets `page`.
 */
import { useTransition, type ChangeEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SORT_OPTIONS, type SortKey } from "./filters";

export function SortSelect({ className = "" }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const raw = params.get("sort");
  const value: SortKey = SORT_OPTIONS.some((o) => o.value === raw)
    ? (raw as SortKey)
    : "featured";

  const onChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = new URLSearchParams(params.toString());
    if (e.target.value === "featured") next.delete("sort");
    else next.set("sort", e.target.value);
    next.delete("page");
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  return (
    <label className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="text-[0.6rem] font-medium uppercase tracking-[0.28em] text-muted/70">
        Sort
      </span>
      <span className="relative">
        <select
          value={value}
          onChange={onChange}
          aria-label="Sort products"
          className={`cursor-pointer appearance-none rounded-full border border-line bg-ink-3 py-2 pl-4 pr-9 text-xs tracking-wide text-ivory transition-all duration-300 ease-[var(--ease-lux)] hover:border-gold/50 focus-visible:outline-2 focus-visible:outline-gold ${
            isPending ? "opacity-50" : "opacity-100"
          }`}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-ink-3 text-ivory">
              {o.label}
            </option>
          ))}
        </select>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gold"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </label>
  );
}
