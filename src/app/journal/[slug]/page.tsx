import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/config/site";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ENTRIES, getEntry, getEntries, formatDate, sectionLabel } from "@/lib/journal";

export function generateStaticParams() {
  return ENTRIES.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getEntry(slug);
  if (!entry) return { title: "Journal" };
  return {
    title: entry.title,
    description: entry.excerpt,
    alternates: { canonical: `/journal/${entry.slug}` },
    openGraph: {
      type: "article",
      title: entry.title,
      description: entry.excerpt,
      publishedTime: entry.date,
      images: [{ url: entry.image }],
    },
  };
}

export default async function JournalEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getEntry(slug);
  if (!entry) notFound();

  const more = getEntries()
    .filter((e) => e.slug !== entry.slug)
    .slice(0, 2);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.title,
    description: entry.excerpt,
    datePublished: entry.date,
    image: `${site.url}${entry.image}`,
    author: { "@type": "Organization", name: site.legalName },
    publisher: { "@type": "Organization", name: site.legalName },
    mainEntityOfPage: `${site.url}/journal/${entry.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article>
        {/* masthead */}
        <header className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={entry.image}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,9,0.72),rgba(8,8,9,0.88)_60%,var(--color-ink))]"
            />
          </div>
          <div className="relative z-10 mx-auto max-w-3xl px-6 pb-16 pt-[calc(var(--header-h)+5rem)] text-center">
            <Reveal className="flex flex-col items-center gap-5">
              {/* back to the section this entry belongs to, not the whole
                  index — a reader who arrived from News wants News */}
              <Link
                href={`/journal?section=${entry.section}`}
                className="text-[0.65rem] uppercase tracking-[0.3em] text-gold/90 transition-colors duration-300 hover:text-champagne"
              >
                ← {sectionLabel(entry.section)}
              </Link>
              <h1 className="font-display text-4xl leading-[1.08] text-ivory [text-wrap:balance] md:text-5xl lg:text-6xl">
                {entry.title}
              </h1>
              <p className="text-xs text-muted">
                <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                <span aria-hidden="true"> · </span>
                {entry.readingMinutes} min read
              </p>
              <div className="gold-rule mt-1 w-24" aria-hidden="true" />
            </Reveal>
          </div>
        </header>

        {/* body */}
        <div className="mx-auto max-w-2xl px-6 pb-20">
          {entry.body.map((para, i) =>
            para.startsWith("## ") ? (
              <Reveal key={i}>
                <h2 className="mt-12 font-display text-2xl text-ivory md:text-3xl">
                  {para.slice(3)}
                </h2>
              </Reveal>
            ) : (
              <Reveal key={i}>
                <p className="mt-6 text-base leading-[1.85] text-muted md:text-lg">{para}</p>
              </Reveal>
            )
          )}

          <div className="gold-rule mt-14" aria-hidden="true" />

          <Reveal className="mt-10 text-center">
            <p className="font-display text-xl italic text-ivory/90">{site.tagline}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button href="/craft-your-design" variant="gold">
                Craft your design
              </Button>
              <Button href="/products" variant="outline">
                Browse the collection
              </Button>
            </div>
          </Reveal>
        </div>
      </article>

      {/* more entries */}
      {more.length > 0 && (
        <section aria-label="More from the Journal" className="border-t border-line bg-ink-2">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.28em] text-champagne">
              More from the Journal
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {more.map((e, i) => (
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
                      <h3 className="font-display text-2xl leading-tight text-ivory transition-colors duration-300 group-hover:text-champagne">
                        {e.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted">{e.excerpt}</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
