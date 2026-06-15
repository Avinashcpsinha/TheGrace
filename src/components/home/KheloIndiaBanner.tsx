/**
 * KheloIndiaBanner — full-bleed highlight band for the Khelo India Legacy
 * collection. Async server component: fetches its own products from the
 * catalog, curates ~8 images and hands them to the client-side
 * KheloParallaxStrip (GSAP scrub parallax + auto drift).
 */
import { getProductsByCategory } from "@/lib/catalog";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { KheloParallaxStrip, type KheloStripImage } from "./KheloParallaxStrip";

export async function KheloIndiaBanner() {
  const products = await getProductsByCategory("khelo-india");
  const pool = [
    ...products.filter((p) => p.curated),
    ...products.filter((p) => !p.curated),
  ];
  const images: KheloStripImage[] = pool.slice(0, 8).map((p) => ({
    src: p.images[0].thumb,
    blur: p.images[0].blur,
    alt: p.name,
  }));

  return (
    <section className="relative overflow-hidden bg-ink-2">
      <div className="gold-rule absolute inset-x-0 top-0" aria-hidden="true" />
      <div className="gold-rule absolute inset-x-0 bottom-0" aria-hidden="true" />

      <div className="mx-auto max-w-4xl px-6 pb-14 pt-24 text-center">
        <Reveal>
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.35em] text-gold/90">
            National podium quality
          </p>
          <h2 className="mt-4 font-display text-4xl leading-[1.08] text-ivory md:text-5xl lg:text-6xl [text-wrap:balance]">
            From our workshop to the <span className="gold-text">Khelo India</span> podium
          </h2>
          <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-muted md:text-lg">
            The official awards of the Khelo India Games — the cups, medals and
            shields raised by champions across the country — are designed, cast,
            gold-plated and engraved in our Lajpat Nagar workshop.
          </p>
        </Reveal>
      </div>

      {images.length > 0 && <KheloParallaxStrip images={images} />}

      <Reveal className="relative px-6 pb-24 pt-14 text-center" delay={120}>
        <Button href="/category/khelo-india" variant="gold" size="lg">
          Explore the Khelo India legacy
        </Button>
      </Reveal>
    </section>
  );
}
