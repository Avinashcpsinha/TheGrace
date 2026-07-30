import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HERO } from "@/lib/hero-images";
import { HeroBackdrop } from "@/components/catalog/HeroBackdrop";
import { Reveal } from "@/components/ui/Reveal";
import { getEntries, formatDate } from "@/lib/journal";

export const metadata: Metadata = {
  title: "Journal — Notes from the Workshop",
  description:
    "Notes on craft, materials and commissions from The Grace — a premium trophy and awards workshop in Lajpat Nagar, New Delhi.",
  alternates: { canonical: "/journal" },
};

export default function JournalPage() {
  const entries = getEntries();
  const [lead, ...rest] = entries;

  return (
    <>
      {/* intro */}
      <section className="spotlight tg-hero relative overflow-hidden">
        <HeroBackdrop src={HERO.about} />
        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-[calc(var(--header-h)+5rem)] md:pb-24">
          <Reveal className="flex flex-col items-center gap-5 text-center">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.35em] text-gold/90">
              From the bench
            </p>
            <h1 className="max-w-4xl font-display text-5xl leading-[1.04] text-ivory [text-wrap:balance] md:text-6xl lg:text-7xl">
              <span className="reveal-mask">
                <span>
                  The <em className="gold-text">Journal</em>
                </span>
              </span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted md:text-lg">
              Notes on craft, materials and the commissions that taught us something worth
              writing down.
            </p>
            <div className="gold-rule mt-1 w-28" aria-hidden="true" />
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 pb-24 pt-6">
        {/* lead entry */}
        {lead && (
          <Reveal>
            <Link
              href={`/journal/${lead.slug}`}
              className="group card-surface grid overflow-hidden rounded-2xl md:grid-cols-2"
            >
              <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:min-h-[22rem]">
                <Image
                  src={lead.image}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-[900ms] ease-[var(--ease-lux)] group-hover:scale-[1.04] motion-reduce:transition-none"
                />
              </div>
              <div className="flex flex-col justify-center gap-4 p-8 md:p-10">
                <p className="text-[0.65rem] uppercase tracking-[0.3em] text-gold/90">
                  Latest
                </p>
                <h2 className="font-display text-3xl leading-tight text-ivory transition-colors duration-300 group-hover:text-champagne md:text-4xl">
                  {lead.title}
                </h2>
                <p className="text-sm leading-relaxed text-muted">{lead.excerpt}</p>
                <p className="mt-1 text-xs text-muted/70">
                  <time dateTime={lead.date}>{formatDate(lead.date)}</time>
                  <span aria-hidden="true"> · </span>
                  {lead.readingMinutes} min read
                </p>
              </div>
            </Link>
          </Reveal>
        )}

        {/* the rest */}
        {rest.length > 0 && (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {rest.map((e, i) => (
              <Reveal key={e.slug} delay={i * 110}>
                <Link
                  href={`/journal/${e.slug}`}
                  className="group card-surface flex h-full flex-col overflow-hidden rounded-2xl"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={e.image}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-[900ms] ease-[var(--ease-lux)] group-hover:scale-[1.04] motion-reduce:transition-none"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-7">
                    <h2 className="font-display text-2xl leading-tight text-ivory transition-colors duration-300 group-hover:text-champagne">
                      {e.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-muted">{e.excerpt}</p>
                    <p className="mt-auto pt-2 text-xs text-muted/70">
                      <time dateTime={e.date}>{formatDate(e.date)}</time>
                      <span aria-hidden="true"> · </span>
                      {e.readingMinutes} min read
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
