/**
 * Admin-only product override editing.
 *   PATCH  — merge { price?, compareAtPrice?, inStock?, featured?, premium?,
 *            hidden? } into data/product-overrides.json for this slug.
 *   DELETE — drop the slug's override entirely (reset to catalog values).
 * Both return { product: AdminProductRow } rebuilt from catalog + override, so
 * the dashboard table can replace its optimistic row with the server truth.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import productsJson from "@/data/products.json";
import type { Product } from "@/lib/types";
import type { ProductOverride } from "@/lib/catalog";
import { requireAdmin } from "@/lib/admin-auth";
import { readCollection, updateCollection } from "@/lib/db";
import { toAdminProductRow } from "@/app/admin/products/admin-product";

export const runtime = "nodejs";

const COLLECTION = "product-overrides";
const catalog = productsJson as unknown as Product[];

const patchSchema = z
  .object({
    price: z.coerce.number().int().min(0).max(100_000_000).optional(),
    compareAtPrice: z.coerce.number().int().min(0).max(100_000_000).optional(),
    inStock: z.boolean().optional(),
    featured: z.boolean().optional(),
    premium: z.boolean().optional(),
    hidden: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to update" });

function baseProduct(slug: string): Product | undefined {
  return catalog.find((p) => p.slug === slug);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const base = baseProduct(slug);
  if (!base) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid edit" },
      { status: 400 }
    );
  }

  const next = await updateCollection<Record<string, ProductOverride>>(
    COLLECTION,
    {},
    (current) => ({ ...current, [slug]: { ...current[slug], ...parsed.data } })
  );

  const override = next[slug];
  const merged = { ...base, ...override } as Product;
  return NextResponse.json({ product: toAdminProductRow(merged, override) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const base = baseProduct(slug);
  if (!base) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const current = await readCollection<Record<string, ProductOverride>>(COLLECTION, {});
  if (current[slug]) {
    await updateCollection<Record<string, ProductOverride>>(COLLECTION, {}, (cur) => {
      const { [slug]: _drop, ...rest } = cur;
      return rest;
    });
  }

  return NextResponse.json({ product: toAdminProductRow(base, undefined) });
}
