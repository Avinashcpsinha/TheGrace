import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

/** Small muted breadcrumb trail — last item is the current page. */
export function Breadcrumbs({ items, className = "" }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-[0.2em] text-muted">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-2">
              {c.href && !last ? (
                <Link
                  href={c.href}
                  className="transition-colors duration-300 hover:text-champagne"
                >
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="text-champagne/80">
                  {c.label}
                </span>
              )}
              {!last && (
                <span aria-hidden="true" className="text-muted/40">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
