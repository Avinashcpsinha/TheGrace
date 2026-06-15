"use client";

/**
 * PDP buy box (client) — receives the full Product as a prop (the server
 * page reads the catalog; products.json never enters the client bundle).
 * Eyebrow → serif h1 → SKU → Price → size pills → free engraving input →
 * qty stepper → always-visible bulk pricing table with live tier highlight
 * → Add to Cart / Order on WhatsApp / wishlist / call.
 */

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { useCart, useWishlist } from "@/lib/store";
import { productWhatsAppLink, telLink } from "@/lib/order-links";
import { BULK_TIERS, bulkDiscountRate, unitPriceFor } from "@/lib/pricing";
import { formatINR, clamp } from "@/lib/format";
import { site } from "@/config/site";
import type { Product } from "@/lib/types";

const MAX_QTY = 500;
const FALLBACK_SIZE = { label: "Standard", priceDelta: 0 };

export function BuyBox({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();

  const sizes = product.sizes.length > 0 ? product.sizes : [FALLBACK_SIZE];
  const [sizeIdx, setSizeIdx] = useState(0);
  const [engraving, setEngraving] = useState("");
  const [qtyText, setQtyText] = useState("1");

  const size = sizes[Math.min(sizeIdx, sizes.length - 1)];
  const unit = product.price + size.priceDelta; // base + size delta, pre-bulk
  const qty = clamp(parseInt(qtyText, 10) || 1, 1, MAX_QTY);
  const effUnit = unitPriceFor(unit, qty);
  const wished = wishlist.includes(product.slug);

  /* 1–9 row + the four bulk tiers, ascending */
  const tiers = useMemo(
    () => [
      { min: 1, off: 0, label: "1–9 pcs" },
      ...[...BULK_TIERS].reverse().map((t) => ({ min: t.min, off: t.off, label: t.label })),
    ],
    []
  );
  const activeOff = bulkDiscountRate(qty);

  const setQty = (n: number) => setQtyText(String(clamp(n, 1, MAX_QTY)));

  const waHref = productWhatsAppLink({
    name: product.name,
    sku: product.sku,
    size: size.label,
    qty,
    unitPrice: unit,
    engraving: engraving.trim() || undefined,
    path: `/product/${product.slug}`,
  });

  const handleAdd = () =>
    addToCart({
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      image: product.images[0]?.thumb ?? "",
      unitPrice: unit,
      size: size.label,
      qty,
      engraving: engraving.trim() || undefined,
      category: product.category,
    });

  const eyebrow = (product.subcategory ?? product.category).replace(/-/g, " ");

  return (
    <div>
      {/* identity */}
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.35em] text-gold/90">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-display text-4xl leading-[1.06] text-ivory [text-wrap:balance] md:text-5xl">
        {product.name}
      </h1>
      <p className="mt-2 text-xs tracking-[0.15em] text-muted">SKU {product.sku}</p>

      <div className="mt-5">
        <Price
          price={unit}
          compareAtPrice={
            product.compareAtPrice ? product.compareAtPrice + size.priceDelta : undefined
          }
          size="lg"
        />
      </div>

      {product.premium && (
        <p className="mt-3 text-sm">
          <span className="gold-text font-medium">
            Premium Collection — velvet presentation case included
          </span>
        </p>
      )}

      {/* size */}
      <fieldset className="mt-8">
        <legend className="text-[0.65rem] uppercase tracking-[0.3em] text-muted">Size</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {sizes.map((s, i) => {
            const selected = i === sizeIdx;
            return (
              <label
                key={s.label}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors duration-300 ease-[var(--ease-lux)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold ${
                  selected
                    ? "border-gold bg-gold font-semibold text-ink"
                    : "border-line text-muted hover:border-gold/50 hover:text-champagne"
                }`}
              >
                <input
                  type="radio"
                  name="pdp-size"
                  value={s.label}
                  checked={selected}
                  onChange={() => setSizeIdx(i)}
                  className="sr-only"
                />
                {s.label} · {formatINR(product.price + s.priceDelta)}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* engraving */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-4">
          <label
            htmlFor="pdp-engraving"
            className="text-[0.65rem] uppercase tracking-[0.3em] text-muted"
          >
            Engraving <span className="normal-case tracking-normal text-gold">(included free)</span>
          </label>
          <span className="text-[0.65rem] tabular-nums text-muted" aria-hidden="true">
            {engraving.length}/60
          </span>
        </div>
        <input
          id="pdp-engraving"
          type="text"
          maxLength={60}
          value={engraving}
          onChange={(e) => setEngraving(e.target.value)}
          placeholder='e.g. "Champion 2026 — Annual Sports Day"'
          aria-describedby="pdp-engraving-note"
          className="mt-3 w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-ivory placeholder:text-muted/50 transition-colors duration-300 focus:border-gold/60"
        />
        <p id="pdp-engraving-note" className="mt-2 text-xs text-muted">
          Up to 60 characters. Logo? Share it on WhatsApp after ordering.
        </p>
      </div>

      {/* quantity */}
      <div className="mt-6">
        <label
          htmlFor="pdp-qty"
          className="text-[0.65rem] uppercase tracking-[0.3em] text-muted"
        >
          Quantity
        </label>
        <div className="mt-3 inline-flex items-center overflow-hidden rounded-full border border-line bg-ink-2">
          <button
            type="button"
            onClick={() => setQty(qty - 1)}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="grid h-11 w-11 place-items-center text-lg text-muted transition-colors duration-300 hover:text-gold disabled:opacity-30 cursor-pointer"
          >
            −
          </button>
          <input
            id="pdp-qty"
            type="text"
            inputMode="numeric"
            value={qtyText}
            onChange={(e) => setQtyText(e.target.value.replace(/\D/g, "").slice(0, 3))}
            onBlur={() => setQtyText(String(qty))}
            aria-label="Quantity (1 to 500)"
            className="h-11 w-14 bg-transparent text-center text-sm font-semibold tabular-nums text-ivory"
          />
          <button
            type="button"
            onClick={() => setQty(qty + 1)}
            disabled={qty >= MAX_QTY}
            aria-label="Increase quantity"
            className="grid h-11 w-11 place-items-center text-lg text-muted transition-colors duration-300 hover:text-gold disabled:opacity-30 cursor-pointer"
          >
            +
          </button>
        </div>
      </div>

      {/* bulk pricing — always visible, active tier follows qty */}
      <div className="mt-8 rounded-2xl border border-line bg-ink-2/60 p-5">
        <h2 className="text-[0.65rem] uppercase tracking-[0.3em] text-gold/80">Bulk pricing</h2>
        <table className="mt-3 w-full border-collapse text-sm">
          <caption className="sr-only">
            Per-piece price by order quantity for {product.name}
          </caption>
          <thead>
            <tr className="text-[0.6rem] uppercase tracking-[0.2em] text-muted/80">
              <th scope="col" className="pb-2 text-left font-medium">
                Quantity
              </th>
              <th scope="col" className="pb-2 text-right font-medium">
                Per piece
              </th>
              <th scope="col" className="pb-2 text-right font-medium">
                You save
              </th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t) => {
              const isActive = t.off === activeOff;
              return (
                <tr
                  key={t.label}
                  className={`border-t border-line/60 transition-colors duration-300 ${
                    isActive ? "bg-gold/[0.07] text-gold-bright" : "text-muted"
                  }`}
                >
                  <td className="py-2.5 pl-2">
                    {t.label}
                    {isActive && (
                      <span className="ml-2 rounded-full border border-gold/40 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.15em] text-gold">
                        Your tier
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right tabular-nums">
                    {formatINR(unitPriceFor(unit, t.min))}
                  </td>
                  <td className="py-2.5 pr-2 text-right tabular-nums">
                    {t.off > 0 ? `${Math.round(t.off * 100)}%` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p aria-live="polite" className="mt-4 border-t border-line/60 pt-4 text-sm text-muted">
          Your price:{" "}
          <span className="font-semibold text-champagne">{formatINR(effUnit)}/pc</span> × {qty} ={" "}
          <span className="font-semibold text-gold-bright">{formatINR(effUnit * qty)}</span>
        </p>
      </div>

      {/* made to order */}
      {!product.inStock && (
        <p className="mt-6 rounded-xl border border-gold-bright/30 bg-gold-bright/[0.06] px-4 py-3 text-sm text-gold-bright">
          Made to order — crafted and dispatched in 7–10 days. Order now to reserve your
          production slot.
        </p>
      )}

      {/* actions */}
      <div className="mt-6 flex flex-wrap items-stretch gap-3">
        <Button
          size="lg"
          variant="gold"
          onClick={handleAdd}
          aria-label={`Add ${product.name} to cart`}
          className="min-w-0 flex-1"
        >
          Add to Cart
        </Button>
        <Button
          size="lg"
          variant="whatsapp"
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Order ${product.name} on WhatsApp`}
          className="min-w-0 flex-1"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.42-9.43a9.36 9.36 0 0 1 6.66 2.76 9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.23 9.43-9.43 9.43zm8.02-17.44A11.3 11.3 0 0 0 12.03.75C5.8.75.73 5.82.73 12.06c0 1.99.52 3.93 1.51 5.64L.65 23.25l5.68-1.49a11.27 11.27 0 0 0 5.7 1.55h.01c6.23 0 11.3-5.07 11.3-11.3 0-3.02-1.17-5.86-3.28-8z" />
          </svg>
          Order on WhatsApp
        </Button>
        <button
          type="button"
          onClick={() => toggleWishlist(product.slug, product.name)}
          aria-pressed={wished}
          aria-label={
            wished
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          className={`grid h-[3.25rem] w-[3.25rem] shrink-0 place-items-center self-center rounded-full border transition-colors duration-300 cursor-pointer ${
            wished
              ? "border-gold bg-gold text-ink"
              : "border-line bg-ink-2 text-ivory hover:border-gold/60 hover:text-gold"
          }`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={wished ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      <p className="mt-4 text-sm text-muted">
        <a
          href={telLink()}
          className="transition-colors duration-300 hover:text-ivory"
          aria-label={`Call The Grace on ${site.phonePretty()}`}
        >
          or call <span className="text-champagne">{site.phonePretty()}</span>
        </a>
      </p>
    </div>
  );
}
