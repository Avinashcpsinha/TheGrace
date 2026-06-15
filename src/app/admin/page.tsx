import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { listOrders } from "@/lib/orders";
import { readCollection } from "@/lib/db";
import { getAllProducts } from "@/lib/catalog";
import { formatDate, formatINR } from "@/lib/format";
import type { CustomRequest, Order, OrderStatus, PaymentStatus } from "@/lib/types";

export const metadata = { title: "Dashboard" };

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  in_production: "In production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_CHIP: Record<OrderStatus, string> = {
  new: "border-gold/40 bg-gold/10 text-gold-bright",
  confirmed: "border-champagne/30 bg-champagne/10 text-champagne",
  in_production: "border-gold/30 bg-white/5 text-ivory",
  shipped: "border-line bg-white/5 text-ivory",
  delivered: "border-success/40 bg-success/10 text-success",
  cancelled: "border-danger/40 bg-danger/10 text-danger",
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

function itemsSummary(o: Order): string {
  const first = o.items[0];
  if (!first) return "—";
  const more = o.items.length - 1;
  return `${first.qty} × ${first.name}${more > 0 ? ` +${more} more` : ""}`;
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card-surface rounded-xl px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-ivory">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  if (!(await requireAdmin())) redirect("/admin/login");

  const [orders, requests, products] = await Promise.all([
    listOrders(),
    readCollection<CustomRequest[]>("custom-requests", []),
    getAllProducts({ includeHidden: true }),
  ]);

  const now = Date.now();
  const revenue = orders
    .filter((o) => o.paymentStatus === "paid" || o.paymentStatus === "cod")
    .reduce((sum, o) => sum + o.total, 0);
  const ordersThisWeek = orders.filter(
    (o) => now - new Date(o.createdAt).getTime() < WEEK_MS
  ).length;
  const newRequests = requests.filter((r) => r.status === "new").length;
  const liveProducts = products.filter((p) => !p.hidden).length;
  const outOfStock = products.filter((p) => !p.hidden && !p.inStock).length;
  const recent = orders.slice(0, 8);

  return (
    <div>
      <h1 className="text-xl font-semibold text-ivory">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">
        Everything happening across the shop at a glance.
      </p>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total orders" value={String(orders.length)} />
        <StatCard label="Revenue" value={formatINR(revenue)} hint="Paid + COD orders" />
        <StatCard label="Orders this week" value={String(ordersThisWeek)} />
        <StatCard label="New custom requests" value={String(newRequests)} />
        <StatCard label="Products live" value={String(liveProducts)} />
        <StatCard label="Out of stock" value={String(outOfStock)} />
      </div>

      {/* Quick links */}
      <nav aria-label="Quick links" className="mt-6 flex flex-wrap gap-2">
        {[
          { href: "/admin/orders", label: "Manage orders" },
          { href: "/admin/products", label: "Edit products" },
          { href: "/admin/requests", label: "Customization requests" },
          { href: "/", label: "Open storefront" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full border border-line px-4 py-2 text-xs text-muted transition-colors duration-200 hover:border-gold/40 hover:text-champagne"
          >
            {l.label}
          </Link>
        ))}
      </nav>

      {/* Recent orders */}
      <section className="mt-8" aria-labelledby="recent-orders-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="recent-orders-heading" className="text-sm font-semibold text-ivory">
            Recent orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-xs text-gold-bright underline-offset-4 hover:underline"
          >
            View all orders →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="mt-4 rounded-xl border border-line bg-ink-2 px-4 py-8 text-center text-sm text-muted">
            No orders yet — they&rsquo;ll appear here as soon as checkout or WhatsApp orders
            come in.
          </p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="card-surface mt-3 hidden overflow-hidden rounded-xl md:block">
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
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id} className="border-b border-line/60 last:border-b-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders?q=${encodeURIComponent(o.id)}`}
                          className="font-medium tabular-nums text-champagne underline-offset-4 hover:underline"
                          aria-label={`Open order ${o.id} in the orders manager`}
                        >
                          {o.id}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">
                        {formatDate(o.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-ivory">{o.customer.name}</td>
                      <td className="max-w-[16rem] truncate px-4 py-3 text-muted">
                        {itemsSummary(o)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-ivory">
                        {formatINR(o.total)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${PAYMENT_CHIP[o.paymentStatus]}`}
                        >
                          {PAYMENT_LABEL[o.paymentStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_CHIP[o.status]}`}
                        >
                          {STATUS_LABEL[o.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="mt-3 flex flex-col gap-2 md:hidden">
              {recent.map((o) => (
                <li key={o.id} className="card-surface rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/admin/orders?q=${encodeURIComponent(o.id)}`}
                      className="font-medium tabular-nums text-champagne underline-offset-4 hover:underline"
                      aria-label={`Open order ${o.id} in the orders manager`}
                    >
                      {o.id}
                    </Link>
                    <span className="text-xs text-muted">{formatDate(o.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-ivory">{o.customer.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">{itemsSummary(o)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium tabular-nums text-ivory">
                      {formatINR(o.total)}
                    </span>
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${PAYMENT_CHIP[o.paymentStatus]}`}
                    >
                      {PAYMENT_LABEL[o.paymentStatus]}
                    </span>
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_CHIP[o.status]}`}
                    >
                      {STATUS_LABEL[o.status]}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
