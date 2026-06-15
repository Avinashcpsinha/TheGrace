"use client";

/**
 * Product manager — inline price editing, stock/featured/premium/hidden
 * toggles, gold "edited" dot + reset when an override exists. Optimistic
 * PATCH /api/admin/products/[slug]; DELETE resets to catalog values (the
 * API returns the pristine row). Table on desktop, cards on mobile.
 */
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { AdminProductRow } from "./admin-product";
import { formatINR } from "@/lib/format";
import { toast } from "@/lib/events";

type RowPatch = Partial<
  Pick<AdminProductRow, "price" | "compareAtPrice" | "inStock" | "featured" | "premium" | "hidden">
>;

interface CategoryLite {
  slug: string;
  name: string;
}

function PriceInput({
  value,
  label,
  disabled,
  onCommit,
}: {
  value: number | null;
  label: string;
  disabled?: boolean;
  onCommit: (v: number) => void;
}) {
  const [draft, setDraft] = useState(value === null ? "" : String(value));
  useEffect(() => {
    setDraft(value === null ? "" : String(value));
  }, [value]);

  function commit() {
    if (draft.trim() === "") {
      setDraft(value === null ? "" : String(value));
      return;
    }
    const n = Math.round(Number(draft));
    if (!Number.isFinite(n) || n < 0 || n === value) {
      setDraft(value === null ? "" : String(value));
      return;
    }
    onCommit(n);
  }

  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      step={1}
      value={draft}
      placeholder="—"
      disabled={disabled}
      aria-label={label}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setDraft(value === null ? "" : String(value));
      }}
      className="w-24 rounded-md border border-line bg-ink px-2 py-1.5 text-right text-xs tabular-nums text-ivory transition-colors duration-200 placeholder:text-muted/50 focus:border-gold focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
  );
}

