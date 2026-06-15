"use client";

/**
 * Server-driven filter UI. Chips update URL searchParams via
 * router.replace(..., { scroll: false }) inside useTransition so the
 * server-rendered grid refreshes without a jump. Desktop: inline chip rows.
 * Mobile: a "Filters" button opening a slide-over panel.
 *
 * Params owned here: cat, sub, min, max, occasion, tier, stock.
 * Changing any filter resets `page`.
 */
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { OCCASIONS, PRICE_RANGES, type PriceRange } from "./filters";

export interface ChipOption {
  slug: string;
  name: string;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs tracking-wide transition-colors duration-300 ease-[var(--ease-lux)] ${
        active
          ? "border-gold bg-gold font-semibold text-ink shadow-[0_0_24px_-8px_rgba(212,175,55,0.6)]"
          : "border-line text-muted hover:border-gold/50 hover:text-champagne"
      }`}
    >
      {children}
    </button>
  );
}

function FilterRow({
  label,
  stacked,
  children,
}: {
  label: string;
  stacked: boolean;
  children: ReactNode;
}) {
  return (
    <div className={stacked ? "flex flex-col gap-2.5" : "flex items-start gap-3"}>
      <span
        className={`text-[0.6rem] font-medium uppercase tracking-[0.28em] text-muted/70 ${
          stacked ? "" : "w-20 shrink-0 pt-2"
        }`}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function FilterBar({
  categories,
  subcategories,
  showTier = true,
  resultCount,
  endSlot,
  className = "",
}: {
  /** category chips (omit on category-scoped pages) */
  categories?: ChipOption[];
  /** subcategory chips for the active category */
  subcategories?: ChipOption[];
  /** show the Premium / Standard toggle (hidden on /premium and /standard) */
  showTier?: boolean;
  /** live result count after filtering (server-computed) */
  resultCount: number;
  /** rendered right-aligned in the toolbar row — pass <SortSelect /> */
  endSlot?: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const get = (key: string) => params.get(key);

  const setParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  /** toggle a single-value param; clicking the active chip clears it */
  const toggle = (key: string, value: string, alsoClear: string[] = []) => {
    const patch: Record<string, string | null> = {
      [key]: get(key) === value ? null : value,
    };
    for (const k of alsoClear) patch[k] = null;
    setParams(patch);
  };

  const priceActive = (r: PriceRange) =>
    (get("min") ?? "") === (r.min !== undefined ? String(r.min) : "") &&
    (get("max") ?? "") === (r.max !== undefined ? String(r.max) : "");

  const setPrice = (r: PriceRange) => {
    if (priceActive(r)) setParams({ min: null, max: null });
    else
      setParams({
        min: r.min !== undefined ? String(r.min) : null,
        max: r.max !== undefined ? String(r.max) : null,
      });
  };

  const activeCount =
    (get("cat") ? 1 : 0) +
    (get("sub") ? 1 : 0) +
    (get("min") || get("max") ? 1 : 0) +
    (get("occasion") ? 1 : 0) +
    (get("tier") ? 1 : 0) +
    (get("stock") === "1" ? 1 : 0);

  const clearAll = () =>
    setParams({
      cat: null,
      sub: null,
      min: null,
      max: null,
      occasion: null,
      tier: null,
      stock: null,
    });

  const closePanel = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const rows = (stacked: boolean) => (
    <div className={stacked ? "flex flex-col gap-6" : "flex flex-col gap-3"}>
      {categories && categories.length > 0 && (
        <FilterRow label="Category" stacked={stacked}>
          {categories.map((c) => (
            <Chip
              key={c.slug}
              active={get("cat") === c.slug}
              onClick={() => toggle("cat", c.slug, ["sub"])}
            >
              {c.name}
            </Chip>
          ))}
        </FilterRow>
      )}

      {subcategories && subcategories.length > 1 && (
        <FilterRow label="Type" stacked={stacked}>
          {subcategories.map((s) => (
            <Chip key={s.slug} active={get("sub") === s.slug} onClick={() => toggle("sub", s.slug)}>
              {s.name}
            </Chip>
          ))}
        </FilterRow>
      )}

      <FilterRow label="Price" stacked={stacked}>
        {PRICE_RANGES.map((r) => (
          <Chip key={r.id} active={priceActive(r)} onClick={() => setPrice(r)}>
            {r.label}
          </Chip>
        ))}
      </FilterRow>

      <FilterRow label="Occasion" stacked={stacked}>
        {OCCASIONS.map((o) => (
          <Chip key={o} active={get("occasion") === o} onClick={() => toggle("occasion", o)}>
            {o}
          </Chip>
        ))}
      </FilterRow>

      <FilterRow label={showTier ? "Collection" : "Availability"} stacked={stacked}>
        {showTier && (
          <>
            <Chip active={!get("tier")} onClick={() => setParams({ tier: null })}>
              All
            </Chip>
            <Chip active={get("tier") === "premium"} onClick={() => toggle("tier", "premium")}>
              Premium only
            </Chip>
            <Chip active={get("tier") === "standard"} onClick={() => toggle("tier", "standard")}>
              Standard only
            </Chip>
          </>
        )}
        <Chip
          active={get("stock") === "1"}
          onClick={() => setParams({ stock: get("stock") === "1" ? null : "1" })}
        >
          In stock
        </Chip>
      </FilterRow>
    </div>
  );

  return (
    <div className={className}>
      {/* toolbar row: mobile trigger · live count · clear all · sort */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`Open filters${activeCount > 0 ? ` (${activeCount} active)` : ""}`}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-ink-3 px-4 py-2 text-sm text-ivory transition-colors duration-300 hover:border-gold/50 md:hidden"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="grid h-5 w-5 place-items-center rounded-full bg-gold text-[0.65rem] font-bold text-ink">
              {activeCount}
            </span>
          )}
        </button>

        <p
          aria-live="polite"
          className={`text-[0.7rem] uppercase tracking-[0.25em] text-muted transition-opacity duration-300 ${
            isPending ? "opacity-40" : "opacity-100"
          }`}
        >
          {resultCount} {resultCount === 1 ? "piece" : "pieces"}
        </p>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            aria-label="Clear all filters"
            className="cursor-pointer text-xs text-gold underline-offset-4 transition-colors duration-300 hover:text-gold-bright hover:underline"
          >
            × Clear all
          </button>
        )}

        {endSlot && <div className="ml-auto">{endSlot}</div>}
      </div>

      {/* desktop chip rows */}
      <div className="mt-5 hidden md:block">{rows(false)}</div>

      {/* mobile slide-over */}
      <div
        className={`fixed inset-0 z-[70] md:hidden ${open ? "" : "pointer-events-none"}`}
        inert={!open}
        aria-hidden={!open}
      >
        <div
          onClick={closePanel}
          aria-hidden="true"
          className={`absolute inset-0 bg-black/65 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Product filters"
          tabIndex={-1}
          className={`absolute right-0 top-0 flex h-full w-[86vw] max-w-sm flex-col overflow-y-auto overscroll-contain border-l border-line bg-ink-2 transition-transform duration-500 ease-[var(--ease-lux)] will-change-transform ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-line px-6 py-5">
            <p className="font-display text-2xl text-ivory">Filters</p>
            <button
              type="button"
              onClick={closePanel}
              aria-label="Close filters"
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-line text-muted transition-colors duration-300 hover:border-gold/50 hover:text-champagne"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 px-6 py-6">{rows(true)}</div>

          <div className="sticky bottom-0 border-t border-line bg-ink-2/95 px-6 py-4 backdrop-blur-sm">
            <button
              type="button"
              onClick={closePanel}
              className="w-full cursor-pointer rounded-full bg-[linear-gradient(110deg,#b8902c,#d4af37_45%,#eed688_55%,#d4af37)] bg-[length:200%_100%] px-6 py-3 text-sm font-medium tracking-wide text-ink shadow-[var(--shadow-gold)] transition-all duration-300 ease-[var(--ease-lux)] hover:bg-[position:100%_0]"
            >
              Show {resultCount} {resultCount === 1 ? "piece" : "pieces"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
