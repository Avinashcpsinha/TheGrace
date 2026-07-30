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
 * The commission desk. /customization is the showroom — what bespoke work
 * looks like, the process, the bulk tiers. This page is the doing: brief in,
 * proof out. Both are in the primary nav, so they must not repeat each other.
 */
const WHAT_TO_SEND = [
  {
    n: "01",
    title: "The occasion",
    body: "What is being honoured, on what date, and how many pieces. The date matters most — it tells us whether the timeline is comfortable or tight.",
  },
  {
    n: "02",
    title: "The artwork",
    body: "A logo, a sketch, a photograph of something you liked. Vector files reproduce most crisply, but we can redraw from a decent image.",
  },
  {
    n: "03",
    title: "The words",
    body: "Exactly how names, titles and citations should read. Engraving is free — spelling is the one thing we cannot undo once it is etched.",
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
              Tell us what you are honouring. A designer picks it up the same working day, and
              you approve a proof before a single piece is cast.
            </p>
            <div className="gold-rule mt-1 w-28" aria-hidden="true" />
          </Reveal>
        </div>
      </section>

      {/* what to send */}
      <section aria-label="What to send us" className="mx-auto max-w-7xl px-6 pt-6">
        <ol role="list" className="grid gap-5 md:grid-cols-3">
          {WHAT_TO_SEND.map((s, i) => (
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
