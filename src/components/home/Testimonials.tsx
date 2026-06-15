"use client";

/**
 * Testimonials — auto-advancing pull-quote carousel (6s, pauses on
 * hover/focus). Crossfade + slight rise via framer-motion AnimatePresence
 * inside a height-stable (min-h) stage. Arrows + dots, all keyboard
 * reachable. Reduced motion: no auto-advance, quotes swap instantly —
 * dots and arrows stay functional. Personas are invented for the demo.
 */
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

interface Quote {
  quote: string;
  name: string;
  role: string;
}

const QUOTES: Quote[] = [
  {
    quote:
      "Three hundred engraved awards for our annual night — every nameplate flawless, every box ribboned. Leadership kept asking who made them.",
    name: "Anjali Mehrotra",
    role: "Head of HR, Veritas Softworks",
  },
  {
    quote:
      "From the rolling shield to two hundred sports-day medals, everything arrived a week early and gleaming. Our students treat them like treasure.",
    name: "Dr. Kavita Raghavan",
    role: "Principal, Greenfield International School",
  },
  {
    quote:
      "We commissioned the full podium set for our district games. The cups stood shoulder to shoulder with what you see at national events.",
    name: "Rakesh Yadav",
    role: "District Sports Officer, Meerut",
  },
  {
    quote:
      "I order engraved mementos for every wedding I plan. Guests assume they are imported — I tell them: Lajpat Nagar, by The Grace.",
    name: "Aisha Chandna",
    role: "Founder, Marigold Weddings",
  },
  {
    quote:
      "Our investor gifting had to feel like the brand — minimal, heavy, gold-stamped. They nailed it in a single sampling round.",
    name: "Arjun Bedi",
    role: "Co-founder, Northstar Labs",
  },
];

const EASE_LUX: [number, number, number, number] = [0.22, 1, 0.36, 1];

function QuoteContent({ q }: { q: Quote }): ReactNode {
  return (
    <>
      <blockquote className="mx-auto max-w-3xl font-display text-xl italic leading-snug text-champagne sm:text-2xl md:text-[1.75rem] [text-wrap:balance]">
        {q.quote}
      </blockquote>
      <figcaption className="mt-6">
        <span className="block text-sm uppercase tracking-[0.22em] text-ivory">
          {q.name}
        </span>
        <span className="mt-1.5 block text-[0.65rem] uppercase tracking-[0.3em] text-muted">
          {q.role}
        </span>
      </figcaption>
    </>
  );
}

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (paused || reduced) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % QUOTES.length),
      6000
    );
    return () => window.clearInterval(id);
  }, [paused, reduced]);

  const go = (i: number) => setIndex((i + QUOTES.length) % QUOTES.length);
  const current = QUOTES[index];

  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <SectionHeading
        eyebrow="Word of Honour"
        title="Trusted at every podium"
        sub="Corporates, schools, sports bodies and planners — the people who hand over the honours."
      />

      <Reveal className="mt-12">
        <div
          role="group"
          aria-roledescription="carousel"
          aria-label="Client testimonials"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {/* gold quotation ornament */}
          <span
            aria-hidden="true"
            className="gold-text block select-none text-center font-display text-7xl leading-[0.6] md:text-8xl"
          >
            &ldquo;
          </span>

          {/* height-stable stage */}
          <div className="relative mt-6 min-h-[20rem] sm:min-h-[15rem] md:min-h-[13rem]">
            {reduced ? (
              <figure className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
                <QuoteContent q={current} />
              </figure>
            ) : (
              <AnimatePresence initial={false}>
                <motion.figure
                  key={index}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.65, ease: EASE_LUX }}
                  className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center"
                >
                  <QuoteContent q={current} />
                </motion.figure>
              </AnimatePresence>
            )}
          </div>

          {/* controls */}
          <div className="mt-10 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous testimonial"
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-line text-muted transition-colors duration-300 hover:border-gold/60 hover:text-gold"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <div className="flex items-center gap-2.5" role="tablist" aria-label="Choose testimonial">
              {QUOTES.map((q, i) => (
                <button
                  key={q.name}
                  type="button"
                  role="tab"
                  onClick={() => go(i)}
                  aria-label={`Go to testimonial ${i + 1} of ${QUOTES.length}: ${q.name}`}
                  aria-selected={i === index}
                  className={`h-2.5 cursor-pointer rounded-full transition-all duration-300 ease-[var(--ease-lux)] ${
                    i === index
                      ? "w-7 bg-gold"
                      : "w-2.5 bg-line hover:bg-muted"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next testimonial"
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-line text-muted transition-colors duration-300 hover:border-gold/60 hover:text-gold"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
