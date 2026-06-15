"use client";

/**
 * ════════════════════════════════════════════════════════════════════
 *  BookHero — the signature scroll-driven 3D book experience.
 * ════════════════════════════════════════════════════════════════════
 *
 *  CONTRACT (do not change the props — the home page already passes them):
 *
 *  Closed state  → fullscreen centered 3D closed book, leather cover,
 *                  embossed gold "coverTitle", glowing trophy emblem,
 *                  particles + breathing camera, scroll cue.
 *  Scrub open    → scroll position drives the cover rotation (GSAP
 *                  ScrollTrigger scrub, pinned ~300vh), camera dollies in.
 *  Open spread   → leftPage = premium hero trophy (links leftPage.href),
 *                  rightPage = collage grid (links rightPage.href);
 *                  hover lift + "View Collection →" reveal on each page.
 *  Outro         → book scales/fades, site (and header) take over. Must
 *                  emit emitBookProgress(p) from lib/events while scrubbing
 *                  (0 closed → 1 open → >1 outro) so the Header reveals.
 *  A11y          → "Open the book" visible button (skips to spread),
 *                  prefers-reduced-motion → static elegant open spread,
 *                  keyboard reachable links.
 *  Mobile        → lighter treatment, still scroll-driven, 60fps.
 *
 *  THIS FILE IS A PLACEHOLDER — replaced by the real implementation.
 */
import Image from "next/image";
import Link from "next/link";

export interface BookPageImage {
  src: string;
  blur?: string;
  alt?: string;
}

export interface BookHeroProps {
  coverTitle: string;
  coverSubtitle?: string;
  scrollHint?: string;
  leftPage: {
    title: string;
    tagline: string;
    href: string;
    image: BookPageImage;
  };
  rightPage: {
    title: string;
    tagline: string;
    href: string;
    images: BookPageImage[];
  };
}

export function BookHero({ coverTitle, coverSubtitle, leftPage, rightPage }: BookHeroProps) {
  return (
    <section className="spotlight relative flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-24">
      <h1 className="gold-text font-display text-6xl tracking-[0.18em]">{coverTitle}</h1>
      {coverSubtitle && <p className="text-muted">{coverSubtitle}</p>}
      <div className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        {[leftPage, rightPage].map((page, i) => (
          <Link key={page.href} href={page.href} className="card-surface rounded-2xl p-6">
            <div className="photo-well relative aspect-[4/5] overflow-hidden rounded-xl">
              <Image
                src={"image" in page ? (page as BookHeroProps["leftPage"]).image.src : (page as BookHeroProps["rightPage"]).images[0]?.src}
                alt={page.title}
                fill
                priority={i === 0}
                className="object-contain p-6"
              />
            </div>
            <h2 className="mt-4 font-display text-2xl text-champagne">{page.title}</h2>
            <p className="text-sm text-muted">{page.tagline}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
