import type { Metadata } from "next";
import { getOrder } from "@/lib/orders";
import { site } from "@/config/site";
import { waLink } from "@/lib/order-links";
import { Button } from "@/components/ui/Button";
import { OrderDetails } from "@/components/commerce/OrderDetails";
import { CopyOrderId } from "@/components/commerce/CopyOrderId";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmedPage({ params }: PageProps) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    return (
      <section className="spotlight">
        <div className="mx-auto max-w-xl px-6 pb-28 pt-[calc(var(--header-h)+5rem)] text-center">
          <h1 className="font-display text-4xl text-ivory [text-wrap:balance] md:text-5xl">
            We couldn&rsquo;t find order{" "}
            <span className="gold-text">{id}</span>
          </h1>
          <p className="mt-5 leading-relaxed text-muted">
            The link may be incomplete, or the order was placed on another device. Try tracking
            it by ID, or message us and we&rsquo;ll look it up right away.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button href="/track-order">Track an order</Button>
            <Button
              href={waLink(`Hi The Grace! I'd like to check on my order ${id}.`)}
              variant="whatsapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span aria-hidden="true">💬</span> WhatsApp us
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const waMessage = [
    `Hi The Grace! I've just placed order ${order.id}.`,
    ``,
    ...order.items.map(
      (it) =>
        `🏆 ${it.name} × ${it.qty}` +
        (it.size && it.size !== "Standard" ? ` — ${it.size}` : "")
    ),
    ``,
    `I'd like to confirm the details.`,
  ].join("\n");

  return (
    <section className="spotlight">
      <div className="mx-auto max-w-5xl px-6 pb-28 pt-[calc(var(--header-h)+3.5rem)]">
        {/* Success hero */}
        <div className="text-center">
          <span
            aria-hidden="true"
            className="mx-auto grid size-16 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold shadow-[var(--shadow-gold)]"
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <p className="mt-6 text-[0.7rem] font-medium uppercase tracking-[0.35em] text-gold/90">
            Thank you, {order.customer.name.split(" ")[0]}
          </p>
          <h1 className="mt-3 font-display text-5xl leading-[1.04] text-ivory [text-wrap:balance] md:text-6xl">
            Your order is placed
          </h1>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted">
            {order.paymentMethod === "razorpay" && order.paymentStatus === "paid"
              ? "Payment received. "
              : order.paymentMethod === "cod"
                ? "You'll pay on delivery. "
                : "We'll confirm the details with you shortly. "}
            A copy of everything is below — keep your order ID handy.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <span className="font-display text-2xl tabular-nums text-champagne">{order.id}</span>
            <CopyOrderId id={order.id} />
          </div>
        </div>

        <div className="gold-rule mx-auto my-12 w-32" aria-hidden="true" />

        <OrderDetails order={order} />

        {/* next steps */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Button href={`/track-order?id=${encodeURIComponent(order.id)}`} variant="outline">
            Track this order
          </Button>
          <Button
            href={waLink(waMessage)}
            variant="whatsapp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span aria-hidden="true">💬</span> Message us on WhatsApp
          </Button>
          <Button href="/products" variant="ghost">
            Continue shopping →
          </Button>
        </div>

        <p className="mt-8 text-center text-xs text-muted">
          Questions? Call {site.phonePretty()} · Mon–Sat 10:00–19:00 IST
        </p>
      </div>
    </section>
  );
}
