import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HERO } from "@/lib/hero-images";
import { CollectionHero } from "@/components/catalog/CollectionHero";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { getCategory, getProductsByCategory } from "@/lib/catalog";
import { BULK_TIERS } from "@/lib/pricing";
import { enquiryWhatsAppLink } from "@/lib/order-links";

/**
 * The corporate front door. "Corporate" in the nav used to drop straight into
 * /category/gifting, which hid the other half of what companies actually buy
 * from us — branded merchandise. This page carries both, then hands off to
 * the two catalogues.
 */

export const metadata: Metadata = {
  title: "Corporate — Gifting & Branded Merchandise",
  description:
    "Corporate gifting and branded merchandise from The Grace, New Delhi. Gift boxes, hampers, welcome kits, drinkware, desk pieces and long-service awards — branded to your house style, GST invoiced, delivered PAN India.",
  alternates: { canonical: "/corporate" },
};

/** What companies actually come to us for, in the order they ask for it. */
const OCCASIONS = [
  {
    title: "Annual nights & long service",
    body: "Recognition awards with the year, the name and the citation engraved — plus the spares nobody remembers to order until the week of.",
  },
  {
    title: "Onboarding & welcome kits",
    body: "A branded box that lands on a new joiner's desk: notebook, drinkware, a desk piece and whatever else carries your mark well.",
  },
  {
    title: "Investor & client gifting",
    body: "Small runs, high finish. Usually one sampling round, because at this quantity the piece has to be right rather than approximately right.",
  },
  {
    title: "Conferences & offsites",
    body: "Bags, lanyards, pins and giveaways at volume, delivered to the venue rather than to an office nobody will be in that week.",
  },
];

