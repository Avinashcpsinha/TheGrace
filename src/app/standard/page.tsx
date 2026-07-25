import type { Metadata } from "next";
import { Suspense } from "react";
import { getCategories, getCategory, getStandardProducts } from "@/lib/catalog";
import { VideoHero } from "@/components/catalog/VideoHero";
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
  title: "The Standard Collection — Trophies & Medals for Every Podium",
  description:
    "Bright, dependable trophies and medals for schools, leagues and annual days — bulk pricing, fast turnaround and free engraving from The Grace, Delhi.",
};

const VALUE_PROPS: { title: string; note: string }[] = [
  { title: "Bulk pricing", note: "Tiered discounts that grow with your order" },
  { title: "Fast turnaround", note: "Dispatch in days, not weeks" },
  { title: "Free engraving", note: "Names, dates and logos at no extra cost" },
];

export default async function StandardPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  // tier is fixed on this page — ignore any ?tier= in the URL
  const f: CatalogFilters = { ...parseFilters(sp), tier: undefined };

  const standard = await getStandardProducts();
  const filtered = sortProducts(filterProducts(standard, f), f.sort);
  const { items, shown, total } = paginate(filtered, f.page);

  const categories = getCategories().filter((c) => c.count > 0);
  const activeCat = f.cat ? getCategory(f.cat) : undefined;

  return (
    <>
      <VideoHero
        crumbs={[{ label: "Home", href: "/" }, { label: "Standard Collection" }]}
        eyebrow="The Standard Collection"
        title="Every podium deserves shine"
        sub="Crowd-pleasing trophies, medals and keepsakes at honest prices — built for leagues, schools, offices and every win in between."
        videoSrc="/Standard.mp4"
        poster="/images/site/standard-hero-poster.webp"
      >
        <div className="border-y border-line/70 bg-ink-2/60">
          <ul
            role="list"
            className="mx-auto grid max-w-7xl grid-cols-1 gap-x-6 gap-y-3 px-6 py-4 sm:grid-cols-3"
          >
            {VALUE_PROPS.map((v) => (
              <li key={v.title} className="flex items-center justify-center gap-3 text-center sm:text-left">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="shrink-0 text-gold"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <p className="text-xs text-muted">
                  <span className="font-semibold uppercase tracking-[0.18em] text-champagne">
                    {v.title}
                  </span>
                  <span className="hidden md:inline"> — {v.note}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
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
            emptyTitle="No standard pieces match"
            emptyNote="Loosen a filter, or message us your budget and quantity — we will line up options the same day."
            emptyTopic="standard trophies and medals"
            suggestions={[
              { href: "/standard", label: "All Standard" },
              { href: "/premium", label: "Premium Collection" },
              ...categories
                .slice(0, 4)
                .map((c) => ({ href: `/category/${c.slug}`, label: c.name })),
            ]}
            priorityCount={f.page === 1 ? 4 : 0}
          />
        </div>

        <Pagination raw={sp} page={f.page} shown={shown} total={total} />
      </section>
    </>
  );
}
