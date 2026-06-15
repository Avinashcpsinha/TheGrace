/**
 * Thin gold marquee of signature materials — sits beneath the Premium
 * collection hero. Pure CSS transform animation (GPU only) with a static
 * fallback under prefers-reduced-motion; screen readers get one plain
 * sentence instead of the looping track.
 */
const MATERIALS = ["Optical crystal", "Die-cast metal", "24K electroplating", "Hardwood"];

export function MaterialsMarquee() {
  const sequence = Array.from({ length: 4 }, () => MATERIALS).flat();

  return (
    <div className="relative overflow-hidden border-y border-gold/15 bg-gold/[0.03] py-3">
      <p className="sr-only">Signature materials: {MATERIALS.join(", ")}.</p>
      <div aria-hidden="true" className="tg-marquee flex w-max items-center will-change-transform">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center gap-10 pr-10">
            {sequence.map((m, i) => (
              <span
                key={`${copy}-${i}`}
                className="flex items-center gap-10 whitespace-nowrap text-[0.65rem] uppercase tracking-[0.35em] text-gold/80"
              >
                {m}
                <span className="h-1 w-1 rounded-full bg-gold/50" />
              </span>
            ))}
          </div>
        ))}
      </div>
      <style>{`
        .tg-marquee { animation: tg-marquee-slide 36s linear infinite; }
        @keyframes tg-marquee-slide {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .tg-marquee { animation: none; }
        }
      `}</style>
    </div>
  );
}
