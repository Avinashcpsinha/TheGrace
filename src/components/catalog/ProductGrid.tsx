import Link from "next/link";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { enquiryWhatsAppLink } from "@/lib/order-links";

export interface SuggestionLink {
  href: string;
  label: string;
}

/**
 * Server-rendered responsive product grid (2 / 3 / 4 columns) with staggered
 * reveals. Empty results render an elegant ceremony-stage empty state with
 * suggestion chips and a WhatsApp enquiry button.
 */
export function ProductGrid({
  products,
  emptyTitle = "Nothing here yet",
  emptyNote = "No pieces match this combination — loosen a filter, or tell us what you are after and we will craft it.",
  emptyTopic = "trophies and awards",
  suggestions = [],
  priorityCount = 4,
}: {
  products: Product[];
  emptyTitle?: string;
  emptyNote?: string;
  /** topic passed to enquiryWhatsAppLink for the empty-state CTA */
  emptyTopic?: string;
  /** chips linking out of the dead end (other categories, collections) */
  suggestions?: SuggestionLink[];
  /** how many leading images load eagerly (page 1 above the fold) */
  priorityCount?: number;
}) {
  if (products.length === 0) {
    return (
      <Reveal className="spotlight card-surface rounded-3xl px-6 py-20 text-center md:py-24">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.35em] text-gold/80">
          The stage is bare
        </p>
        <h2 className="mt-4 font-display text-4xl text-ivory [text-wrap:balance] md:text-5xl">
          {emptyTitle}
        </h2>
        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted">{emptyNote}</p>

        {suggestions.length > 0 && (
          <ul role="list" className="mt-8 flex flex-wrap justify-center gap-2">
            {suggestions.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="inline-block rounded-full border border-line px-4 py-2 text-xs uppercase tracking-[0.18em] text-muted transition-colors duration-300 hover:border-gold/60 hover:text-champagne"
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 flex justify-center">
          <Button
            href={enquiryWhatsAppLink(emptyTopic)}
            variant="whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Enquire about ${emptyTopic} on WhatsApp`}
          >
            Enquire on WhatsApp
          </Button>
        </div>
      </Reveal>
    );
  }

  return (
    <ul
      role="list"
      className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4 xl:gap-6"
    >
      {products.map((p, i) => (
        <Reveal as="li" key={p.slug} delay={(i % 4) * 90}>
          <ProductCard product={p} priority={i < priorityCount} />
        </Reveal>
      ))}
    </ul>
  );
}
