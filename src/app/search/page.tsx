import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getAllProducts, getCategories } from "@/lib/catalog";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { enquiryWhatsAppLink } from "@/lib/order-links";
import { CollectionHero } from "@/components/catalog/CollectionHero";
import { SortSelect } from "@/components/catalog/SortSelect";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { Pagination } from "@/components/catalog/Pagination";
import {
  firstParam,
  matchesQuery,
  paginate,
  parseFilters,
  sortProducts,
  type RawSearchParams,
} from "@/components/catalog/filters";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const q = firstParam(sp.q)?.trim();
  return {
    title: q ? `Search — “${q}”` : "Search the Catalogue",
    description: q
      ? `Trophies, medals and awards matching “${q}” at The Grace, Delhi.`
      : "Search trophies, medals, mementos and corporate awards by name, material or occasion.",
    robots: { index: false, follow: true },
  };
}

function SearchForm({ initial }: { initial: string }) {
  return (
    <form
      action="/search"
      role="search"
      className="mx-auto flex w-full max-w-2xl items-center gap-3"
    >
      <label htmlFor="catalog-search" className="sr-only">
        Search the catalogue
      </label>
      <input
        id="catalog-search"
        name="q"
        type="search"
        defaultValue={initial}
        placeholder="Try “crystal”, “medal”, “corporate gift”…"
        autoComplete="off"
        className="w-full rounded-full border border-line bg-ink-3 px-6 py-3.5 text-sm text-ivory placeholder:text-muted/60 transition-colors duration-300 hover:border-gold/40 focus-visible:outline-2 focus-visible:outline-gold"
      />
      <Button type="submit" variant="gold" aria-label="Search products">
        Search
      </Button>
    </form>
  );
}

function CategoryChips({ heading }: { heading: string }) {
  const categories = getCategories().filter((c) => c.count > 0);
  return (
    <div className="text-center">
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-muted/70">
        {heading}
      </p>
      <ul role="list" className="mt-4 flex flex-wrap justify-center gap-2">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/category/${c.slug}`}
              className="inline-block rounded-full border border-line px-4 py-2 text-xs uppercase tracking-[0.18em] text-muted transition-colors duration-300 hover:border-gold/60 hover:text-champagne"
            >
              {c.name}
              <span className="ml-1.5 text-muted/50">{c.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const f = parseFilters(sp);
  const q = f.q ?? "";

  /* ── no query: prompt + browse-by-collection ─────────────────────── */
  if (!q) {
    return (
      <>
        <CollectionHero
          crumbs={[{ label: "Home", href: "/" }, { label: "Search" }]}
          eyebrow="Search"
          title="What are you looking for?"
          sub="Search by name, material or occasion — a crystal award, a tournament cup, a felicitation memento."
        />
        <section className="mx-auto max-w-7xl px-6 pb-24">
          <Reveal className="flex flex-col gap-14">
            <SearchForm initial="" />
            <CategoryChips heading="Or browse a collection" />
          </Reveal>
        </section>
      </>
    );
  }

  /* ── results ─────────────────────────────────────────────────────── */
  const all = await getAllProducts();
  const matched = sortProducts(
    all.filter((p) => matchesQuery(p, q)),
    f.sort
  );
  const { items, shown, total } = paginate(matched, f.page);

  return (
    <>
      <CollectionHero
        crumbs={[{ label: "Home", href: "/" }, { label: "Search" }]}
        eyebrow="Search results"
        title={
          <>
            {total} {total === 1 ? "result" : "results"} for{" "}
            <span className="gold-text italic">“{q}”</span>
          </>
        }
        sub="Matched across names, categories, occasions and materials."
      />

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="flex flex-col items-center gap-5 border-y border-line/70 py-5 md:flex-row md:justify-between">
          <SearchForm initial={q} />
          <Suspense fallback={<div className="h-9" aria-hidden="true" />}>
            <SortSelect className="shrink-0" />
          </Suspense>
        </div>

        <div className="mt-10">
          {total > 0 ? (
            <>
              <ProductGrid products={items} priorityCount={f.page === 1 ? 4 : 0} />
              <Pagination raw={sp} page={f.page} shown={shown} total={total} label="results" />
            </>
          ) : (
            <Reveal className="spotlight card-surface rounded-3xl px-6 py-20 text-center md:py-24">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.35em] text-gold/80">
                The stage is bare
              </p>
              <h2 className="mt-4 font-display text-4xl text-ivory [text-wrap:balance] md:text-5xl">
                Nothing for <span className="italic">“{q}”</span> yet
              </h2>
              <ul
                role="list"
                className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm leading-relaxed text-muted"
              >
                <li className="flex gap-3">
                  <span aria-hidden="true" className="text-gold">·</span>
                  Check the spelling, or try fewer words
                </li>
                <li className="flex gap-3">
                  <span aria-hidden="true" className="text-gold">·</span>
                  Search broader terms — “crystal”, “medal”, “gift”, “cup”
                </li>
                <li className="flex gap-3">
                  <span aria-hidden="true" className="text-gold">·</span>
                  Try an occasion — “corporate”, “sports”, “felicitation”
                </li>
              </ul>
              <div className="mt-10">
                <CategoryChips heading="Popular collections" />
              </div>
              <div className="mt-10 flex justify-center">
                <Button
                  href={enquiryWhatsAppLink(`“${q}”`)}
                  variant="whatsapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Ask us about ${q} on WhatsApp`}
                >
                  Ask us on WhatsApp
                </Button>
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}
