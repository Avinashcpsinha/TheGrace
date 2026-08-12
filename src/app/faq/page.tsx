import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { HERO } from "@/lib/hero-images";
import { HeroBackdrop } from "@/components/catalog/HeroBackdrop";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "FAQ — Orders, Customization, Engraving, Delivery",
  description:
    "Every answer in one place: minimum order quantity, lead times and rush orders, free engraving, design proofs, materials, custom moulds, bulk discounts, purchase orders and GST invoices, PAN India delivery, repairs and re-engraving — from The Grace, New Delhi.",
  alternates: { canonical: "/faq" },
};

interface Faq {
  q: string;
  a: string;
}

/**
 * Grouped so the page scans as sections rather than one long list. Answers
 * are the same ones the workshop gives on WhatsApp every day — lead time,
 * engraving, proofs, bulk tiers, invoicing, delivery, corporate paperwork and
 * what happens when something goes wrong.
 *
 * Every question here is also emitted as FAQPage structured data, so keep
 * answers self-contained: they can be shown by a search engine with no page
 * around them.
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
      {
        q: "Can I order a sample before committing to the full run?",
        a: "Yes, and for large or first-time corporate orders we recommend it. A single sample is charged at the unit price without the bulk discount; if you go ahead with the run, that difference comes off the final invoice.",
      },
      {
        q: "Can I change or cancel after ordering?",
        a: "Until the proof is approved, freely — nothing has been made. After approval it depends on the stage: quantities can usually still move up, engraving text cannot change once it is etched, and a cancelled run is charged for whatever has already been cast.",
      },
      {
        q: "How do I track an order I have already placed?",
        a: "Every order gets a reference beginning TG-. Enter it on the Track Order page for its current stage, or send it to us on WhatsApp and we will tell you exactly where it is on the bench.",
      },
    ],
  },
  {
    heading: "Customization & design",
    items: [
      {
        q: "What do you need from me to start a custom piece?",
        a: "Three things: the occasion and its date, the quantity, and the words to be engraved. Artwork helps but is not essential — we can work from a logo file, a photograph, or a description of what you have in mind.",
      },
      {
        q: "Can you work from our logo or a sketch?",
        a: "Yes. Send a logo file, a photograph or even a rough sketch and our design team will translate it into a mould or an etch. Vector artwork (AI, EPS, SVG or PDF) reproduces most crisply, but we can redraw from a good image at no extra cost.",
      },
      {
        q: "Can you design something entirely new, not from the catalogue?",
        a: "That is most of what we do. A fully bespoke piece needs a new mould, which adds a one-off tooling cost and roughly a week to the timeline — both quoted up front, never discovered later.",
      },
      {
        q: "How many revisions of the proof do I get?",
        a: "As many as it takes. We would far rather revise a drawing five times than cast the wrong thing once. Proofs are free at every round.",
      },
      {
        q: "Do you make corporate gifting and branded merchandise too?",
        a: "Yes — gift boxes, hampers, welcome kits, drinkware, desk pieces, bags, apparel, keychains and lapel pins, all branded to your house style. The Corporate page carries both catalogues.",
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
        q: "What materials do you work in?",
        a: "Optical crystal, die-cast metal, brass, acrylic, resin and seasoned hardwood — cast, cut, engraved and finished in our own Lajpat Nagar workshop rather than outsourced.",
      },
      {
        q: "Crystal or metal — which should I choose?",
        a: "Crystal suits corporate recognition and anything that will live on a desk: it takes a logo beautifully and engraves sub-surface, so it cannot scuff. Metal suits sport and anything that will be lifted, handed round or carried home, because it survives being dropped. If a piece is going on a podium, we will recommend metal.",
      },
      {
        q: "What sizes do trophies come in?",
        a: "Most designs run from roughly 6 to 22 inches, and podium sets are supplied in graduated heights for first, second and third. If you need a specific height to match an existing set, send us a photograph and a measurement.",
      },
      {
        q: "Can we have custom ribbons on medals?",
        a: "Yes. Custom-woven ribbons in your own colours and text need a minimum of fifty; below that we print onto stock ribbon, which costs less and is honestly hard to tell apart at arm's length.",
      },
      {
        q: "Can you re-engrave a rolling shield we already own?",
        a: "Yes, including shields we did not make. Send a photograph of the piece and the new name; if it is one of ours we will still have the artwork and the plate spacing on file.",
      },
    ],
  },
  {
    heading: "Bulk & corporate",
    items: [
      {
        q: "How do the bulk discounts work?",
        a: "They apply automatically by quantity: 5% from ten pieces, 10% from twenty-five, 15% from fifty and 20% from a hundred. The tier is calculated per line, and it is already reflected in the price you see in the cart.",
      },
      {
        q: "Can you raise a proforma invoice or work against a purchase order?",
        a: `Yes to both — this is the normal route for corporate and institutional orders. Send your PO or ask for a proforma and we will raise it against the quoted amount. Write to ${site.email} or mention it on WhatsApp.`,
      },
      {
        q: "Can you deliver to a venue rather than to our office?",
        a: "Yes, and for conferences and offsites we would encourage it. Give us the venue, the date and a contact on site; we will time the dispatch so the boxes are not sitting in a store room for a week.",
      },
      {
        q: "Can you match our brand guidelines exactly?",
        a: "Send the guidelines and we will work to them — Pantone references, clear space, approved logo lock-ups. The proof shows you the result before anything is branded.",
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
        q: "Can you do a rush order?",
        a: "Sometimes. Stock pieces with simple engraving can move in two to three days; anything needing a new mould cannot be hurried without being spoiled. We will tell you which of those your order is before you commit, not after.",
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
  {
    heading: "After the ceremony",
    items: [
      {
        q: "Something arrived damaged. What now?",
        a: "Photograph it as it came out of the box and send it to us the same day. Transit damage is our problem, not yours — we remake and re-dispatch, and if the ceremony is imminent we will tell you straight away whether we can make the date.",
      },
      {
        q: "There is a mistake in the engraving.",
        a: "If the approved proof was right and the piece is wrong, we remake it at our cost. If the proof itself carried the error, we will still remake it, at the cost of the materials only — but this is exactly why we ask for a third pair of eyes on the proof before approval.",
      },
      {
        q: "Can you repair or re-polish an older trophy?",
        a: "Usually, yes, including pieces from other makers. Bring it to the workshop or send a photograph and we will tell you honestly whether repair or replacement is the better use of your money.",
      },
      {
        q: "Do you keep our artwork for repeat orders?",
        a: "Yes. Moulds, dies and artwork are kept on file indefinitely, which is what lets a school reorder the same shield eight years later without sending anything but a name.",
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
