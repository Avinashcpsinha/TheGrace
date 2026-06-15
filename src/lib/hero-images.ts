import "server-only";
import productsJson from "@/data/products.json";

/**
 * Picks a strong catalogue image to use as a page's cinematic hero backdrop.
 * Preference: curated > premium > darker dominant (less white to darken) >
 * larger. Darker shots read best once the cinematic scrim is applied.
 */

interface PImg {
  src: string;
  width?: number;
  height?: number;
  dominant?: string;
}
interface P {
  category: string;
  premium?: boolean;
  curated?: boolean;
  inStock?: boolean;
  images?: PImg[];
}

const ALL: P[] = Array.isArray(productsJson)
  ? (productsJson as P[])
  : ((productsJson as { products: P[] }).products ?? []);

const FALLBACK = "/images/site/hero-trophy.webp";

function lum(hex?: string): number {
  if (!hex) return 999;
  const m = hex.replace("#", "");
  if (m.length < 6) return 999;
  const r = parseInt(m.slice(0, 2), 16),
    g = parseInt(m.slice(2, 4), 16),
    b = parseInt(m.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function pick(filter: (p: P) => boolean): string | undefined {
  const cands = ALL.filter(filter)
    .map((p) => ({ p, im: p.images?.[0] }))
    .filter((x): x is { p: P; im: PImg } => !!x.im && (x.im.width ?? 0) >= 800);
  cands.sort(
    (a, b) =>
      Number(b.p.premium) - Number(a.p.premium) ||
      lum(a.im.dominant) - lum(b.im.dominant) ||
      (b.im.width ?? 0) * (b.im.height ?? 0) - (a.im.width ?? 0) * (a.im.height ?? 0)
  );
  return cands[0]?.im.src;
}

/** Manual overrides where the auto-pick isn't the most hero-worthy shot. */
const CURATED: Record<string, string> = {
  gifting: "/images/products/gifting/sovereign-gift-set-2565.webp",
};

/** Best hero image for a category slug (override → curated → any). */
export function heroForCategory(slug: string): string {
  return (
    CURATED[slug] ??
    pick((p) => p.category === slug && !!p.curated) ??
    pick((p) => p.category === slug) ??
    FALLBACK
  );
}

/** Hand-tuned heroes for the marquee + editorial pages (strong trophy shots). */
export const HERO = {
  premium: "/images/site/hero-trophy.webp",
  standard: heroForCategory("trophies"),
  products: heroForCategory("sports"),
  about: "/images/site/hero-trophy-alt.webp",
  contact: heroForCategory("khelo-india"),
  customization: heroForCategory("trophies"),
} as const;
