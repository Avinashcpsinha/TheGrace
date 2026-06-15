/**
 * POST /api/products — resolves a batch of slugs to full products for the
 * client-side wishlist (keeps the 241-product catalog out of the browser
 * bundle). Body: { slugs: string[] } (≤100). Returns { products: Product[] }
 * for the slugs that exist and aren't hidden, order unspecified (the client
 * re-sorts to the saved order).
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAllProducts } from "@/lib/catalog";

const schema = z.object({
  slugs: z.array(z.string().trim().min(1).max(120)).max(100),
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid slug list" }, { status: 400 });
  }

  const wanted = new Set(parsed.data.slugs);
  const products = (await getAllProducts()).filter((p) => wanted.has(p.slug));

  return NextResponse.json({ products });
}
