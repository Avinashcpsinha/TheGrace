/**
 * CategoryShowcase — editorial bento grid of category tiles.
 * First two categories render as large tiles (col-span-2 / row-span-2 on
 * desktop); the rest are standard tiles. When the remainder would leave an
 * orphan cell, the final category becomes a full-width cinematic tile.
 * Server component — all hover choreography is pure CSS (group-hover).
 */
import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/lib/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

type Cover = { src: string; blur: string; dominant?: string };
type TileVariant = "large" | "standard" | "wide";

const FALLBACK_COVER: Cover = { src: "/images/site/hero-trophy.webp", blur: "", dominant: "#12121a" };

function tileVariant(i: number, total: number): TileVariant {
  if (i < 2) return "large";
  if (i === total - 1 && (total - 2) % 4 === 1) return "wide";
  return "standard";
}

const spanCls: Record<TileVariant, string> = {
  large: "col-span-2 lg:col-span-2 lg:row-span-2",
  standard: "col-span-1",
  wide: "col-span-2 lg:col-span-4",
};

/** "X pieces" line, or a gold "Made to order" chip for empty categories. */
function CountLine({ count }: { count: number }) {
  if (count === 0) {
    return (
      <span className="inline-flex w-fit items-center rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-gold">
        Made to order
      </span>
    );
  }
  return <p className="text-xs tracking-wide text-muted">{count} pieces</p>;
}

/** Light sweep overlay — same gesture as ProductCard. */
function Sweep() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 translate-x-[-60%] bg-[linear-gradient(115deg,transparent_30%,rgba(255,250,230,0.35)_50%,transparent_70%)] opacity-0 [transition:transform_1.1s_var(--ease-lux),opacity_0.4s] group-hover:translate-x-[60%] group-hover:opacity-100"
    />
  );
}

function ArrowBadge() {
  return (
    <span
      aria-hidden="true"
      className="grid h-9 w-9 shrink-0 -translate-x-1 place-items-center rounded-full border border-line text-gold opacity-0 transition-all duration-300 ease-[var(--ease-lux)] group-hover:translate-x-0 group-hover:border-gold/60 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100"
    >
      →
    </span>
  );
}

function Tile({
  category,
  cover,
  variant,
}: {
  category: Category;
  cover: Cover;
  variant: TileVariant;
}) {
  const blurProps = cover.blur
    ? ({ placeholder: "blur", blurDataURL: cover.blur } as const)
    : {};
  const alt = `${category.name} — representative piece from the collection`;
  // the library is square, so square wells filled edge-to-edge show each
  // cover on the background it was shot on, with no letterbox band
  const imgCls =
    "object-cover transition-transform duration-700 ease-[var(--ease-lux)] group-hover:scale-[1.06]";
  const cardCls =
    "group card-surface h-full overflow-hidden rounded-2xl transition-[box-shadow,transform] duration-500 ease-[var(--ease-lux)] hover:shadow-[var(--shadow-gold)]";

  if (variant === "wide") {
    return (
      <Link
        href={`/category/${category.slug}`}
        aria-label={`Browse ${category.name}`}
        className={`${cardCls} flex flex-col sm:flex-row`}
      >
        <div className="flex flex-col justify-center gap-3 p-7 sm:w-2/5 md:p-10">
          <h3 className="font-display text-2xl leading-tight text-ivory transition-colors group-hover:text-champagne md:text-3xl [text-wrap:balance]">
            {category.name}
          </h3>
          <p className="text-sm leading-relaxed text-muted">{category.blurb}</p>
          <div className="mt-1 flex items-center gap-4">
            <CountLine count={category.count} />
            <ArrowBadge />
          </div>
        </div>
        <div
          className="photo-well relative min-h-56 flex-1 overflow-hidden sm:min-h-0"
          style={{ backgroundColor: cover.dominant }}
        >
          <Image
            src={cover.src}
            alt={alt}
            fill
            sizes="(max-width: 640px) 100vw, 60vw"
            {...blurProps}
            className={imgCls}
          />
          <Sweep />
        </div>
      </Link>
    );
  }

  const isLarge = variant === "large";
  return (
    <Link
      href={`/category/${category.slug}`}
      aria-label={`Browse ${category.name}`}
      className={`${cardCls} flex flex-col`}
    >
      <div
        style={{ backgroundColor: cover.dominant }}
        className="photo-well relative aspect-square overflow-hidden"
      >
        <Image
          src={cover.src}
          alt={alt}
          fill
          sizes={
            isLarge
              ? "(max-width: 1024px) 100vw, 50vw"
              : "(max-width: 1024px) 50vw, 25vw"
          }
          {...blurProps}
          className={imgCls}
        />
        <Sweep />
      </div>
      <div className="flex flex-1 items-end justify-between gap-3 p-5">
        <div className="flex flex-col gap-1.5">
          <h3
            className={`font-display leading-tight text-ivory transition-colors group-hover:text-champagne ${
              isLarge ? "text-2xl md:text-3xl" : "text-lg md:text-xl"
            }`}
          >
            {category.name}
          </h3>
          <p className={`text-muted leading-relaxed ${isLarge ? "text-sm" : "text-xs line-clamp-2"}`}>
            {category.blurb}
          </p>
          <div className="mt-1">
            <CountLine count={category.count} />
          </div>
        </div>
        <ArrowBadge />
      </div>
    </Link>
  );
}

export function CategoryShowcase({
  categories,
  covers,
}: {
  categories: Category[];
  covers: Record<string, Cover>;
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeading
        eyebrow="Browse the House"
        title="Shop by Category"
        sub="From boardroom crystal to stadium gold — find the shape your occasion deserves."
      />

      <div className="mt-14 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {categories.map((c, i) => (
          <Reveal
            key={c.slug}
            delay={i * 80}
            className={spanCls[tileVariant(i, categories.length)]}
          >
            <Tile
              category={c}
              cover={covers[c.slug] ?? FALLBACK_COVER}
              variant={tileVariant(i, categories.length)}
            />
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-14 text-center" delay={120}>
        <Button href="/products" variant="outline" size="lg">
          Explore all products
        </Button>
      </Reveal>
    </section>
  );
}
