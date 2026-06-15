import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { HeroBackdrop } from "./HeroBackdrop";

/**
 * Cinematic collection-page intro: breadcrumbs, gold eyebrow, large serif
 * title (masked reveal), supporting line and a gold rule, on a spotlight
 * wash. `children` render full-bleed beneath the hero copy (marquee lines,
 * value-prop strips, legacy banners).
 */
export function CollectionHero({
  eyebrow,
  title,
  sub,
  crumbs,
  bg,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
  crumbs?: Crumb[];
  /** optional cinematic hero image */
  bg?: { src: string; alt?: string };
  children?: ReactNode;
}) {
  return (
    <section className={`spotlight relative overflow-hidden ${bg ? "tg-hero" : ""}`}>
      {bg && <HeroBackdrop src={bg.src} alt={bg.alt} />}
      <div
        className={`relative z-10 mx-auto max-w-7xl px-6 ${
          bg
            ? "pb-20 pt-[calc(var(--header-h)+5rem)] md:pb-28"
            : "pb-12 pt-[calc(var(--header-h)+3rem)] md:pb-16"
        }`}
      >
        {crumbs && crumbs.length > 0 && (
          <Breadcrumbs items={crumbs} className="flex justify-center" />
        )}
        <Reveal className="mt-8 flex flex-col items-center gap-5 text-center">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.35em] text-gold/90">
            {eyebrow}
          </p>
          <h1 className="max-w-4xl font-display text-5xl leading-[1.04] text-ivory [text-wrap:balance] md:text-6xl lg:text-7xl">
            <span className="reveal-mask">
              <span>{title}</span>
            </span>
          </h1>
          {sub && (
            <p className="max-w-2xl text-base leading-relaxed text-muted md:text-lg">{sub}</p>
          )}
          <div className="gold-rule mt-1 w-28" aria-hidden="true" />
        </Reveal>
      </div>
      <div className="relative z-10">{children}</div>
    </section>
  );
}
