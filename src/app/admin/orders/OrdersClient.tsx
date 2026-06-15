"use client";

/**
 * Orders manager — dense table (desktop) / cards (mobile) with status
 * filter chips, id/name/phone search, per-row status select (optimistic
 * PATCH to /api/admin/orders/[id]) and an expandable full-detail panel
 * (items + engraving, address, GSTIN, notes, timeline).
 */
import Image from "next/image";
import { Fragment, useMemo, useState } from "react";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";
import { formatDate, formatINR } from "@/lib/format";
import { toast } from "@/lib/events";

const STATUSES: OrderStatus[] = [
  "new",
  "confirmed",
  "in_production",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  in_production: "In production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  cod: "COD",
  failed: "Failed",
};

const PAYMENT_CHIP: Record<PaymentStatus, string> = {
  pending: "border-line bg-white/5 text-muted",
  paid: "border-success/40 bg-success/10 text-success",
  cod: "border-gold/40 bg-gold/10 text-gold-bright",
  failed: "border-danger/40 bg-danger/10 text-danger",
};

const METHOD_LABEL: Record<Order["paymentMethod"], string> = {
  razorpay: "Razorpay",
  cod: "Cash on delivery",
  whatsapp: "WhatsApp",
};

function itemsSummary(o: Order): string {
  const first = o.items[0];
  if (!first) return "—";
  const more = o.items.length - 1;
  return `${first.qty} × ${first.name}${more > 0 ? ` +${more} more` : ""}`;
}

