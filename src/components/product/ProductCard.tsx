"use client";

/**
 * Shared product card — used on home, collections, category pages, search
 * and related products. Hover: subtle 3D tilt + lift + gold glow; quick
 * actions for wishlist and WhatsApp ordering.
 */
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { Product } from "@/lib/types";
import { useWishlist } from "@/lib/store";
import { productWhatsAppLink } from "@/lib/order-links";
import { Price } from "@/components/ui/Price";

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const { wishlist, toggleWishlist } = useWishlist();
  const wished = wishlist.includes(product.slug);
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const img = product.images[0];

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(900px) rotateY(${(px * 5).toFixed(2)}deg) rotateX(${(-py * 5).toFixed(2)}deg) translateY(-4px)`;
    });
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(raf.current);
    el.style.transform = "";
  };

  const wa = productWhatsAppLink({
    name: product.name,
    sku: product.sku,
    qty: 1,
    unitPrice: product.price,
    path: `/product/${product.slug}`,
  });

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="group relative card-surface rounded-2xl overflow-hidden transition-[box-shadow,transform] duration-500 ease-[var(--ease-lux)] hover:shadow-[var(--shadow-gold)] will-change-transform"
    >
      <Link
        href={`/product/${product.slug}`}
        className="block focus-visible:outline-none"
        aria-label={`${product.name} — view details`}
      >
        {/* photo */}
        <div className="photo-well relative aspect-[4/5] overflow-hidden">
          <Image
            src={img.thumb}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            placeholder="blur"
            blurDataURL={img.blur}
            priority={priority}
            className="object-contain p-5 transition-transform duration-700 ease-[var(--ease-lux)] group-hover:scale-[1.06]"
          />
          {/* light sweep on hover */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[linear-gradient(115deg,transparent_30%,rgba(255,250,230,0.35)_50%,transparent_70%)] translate-x-[-60%] group-hover:translate-x-[60%] [transition:transform_1.1s_var(--ease-lux),opacity_0.4s]"
          />
          {product.premium && (
            <span className="absolute left-3 top-3 rounded-full bg-ink/85 border border-gold/40 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-gold">
              Premium
            </span>
          )}
          {!product.inStock && (
            <span className="absolute right-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-muted">
              Made to order
            </span>
          )}
        </div>

        {/* info */}
        <div className="p-4">
          <p className="text-[0.62rem] uppercase tracking-[0.25em] text-muted">
            {product.subcategory?.replace(/-/g, " ") ?? product.category.replace(/-/g, " ")}
          </p>
          <h3 className="mt-1 font-display text-lg leading-snug text-ivory line-clamp-1 group-hover:text-champagne transition-colors">
            {product.name}
          </h3>
          <div className="mt-2 flex items-center justify-between">
            <Price price={product.price} compareAtPrice={product.compareAtPrice} size="sm" />
            <span className="text-[0.65rem] text-gold opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              View →
            </span>
          </div>
        </div>
      </Link>

      {/* quick actions */}
      <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 focus-within:opacity-100 transition-all duration-300">
        <button
          type="button"
          onClick={() => toggleWishlist(product.slug, product.name)}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={wished}
          className={`grid h-9 w-9 place-items-center rounded-full border backdrop-blur-md transition-colors cursor-pointer ${
            wished
              ? "bg-gold text-ink border-gold"
              : "bg-ink/70 text-ivory border-line hover:border-gold/60 hover:text-gold"
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill={wished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Order ${product.name} on WhatsApp`}
          className="grid h-9 w-9 place-items-center rounded-full border border-line bg-ink/70 text-ivory backdrop-blur-md hover:border-[#25d366]/70 hover:text-[#25d366] transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.42-9.43a9.36 9.36 0 0 1 6.66 2.76 9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.23 9.43-9.43 9.43zm8.02-17.44A11.3 11.3 0 0 0 12.03 .75C5.8.75.73 5.82.73 12.06c0 1.99.52 3.93 1.51 5.64L.65 23.25l5.68-1.49a11.27 11.27 0 0 0 5.7 1.55h.01c6.23 0 11.3-5.07 11.3-11.3 0-3.02-1.17-5.86-3.28-8z" />
          </svg>
        </a>
      </div>
    </div>
  );
}
