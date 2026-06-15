import type { CartItem } from "./types";

/** Bulk pricing tiers — shown on PDPs and applied in cart/checkout. */
export const BULK_TIERS = [
  { min: 100, off: 0.2, label: "100+ pcs" },
  { min: 50, off: 0.15, label: "50–99 pcs" },
  { min: 25, off: 0.1, label: "25–49 pcs" },
  { min: 10, off: 0.05, label: "10–24 pcs" },
] as const;

export function bulkDiscountRate(qty: number): number {
  for (const t of BULK_TIERS) if (qty >= t.min) return t.off;
  return 0;
}

/** Effective unit price for a quantity (bulk tier applied). */
export function unitPriceFor(basePrice: number, qty: number): number {
  return Math.round(basePrice * (1 - bulkDiscountRate(qty)));
}

export interface CartTotals {
  subtotal: number; // sum of unitPrice × qty, before bulk discounts
  bulkDiscount: number;
  total: number;
  itemCount: number;
}

export function cartTotals(items: CartItem[]): CartTotals {
  let subtotal = 0;
  let discounted = 0;
  let itemCount = 0;
  for (const it of items) {
    subtotal += it.unitPrice * it.qty;
    discounted += unitPriceFor(it.unitPrice, it.qty) * it.qty;
    itemCount += it.qty;
  }
  return {
    subtotal,
    bulkDiscount: subtotal - discounted,
    total: discounted,
    itemCount,
  };
}
