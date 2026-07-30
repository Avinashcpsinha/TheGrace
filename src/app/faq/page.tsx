import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { HERO } from "@/lib/hero-images";
import { HeroBackdrop } from "@/components/catalog/HeroBackdrop";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "FAQ — Orders, Engraving, Delivery",
  description:
    "Answers on minimum order quantity, lead times, free engraving, design proofs, bulk discounts, GST invoices, delivery across India and payment options at The Grace, New Delhi.",
  alternates: { canonical: "/faq" },
};

interface Faq {
  q: string;
  a: string;
}

/**
 * Grouped so the page scans as sections rather than one long list. Answers
 * are the same ones the workshop gives on WhatsApp every day — lead time,
 * engraving, proofs, bulk tiers, invoicing and delivery.
 */
const GROUPS: { heading: string; items: Faq[] }[] = [
  {
    heading: "Ordering",
    items: [
      {
        q: "Is there a minimum order quantity?",
        a: "No. We will make a single trophy for one deserving person, and we regularly ship runs of five hundred for national tournaments. Bulk discount tiers begin at ten pieces and deepen from there.",
      },
      {
        q: "How do I place an order?",
        a: "Whichever way suits you. Every product page and the cart carry an Order on WhatsApp button that pre-fills the piece, size, quantity and engraving text. You can also call the workshop directly, or email us — all three reach the same team.",
      },
      {
        q: "Can I see the design before you make it?",
        a: "Always. We send a design proof on WhatsApp and nothing enters production until you have approved it. Proofs are free and we will revise them until the piece reads the way you want.",
      },
    ],
  },
  {
    heading: "Craft & engraving",
    items: [
      {
        q: "Is engraving included?",
        a: "Yes — free engraving is included on every award we make. Names, dates, citations and logos are laser-etched or cast as metal badges depending on the material.",
      },
      {
        q: "Can you work from our logo or a sketch?",
        a: "Yes. Send a logo file, a photograph or even a rough sketch and our design team will translate it into a mould or an etch. Vector artwork reproduces most crisply, but we can redraw from a good image.",
      },
      {
        q: "What materials do you work in?",
        a: "Optical crystal, die-cast metal, brass, acrylic, resin and seasoned hardwood — cast, cut, engraved and finished in our own Lajpat Nagar workshop rather than outsourced.",
      },
    ],
  },
  {
    heading: "Delivery & payment",
    items: [
      {
        q: "How long does an order take?",
        a: "Most commissions are cast, engraved, polished, packed and delivered within seven to ten days. Tell us your ceremony date when you enquire — if it is tighter than that, say so and we will tell you honestly whether we can meet it.",
      },
      {
        q: "Do you deliver outside Delhi?",
        a: "Yes, PAN India. Awards are packed to survive transit, and podium pieces travel in fitted boxes.",
      },
      {
        q: "Can I get a GST invoice?",
        a: "Yes. Enter your GSTIN at checkout, or mention it when you order on WhatsApp, and a GST invoice is raised against the order.",
      },
      {
        q: "What payment methods do you accept?",
        a: `Cash on delivery is available, and orders placed on WhatsApp can be settled directly with the workshop. For bulk and corporate orders we will raise a proforma invoice on request — write to ${site.email}.`,
      },
    ],
  },
];

const ALL = GROUPS.flatMap((g) => g.items);

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: ALL.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* intro */}
      <section className="spotlight tg-hero relative overflow-hidden">
        <HeroBackdrop src={HERO.about} />
        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-[calc(var(--header-h)+5rem)] md:pb-24">
          <Reveal className="flex flex-col items-center gap-5 text-center">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.35em] text-gold/90">
              Good to know
            </p>
            <h1 className="max-w-4xl font-display text-5xl leading-[1.04] text-ivory [text-wrap:balance] md:text-6xl lg:text-7xl">
              <span className="reveal-mask">
                <span>
                  Frequently asked <em className="gold-text">questions</em>
                </span>
              </span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted md:text-lg">
              The things people ask before they commission an award. If yours is not here,
              the workshop is a message away.
            </p>
            <div className="gold-rule mt-1 w-28" aria-hidden="true" />
          </Reveal>
        </div>
      </section>

      {/* the questions */}
      <div className="mx-auto max-w-3xl px-6 pb-8 pt-6">
        {GROUPS.map((group, gi) => (
          <section key={group.heading} aria-label={group.heading} className="mb-14">
            <Reveal delay={gi * 80}>
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.28em] text-champagne">
                {group.heading}
              </h2>
              <div className="gold-rule mt-4 w-16" aria-hidden="true" />
            </Reveal>

            <div className="mt-6 space-y-3">
              {group.items.map((f, i) => (
                <Reveal key={f.q} delay={i * 70}>
                  <details className="card-surface group rounded-2xl px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left font-display text-lg text-ivory transition-colors duration-300 hover:text-champagne">
                      {f.q}
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-gold transition-transform duration-300 ease-[var(--ease-lux)] group-open:rotate-45 motion-reduce:transition-none"
                      >
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </svg>
                    </summary>
                    <p className="mt-4 text-sm leading-relaxed text-muted">{f.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </section>
        ))}

        {/* still stuck */}
        <Reveal className="card-surface rounded-2xl p-8 text-center">
          <h2 className="font-display text-2xl text-ivory">Still have a question?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
            Tell us the occasion and the date. We will tell you what is possible — and what it
            will cost — before you commit to anything.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button href="/contact" variant="gold">
              Get in touch
            </Button>
            <Button href="/craft-your-design" variant="outline">
              Craft your design
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted/70">
            Or browse{" "}
            <Link href="/products" className="text-champagne hover:underline">
              the full collection
            </Link>
            .
          </p>
        </Reveal>
      </div>
    </>
  );
}
