/**
 * Cinematic hero backdrops.
 *
 * The catalogue product shots are now transparent cut-outs — perfect on the
 * light product cards, but not as full-bleed hero backdrops. So the page and
 * category heroes use the dark studio trophy plates in public/images/site,
 * which the HeroBackdrop treatment grades, washes and scrims.
 */

const TROPHY = "/images/site/hero-trophy.webp";
const TROPHY_ALT = "/images/site/hero-trophy-alt.webp";

const CATEGORY_HERO: Record<string, string> = {
  trophies: TROPHY,
  merchandise: TROPHY_ALT,
  gifting: TROPHY_ALT,
  medals: TROPHY,
  mementos: TROPHY,
  sports: TROPHY_ALT,
};

/** Best hero image for a category slug. */
export function heroForCategory(slug: string): string {
  return CATEGORY_HERO[slug] ?? TROPHY;
}

/** Hand-tuned heroes for the marquee + editorial pages. */
export const HERO = {
  premium: TROPHY,
  standard: TROPHY,
  products: TROPHY_ALT,
  about: TROPHY_ALT,
  contact: TROPHY,
  customization: TROPHY,
} as const;
