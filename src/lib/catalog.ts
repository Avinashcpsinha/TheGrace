import "server-only";

/**
 * Server-side catalog access. Reads the generated catalog (src/data) and
 * merges admin overrides from data/product-overrides.json so the dashboard
 * can edit price/stock/visibility without re-running ingestion.
 */
import productsJson from "@/data/products.json";
import categoriesJson from "@/data/categories.json";
import heroJson from "@/data/hero.json";
import type { Category, Product } from "./types";
import { readCollection } from "./db";

export type ProductOverride = Partial<
  Pick<Product, "name" | "price" | "compareAtPrice" | "inStock" | "featured" | "hidden" | "description" | "premium">
>;

async function overrides(): Promise<Record<string, ProductOverride>> {
  return readCollection<Record<string, ProductOverride>>("product-overrides", {});
}

export async function getAllProducts(opts?: { includeHidden?: boolean }): Promise<Product[]> {
  const ov = await overrides();
  const merged = (productsJson as unknown as Product[]).map((p) =>
    ov[p.slug] ? { ...p, ...ov[p.slug] } : p
  );
  return opts?.includeHidden ? merged : merged.filter((p) => !p.hidden);
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await getAllProducts()).find((p) => p.slug === slug);
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  return (await getAllProducts()).filter((p) => p.category === category);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const all = await getAllProducts();
  const feat = all.filter((p) => p.featured && p.inStock);
  return (feat.length >= limit ? feat : [...feat, ...all.filter((p) => p.curated && !p.featured)]).slice(0, limit);
}

export async function getPremiumProducts(): Promise<Product[]> {
  return (await getAllProducts()).filter((p) => p.premium);
}

export async function getStandardProducts(): Promise<Product[]> {
  return (await getAllProducts()).filter((p) => !p.premium);
}

export function getCategories(): Category[] {
  return categoriesJson as unknown as Category[];
}

export function getCategory(slug: string): Category | undefined {
  return getCategories().find((c) => c.slug === slug);
}

export interface HeroData {
  candidates: { slug: string; name: string; src: string }[];
  chosen: string | null;
  note?: string;
}

export function getHeroData(): HeroData {
  return heroJson as unknown as HeroData;
}

/** related products: same category first, then same premium tier */
export async function getRelatedProducts(p: Product, limit = 4): Promise<Product[]> {
  const all = await getAllProducts();
  const same = all.filter((x) => x.slug !== p.slug && x.category === p.category);
  const rest = all.filter((x) => x.slug !== p.slug && x.category !== p.category && x.premium === p.premium);
  return [...same, ...rest].slice(0, limit);
}
