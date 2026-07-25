import type { Metadata } from "next";
import Image from "next/image";
import { site } from "@/config/site";
import { HERO } from "@/lib/hero-images";
import { HeroBackdrop } from "@/components/catalog/HeroBackdrop";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CraftCounters } from "@/components/home/CraftCounters";
import { MaterialsMarquee } from "@/components/catalog/MaterialsMarquee";
import { ContactCTA } from "@/components/home/ContactCTA";

export const metadata: Metadata = {
  title: "About — The Workshop Behind the Awards",
  description:
    "The Grace is a premium trophy and awards manufacturer in Lajpat Nagar, New Delhi — trophies, medals, mementos, corporate gifting and branded merchandise. Two decades of design, casting, engraving and finishing under one roof.",
  alternates: { canonical: "/about" },
};

const PROCESS = [
  {
    n: "01",
    title: "Design",
    body: "Every commission starts on paper — proportions, materials and the words that will be engraved. You approve a proof before a single piece is cast.",
  },
  {
    n: "02",
    title: "Cast & cut",
    body: "Optical crystal, die-cast metal and seasoned hardwood are shaped in our own workshop — no outsourcing, so quality is ours to guarantee.",
  },
  {
    n: "03",
    title: "Engrave",
    body: "Names, dates and logos are laser-etched or cast as metal badges. Free engraving is included on every award we make.",
  },
  {
    n: "04",
    title: "Finish & deliver",
    body: "24K electroplating, hand-polishing, velvet presentation cases — then foam-cradled, double-boxed and delivered PAN India.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="spotlight tg-hero relative overflow-hidden">
        <HeroBackdrop src={HERO.about} />
        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-[calc(var(--header-h)+5rem)] md:pb-24">
          <Reveal className="max-w-3xl">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.35em] text-gold/90">
              Our story
            </p>
            <h1 className="mt-4 font-display text-5xl leading-[1.04] text-ivory [text-wrap:balance] md:text-6xl lg:text-7xl">
              The workshop behind the <em className="gold-text">nation&rsquo;s honours</em>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
              From a single bench in Lajpat Nagar to podiums across the country, {site.name} has
              spent two decades turning moments of achievement into objects worth keeping. Every
              trophy that leaves our doors is designed, cast, engraved and finished by the same
              hands.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Story + image */}
      <section aria-label="Our heritage" className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="photo-well relative aspect-[4/5] overflow-hidden rounded-3xl">
              <Image
                src="/images/site/hero-trophy.webp"
                alt="A signature trophy crafted by The Grace"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-8"
              />
            </div>
          </Reveal>
          <Reveal delay={120} className="space-y-6">
            <h2 className="font-display text-3xl text-ivory md:text-4xl [text-wrap:balance]">
              Craft kept in-house, on purpose
            </h2>
            <p className="leading-relaxed text-muted">
              Most of the awards industry is a chain of middlemen. We chose the harder path:
              keeping design, fabrication, engraving and finishing under one roof. It means we
              can promise a date and keep it, hold a finish to our own standard, and take on the
              kind of bespoke work that off-the-shelf suppliers turn away.
            </p>
            <blockquote className="border-l-2 border-gold/50 pl-5">
              <p className="font-display text-2xl italic leading-snug text-ivory/90 [text-wrap:balance]">
                &ldquo;An award outlives the ceremony. We build it to be the thing on the shelf
                forty years from now.&rdquo;
              </p>
            </blockquote>
            <p className="leading-relaxed text-muted">
              That conviction is why schools, sports federations, PSUs and corporate houses keep
              coming back — and why, when an occasion calls for something worth keeping, the work
              comes to Lajpat Nagar.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Stats */}
      <section aria-label="By the numbers" className="mx-auto max-w-7xl px-6 py-12">
        <Reveal>
          <CraftCounters />
        </Reveal>
      </section>

      {/* Process */}
      <section aria-label="How we work" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading
          eyebrow="From sketch to shelf"
          title="Four stages, one workshop"
          sub="Nothing leaves the building until it has passed through every one of them."
        />
        <ol role="list" className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((s, i) => (
            <Reveal
              as="li"
              key={s.n}
              delay={i * 110}
              className="card-surface relative overflow-hidden rounded-2xl p-7"
            >
              <span aria-hidden="true" className="gold-text font-display text-5xl leading-none">
                {s.n}
              </span>
              <h3 className="mt-4 font-display text-2xl text-ivory">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Trusted at scale */}
      <section aria-label="Trusted at scale" className="spotlight border-y border-line">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 lg:grid-cols-[1.2fr_1fr]">
          <Reveal className="space-y-5">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.35em] text-gold/90">
              Trusted at scale
            </p>
            <h2 className="font-display text-4xl leading-[1.06] text-ivory [text-wrap:balance] md:text-5xl">
              A finish that holds, from one piece to ten thousand
            </h2>
            <p className="max-w-xl leading-relaxed text-muted">
              Schools, sports federations, PSUs and corporate houses come to us for programmes
              that run into the thousands — and every piece is held to the same standard as a
              one-off commission. Scale, without a dip in finish.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="photo-well relative aspect-square overflow-hidden rounded-3xl">
              <Image
                src="/images/site/hero-trophy-alt.webp"
                alt="A ceremonial cup crafted by The Grace"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-contain p-8"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Materials */}
      <div className="py-4">
        <MaterialsMarquee />
      </div>

      {/* Contact */}
      <ContactCTA />
    </>
  );
}
