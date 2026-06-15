/**
 * Shared shape for product rows in the admin dashboard.
 *
 * `toAdminProductRow` runs on the server only (page + /api/admin/products);
 * the client table imports the TYPE only (type-only imports are erased, so
 * products.json never reaches the client bundle).
 */
import type { Product } from "@/lib/types";
import type { ProductOverride } from "@/lib/catalog";

export interface AdminProductRow {
  slug: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  compareAtPrice: number | null;
  inStock: boolean;
  featured: boolean;
  premium: boolean;
  hidden: boolean;
  thumb: string;
  /** override keys present for this product, e.g. ["price", "hidden"] */
  overridden: string[];
}

export function toAdminProductRow(p: Product, override?: ProductOverride): AdminProductRow {
  return {
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    category: p.category,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    inStock: p.inStock,
    featured: Boolean(p.featured),
    premium: p.premium,
    hidden: Boolean(p.hidden),
    thumb: p.images[0]?.thumb ?? "",
    overridden: override ? Object.keys(override) : [],
  };
}
