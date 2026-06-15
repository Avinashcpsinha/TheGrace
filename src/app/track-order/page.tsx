import type { Metadata } from "next";
import { getOrder } from "@/lib/orders";
import { waLink } from "@/lib/order-links";
import { site } from "@/config/site";
import { Button } from "@/components/ui/Button";
import { OrderDetails } from "@/components/commerce/OrderDetails";
import { TrackOrderForm } from "@/components/commerce/TrackOrderForm";

export const metadata: Metadata = {
  title: "Track Order",
  description:
    "Track your trophy or awards order from The Grace — enter your order ID to see live production and delivery status.",
  robots: { index: false, follow: true },
};

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function TrackOrderPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  const lookupId = typeof id === "string" ? id.trim() : "";
  const order = lookupId ? await getOrder(lookupId) : undefined;

  return (
    <section className="spotlight">
      <div className="mx-auto max-w-5xl px-6 pb-28 pt-[calc(var(--header-h)+3.5rem)]">
        <header className="max-w-2xl">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.35em] text-gold/90">
            Where&rsquo;s my order
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[1.04] text-ivory [text-wrap:balance] md:text-6xl">
            Track your order
          </h1>
          <p className="mt-5 leading-relaxed text-muted">
            Enter the order ID from your confirmation (it looks like{" "}
            <span className="text-champagne">TG-XXXXXX</span>) to follow it from our Delhi
            workshop to your door.
          </p>
          <div className="gold-rule mt-6 w-24" aria-hidden="true" />
        </header>

        <div className="mt-10 max-w-xl">
          <TrackOrderForm defaultId={lookupId} />
        </div>

        {lookupId && !order && (
          <div className="mt-10 rounded-2xl border border-danger/30 bg-danger/5 p-6">
            <p className="font-display text-2xl text-ivory">
              No order found for <span className="text-champagne">{lookupId}</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Double-check the ID for typos (the letters O/0 and I/1 are easy to mix up). If it
              still doesn&rsquo;t show, message us — we&rsquo;ll find it in moments.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                href={waLink(`Hi The Grace! I'd like to track my order ${lookupId}.`)}
                variant="whatsapp"
                size="sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span aria-hidden="true">💬</span> WhatsApp us
              </Button>
              <Button href={`tel:${site.phone.replace(/\s/g, "")}`} variant="outline" size="sm">
                Call {site.phonePretty()}
              </Button>
            </div>
          </div>
        )}

        {order && (
          <div className="mt-14">
            <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-3xl text-ivory">
                Order <span className="text-champagne tabular-nums">{order.id}</span>
              </h2>
              <Button
                href={waLink(`Hi The Grace! I have a question about my order ${order.id}.`)}
                variant="whatsapp"
                size="sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span aria-hidden="true">💬</span> Ask about this order
              </Button>
            </div>
            <OrderDetails order={order} />
          </div>
        )}
      </div>
    </section>
  );
}
