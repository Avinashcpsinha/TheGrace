/**
 * GET /api/search-index — slim product index for the client-side
 * SearchOverlay. One small payload, cached for 5 minutes, so instant
 * fuzzy search never ships products.json to the browser.
 */
import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/catalog";

export async function GET() {
  const products = await getAllProducts();

  const index = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    category: p.category,
    subcategory: p.subcategory ?? "",
    price: p.price,
    premium: p.premium,
    thumb: p.images[0]?.thumb ?? "",
    blur: p.images[0]?.blur ?? "",
  }));

  return NextResponse.json(index, {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}
