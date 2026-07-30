import type { Metadata } from "next";
import { HERO } from "@/lib/hero-images";
import { HeroBackdrop } from "@/components/catalog/HeroBackdrop";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Testimonials } from "@/components/home/Testimonials";
import { CraftCounters } from "@/components/home/CraftCounters";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Client Testimonies — Who We Make Awards For",
  description:
    "Corporates, schools, sports bodies and event planners across India trust The Grace with their podium. Read what clients say about our trophies, medals and corporate gifting.",
  alternates: { canonical: "/testimonials" },
};

/** The four rooms our awards end up in. */
const SECTORS = [
  {
    title: "Corporates",
    body: "Annual nights, long-service awards, investor gifting and welcome kits — branded to a house style and delivered in presentation boxes.",
  },
  {
    title: "Schools & universities",
    body: "Sports days, convocations and rolling shields that come back to the same stage year after year, re-engraved with a new name.",
  },
  {
    title: "Sports bodies",
    body: "Full podium sets for leagues, districts and tournaments — including the official awards for the Khelo India Games.",
  },
  {
    title: "Event planners",
    body: "Weddings, conferences and award ceremonies, where the memento has to feel considered and arrive on an immovable date.",
  },
];

export default function TestimonialsPage() {
  return (
    <>
      {/* intro */}
      <section className="spotlight tg-hero relative overflow-hidden">
        <HeroBackdrop src={HERO.about} />
        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-[calc(var(--header-h)+5rem)] md:pb-24">
          <Reveal className="flex flex-col items-center gap-5 text-center">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.35em] text-gold/90">
              Word of honour
            </p>
            <h1 className="max-w-4xl font-display text-5xl leading-[1.04] text-ivory [text-wrap:balance] md:text-6xl lg:text-7xl">
              <span className="reveal-mask">
                <span>
                  Client <em className="gold-text">testimonies</em>
                </span>
              </span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted md:text-lg">
              The people who hand over the honours — and what they say once the boxes are
              opened and the ceremony is over.
            </p>
            <div className="gold-rule mt-1 w-28" aria-hidden="true" />
          </Reveal>
        </div>
      </section>

      {/* the quotes */}
      <Testimonials />

      {/* who we make for */}
      <section aria-label="Who we make awards for" className="mx-auto max-w-7xl px-6 pb-8">
        <SectionHeading
          eyebrow="Who we make for"
          title="Four rooms, one standard"
          sub="The brief changes with the occasion. The finish does not."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {SECTORS.map((s, i) => (
            <Reveal key={s.title} delay={i * 110} className="card-surface rounded-2xl p-7">
              <h3 className="font-display text-2xl text-ivory">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* the numbers */}
      <CraftCounters />

      {/* cta */}
      <section aria-label="Start your commission" className="mx-auto max-w-3xl px-6 pb-24">
        <Reveal className="card-surface rounded-2xl p-8 text-center">
          <h2 className="font-display text-2xl text-ivory">Add your ceremony to the list</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
            Tell us what you are honouring and when. We will send a design proof before
            anything is cast.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button href="/craft-your-design" variant="gold">
              Craft your design
            </Button>
            <Button href="/contact" variant="outline">
              Get in touch
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
