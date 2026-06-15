import Link from "next/link";
import { PAGE_SIZE, firstParam, type RawSearchParams } from "./filters";

/**
 * "Load more" pagination — a plain <Link> to ?page=n+1 preserving every
 * other search param (SEO-crawlable, works without JS). Shows a
 * "Showing X of Y" line and a thin gold progress rule.
 */
export function Pagination({
  raw,
  page,
  shown,
  total,
  label = "pieces",
}: {
  /** the awaited searchParams object of the current request */
  raw: RawSearchParams;
  page: number;
  shown: number;
  total: number;
  label?: string;
}) {
  if (total === 0) return null;

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    const val = firstParam(v);
    if (val) qs.set(k, val);
  }
  qs.set("page", String(page + 1));

  const remaining = Math.min(PAGE_SIZE, total - shown);
  const pct = Math.max(4, Math.round((shown / total) * 100));

  return (
    <nav aria-label="Catalogue pagination" className="mt-14 flex flex-col items-center gap-5">
      <p className="text-[0.65rem] uppercase tracking-[0.25em] text-muted">
        Showing {shown} of {total} {label}
      </p>
      <div className="h-[3px] w-44 overflow-hidden rounded-full bg-ink-4" aria-hidden="true">
        <div className="h-full rounded-full bg-gold/80" style={{ width: `${pct}%` }} />
      </div>
      {shown < total && (
        <Link
          href={`?${qs.toString()}`}
          scroll={false}
          aria-label={`Load ${remaining} more ${label}`}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/50 px-8 py-3.5 text-sm font-medium tracking-wide text-champagne transition-all duration-300 ease-[var(--ease-lux)] hover:-translate-y-px hover:border-gold hover:bg-gold/10 active:translate-y-0"
        >
          Load {remaining} more
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14m-7-7 7 7 7-7" />
          </svg>
        </Link>
      )}
    </nav>
  );
}
