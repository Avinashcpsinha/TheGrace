"use client";

/**
 * Full-screen, command-palette-style product search.
 *
 * - Fetches GET /api/search-index once per session (module-level cache).
 * - Instant fuzzy results as you type (name startsWith > word startsWith >
 *   includes > category/subcategory match), max 12, thumbnail grid.
 * - Keyboard: ↑/↓ move selection, Enter opens, Esc closes. Focus trapped,
 *   body scroll locked, backdrop click closes.
 * - Empty state shows popular category chips; footer hint links to
 *   /search?q=… for the full results page.
 */

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { formatINR } from "@/lib/format";
import categoriesJson from "@/data/categories.json";

interface SearchDoc {
  slug: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  premium: boolean;
  thumb: string;
  blur: string;
}

interface CategoryLite {
  slug: string;
  name: string;
  count: number;
}

const CATEGORIES: CategoryLite[] = categoriesJson;

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ── module-level index cache: fetched once, shared across opens ──── */
let cachedIndex: SearchDoc[] | null = null;
let pendingIndex: Promise<SearchDoc[]> | null = null;

function loadIndex(): Promise<SearchDoc[]> {
  if (cachedIndex) return Promise.resolve(cachedIndex);
  if (!pendingIndex) {
    pendingIndex = fetch("/api/search-index")
      .then((res) => {
        if (!res.ok) throw new Error(`search-index ${res.status}`);
        return res.json() as Promise<SearchDoc[]>;
      })
      .then((docs) => {
        cachedIndex = docs;
        return docs;
      })
      .catch((err: unknown) => {
        pendingIndex = null; // allow retry on next open
        throw err;
      });
  }
  return pendingIndex;
}

/* ── scoring: name startsWith > word startsWith > includes > category ── */
function scoreDoc(doc: SearchDoc, tokens: string[]): number {
  const name = doc.name.toLowerCase();
  const words = name.split(/\s+/);
  const cat = doc.category.toLowerCase();
  const sub = doc.subcategory.toLowerCase();
  let total = 0;
  for (const t of tokens) {
    let s = 0;
    if (name.startsWith(t)) s = 4;
    else if (words.some((w) => w.startsWith(t))) s = 3;
    else if (name.includes(t)) s = 2;
    else if (cat.includes(t) || sub.includes(t)) s = 1;
    if (s === 0) return 0; // every token must match something
    total += s;
  }
  return total;
}

