/**
 * Catalog filtering / sorting / pagination — pure helpers shared by every
 * browse page (server) and the FilterBar / SortSelect (client).
 *
 * IMPORTANT: keep this module free of server-only imports and of the raw
 * products.json — it is imported by client components.
 *
 * URL parameter scheme (all optional):
 *   q=…           free-text query (name/category/subcategory/occasions/materials)
 *   cat=…         category slug
 *   sub=…         subcategory slug
 *   min=… max=…   price bounds in INR
 *   occasion=…    one of OCCASIONS
 *   tier=premium|standard
 *   stock=1       in-stock only
 *   sort=featured|price-asc|price-desc|name
 *   page=n        cumulative "load more" page (page n shows n × PAGE_SIZE items)
 */
import type { Product } from "@/lib/types";
import { formatINR } from "@/lib/format";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export const PAGE_SIZE = 24;

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price low → high" },
  { value: "price-desc", label: "Price high → low" },
  { value: "name", label: "Name A–Z" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export const OCCASIONS = [
  "Corporate",
  "Sports",
  "Academic",
  "Felicitation",
  "Government",
  "Social",
] as const;

export interface PriceRange {
  id: string;
  label: string;
  min?: number;
  max?: number;
}

export const PRICE_RANGES: PriceRange[] = [
  { id: "under-500", label: `Under ${formatINR(500)}`, max: 500 },
  { id: "500-1500", label: `${formatINR(500)} – ${formatINR(1500)}`, min: 500, max: 1500 },
  { id: "1500-5000", label: `${formatINR(1500)} – ${formatINR(5000)}`, min: 1500, max: 5000 },
  { id: "5000-plus", label: `${formatINR(5000)}+`, min: 5000 },
];

export type Tier = "premium" | "standard";

export interface CatalogFilters {
  q?: string;
  cat?: string;
  sub?: string;
  min?: number;
  max?: number;
  occasion?: string;
  tier?: Tier;
  stock: boolean;
  sort: SortKey;
  page: number;
}

/** Next 15 search params may be arrays — take the first value. */
export const firstParam = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

const toNumber = (v: string | undefined): number | undefined => {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

export function parseFilters(sp: RawSearchParams): CatalogFilters {
  const sortRaw = firstParam(sp.sort);
  const tierRaw = firstParam(sp.tier);
  const pageRaw = Math.floor(toNumber(firstParam(sp.page)) ?? 1);
  return {
    q: firstParam(sp.q)?.trim() || undefined,
    cat: firstParam(sp.cat) || undefined,
    sub: firstParam(sp.sub) || undefined,
    min: toNumber(firstParam(sp.min)),
    max: toNumber(firstParam(sp.max)),
    occasion: firstParam(sp.occasion) || undefined,
    tier: tierRaw === "premium" || tierRaw === "standard" ? tierRaw : undefined,
    stock: firstParam(sp.stock) === "1",
    sort: SORT_OPTIONS.some((o) => o.value === sortRaw) ? (sortRaw as SortKey) : "featured",
    page: pageRaw >= 1 ? pageRaw : 1,
  };
}

/** Case-insensitive multi-word match over name/category/subcategory/occasions/materials. */
export function matchesQuery(p: Product, q: string): boolean {
  const hay = [
    p.name,
    p.category,
    p.category.replace(/-/g, " "),
    p.subcategory ?? "",
    (p.subcategory ?? "").replace(/-/g, " "),
    ...p.occasions,
    ...p.materials,
  ]
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => hay.includes(token));
}

export function filterProducts(products: Product[], f: CatalogFilters): Product[] {
  return products.filter((p) => {
    if (f.cat && p.category !== f.cat) return false;
    if (f.sub && p.subcategory !== f.sub) return false;
    if (f.min !== undefined && p.price < f.min) return false;
    if (f.max !== undefined && p.price > f.max) return false;
    if (f.occasion && !p.occasions.includes(f.occasion)) return false;
    if (f.tier === "premium" && !p.premium) return false;
    if (f.tier === "standard" && p.premium) return false;
    if (f.stock && !p.inStock) return false;
    if (f.q && !matchesQuery(p, f.q)) return false;
    return true;
  });
}

export function sortProducts(products: Product[], sort: SortKey): Product[] {
  const list = [...products];
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    default: {
      // featured first, then curated; stable sort keeps catalog order otherwise
      const score = (p: Product) => (p.featured ? 2 : 0) + (p.curated ? 1 : 0);
      return list.sort((a, b) => score(b) - score(a));
    }
  }
}

/** Cumulative "load more" pagination: page n shows the first n × PAGE_SIZE items. */
export function paginate<T>(
  list: T[],
  page: number,
  pageSize: number = PAGE_SIZE
): { items: T[]; shown: number; total: number } {
  const shown = Math.min(list.length, Math.max(1, page) * pageSize);
  return { items: list.slice(0, shown), shown, total: list.length };
}