/** Only rendered after a client-side expand, so locale time is safe. */
function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function PaymentChip({ order }: { order: Order }) {
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span
        className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${PAYMENT_CHIP[order.paymentStatus]}`}
      >
        {PAYMENT_LABEL[order.paymentStatus]}
      </span>
      <span className="text-[10px] text-muted">{METHOD_LABEL[order.paymentMethod]}</span>
    </span>
  );
}

function StatusSelect({
  order,
  saving,
  onChange,
}: {
  order: Order;
  saving: boolean;
  onChange: (status: OrderStatus) => void;
}) {
  return (
    <select
      value={order.status}
      disabled={saving}
      aria-label={`Status for order ${order.id}`}
      aria-busy={saving}
      onChange={(e) => onChange(e.target.value as OrderStatus)}
      className="rounded-md border border-line bg-ink px-2 py-1.5 text-xs text-ivory transition-colors duration-200 focus:border-gold focus:outline-none disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

function OrderDetail({ order }: { order: Order }) {
  const c = order.customer;
  const addressLines = [c.address, [c.city, c.state, c.pincode].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="grid gap-6 text-sm lg:grid-cols-3">
      {/* Items */}
      <div className="lg:col-span-2">
        <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted">Items</h3>
        <ul className="mt-2 flex flex-col gap-2">
          {order.items.map((it, i) => (
            <li
              key={`${it.slug}-${it.size}-${i}`}
              className="flex items-start gap-3 rounded-lg border border-line/60 bg-ink px-3 py-2.5"
            >
              {it.image ? (
                <Image
                  src={it.image}
                  alt={it.name}
                  width={44}
                  height={44}
                  className="photo-well size-11 shrink-0 rounded-md object-cover"
                />
              ) : (
                <span className="photo-well size-11 shrink-0 rounded-md" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ivory">{it.name}</p>
                <p className="text-xs text-muted">
                  {it.sku}
                  {it.size && it.size !== "Standard" ? ` · ${it.size}` : ""} · Qty {it.qty} ·{" "}
                  {formatINR(it.unitPrice)}/pc
                </p>
                {it.engraving && (
                  <p className="mt-1 text-xs text-champagne">
                    Engraving: <span className="italic">&ldquo;{it.engraving}&rdquo;</span>
                  </p>
                )}
                {it.logoNote && <p className="mt-0.5 text-xs text-muted">Logo: {it.logoNote}</p>}
              </div>
              <p className="shrink-0 tabular-nums text-ivory">
                {formatINR(it.unitPrice * it.qty)}
              </p>
            </li>
          ))}
        </ul>
        <dl className="mt-3 ml-auto flex max-w-xs flex-col gap-1 text-xs">
          <div className="flex justify-between gap-6">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums text-ivory">{formatINR(order.subtotal)}</dd>
          </div>
          {order.bulkDiscount > 0 && (
            <div className="flex justify-between gap-6">
              <dt className="text-muted">Bulk discount</dt>
              <dd className="tabular-nums text-success">−{formatINR(order.bulkDiscount)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-6 border-t border-line pt-1 text-sm font-medium">
            <dt className="text-ivory">Total</dt>
            <dd className="tabular-nums text-champagne">{formatINR(order.total)}</dd>
          </div>
        </dl>
      </div>

      {/* Customer + timeline */}
      <div className="flex flex-col gap-5">
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted">Customer</h3>
          <p className="mt-2 font-medium text-ivory">{c.name}</p>
          <p className="text-xs text-muted">
            <a href={`tel:${c.phone}`} className="hover:text-champagne">
              {c.phone}
            </a>
            {c.email && (
              <>
                {" · "}
                <a href={`mailto:${c.email}`} className="hover:text-champagne">
                  {c.email}
                </a>
              </>
            )}
          </p>
          {addressLines && (
            <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-muted">
              {addressLines}
            </p>
          )}
          {c.gstin && <p className="mt-2 text-xs text-muted">GSTIN: {c.gstin}</p>}
          {c.notes && (
            <p className="mt-2 rounded-md border border-gold/20 bg-gold/5 px-2.5 py-2 text-xs text-champagne">
              Note: {c.notes}
            </p>
          )}
          {order.razorpayPaymentId && (
            <p className="mt-2 break-all text-[11px] text-muted">
              Razorpay payment: {order.razorpayPaymentId}
            </p>
          )}
        </div>

        <div>
          <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted">Timeline</h3>
          <ol className="mt-2 flex flex-col gap-1.5">
            {order.timeline.map((ev, i) => (
              <li key={`${ev.at}-${i}`} className="flex items-baseline gap-2 text-xs">
                <span
                  className={`mt-0.5 size-1.5 shrink-0 rounded-full ${
                    i === order.timeline.length - 1 ? "bg-gold" : "bg-line"
                  }`}
                  aria-hidden="true"
                />
                <span className="text-ivory">{ev.label}</span>
                <span className="ml-auto shrink-0 text-muted">{fmtDateTime(ev.at)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export function OrdersClient({
  initialOrders,
  initialQuery = "",
}: {
  initialOrders: Order[];
  initialQuery?: string;
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [query, setQuery] = useState(initialQuery);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const s of STATUSES) c[s] = 0;
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter(
      (o) =>
        (filter === "all" || o.status === filter) &&
        (!q ||
          o.id.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.phone.toLowerCase().includes(q))
    );
  }, [orders, filter, query]);

  async function setStatus(id: string, status: OrderStatus) {
    const previous = orders;
    setSavingId(id);
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { order: Order };
      // replace with the server copy so the timeline stays in sync
      setOrders((os) => os.map((o) => (o.id === id ? data.order : o)));
      toast(`Order ${id} → ${STATUS_LABEL[status]}`);
    } catch {
      setOrders(previous);
      toast(`Couldn't update ${id} — please try again`);
    } finally {
      setSavingId(null);
    }
  }

  const toggleExpand = (id: string) => setExpanded((cur) => (cur === id ? null : id));

  return (
    <div className="mt-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter orders by status">
          {(["all", ...STATUSES] as const).map((s) => {
            const active = filter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors duration-200 ${
                  active
                    ? "border-gold/60 bg-gold/15 font-medium text-champagne"
                    : "border-line text-muted hover:border-gold/30 hover:text-ivory"
                }`}
              >
                {s === "all" ? "All" : STATUS_LABEL[s]}
                <span className="ml-1.5 tabular-nums opacity-70">{counts[s] ?? 0}</span>
              </button>
            );
          })}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search id, name or phone…"
          aria-label="Search orders by id, customer name or phone"
          className="w-full rounded-lg border border-line bg-ink-2 px-3.5 py-2 text-sm text-ivory placeholder:text-muted/60 transition-colors duration-200 focus:border-gold focus:outline-none lg:w-72"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-4 rounded-xl border border-line bg-ink-2 px-4 py-10 text-center text-sm text-muted">
          No orders match{query.trim() ? ` “${query.trim()}”` : " this filter"}.
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card-surface mt-4 hidden overflow-hidden rounded-xl lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-[0.12em] text-muted">
                  <th scope="col" className="px-4 py-3 font-medium">Order</th>
                  <th scope="col" className="px-4 py-3 font-medium">Date</th>
                  <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                  <th scope="col" className="px-4 py-3 font-medium">Items</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Total</th>
                  <th scope="col" className="px-4 py-3 font-medium">Payment</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-2 py-3">
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const open = expanded === o.id;
                  return (
                    <Fragment key={o.id}>
                      <tr className="border-b border-line/60 last:border-b-0">
                        <td className="px-4 py-3 font-medium tabular-nums text-champagne">
                          {o.id}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted">
                          {formatDate(o.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-ivory">{o.customer.name}</p>
                          <p className="text-xs text-muted">{o.customer.phone}</p>
                        </td>
                        <td className="max-w-[15rem] truncate px-4 py-3 text-muted">
                          {itemsSummary(o)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-ivory">
                          {formatINR(o.total)}
                        </td>
                        <td className="px-4 py-3">
                          <PaymentChip order={o} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusSelect
                            order={o}
                            saving={savingId === o.id}
                            onChange={(s) => setStatus(o.id, s)}
                          />
                        </td>
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            onClick={() => toggleExpand(o.id)}
                            aria-expanded={open}
                            aria-controls={`order-detail-${o.id}`}
                            aria-label={`${open ? "Hide" : "Show"} details for order ${o.id}`}
                            className="grid size-8 place-items-center rounded-full text-muted transition-colors duration-200 hover:bg-white/5 hover:text-ivory"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              aria-hidden="true"
                              className={`transition-transform duration-300 ease-[var(--ease-lux)] ${open ? "rotate-180" : ""}`}
                            >
                              <path
                                d="M2 4l4 4 4-4"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                      {open && (
                        <tr id={`order-detail-${o.id}`} className="border-b border-line/60">
                          <td colSpan={8} className="bg-ink-2/60 px-5 py-5">
                            <OrderDetail order={o} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="mt-4 flex flex-col gap-2 lg:hidden">
            {filtered.map((o) => {
              const open = expanded === o.id;
              return (
                <li key={o.id} className="card-surface rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium tabular-nums text-champagne">{o.id}</span>
                    <span className="text-xs text-muted">{formatDate(o.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-ivory">
                    {o.customer.name}
                    <span className="ml-2 text-xs text-muted">{o.customer.phone}</span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">{itemsSummary(o)}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                    <span className="text-sm font-medium tabular-nums text-ivory">
                      {formatINR(o.total)}
                    </span>
                    <PaymentChip order={o} />
                    <StatusSelect
                      order={o}
                      saving={savingId === o.id}
                      onChange={(s) => setStatus(o.id, s)}
                    />
                    <button
                      type="button"
                      onClick={() => toggleExpand(o.id)}
                      aria-expanded={open}
                      aria-controls={`order-card-detail-${o.id}`}
                      className="ml-auto rounded-full border border-line px-3 py-1.5 text-xs text-muted transition-colors duration-200 hover:border-gold/30 hover:text-ivory"
                    >
                      {open ? "Hide details" : "Details"}
                    </button>
                  </div>
                  {open && (
                    <div
                      id={`order-card-detail-${o.id}`}
                      className="mt-3 border-t border-line pt-3"
                    >
                      <OrderDetail order={o} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
