"use client";

/**
 * CraftCounters — animated stat grid for the CraftStory section.
 * Numbers count up with requestAnimationFrame (cubic ease-out, ~1.6s) the
 * first time the grid enters the viewport. Server-rendered markup shows the
 * final figures (no-JS / reduced-motion safe); JS zeroes them just before
 * the IntersectionObserver fires. Indian digit grouping via Intl en-IN.
 * Figures are representative marketing copy.
 */
import { useEffect, useRef } from "react";

const STATS = [
  { value: 12, suffix: "+", label: "Years of craft" },
  { value: 500000, suffix: "+", label: "Awards delivered" },
  { value: 2000, suffix: "+", label: "Institutions served" },
  { value: 28, suffix: "", label: "States reached" },
] as const;

const DURATION = 1600;
const fmt = new Intl.NumberFormat("en-IN");

export function CraftCounters() {
  const gridRef = useRef<HTMLDivElement>(null);
  const numRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    // reduced motion: leave the server-rendered final numbers untouched
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    numRefs.current.forEach((el, i) => {
      const stat = STATS[i];
      if (el && stat) el.textContent = `0${stat.suffix}`;
    });

    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION);
          const eased = 1 - Math.pow(1 - t, 3);
          numRefs.current.forEach((el, i) => {
            const stat = STATS[i];
            if (!el || !stat) return;
            el.textContent = `${fmt.format(Math.round(stat.value * eased))}${stat.suffix}`;
          });
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.35 }
    );
    io.observe(grid);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line"
    >
      {STATS.map((s, i) => (
        <div key={s.label} className="bg-ink-2 p-8 text-center md:p-10">
          <p className="sr-only">{`${fmt.format(s.value)}${s.suffix} ${s.label}`}</p>
          <p
            aria-hidden="true"
            className="gold-text font-display text-4xl leading-none sm:text-5xl md:text-6xl [font-variant-numeric:tabular-nums]"
          >
            <span
              ref={(el) => {
                numRefs.current[i] = el;
              }}
            >
              {fmt.format(s.value)}
              {s.suffix}
            </span>
          </p>
          <p
            aria-hidden="true"
            className="mt-3 text-[0.62rem] uppercase tracking-[0.3em] text-muted"
          >
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}
