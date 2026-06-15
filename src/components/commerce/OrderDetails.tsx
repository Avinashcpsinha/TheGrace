/**
 * OrderDetails — server component shared by /order/confirmed/[id] and
 * /track-order. Renders the full picture of an order: a status timeline, the
 * line items with engraving, the totals, the shipping address and the payment
 * state. Pure presentation; pass it an Order.
 *
 * Dates are formatted in Asia/Kolkata so the server output is stable
 * regardless of the host timezone (these pages are RSC — no client hydration
 * of these nodes — so locale formatting here is safe).
 */
import Image from "next/image";
import type { Order, OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/types";
import { formatINR } from "@/lib/format";

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Order placed",
  confirmed: "Order confirmed",
  in_production: "In production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Customer-facing progress track (cancelled handled separately). */
const PIPELINE: OrderStatus[] = ["new", "confirmed", "in_production", "shipped", "delivered"];

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: "Payment pending",
  paid: "Paid",
  cod: "Cash on Delivery",
  failed: "Payment failed",
};

const METHOD_LABEL: Record<PaymentMethod, string> = {
  razorpay: "Online (Razorpay)",
  cod: "Cash on Delivery",
  whatsapp: "WhatsApp",
};

const dateTime = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

export function OrderDetails({ order }: { order: Order }) {
  const cancelled = order.status === "cancelled";
  const reachedIdx = PIPELINE.indexOf(order.status);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      {/* Left: items + totals */}
      <div className="space-y-8">
        <section aria-label="Items in this order">
          <h2 className="text-[0.7rem] uppercase tracking-[0.3em] text-gold/80">Items</h2>
          <ul className="mt-4 space-y-3">
            {order.items.map((it, i) => (
              <li
                key={`${it.slug}-${it.size}-${i}`}
                className="flex items-start gap-4 rounded-xl border border-line bg-ink-2/60 p-4"
              >
                <span className="photo-well relative block h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                  {it.image ? (
                    <Image
                      src={it.image}
                      alt={it.name}
                      width={64}
                      height={64}
                      className="h-16 w-16 object-contain p-1.5"
                    />
                  ) : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg leading-tight text-ivory">{it.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {it.sku}
                    {it.size && it.size !== "Standard" ? ` · ${it.size}` : ""} · Qty {it.qty}
                  </p>
                  {it.engraving && (
                    <p className="mt-1 text-xs text-champagne">
                      Engraving: <span className="italic">&ldquo;{it.engraving}&rdquo;</span>
                    </p>
                  )}
                  {it.logoNote && <p className="mt-0.5 text-xs text-muted">{it.logoNote}</p>}
                </div>
                <p className="shrink-0 tabular-nums text-sm text-champagne">
                  {formatINR(it.unitPrice * it.qty)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-5 ml-auto flex max-w-xs flex-col gap-2 text-sm">
            <div className="flex justify-between gap-6">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums text-ivory">{formatINR(order.subtotal)}</dd>
            </div>
            {order.bulkDiscount > 0 && (
              <div className="flex justify-between gap-6 text-gold">
                <dt>Bulk savings</dt>
                <dd className="tabular-nums">−{formatINR(order.bulkDiscount)}</dd>
              </div>
            )}
            <div className="gold-rule my-1" aria-hidden="true" />
            <div className="flex items-baseline justify-between gap-6">
              <dt className="text-ivory">Total</dt>
              <dd className="font-display text-2xl tabular-nums text-champagne">
                {formatINR(order.total)}
              </dd>
            </div>
          </dl>
        </section>

        {/* Shipping + payment */}
        <section aria-label="Delivery and payment" className="grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-[0.7rem] uppercase tracking-[0.3em] text-gold/80">Deliver to</h2>
            <p className="mt-3 text-sm text-ivory">{order.customer.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {order.customer.address}
              {order.customer.address ? <br /> : null}
              {[order.customer.city, order.customer.state, order.customer.pincode]
                .filter(Boolean)
                .join(", ")}
            </p>
            <p className="mt-2 text-sm text-muted">{order.customer.phone}</p>
            {order.customer.gstin && (
              <p className="mt-1 text-xs text-muted">GSTIN: {order.customer.gstin}</p>
            )}
          </div>
          <div>
            <h2 className="text-[0.7rem] uppercase tracking-[0.3em] text-gold/80">Payment</h2>
            <p className="mt-3 text-sm text-ivory">{METHOD_LABEL[order.paymentMethod]}</p>
            <p className="mt-1 text-sm text-muted">{PAYMENT_LABEL[order.paymentStatus]}</p>
            {order.customer.notes && (
              <p className="mt-3 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2 text-xs text-champagne">
                Note: {order.customer.notes}
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Right: status timeline */}
      <aside aria-label="Order status" className="card-surface rounded-2xl p-6">
        <h2 className="text-[0.7rem] uppercase tracking-[0.3em] text-gold/80">Status</h2>
        <p
          className={`mt-2 font-display text-2xl ${cancelled ? "text-danger" : "text-ivory"}`}
        >
          {STATUS_LABEL[order.status]}
        </p>

        {cancelled ? (
          <p className="mt-4 text-sm leading-relaxed text-muted">
            This order was cancelled. If that&rsquo;s unexpected, message us on WhatsApp and
            we&rsquo;ll sort it out.
          </p>
        ) : (
          <ol className="mt-6 space-y-0">
            {PIPELINE.map((step, i) => {
              const done = i <= reachedIdx;
              const current = i === reachedIdx;
              const last = i === PIPELINE.length - 1;
              return (
                <li key={step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                        done ? "border-gold bg-gold/20" : "border-line bg-ink"
                      }`}
                      aria-hidden="true"
                    >
                      {done && (
                        <span
                          className={`size-2 rounded-full ${current ? "bg-gold-bright" : "bg-gold"}`}
                        />
                      )}
                    </span>
                    {!last && (
                      <span
                        className={`my-1 w-px flex-1 ${i < reachedIdx ? "bg-gold/50" : "bg-line"}`}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className={`pb-6 ${last ? "pb-0" : ""}`}>
                    <p className={`text-sm ${done ? "text-ivory" : "text-muted"}`}>
                      {STATUS_LABEL[step]}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {/* full event log */}
        <div className="mt-2 border-t border-line pt-4">
          <h3 className="text-[0.65rem] uppercase tracking-[0.24em] text-muted">History</h3>
          <ol className="mt-3 space-y-2">
            {order.timeline.map((ev, i) => (
              <li key={`${ev.at}-${i}`} className="flex items-baseline justify-between gap-3 text-xs">
                <span className="text-ivory">{ev.label}</span>
                <span className="shrink-0 text-muted">{dateTime.format(new Date(ev.at))}</span>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}