export default async function CorporatePage() {
  const gifting = getCategory("gifting");
  const merchandise = getCategory("merchandise");

  /* A short curated strip drawn from both halves, so the page shows real
     stock rather than only describing it. */
  const [giftingProducts, merchProducts] = await Promise.all([
    getProductsByCategory("gifting"),
    getProductsByCategory("merchandise"),
  ]);
  const featured = [
    ...giftingProducts.filter((p) => p.curated).slice(0, 4),
    ...merchProducts.filter((p) => p.curated).slice(0, 4),
  ];
  const strip = (featured.length >= 4 ? featured : [...giftingProducts, ...merchProducts]).slice(
    0,
    8
  );

  const tiers = [...BULK_TIERS].reverse(); // ascending: 10–24 … 100+

  return (
    <>
      <CollectionHero
        crumbs={[{ label: "Home", href: "/" }, { label: "Corporate" }]}
        eyebrow="For companies"
        title={
          <>
            Corporate gifting &amp; <em className="gold-text">merchandise</em>
          </>
        }
        sub="Two catalogues, one workshop. Everything is branded to your house style, engraved or printed in Lajpat Nagar, GST invoiced and delivered PAN India."
        bg={{ src: HERO.products }}
      />

      {/* the two halves */}
      <section aria-label="Corporate collections" className="mx-auto max-w-7xl px-6 pt-4">
        <div className="grid gap-6 md:grid-cols-2">
          <HalfPanel
            href="/category/gifting"
            eyebrow="Half one"
            name={gifting?.name ?? "Corporate Gifting"}
            blurb={
              gifting?.blurb ??
              "Curated gift boxes, hampers and welcome kits — presentation-packed and branded to your house style."
            }
            count={gifting?.count ?? 0}
            image="/images/site/hero-trophy.webp"
          />
          <HalfPanel
            href="/category/merchandise"
            eyebrow="Half two"
            name={merchandise?.name ?? "Merchandise"}
            blurb={
              merchandise?.blurb ??
              "Branded merchandise — desk pieces, drinkware, keychains, bags and lapel pins."
            }
            count={merchandise?.count ?? 0}
            image="/images/site/hero-trophy-alt.webp"
          />
        </div>
      </section>

      {/* what corporates order */}
      <section aria-label="What companies order" className="mx-auto max-w-7xl px-6 pt-24">
        <SectionHeading
          eyebrow="The brief we usually get"
          title="Four occasions, one purchase order"
          sub="Most companies come to us for one of these and end up consolidating the rest — same house style, same invoice, same delivery window."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {OCCASIONS.map((o, i) => (
            <Reveal key={o.title} delay={i * 110} className="card-surface rounded-2xl p-7">
              <h3 className="font-display text-2xl text-ivory">{o.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{o.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* a taste of both catalogues */}
      {strip.length > 0 && (
        <section aria-label="Selected corporate pieces" className="mx-auto max-w-7xl px-6 pt-24">
          <SectionHeading
            eyebrow="In stock now"
            title="A few pieces from both halves"
            sub="Branding, engraving and presentation packing are included on everything here."
          />
          <div className="mt-12">
            <ProductGrid products={strip} priorityCount={0} />
          </div>
          <Reveal className="mt-12 flex flex-wrap items-center justify-center gap-3" delay={120}>
            <Button href="/category/gifting" variant="outline">
              All corporate gifting
            </Button>
            <Button href="/category/merchandise" variant="outline">
              All merchandise
            </Button>
          </Reveal>
        </section>
      )}

      {/* bulk tiers */}
      <section aria-label="Bulk pricing" className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeading
          eyebrow="Bulk advantage"
          title="The bigger the headcount, the lower the unit"
          sub="Tier discounts apply automatically across the catalogue, and on custom corporate work quantity is your strongest negotiating card."
        />
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {tiers.map((t, i) => (
            <Reveal
              key={t.label}
              delay={i * 100}
              className="card-surface rounded-2xl p-6 text-center transition-shadow duration-500 ease-[var(--ease-lux)] hover:shadow-[var(--shadow-gold)]"
            >
              <p className="gold-text font-display text-4xl md:text-5xl">
                {Math.round(t.off * 100)}%
              </p>
              <p className="mt-1 text-[0.6rem] uppercase tracking-[0.25em] text-muted">
                off per piece
              </p>
              <div className="gold-rule mx-auto mt-4 w-10" aria-hidden="true" />
              <p className="mt-3 text-sm text-champagne">{t.label}</p>
            </Reveal>
          ))}
        </div>
        <Reveal delay={200}>
          <p className="mt-10 text-center text-[0.7rem] uppercase tracking-[0.3em] text-muted">
            GST invoices · Proforma on request · PAN India delivery
          </p>
        </Reveal>
      </section>

      {/* cta */}
      <section aria-label="Start a corporate order" className="mx-auto max-w-3xl px-6 pb-24">
        <Reveal className="card-surface rounded-2xl p-8 text-center">
          <h2 className="font-display text-2xl text-ivory">Have a house style to match?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
            Send us the brand guidelines, the headcount and the date. You will get a design
            proof before anything is branded, and a proforma invoice if your finance team
            needs one.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button href="/craft-your-design" variant="gold">
              Brief the workshop
            </Button>
            <Button
              href={enquiryWhatsAppLink("I'd like to discuss a corporate gifting order.")}
              variant="whatsapp"
            >
              Message on WhatsApp
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted/70">
            Or read the{" "}
            <Link href="/faq" className="text-champagne hover:underline">
              questions companies ask most
            </Link>
            .
          </p>
        </Reveal>
      </section>
    </>
  );
}

/** One of the two catalogue halves, as a full-bleed editorial panel. */
function HalfPanel({
  href,
  eyebrow,
  name,
  blurb,
  count,
  image,
}: {
  href: string;
  eyebrow: string;
  name: string;
  blurb: string;
  count: number;
  image: string;
}) {
  return (
    <Reveal>
      <Link
        href={href}
        aria-label={`Browse ${name}`}
        className="group card-surface flex h-full flex-col overflow-hidden rounded-2xl transition-[box-shadow] duration-500 ease-[var(--ease-lux)] hover:shadow-[var(--shadow-gold)]"
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-[var(--ease-lux)] group-hover:scale-[1.05] motion-reduce:transition-none"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,9,0.15),rgba(8,8,9,0.85))]"
          />
          <p className="absolute bottom-4 left-6 text-[0.6rem] uppercase tracking-[0.3em] text-gold/90">
            {eyebrow}
          </p>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-7">
          <h2 className="font-display text-3xl text-ivory transition-colors duration-300 group-hover:text-champagne">
            {name}
          </h2>
          <p className="text-sm leading-relaxed text-muted">{blurb}</p>
          <p className="mt-auto pt-3 text-xs tracking-wide text-muted/80">
            {count > 0 ? `${count} pieces in the catalogue` : "Made to order"}
            <span
              aria-hidden="true"
              className="ml-2 inline-block text-gold transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </p>
        </div>
      </Link>
    </Reveal>
  );
}
