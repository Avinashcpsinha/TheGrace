import type { Metadata } from "next";
import { HERO } from "@/lib/hero-images";
import { HeroBackdrop } from "@/components/catalog/HeroBackdrop";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CustomRequestForm } from "@/components/pdp/CustomRequestForm";
import { BULK_TIERS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Customization — Design Your Own Award",
  description:
    "Bespoke trophies, medals, mementos, corporate gifts and branded merchandise from The Grace, Delhi. Share your vision, approve a free design proof, and we craft and deliver PAN India in 7–10 days.",
  alternates: { canonical: "/customization" },
};

const STEPS = [
  {
    n: "01",
    title: "Share your vision",
    body: "The occasion, the quantity, the words to engrave — plus any logo, sketch or reference photo you have.",
  },
  {
    n: "02",
    title: "Approve the design proof",
    body: "We send a design proof on WhatsApp. Nothing enters production until you love every line of it.",
  },
  {
    n: "03",
    title: "We craft & deliver",
    body: "Cast, engraved, polished and packed in our Lajpat Nagar workshop — delivered PAN India, usually in 7–10 days.",
  },
];

export default function CustomizationPage() {
  const tiers = [...BULK_TIERS].reverse(); // ascending: 10–24 … 100+

  return (
    <>
      {/* cinematic intro */}
      <section className="spotlight tg-hero relative overflow-hidden">
        <HeroBackdrop src={HERO.customization} />
        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-[calc(var(--header-h)+5rem)] md:pb-24">
          <Reveal className="flex flex-col items-center gap-5 text-center">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.35em] text-gold/90">
              Make it yours
            </p>
            <h1 className="max-w-4xl font-display text-5xl leading-[1.04] text-ivory [text-wrap:balance] md:text-6xl lg:text-7xl">
              <span className="reveal-mask">
                <span>
                  An award designed around <em className="gold-text">your moment</em>
                </span>
              </span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted md:text-lg">
              From a school sports day to a national podium — our Lajpat Nagar workshop will
              sketch, sculpt and engrave a piece that could belong to no other ceremony.
            </p>
            <div className="gold-rule mt-1 w-28" aria-hidden="true" />
          </Reveal>
        </div>
      </section>

      {/* 3-step explainer */}
      <section aria-label="How customization works" className="mx-auto max-w-7xl px-6 pt-6">
        <ol role="list" className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal
              as="li"
              key={s.n}
              delay={i * 130}
              className="card-surface relative overflow-hidden rounded-2xl p-7"
            >
              <span aria-hidden="true" className="gold-text font-display text-5xl leading-none">
                {s.n}
              </span>
              <h2 className="mt-4 font-display text-2xl text-ivory">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* form */}
      <section aria-label="Customization request" className="mx-auto max-w-3xl px-6 pt-16">
        <Reveal delay={120}>
          <CustomRequestForm />
        </Reveal>
      </section>

      {/* bulk pricing band + trust line */}
      <section aria-label="Bulk pricing" className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeading
          eyebrow="Bulk advantage"
          title="The more you honour, the less each award costs"
          sub="Tier discounts apply automatically on every product — and on custom work, quantity is your strongest negotiating card."
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
            GST invoices · PAN India delivery · 2,000+ institutions served
          </p>
        </Reveal>
      </section>
    </>
  );
}
