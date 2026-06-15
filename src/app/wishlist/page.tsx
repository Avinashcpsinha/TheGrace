import type { Metadata } from "next";
import { WishlistView } from "@/components/commerce/WishlistView";

export const metadata: Metadata = {
  title: "Wishlist",
  description:
    "Pieces you've saved while browsing The Grace — move them to your cart whenever you're ready.",
  robots: { index: false },
};

export default function WishlistPage() {
  return (
    <section className="spotlight">
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-[calc(var(--header-h)+3rem)]">
        <header className="max-w-2xl">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.35em] text-gold/90">
            Saved pieces
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[1.04] text-ivory [text-wrap:balance] md:text-6xl">
            Wishlist
          </h1>
          <p className="mt-4 max-w-xl text-muted">
            Kept safely on this device until you&apos;re ready to celebrate.
          </p>
          <div className="gold-rule mt-6 w-24" aria-hidden="true" />
        </header>

        <div className="mt-12">
          <WishlistView />
        </div>
      </div>
    </section>
  );
}