function Toggle({
  on,
  label,
  disabled,
  onChange,
}: {
  on: boolean;
  label: string;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-5 w-9 shrink-0 rounded-full border ${
        on ? "border-gold/60 bg-gold/25" : "border-line bg-ink-4"
      } disabled:opacity-40`}
    >
      <span
        className={`absolute top-1/2 left-0 size-3.5 -translate-y-1/2 rounded-full transition-transform duration-200 ease-[var(--ease-lux)] ${
          on ? "translate-x-[1.1rem] bg-gold" : "translate-x-[0.15rem] bg-muted"
        }`}
        aria-hidden="true"
      />
    </button>
  );
}

function EditedDot({ row }: { row: AdminProductRow }) {
  if (row.overridden.length === 0) return null;
  return (
    <span
      className="inline-block size-2 rounded-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.7)]"
      title={`Edited: ${row.overridden.join(", ")}`}
      aria-label={`Edited fields: ${row.overridden.join(", ")}`}
      role="img"
    />
  );
}

export function ProductsClient({
  initialRows,
  categories,
}: {
  initialRows: AdminProductRow[];
  categories: CategoryLite[];
}) {
  const [rows, setRows] = useState<AdminProductRow[]>(initialRows);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [busySlug, setBusySlug] = useState<string | null>(null);

  const categoryName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of categories) map[c.slug] = c.name;
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (cat === "all" || r.category === cat) &&
        (!q ||
          r.name.toLowerCase().includes(q) ||
          r.sku.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q))
    );
  }, [rows, query, cat]);

  async function patchRow(slug: string, patch: RowPatch) {
    const previous = rows;
    setBusySlug(slug);
    setRows((rs) => rs.map((r) => (r.slug === slug ? { ...r, ...patch } : r)));
    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { product: AdminProductRow };
      setRows((rs) => rs.map((r) => (r.slug === slug ? data.product : r)));
      toast("Saved — storefront updated");
    } catch {
      setRows(previous);
      toast("Couldn't save — please try again");
    } finally {
      setBusySlug(null);
    }
  }

  async function resetRow(slug: string, name: string) {
    setBusySlug(slug);
    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { product: AdminProductRow };
      setRows((rs) => rs.map((r) => (r.slug === slug ? data.product : r)));
      toast(`${name} reset to catalog values`);
    } catch {
      toast("Couldn't reset — please try again");
    } finally {
      setBusySlug(null);
    }
  }

  function rowControls(r: AdminProductRow) {
    const busy = busySlug === r.slug;
    return { busy };
  }

  return (
    <div className="mt-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filter products by category"
        >
          {[{ slug: "all", name: "All" }, ...categories].map((c) => {
            const active = cat === c.slug;
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => setCat(c.slug)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors duration-200 ${
                  active
                    ? "border-gold/60 bg-gold/15 font-medium text-champagne"
                    : "border-line text-muted hover:border-gold/30 hover:text-ivory"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, SKU or slug…"
          aria-label="Search products by name, SKU or slug"
          className="w-full rounded-lg border border-line bg-ink-2 px-3.5 py-2 text-sm text-ivory placeholder:text-muted/60 transition-colors duration-200 focus:border-gold focus:outline-none lg:w-72"
        />
      </div>

      <p className="mt-3 text-xs text-muted" aria-live="polite">
        Showing {filtered.length} of {rows.length} products
      </p>

      {filtered.length === 0 ? (
        <p className="mt-3 rounded-xl border border-line bg-ink-2 px-4 py-10 text-center text-sm text-muted">
          No products match{query.trim() ? ` “${query.trim()}”` : " this filter"}.
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card-surface mt-3 hidden overflow-hidden rounded-xl xl:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-[0.12em] text-muted">
                  <th scope="col" className="px-4 py-3 font-medium">Product</th>
                  <th scope="col" className="px-3 py-3 font-medium">Category</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Price ₹</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Compare-at ₹</th>
                  <th scope="col" className="px-3 py-3 text-center font-medium">In stock</th>
                  <th scope="col" className="px-3 py-3 text-center font-medium">Featured</th>
                  <th scope="col" className="px-3 py-3 text-center font-medium">Premium</th>
                  <th scope="col" className="px-3 py-3 text-center font-medium">Hidden</th>
                  <th scope="col" className="px-3 py-3 text-center font-medium">Edited</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const { busy } = rowControls(r);
                  return (
                    <tr
                      key={r.slug}
                      className={`border-b border-line/60 last:border-b-0 ${r.hidden ? "opacity-60" : ""}`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          {r.thumb ? (
                            <Image
                              src={r.thumb}
                              alt={r.name}
                              width={40}
                              height={40}
                              className="photo-well size-10 shrink-0 rounded-md object-cover"
                            />
                          ) : (
                            <span
                              className="photo-well size-10 shrink-0 rounded-md"
                              aria-hidden="true"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="max-w-[16rem] truncate font-medium text-ivory">
                              {r.name}
                            </p>
                            <p className="text-[11px] text-muted">
                              {r.sku} · {formatINR(r.price)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted">
                        {categoryName[r.category] ?? r.category}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <PriceInput
                          value={r.price}
                          label={`Price for ${r.name} in rupees`}
                          disabled={busy}
                          onCommit={(v) => patchRow(r.slug, { price: v })}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <PriceInput
                          value={r.compareAtPrice}
                          label={`Compare-at price for ${r.name} in rupees`}
                          disabled={busy}
                          onCommit={(v) => patchRow(r.slug, { compareAtPrice: v })}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Toggle
                          on={r.inStock}
                          label={`In stock: ${r.name}`}
                          disabled={busy}
                          onChange={(v) => patchRow(r.slug, { inStock: v })}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Toggle
                          on={r.featured}
                          label={`Featured: ${r.name}`}
                          disabled={busy}
                          onChange={(v) => patchRow(r.slug, { featured: v })}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Toggle
                          on={r.premium}
                          label={`Premium tier: ${r.name}`}
                          disabled={busy}
                          onChange={(v) => patchRow(r.slug, { premium: v })}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Toggle
                          on={r.hidden}
                          label={`Hidden from storefront: ${r.name}`}
                          disabled={busy}
                          onChange={(v) => patchRow(r.slug, { hidden: v })}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-flex items-center gap-2">
                          <EditedDot row={r} />
                          {r.overridden.length > 0 && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => resetRow(r.slug, r.name)}
                              aria-label={`Reset overrides for ${r.name}`}
                              className="rounded-full border border-line px-2.5 py-1 text-[11px] text-muted transition-colors duration-200 hover:border-gold/40 hover:text-champagne disabled:opacity-50"
                            >
                              Reset
                            </button>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile / tablet cards */}
          <ul className="mt-3 flex flex-col gap-2 xl:hidden">
            {filtered.map((r) => {
              const { busy } = rowControls(r);
              return (
                <li
                  key={r.slug}
                  className={`card-surface rounded-xl px-4 py-3 ${r.hidden ? "opacity-70" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    {r.thumb ? (
                      <Image
                        src={r.thumb}
                        alt={r.name}
                        width={44}
                        height={44}
                        className="photo-well size-11 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <span className="photo-well size-11 shrink-0 rounded-md" aria-hidden="true" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-medium text-ivory">
                        <span className="truncate">{r.name}</span>
                        <EditedDot row={r} />
                      </p>
                      <p className="text-[11px] text-muted">
                        {r.sku} · {categoryName[r.category] ?? r.category} · {formatINR(r.price)}
                      </p>
                    </div>
                    {r.overridden.length > 0 && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => resetRow(r.slug, r.name)}
                        aria-label={`Reset overrides for ${r.name}`}
                        className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[11px] text-muted transition-colors duration-200 hover:border-gold/40 hover:text-champagne disabled:opacity-50"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2.5">
                    <label className="flex items-center gap-2 text-xs text-muted">
                      Price ₹
                      <PriceInput
                        value={r.price}
                        label={`Price for ${r.name} in rupees`}
                        disabled={busy}
                        onCommit={(v) => patchRow(r.slug, { price: v })}
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs text-muted">
                      Compare ₹
                      <PriceInput
                        value={r.compareAtPrice}
                        label={`Compare-at price for ${r.name} in rupees`}
                        disabled={busy}
                        onCommit={(v) => patchRow(r.slug, { compareAtPrice: v })}
                      />
                    </label>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2.5 sm:grid-cols-4">
                    {(
                      [
                        ["In stock", "inStock", r.inStock],
                        ["Featured", "featured", r.featured],
                        ["Premium", "premium", r.premium],
                        ["Hidden", "hidden", r.hidden],
                      ] as const
                    ).map(([label, key, on]) => (
                      <span key={key} className="flex items-center gap-2 text-xs text-muted">
                        <Toggle
                          on={on}
                          label={`${label}: ${r.name}`}
                          disabled={busy}
                          onChange={(v) => patchRow(r.slug, { [key]: v } as RowPatch)}
                        />
                        {label}
                      </span>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
