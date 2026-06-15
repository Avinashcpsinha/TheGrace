import type { Metadata } from "next";
import { AccountView } from "@/components/commerce/AccountView";

export const metadata: Metadata = {
  title: "Your Account",
  description: "Your orders and saved addresses on this device.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <section className="spotlight">
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-[calc(var(--header-h)+3rem)]">
        <header className="max-w-2xl">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.35em] text-gold/90">
            On this device
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[1.04] text-ivory [text-wrap:balance] md:text-6xl">
            Your account
          </h1>
          <p className="mt-5 leading-relaxed text-muted">
            The Grace keeps it simple — no passwords. Your recent orders and saved addresses live
            right here in your browser.
          </p>
          <div className="gold-rule mt-6 w-24" aria-hidden="true" />
        </header>

        <div className="mt-12">
          <AccountView />
        </div>
      </div>
    </section>
  );
}
