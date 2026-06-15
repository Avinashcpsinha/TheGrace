import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { enquiryWhatsAppLink } from "@/lib/order-links";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className="spotlight">
      <div className="mx-auto flex min-h-[70svh] max-w-2xl flex-col items-center justify-center px-6 pt-[var(--header-h)] text-center">
        <p
          aria-hidden="true"
          className="gold-text font-display text-7xl leading-none md:text-8xl"
        >
          404
        </p>
        <h1 className="mt-6 font-display text-4xl leading-[1.06] text-ivory [text-wrap:balance] md:text-5xl">
          This piece has wandered off its plinth
        </h1>
        <p className="mt-5 max-w-md leading-relaxed text-muted">
          The page you&rsquo;re looking for doesn&rsquo;t exist or has moved. Let&rsquo;s get you
          back to the collection.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button href="/" size="lg">
            Back to home
          </Button>
          <Button href="/products" variant="outline" size="lg">
            Browse all products
          </Button>
          <Button
            href={enquiryWhatsAppLink()}
            variant="whatsapp"
            size="lg"
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
