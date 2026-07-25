/**
 * HeritageBanner — full-bleed craftsmanship highlight band. Async server
 * component: pulls signature pieces from the flagship Trophies collection,
 * curates ~8 images and hands them to the client-side HeritageStrip
 * (GSAP scrub parallax + auto drift).
 */
import { getProductsByCategory } from "@/lib/catalog";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { HeritageStrip, type HeritageStripImage } from "./HeritageStrip";

export async function HeritageBanner() {
  const products = await getProductsByCategory("trophies");
  const pool = [
    ...products.filter((p) => p.curated),
    ...products.filter((p) => !p.curated),
  ];
  const images: HeritageStripImage[] = pool.slice(0, 8).map((p) => ({
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
            Handcrafted in Delhi
          </p>
          <h2 className="mt-4 font-display text-4xl leading-[1.08] text-ivory md:text-5xl lg:text-6xl [text-wrap:balance]">
            Crafted in our <span className="gold-text">Lajpat Nagar</span> workshop
          </h2>
          <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-muted md:text-lg">
            Every cup, medal, memento and keepsake we make is designed, cast,
            gold-plated and engraved by hand in our workshop — then finished to
            a mirror sheen and delivered PAN India.
          </p>
        </Reveal>
      </div>

      {images.length > 0 && <HeritageStrip images={images} />}

      <Reveal className="relative px-6 pb-24 pt-14 text-center" delay={120}>
        <Button href="/premium" variant="gold" size="lg">
          Explore the collection
        </Button>
      </Reveal>
    </section>
  );
}
