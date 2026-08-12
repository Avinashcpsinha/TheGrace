import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HERO } from "@/lib/hero-images";
import { HeroBackdrop } from "@/components/catalog/HeroBackdrop";
import { Reveal } from "@/components/ui/Reveal";
import {
  SECTIONS,
  getEntries,
  formatDate,
  parseSection,
  sectionCounts,
  sectionLabel,
} from "@/lib/journal";

/**
 * The Journal carries four kinds of writing — Launch, News, New Products and
 * Blog — filtered by ?section=. The chips are plain links and the filtering
 * happens on the server, so the page needs no client JavaScript and each
 * section is a shareable, indexable URL.
 */

interface PageProps {
  searchParams: Promise<{ section?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const section = parseSection((await searchParams).section);
  const meta = section ? SECTIONS.find((s) => s.key === section)! : undefined;

  return {
    title: meta ? `${meta.label} — The Journal` : "Journal — Launches, News & Notes",
    description:
      meta?.blurb ??
      "Launches, workshop news, new product information and longer notes on craft from The Grace — a premium trophy and awards workshop in Lajpat Nagar, New Delhi.",
    alternates: { canonical: section ? `/journal?section=${section}` : "/journal" },
  };
}

export default async function JournalPage({ searchParams }: PageProps) {
  const section = parseSection((await searchParams).section);
  const entries = getEntries(section);
  const counts = sectionCounts();
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
              {section
                ? SECTIONS.find((s) => s.key === section)!.blurb
                : "Launches, workshop news, what has just joined the catalogue, and the commissions that taught us something worth writing down."}
            </p>
            <div className="gold-rule mt-1 w-28" aria-hidden="true" />
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 pb-24 pt-6">
        {/* section chips */}
        <Reveal>
          <nav
            aria-label="Journal sections"
            className="flex flex-wrap items-center justify-center gap-2 pb-10"
          >
            <SectionChip href="/journal" label="Everything" count={null} active={!section} />
            {SECTIONS.map((s) => (
              <SectionChip
                key={s.key}
                href={`/journal?section=${s.key}`}
                label={s.label}
                count={counts[s.key]}
                active={section === s.key}
              />
            ))}
          </nav>
        </Reveal>

        {/* empty section */}
        {entries.length === 0 && (
          <Reveal className="card-surface mx-auto max-w-xl rounded-2xl p-10 text-center">
            <h2 className="font-display text-2xl text-ivory">Nothing filed here yet</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              This section is waiting on its first entry. In the meantime, the rest of the
              Journal is{" "}
              <Link href="/journal" className="text-champagne hover:underline">
                over here
              </Link>
              .
            </p>
          </Reveal>
        )}

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
                  {section ? "Latest" : `Latest · ${sectionLabel(lead.section)}`}
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
                    {!section && (
                      <p className="text-[0.6rem] uppercase tracking-[0.3em] text-gold/80">
                        {sectionLabel(e.section)}
                      </p>
                    )}
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

function SectionChip({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number | null;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${
        active
          ? "border-gold/60 bg-gold/10 text-champagne"
          : "border-line text-muted hover:border-gold/40 hover:text-ivory"
      }`}
    >
      {label}
      {count !== null && (
        <span className="ml-2 text-[0.6rem] font-normal tracking-normal text-muted/60">
          {count}
        </span>
      )}
    </Link>
  );
}
