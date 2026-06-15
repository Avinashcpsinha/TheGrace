/**
 * CraftStory — split editorial about the Lajpat Nagar workshop.
 * Left: masked-text serif headline (.reveal-mask inside Reveal), two
 * paragraphs walking the pipeline (design → casting → gold electroplating →
 * engraving → QC), outline CTA to /about.
 * Right: CraftCounters — animated count-up stat grid (client child).
 */
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { CraftCounters } from "./CraftCounters";

const HEADLINE_LINES = ["From sketch to podium,", "every honour hand-finished."];

export function CraftStory() {
  return (
    <section className="spotlight relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-24 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.35em] text-gold/90">
            Our Craft
          </p>
          <h2 className="mt-4 font-display text-4xl leading-[1.08] text-ivory md:text-5xl">
            {HEADLINE_LINES.map((line, i) => (
              <span key={line} className="block">
                <span className="reveal-mask">
                  <span style={{ transitionDelay: `${150 + i * 140}ms` }}>{line}</span>
                </span>
              </span>
            ))}
          </h2>
          <div className="gold-rule mt-6 w-24" aria-hidden="true" />
          <p className="mt-8 leading-relaxed text-muted">
            Every commission begins on the drawing board of our Lajpat Nagar
            workshop — sketched, sculpted and cast in-house before the metal
            ever meets a polishing wheel. Each cup and figure then passes
            through our gold electroplating line, where the lustre that catches
            stage light is laid down micron by micron.
          </p>
          <p className="mt-5 leading-relaxed text-muted">
            Engraving is the final signature — names, dates and crests cut by
            hands that have done this for over a decade. And before anything is
            boxed, it stands one last inspection under ceremony-bright light,
            because that is exactly how it will be seen.
          </p>
          <div className="mt-9">
            <Button href="/about" variant="outline">
              Step inside the workshop
            </Button>
          </div>
        </Reveal>

        <Reveal delay={160}>
          <CraftCounters />
        </Reveal>
      </div>
    </section>
  );
}
