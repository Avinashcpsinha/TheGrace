import Image from "next/image";

/**
 * Full-bleed cinematic hero backdrop. Drop it as the FIRST child of a
 * `relative overflow-hidden` hero section that carries the `.tg-hero`
 * class (which pins the section to a dark + gold palette on every theme).
 *
 * The studio product shots are on light backgrounds, so the treatment does
 * the heavy lifting: a warm, saturated grade keeps the gold glowing, a
 * vignette melts the edges into the page, and a centred scrim darkens
 * behind the title for legibility.
 */
export function HeroBackdrop({ src, alt = "" }: { src: string; alt?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* the photograph — warm + saturated so the gold reads as gold */}
      <Image
        src={src}
        alt={alt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center [filter:saturate(1.4)_contrast(1.05)_brightness(0.82)]"
      />

      {/* warm gold wash (lifts the colour without graying it) */}
      <div className="absolute inset-0 bg-gold/20 mix-blend-soft-light" />

      {/* vignette — edges dissolve into the page colour (theme token) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(135% 130% at 50% 32%, transparent 0%, transparent 36%, var(--color-ink) 100%)",
        }}
      />

      {/* centred legibility scrim behind the title (.tg-hero pins ink to onyx) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(82% 66% at 50% 50%, rgba(11,11,13,0.82) 0%, rgba(11,11,13,0.55) 45%, transparent 80%)",
        }}
      />

      {/* top + bottom linear scrim — tucks under the header, blends into the page below */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-transparent to-ink" />
    </div>
  );
}
