import type { Metadata } from "next";
import { Suspense } from "react";
import { getCategories, getCategory, getPremiumProducts } from "@/lib/catalog";
import { VideoHero } from "@/components/catalog/VideoHero";
import { MaterialsMarquee } from "@/components/catalog/MaterialsMarquee";
import { FilterBar } from "@/components/catalog/FilterBar";
import { SortSelect } from "@/components/catalog/SortSelect";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { Pagination } from "@/components/catalog/Pagination";
import {
  filterProducts,
  paginate,
  parseFilters,
  sortProducts,
  type CatalogFilters,
  type RawSearchParams,
} from "@/components/catalog/filters";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

export const metadata: Metadata = {
  title: "The Premium Collection — Crystal, Metal & Signature Awards",
  description:
    "Optical crystal, die-cast metal and 24K electroplated awards for stages where everything must feel earned. The Grace premium collection, handcrafted in Delhi.",
};

export default async function PremiumPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  // tier is fixed on this page — ignore any ?tier= in the URL
  const f: CatalogFilters = { ...parseFilters(sp), tier: undefined };

  const premium = await getPremiumProducts();
  const filtered = sortProducts(filterProducts(premium, f), f.sort);
  const { items, shown, total } = paginate(filtered, f.page);

  const categories = getCategories().filter((c) => c.count > 0);
  const activeCat = f.cat ? getCategory(f.cat) : undefined;

  return (
    <>
      <VideoHero
        crumbs={[{ label: "Home", href: "/" }, { label: "Premium Collection" }]}
        eyebrow="The Premium Collection"
        title="Crafted for moments that matter"
        sub="Optical crystal, die-cast metal and 24-karat detailing — signature awards for evenings the room will speak about for years."
        videoSrc="/Premeium.mp4"
        poster="/images/site/premium-hero-poster.webp"
      >
        <MaterialsMarquee />
      </VideoHero>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-12">
        <div className="border-y border-line/70 py-5">
          <Suspense fallback={<div className="h-10" aria-hidden="true" />}>
            <FilterBar
              categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
              subcategories={activeCat?.subcategories.map((s) => ({
                slug: s.slug,
                name: s.name,
              }))}
              showTier={false}
              resultCount={total}
              endSlot={<SortSelect />}
            />
          </Suspense>
        </div>

        <div className="mt-10">
          <ProductGrid
            products={items}
            emptyTitle="No premium pieces match"
            emptyNote="Loosen a filter, or tell us the occasion — our atelier quotes bespoke premium awards within a day."
            emptyTopic="premium awards"
            suggestions={[
              { href: "/premium", label: "All Premium" },
              { href: "/standard", label: "Standard Collection" },
              ...categories
                .slice(0, 4)
                .map((c) => ({ href: `/category/${c.slug}`, label: c.name })),
            ]}
            priorityCount={f.page === 1 ? 4 : 0}
          />
        </div>

        <Pagination raw={sp} page={f.page} shown={shown} total={total} label="premium pieces" />
      </section>
    </>
  );
}
