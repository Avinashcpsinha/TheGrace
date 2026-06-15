"use client";

/**
 * /account — a device-scoped "your orders" view. There are no user accounts on
 * The Grace; this reads the order IDs and delivery addresses saved in this
 * browser (see ./storage) so a returning visitor can jump back to tracking or
 * reuse an address. Everything stays local — nothing is fetched until the
 * visitor opens a specific order's tracking page.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  readAddresses,
  readOrderIds,
  writeAddresses,
  type SavedAddress,
} from "./storage";

export function AccountView() {
  const [hydrated, setHydrated] = useState(false);
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);

  useEffect(() => {
    setOrderIds(readOrderIds());
    setAddresses(readAddresses());
    setHydrated(true);
  }, []);

  function removeAddress(id: string) {
    const next = addresses.filter((a) => a.id !== id);
    setAddresses(next);
    writeAddresses(next);
  }

  if (!hydrated) return <div className="min-h-[40vh]" aria-hidden="true" />;

  const nothing = orderIds.length === 0 && addresses.length === 0;

  if (nothing) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h2 className="font-display text-4xl text-ivory [text-wrap:balance] md:text-5xl">
          Nothing saved here yet
        </h2>
        <p className="mt-4 leading-relaxed text-muted">
          Orders you place and addresses you save will appear here on this device — no login
          required. Already have an order ID? Track it directly.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button href="/products" size="lg">
            Browse all products
          </Button>
          <Button href="/track-order" variant="outline" size="lg">
            Track an order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
      {/* Orders */}
      <section aria-label="Your orders">
        <h2 className="font-display text-2xl text-ivory">Your orders</h2>
        <p className="mt-1 text-sm text-muted">Placed from this device, newest first.</p>

        {orderIds.length === 0 ? (
          <p className="mt-5 rounded-xl border border-line bg-ink-2/60 px-4 py-8 text-center text-sm text-muted">
            No orders placed from this browser yet.
          </p>
        ) : (
          <ul className="mt-5 space-y-2.5">
            {orderIds.map((id) => (
              <li
                key={id}
                className="card-surface flex items-center justify-between gap-3 rounded-xl px-4 py-3"
              >
                <span className="font-display text-lg tabular-nums text-champagne">{id}</span>
                <span className="flex gap-2">
                  <Link
                    href={`/track-order?id=${encodeURIComponent(id)}`}
                    className="rounded-full border border-line px-3 py-1.5 text-xs text-muted transition-colors duration-200 hover:border-gold/40 hover:text-champagne"
                  >
                    Track
                  </Link>
                  <Link
                    href={`/order/confirmed/${encodeURIComponent(id)}`}
                    className="rounded-full border border-line px-3 py-1.5 text-xs text-muted transition-colors duration-200 hover:border-gold/40 hover:text-champagne"
                  >
                    View
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Addresses */}
      <section aria-label="Saved addresses">
        <h2 className="font-display text-2xl text-ivory">Saved addresses</h2>
        <p className="mt-1 text-sm text-muted">Reused automatically at checkout.</p>

        {addresses.length === 0 ? (
          <p className="mt-5 rounded-xl border border-line bg-ink-2/60 px-4 py-8 text-center text-sm text-muted">
            No saved addresses yet.
          </p>
        ) : (
          <ul className="mt-5 space-y-2.5">
            {addresses.map((a) => (
              <li key={a.id} className="card-surface flex items-start justify-between gap-3 rounded-xl px-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ivory">{a.line}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {a.city}, {a.state} — {a.pincode}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removeAddress(a.id)}
                  aria-label={`Remove saved address ${a.line}`}
                  className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs text-muted transition-colors duration-200 hover:border-danger/40 hover:text-danger"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
