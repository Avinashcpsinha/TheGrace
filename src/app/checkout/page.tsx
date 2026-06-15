import type { Metadata } from "next";
import { CheckoutView } from "@/components/commerce/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Complete your order from The Grace — pay online via UPI, cards or net banking, choose Cash on Delivery, or finish on WhatsApp.",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <section className="spotlight">
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-[calc(var(--header-h)+3rem)]">
        <header className="max-w-2xl">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.35em] text-gold/90">
            Almost there
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[1.04] text-ivory [text-wrap:balance] md:text-6xl">
            Checkout
          </h1>
          <p className="mt-4 max-w-xl text-muted">
            A few details and your pieces head to the workshop.
          </p>
          <div className="gold-rule mt-6 w-24" aria-hidden="true" />
        </header>

        <div className="mt-12">
          <CheckoutView />
        </div>
      </div>
    </section>
  );
}
