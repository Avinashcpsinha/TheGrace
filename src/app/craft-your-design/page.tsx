import type { Metadata } from "next";
import { HERO } from "@/lib/hero-images";
import { HeroBackdrop } from "@/components/catalog/HeroBackdrop";
import { Reveal } from "@/components/ui/Reveal";
import { CustomRequestForm } from "@/components/pdp/CustomRequestForm";
import { site } from "@/config/site";
import { enquiryWhatsAppLink, telLink } from "@/lib/order-links";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Craft Your Design — Start a Commission",
  description:
    "Start a bespoke commission with The Grace, New Delhi. Share your occasion, quantity, artwork and engraving text; approve a free design proof on WhatsApp; we cast, engrave and deliver PAN India.",
  alternates: { canonical: "/craft-your-design" },
};

/**
 * The commission desk — customer input for all three things we make.
 * /customization is the showroom (what bespoke work looks like, the process,
 * the bulk tiers); this page is the doing: brief in, proof out.
 *
 * The three streams below mirror STREAMS in customization-constants.ts, which
 * is what the form itself asks first. Keep the wording in step.
 */
const STREAM_CARDS = [
  {
    n: "01",
    title: "Trophies & Awards",
    body: "Cups, crystal, medals, shields and mementos. Tell us the ceremony date, the quantity, and exactly how each name should read — engraving is included, and spelling is the one thing we cannot undo.",
  },
  {
    n: "02",
    title: "Corporate Gifting",
    body: "Gift boxes, hampers and welcome kits. We need the headcount, a budget per box and the delivery addresses; we will come back with two or three compositions to choose between.",
  },
  {
    n: "03",
    title: "Merchandise",
    body: "Drinkware, desk pieces, bags, apparel, keychains and pins. Send the artwork — vector reproduces most crisply, but we can redraw from a good image — plus quantities and any size breakdown.",
  },
];

export default function CraftYourDesignPage() {
  return (
    <>
      {/* intro */}
      <section className="spotlight tg-hero relative overflow-hidden">
        <HeroBackdrop src={HERO.customization} />
        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-[calc(var(--header-h)+5rem)] md:pb-24">
          <Reveal className="flex flex-col items-center gap-5 text-center">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.35em] text-gold/90">
              The commission desk
            </p>
            <h1 className="max-w-4xl font-display text-5xl leading-[1.04] text-ivory [text-wrap:balance] md:text-6xl lg:text-7xl">
              <span className="reveal-mask">
                <span>
                  Craft your <em className="gold-text">design</em>
                </span>
              </span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted md:text-lg">
              Trophies and awards, corporate gifting, or branded merchandise — brief us on any
              of the three. A designer picks it up the same working day, and you approve a proof
              before a single piece is made.
            </p>
            <div className="gold-rule mt-1 w-28" aria-hidden="true" />
          </Reveal>
        </div>
      </section>

      {/* the three things we take briefs on */}
      <section aria-label="What we take briefs on" className="mx-auto max-w-7xl px-6 pt-6">
        <ol role="list" className="grid gap-5 md:grid-cols-3">
          {STREAM_CARDS.map((s, i) => (
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

      {/* the brief */}
      <section aria-label="Design request" className="mx-auto max-w-3xl px-6 pt-16">
        <Reveal delay={120}>
          <CustomRequestForm />
        </Reveal>
      </section>

      {/* prefer to talk */}
      <section aria-label="Talk to the workshop" className="mx-auto max-w-3xl px-6 py-20">
        <Reveal className="card-surface rounded-2xl p-8 text-center">
          <h2 className="font-display text-2xl text-ivory">Prefer to just talk it through?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
            Some briefs are easier spoken than typed. Call the workshop or send a message and
            we will take it from there.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button
              href={enquiryWhatsAppLink("I'd like to commission a custom award.")}
              variant="whatsapp"
            >
              Message on WhatsApp
            </Button>
            <Button href={telLink()} variant="outline">
              {site.phonePretty()}
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
