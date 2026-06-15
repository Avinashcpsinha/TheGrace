"use client";

/**
 * /cart — line items with qty steppers, bulk pricing per piece, and a
 * sticky totals rail. WhatsApp ordering is first-class beside Checkout.
 * Renders nothing until the store hydrates (no flash of an empty cart).
 */
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/store";
import { bulkDiscountRate, unitPriceFor } from "@/lib/pricing";
import { formatINR, clamp } from "@/lib/format";
import { cartWhatsAppLink } from "@/lib/order-links";
import { Button } from "@/components/ui/Button";

const MAX_QTY = 500;

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.42-9.43a9.36 9.36 0 0 1 6.66 2.76 9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.23 9.43-9.43 9.43zm8.02-17.44A11.3 11.3 0 0 0 12.03.75C5.8.75.73 5.82.73 12.06c0 1.99.52 3.93 1.51 5.64L.65 23.25l5.68-1.49a11.27 11.27 0 0 0 5.7 1.55h.01c6.23 0 11.3-5.07 11.3-11.3 0-3.02-1.17-5.86-3.28-8z" />
    </svg>
  );
}

function EmptyCart() {
  return (
    <div className="mx-auto max-w-xl py-20 text-center">
      <p
        aria-hidden="true"
        className="mx-auto mb-8 grid h-16 w-16 place-items-center rounded-full border border-gold/30 text-2xl text-gold"
      >
        🏆
      </p>
      <h2 className="font-display text-4xl leading-tight text-ivory [text-wrap:balance] md:text-5xl">
        Your cart awaits its first trophy.
      </h2>
      <p className="mt-4 text-base leading-relaxed text-muted">
        Every great ceremony begins with one piece. Browse the collection — we craft, engrave and
        deliver PAN-India.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button href="/products" size="lg">
          Browse all products
        </Button>
        <Button href="/premium" variant="outline" size="lg">
          Explore premium
        </Button>
      </div>
    </div>
  );
}

export function CartView() {
  const { cart, totals, removeFromCart, setQty, hydrated } = useCart();

  // Quiet until hydrated — avoids a flash of the empty state.
  if (!hydrated) return <div className="min-h-[40vh]" aria-hidden="true" />;
  if (cart.length === 0) return <EmptyCart />;

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      {/* line items */}
      <ul className="divide-y divide-line/70 border-y border-line/70" aria-label="Cart items">
        {cart.map((it) => {
          const rate = bulkDiscountRate(it.qty);
          const perPc = unitPriceFor(it.unitPrice, it.qty);
          return (
            <li key={`${it.slug}__${it.size}`} className="flex gap-4 py-6 sm:gap-6">
              {/* thumb */}
              <Link
                href={`/product/${it.slug}`}
                className="photo-well relative block h-16 w-16 shrink-0 overflow-hidden rounded-xl"
                aria-label={`View ${it.name}`}
                tabIndex={-1}
              >
                <Image
                  src={it.image}
                  alt={it.name}
                  width={64}
                  height={64}
                  className="h-16 w-16 object-contain p-1.5"
                />
              </Link>

              {/* details */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
                  <div className="min-w-0">
                    <Link
                      href={`/product/${it.slug}`}
                      className="font-display text-lg leading-snug text-ivory transition-colors hover:text-champagne"
                    >
                      {it.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted">
                      {it.sku}
                      {it.size && it.size !== "Standard" ? ` · Size: ${it.size}` : ""}
                    </p>
                    {it.engraving && (
                      <p className="mt-1 text-xs italic text-muted">Engraving: “{it.engraving}”</p>
                    )}
                    {it.logoNote && <p className="mt-0.5 text-xs italic text-muted">{it.logoNote}</p>}
                  </div>

                  {/* pricing */}
                  <div className="text-right">
                    <p className="font-semibold text-champagne">{formatINR(perPc * it.qty)}</p>
                    {rate > 0 ? (
                      <p className="mt-0.5 text-xs text-gold">
                        {formatINR(perPc)}/pc · bulk −{Math.round(rate * 100)}%
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-muted">{formatINR(it.unitPrice)}/pc</p>
                    )}
                  </div>
                </div>

                {/* qty + remove */}
                <div className="mt-4 flex items-center gap-4">
                  <div className="inline-flex items-center rounded-full border border-line bg-ink-3">
                    <button
                      type="button"
                      onClick={() => setQty(it.slug, it.size, it.qty - 1)}
                      disabled={it.qty <= 1}
                      aria-label={`Decrease quantity of ${it.name}`}
                      className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:text-champagne disabled:opacity-30 cursor-pointer"
                    >
                      −
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={it.qty}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!Number.isNaN(v)) setQty(it.slug, it.size, clamp(v, 1, MAX_QTY));
                      }}
                      aria-label={`Quantity of ${it.name}`}
                      className="w-10 bg-transparent text-center text-sm text-ivory focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQty(it.slug, it.size, Math.min(it.qty + 1, MAX_QTY))}
                      disabled={it.qty >= MAX_QTY}
                      aria-label={`Increase quantity of ${it.name}`}
                      className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:text-champagne disabled:opacity-30 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(it.slug, it.size)}
                    aria-label={`Remove ${it.name} from cart`}
                    className="text-xs uppercase tracking-[0.18em] text-muted transition-colors hover:text-danger cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* totals rail */}
      <aside
        className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]"
        aria-label="Order summary"
      >
        <div className="card-surface rounded-2xl p-6">
          <h2 className="font-display text-2xl text-ivory">Order summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-baseline justify-between">
              <dt className="text-muted">
                Subtotal · {totals.itemCount} pc{totals.itemCount === 1 ? "" : "s"}
              </dt>
              <dd className="text-ivory">{formatINR(totals.subtotal)}</dd>
            </div>
            {totals.bulkDiscount > 0 && (
              <div className="flex items-baseline justify-between text-gold">
                <dt>Bulk savings</dt>
                <dd>−{formatINR(totals.bulkDiscount)}</dd>
              </div>
            )}
            <div className="gold-rule" aria-hidden="true" />
            <div className="flex items-baseline justify-between">
              <dt className="text-ivory">Total</dt>
              <dd className="font-display text-3xl text-champagne">{formatINR(totals.total)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted">GST invoice available at checkout.</p>

          <div className="mt-6 flex flex-col gap-3">
            <Button href="/checkout" size="lg" className="w-full">
              Checkout
            </Button>
            <Button
              href={cartWhatsAppLink(cart)}
              variant="whatsapp"
              size="lg"
              className="w-full"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Order this cart on WhatsApp"
            >
              <WhatsAppIcon />
              Order on WhatsApp
            </Button>
            <Button href="/products" variant="ghost" className="w-full">
              Continue shopping
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