function trapTab(e: KeyboardEvent, container: HTMLElement) {
  const nodes = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
  );
  if (nodes.length === 0) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  const active = document.activeElement;
  if (e.shiftKey) {
    if (active === first || !container.contains(active)) {
      e.preventDefault();
      last.focus();
    }
  } else if (active === last || !container.contains(active)) {
    e.preventDefault();
    first.focus();
  }
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const reduce = useReducedMotion() ?? false;
  const [docs, setDocs] = useState<SearchDoc[] | null>(cachedIndex);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /* fetch the index on first open only */
  useEffect(() => {
    if (!open || docs) return;
    let alive = true;
    setFailed(false);
    loadIndex()
      .then((d) => {
        if (alive) setDocs(d);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [open, docs]);

  /* open: autofocus, lock scroll, Esc + focus trap; close: restore focus */
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const prevFocus = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 40);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab" && panelRef.current) {
        trapTab(e, panelRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      prevFocus?.focus();
    };
  }, [open, onClose]);

  const trimmed = query.trim();

  const results = useMemo(() => {
    if (!docs || !trimmed) return [];
    const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [];
    return docs
      .map((d) => ({ d, s: scoreDoc(d, tokens) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.d.name.localeCompare(b.d.name))
      .slice(0, 12)
      .map((x) => x.d);
  }, [docs, trimmed]);

  useEffect(() => setSel(0), [trimmed]);

  /* keep keyboard selection in view */
  useEffect(() => {
    if (!open) return;
    document.getElementById(`search-opt-${sel}`)?.scrollIntoView({ block: "nearest" });
  }, [sel, open]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = results[sel];
      if (hit) go(`/product/${hit.slug}`);
      else if (trimmed) go(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Search products"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
          className="fixed inset-0 z-[80] bg-ink/85 backdrop-blur-2xl"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: reduce ? 0 : 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : 16 }}
            transition={{ duration: reduce ? 0 : 0.45, ease: EASE }}
            className="mx-auto flex h-full w-full max-w-3xl flex-col px-6 pb-8 pt-[9vh]"
          >
            {/* input row */}
            <div className="flex items-center gap-4 border-b border-gold/25 pb-4">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
                className="h-6 w-6 shrink-0 text-gold"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search trophies, medals, gifts…"
                aria-label="Search products"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls="search-results"
                aria-activedescendant={results.length > 0 ? `search-opt-${sel}` : undefined}
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-transparent font-display text-3xl text-ivory placeholder:text-muted/60 focus:outline-none md:text-4xl [&::-webkit-search-cancel-button]:hidden"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="shrink-0 rounded-md border border-line px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted transition-colors duration-300 hover:border-gold/50 hover:text-champagne"
              >
                Esc
              </button>
            </div>

            {/* hint row */}
            <div className="mt-3 flex items-center justify-between gap-4 text-xs text-muted">
              <span aria-live="polite" className="truncate">
                {trimmed
                  ? `${results.length} ${results.length === 1 ? "match" : "matches"}`
                  : "↑↓ to navigate · Enter to open · Esc to close"}
              </span>
              {trimmed && (
                <Link
                  href={`/search?q=${encodeURIComponent(trimmed)}`}
                  onClick={onClose}
                  className="shrink-0 transition-colors duration-300 hover:text-champagne"
                >
                  Enter ↵ for all results
                </Link>
              )}
            </div>

            {/* body */}
            <div data-lenis-prevent="true" className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
              {failed && (
                <p role="status" className="text-sm text-muted">
                  Search is unavailable right now — browse the collections below instead.
                </p>
              )}

              {!failed && !docs && (
                <p role="status" aria-live="polite" className="text-sm text-muted">
                  Polishing the trophy cabinet…
                </p>
              )}

              {docs && trimmed && results.length > 0 && (
                <ul
                  id="search-results"
                  role="listbox"
                  aria-label="Matching products"
                  className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
                >
                  {results.map((d, i) => (
                    <li key={d.slug} id={`search-opt-${i}`} role="option" aria-selected={i === sel}>
                      <Link
                        href={`/product/${d.slug}`}
                        prefetch={false}
                        onClick={onClose}
                        onMouseEnter={() => setSel(i)}
                        className={`group block overflow-hidden rounded-xl border transition-colors duration-300 ${
                          i === sel
                            ? "border-gold/70 bg-white/5"
                            : "border-line/70 hover:border-gold/40"
                        }`}
                      >
                        <div className="photo-well relative aspect-square overflow-hidden">
                          {d.thumb ? (
                            <Image
                              src={d.thumb}
                              alt={d.name}
                              fill
                              sizes="(min-width: 768px) 168px, 40vw"
                              placeholder={d.blur ? "blur" : "empty"}
                              blurDataURL={d.blur || undefined}
                              className="object-contain p-2.5 transition-transform duration-500 ease-[var(--ease-lux)] group-hover:scale-105 motion-reduce:transition-none"
                            />
                          ) : (
                            <span className="absolute inset-0 grid place-items-center text-2xl" aria-hidden="true">
                              🏆
                            </span>
                          )}
                          {d.premium && (
                            <span className="absolute left-1.5 top-1.5 rounded-full border border-gold/40 bg-ink/85 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-gold">
                              Premium
                            </span>
                          )}
                        </div>
                        <div className="px-2.5 py-2">
                          <p className="truncate text-xs text-ivory">{d.name}</p>
                          <p className="mt-0.5 text-xs font-medium text-champagne">{formatINR(d.price)}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {docs && trimmed && results.length === 0 && (
                <div>
                  <p role="status" className="text-sm text-muted">
                    No matches for <span className="text-ivory">&ldquo;{trimmed}&rdquo;</span>. Try a
                    different word, or browse a collection:
                  </p>
                  <CategoryChips onPick={onClose} />
                </div>
              )}

              {!trimmed && !failed && (
                <div>
                  <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-muted">
                    Popular collections
                  </p>
                  <CategoryChips onPick={onClose} />
                </div>
              )}
              {failed && <CategoryChips onPick={onClose} />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CategoryChips({ onPick }: { onPick: () => void }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2.5">
      {CATEGORIES.map((c) => (
        <Link
          key={c.slug}
          href={`/category/${c.slug}`}
          onClick={onPick}
          className="rounded-full border border-line px-4 py-2 text-sm text-muted transition-colors duration-300 hover:border-gold/60 hover:text-champagne"
        >
          {c.name}
        </Link>
      ))}
      <Link
        href="/products"
        onClick={onPick}
        className="rounded-full border border-gold/40 px-4 py-2 text-sm text-champagne transition-colors duration-300 hover:border-gold hover:bg-gold/10"
      >
        All products →
      </Link>
    </div>
  );
}
