import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllProducts, getCategories, getCategory } from "@/lib/catalog";
import { HERO } from "@/lib/hero-images";
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
  searchParams: Promise<RawSearchParams>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const f = parseFilters(sp);
  const cat = f.cat ? getCategory(f.cat) : undefined;
  const title = cat ? `${cat.name} — All Products` : "All Products";
  const description = f.q
    ? `Trophies, medals and awards matching “${f.q}” — handcrafted by The Grace, Lajpat Nagar, Delhi.`
    : cat
      ? `${cat.blurb} Browse ${cat.name.toLowerCase()} from The Grace, Delhi.`
      : "Browse the complete collection of trophies, medals, mementos, corporate gifting and branded merchandise — handcrafted and engraved to order in Delhi by The Grace.";
  return { title, description };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const f = parseFilters(sp);

  const all = await getAllProducts();
  const filtered = sortProducts(filterProducts(all, f), f.sort);
  const { items, shown, total } = paginate(filtered, f.page);

  const categories = getCategories().filter((c) => c.count > 0);
  const activeCat = f.cat ? getCategory(f.cat) : undefined;

  return (
    <>
      <CollectionHero
        crumbs={[{ label: "Home", href: "/" }, { label: "All Products" }]}
        eyebrow="The Complete Collection"
        title="All Products"
        sub="Trophies, medals, mementos, corporate gifting and branded merchandise — every piece from our Lajpat Nagar workshop, ready to be engraved with your moment."
        bg={{ src: HERO.products }}
      />

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="border-y border-line/70 py-5">
          <Suspense fallback={<div className="h-10" aria-hidden="true" />}>
            <FilterBar
              categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
              subcategories={activeCat?.subcategories.map((s) => ({
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
            emptyTopic="trophies and awards"
            suggestions={categories.map((c) => ({
              href: `/category/${c.slug}`,
              label: c.name,
            }))}
            priorityCount={f.page === 1 ? 4 : 0}
          />
        </div>

        <Pagination raw={sp} page={f.page} shown={shown} total={total} />
      </section>
    </>
  );
}
