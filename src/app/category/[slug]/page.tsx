import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  getAllProducts,
  getCategories,
  getCategory,
  getProductsByCategory,
} from "@/lib/catalog";
import type { Product } from "@/lib/types";
import { heroForCategory } from "@/lib/hero-images";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { enquiryWhatsAppLink } from "@/lib/order-links";
import { CollectionHero } from "@/components/catalog/CollectionHero";
import { FilterBar } from "@/components/catalog/FilterBar";
import { SortSelect } from "@/components/catalog/SortSelect";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { Pagination } from "@/components/catalog/Pagination";
import {
  filterProducts,
  paginate,
  parseFilters,
  sortProducts,
  type RawSearchParams,
} from "@/components/catalog/filters";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}

export function generateStaticParams() {
  return getCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) return { title: "Category not found" };
  return {
    title: `${cat.name} — Trophies & Awards`,
    description: `${cat.blurb} ${
      cat.count > 0
        ? `Browse ${cat.count} pieces from The Grace, Delhi.`
        : "Crafted to order by The Grace, Delhi."
    }`,
  };
}

/** Round-robin 8 curated picks across the other categories so the rail feels varied. */
function curatedPicks(all: Product[], excludeCategory: string, limit = 8): Product[] {
  const pool = all.filter((p) => p.curated && p.inStock && p.category !== excludeCategory);
  const byCat = new Map<string, Product[]>();
  for (const p of pool) {
    const list = byCat.get(p.category);
    if (list) list.push(p);
    else byCat.set(p.category, [p]);
  }
  const lists = [...byCat.values()];
  const picks: Product[] = [];
  for (let i = 0; picks.length < limit; i++) {
    let added = false;
    for (const list of lists) {
      const item = list[i];
      if (item) {
        picks.push(item);
        added = true;
        if (picks.length === limit) break;
      }
    }
    if (!added) break;
  }
  return picks;
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = getCategory(slug);
  if (!category) notFound();

  const f = parseFilters(sp);
  const products = await getProductsByCategory(slug);

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "All Products", href: "/products" },
    { label: category.name },
  ];

  /* ── empty category (e.g. Mementos): made-to-order panel ─────────── */
  if (products.length === 0) {
    const also = curatedPicks(await getAllProducts(), slug);
    const others = getCategories().filter((c) => c.count > 0);
    return (
      <>
        <CollectionHero crumbs={crumbs} eyebrow={category.name} title={category.name} sub={category.blurb} bg={{ src: heroForCategory(slug) }} />

        <section className="mx-auto max-w-7xl px-6 pb-24">
          <Reveal className="spotlight card-surface mx-auto max-w-3xl rounded-3xl px-6 py-16 text-center md:px-14">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.35em] text-gold/80">
              Made to order
            </p>
            <h2 className="mt-4 font-display text-4xl text-ivory [text-wrap:balance] md:text-5xl">
              Mementos are crafted to order
            </h2>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted">
              Every memento we make is personal — a farewell, a felicitation, a silver
              jubilee. Share the occasion, names and quantity, and our workshop will
              design, engrave and finish a keepsake around it. Most pieces are ready
              within 7–10 days.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button
                href={enquiryWhatsAppLink("custom mementos")}
                variant="whatsapp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Enquire about custom mementos on WhatsApp"
              >
                Enquire on WhatsApp
              </Button>
              <Button href="/customization" variant="outline" aria-label="Design your own memento">
                Design your memento
              </Button>
            </div>
            <div className="gold-rule mx-auto mt-10 w-24" aria-hidden="true" />
            <ul role="list" className="mt-6 flex flex-wrap justify-center gap-2">
              {others.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/category/${c.slug}`}
                    className="inline-block rounded-full border border-line px-4 py-2 text-xs uppercase tracking-[0.18em] text-muted transition-colors duration-300 hover:border-gold/60 hover:text-champagne"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>

          {also.length > 0 && (
            <div className="mt-24">
              <SectionHeading
                eyebrow="While you are here"
                title="You may also like"
                sub="Curated pieces from across the workshop — each one customisable with your engraving."
              />
              <div className="mt-12">
                <ProductGrid products={also} priorityCount={0} />
              </div>
            </div>
          )}
        </section>
      </>
    );
  }

  /* ── normal category browse ──────────────────────────────────────── */
  const filtered = sortProducts(filterProducts(products, f), f.sort);
  const { items, shown, total } = paginate(filtered, f.page);

  return (
    <>
      <CollectionHero crumbs={crumbs} eyebrow="Collection" title={category.name} sub={category.blurb} bg={{ src: heroForCategory(slug) }}>
        {slug === "khelo-india" && (
          <div className="border-y border-gold/20 bg-gold/[0.04] py-3">
            <p className="mx-auto max-w-7xl px-6 text-center text-[0.65rem] uppercase tracking-[0.3em] md:text-xs">
              <span className="gold-text font-semibold">Official Games legacy</span>
              <span className="text-muted">
                {" "}
                — makers of the official Khelo India Games awards, from our Lajpat Nagar
                workshop to the national podium
              </span>
            </p>
          </div>
        )}
      </CollectionHero>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-12">
        <div className="border-y border-line/70 py-5">
          <Suspense fallback={<div className="h-10" aria-hidden="true" />}>
            <FilterBar
              subcategories={category.subcategories.map((s) => ({
                slug: s.slug,
                name: s.name,
              }))}
              showTier
              resultCount={total}
              endSlot={<SortSelect />}
            />
          </Suspense>
        </div>

        <div className="mt-10">
          <ProductGrid
            products={items}
            emptyTitle={`No ${category.name.toLowerCase()} match`}
            emptyNote="Loosen a filter, or tell us what you have in mind — most of our catalogue can be customised or made to order."
            emptyTopic={category.name.toLowerCase()}
            suggestions={getCategories()
              .filter((c) => c.count > 0 && c.slug !== slug)
              .map((c) => ({ href: `/category/${c.slug}`, label: c.name }))}
            priorityCount={f.page === 1 ? 4 : 0}
          />
        </div>

        <Pagination raw={sp} page={f.page} shown={shown} total={total} />
      </section>
    </>
  );
}
