"use client";

/**
 * /wishlist — resolves saved slugs to full products via POST /api/products
 * (keeps the 241-product catalog out of the client bundle), renders the
 * shared ProductCard grid with a "Move to cart" action beneath each card.
 */
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { useCart, useWishlist } from "@/lib/store";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";

const BATCH = 100; // /api/products accepts at most 100 slugs per request

function EmptyWishlist() {
  return (
    <div className="mx-auto max-w-xl py-20 text-center">
      <p
        aria-hidden="true"
        className="mx-auto mb-8 grid h-16 w-16 place-items-center rounded-full border border-gold/30 text-gold"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </p>
      <h2 className="font-display text-4xl leading-tight text-ivory [text-wrap:balance] md:text-5xl">
        Nothing saved — yet.
      </h2>
      <p className="mt-4 text-base leading-relaxed text-muted">
        Tap the heart on any piece to keep it here while you decide. Your saves live on this
        device.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button href="/products" size="lg">
          Browse all products
        </Button>
        <Button href="/premium" variant="outline" size="lg">
          Explore premium
        </Button>
      </div>
    </div>
  );
}

export function WishlistView() {
  const { wishlist, toggleWishlist, hydrated } = useWishlist();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState("");
  const requested = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!hydrated) return;
    const missing = wishlist.filter((s) => !requested.current.has(s));
    if (missing.length === 0) return;
    missing.forEach((s) => requested.current.add(s));

    const batches: string[][] = [];
    for (let i = 0; i < missing.length; i += BATCH) batches.push(missing.slice(i, i + BATCH));

    setPending((n) => n + batches.length);
    setError("");
    for (const slugs of batches) {
      fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs }),
      })
        .then((r) => {
          if (!r.ok) throw new Error("request failed");
          return r.json() as Promise<{ products: Product[] }>;
        })
        .then((data) =>
          setProducts((prev) => {
            const have = new Set(prev.map((p) => p.slug));
            return [...prev, ...data.products.filter((p) => !have.has(p.slug))];
          })
        )
        .catch(() => setError("We couldn't load your wishlist right now — please refresh."))
        .finally(() => setPending((n) => n - 1));
    }
  }, [hydrated, wishlist]);

  if (!hydrated) return <div className="min-h-[40vh]" aria-hidden="true" />;
  if (wishlist.length === 0) return <EmptyWishlist />;

  // preserve the order pieces were saved in
  const visible = wishlist
    .map((slug) => products.find((p) => p.slug === slug))
    .filter((p): p is Product => Boolean(p));

  const moveToCart = (p: Product) => {
    const size = p.sizes[0];
    addToCart({
      slug: p.slug,
      name: p.name,
      sku: p.sku,
      image: p.images[0]?.thumb ?? "",
      unitPrice: p.price + (size?.priceDelta ?? 0),
      size: size?.label ?? "Standard",
      qty: 1,
      category: p.category,
    });
    toggleWishlist(p.slug);
  };

  return (
    <div>
      <p aria-live="polite" className="sr-only">
        {pending > 0 ? "Loading your saved pieces…" : `${visible.length} saved pieces`}
      </p>

      {error && visible.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-display text-2xl text-ivory">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <div key={p.slug} className="flex flex-col gap-3">
              <ProductCard product={p} />
              <Button
                variant="dark"
                size="sm"
                className="w-full"
                onClick={() => moveToCart(p)}
                aria-label={`Move ${p.name} to cart`}
              >
                Move to cart
              </Button>
            </div>
          ))}
        </div>
      )}

      {pending > 0 && visible.length < wishlist.length && (
        <p className="mt-10 text-center text-sm text-muted">Curating your saves…</p>
      )}
    </div>
  );
}
