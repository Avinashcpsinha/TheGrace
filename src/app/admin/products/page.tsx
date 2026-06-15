import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllProducts, getCategories, type ProductOverride } from "@/lib/catalog";
import { readCollection } from "@/lib/db";
import { toAdminProductRow } from "./admin-product";
import { ProductsClient } from "./ProductsClient";

export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  if (!(await requireAdmin())) redirect("/admin/login");

  const [products, overrides] = await Promise.all([
    getAllProducts({ includeHidden: true }),
    readCollection<Record<string, ProductOverride>>("product-overrides", {}),
  ]);

  const rows = products.map((p) => toAdminProductRow(p, overrides[p.slug]));
  const categories = getCategories().map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <div>
      <h1 className="text-xl font-semibold text-ivory">Products</h1>
      <p className="mt-1 text-sm text-muted">
        {rows.length} products in the catalog, hidden ones included. Edits are saved as
        overrides and go live on the storefront immediately.
      </p>
      <p className="mt-3 rounded-lg border border-gold/25 bg-gold/5 px-3.5 py-2.5 text-xs leading-relaxed text-champagne">
        Photos &amp; new products come from the <strong>Images</strong> folder — run{" "}
        <code className="rounded bg-ink px-1.5 py-0.5 font-mono text-[11px]">npm run ingest</code>{" "}
        (see owner guide).
      </p>
      <ProductsClient initialRows={rows} categories={categories} />
    </div>
  );
}
