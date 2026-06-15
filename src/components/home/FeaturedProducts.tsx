/**
 * FeaturedProducts — "The Collection" section below the book.
 * Responsive ProductCard grid (2 cols mobile → 4 desktop) with staggered
 * Reveal entrances and a centered CTA to the full catalogue.
 * Server component — products arrive as props from the home page.
 */
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export function FeaturedProducts({ products }: { products: Product[] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeading
        eyebrow="The Collection"
        title="Featured Pieces"
        sub="Hand-picked from the workshop floor — the pieces ceremonies are built around."
      />

      <div className="mt-14 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {products.map((p, i) => (
          <Reveal key={p.slug} delay={i * 80}>
            <ProductCard product={p} priority={false} />
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-14 text-center" delay={120}>
        <Button href="/products" variant="outline" size="lg">
          Explore all products
        </Button>
      </Reveal>
    </section>
  );
}
