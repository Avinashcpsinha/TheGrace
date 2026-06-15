import type { Metadata } from "next";
import { CartView } from "@/components/commerce/CartView";

export const metadata: Metadata = {
  title: "Cart",
  description:
    "Review your selected trophies, medals and awards — bulk pricing applies automatically. Checkout online or order on WhatsApp.",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <section className="spotlight">
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-[calc(var(--header-h)+3rem)]">
        <header className="max-w-2xl">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.35em] text-gold/90">
            Your selection
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[1.04] text-ivory [text-wrap:balance] md:text-6xl">
            Cart
          </h1>
          <div className="gold-rule mt-6 w-24" aria-hidden="true" />
        </header>

        <div className="mt-12">
          <CartView />
        </div>
      </div>
    </section>
  );
}
