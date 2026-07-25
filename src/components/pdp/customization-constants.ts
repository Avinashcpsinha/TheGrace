/**
 * Shared constants for the customization flow — imported by both the client
 * form (src/components/pdp/CustomRequestForm.tsx) and the API route
 * (src/app/api/custom-request/route.ts) so the product-type list and upload
 * cap can never drift apart. No "use client" — safe on both sides.
 */

export const PRODUCT_TYPES = [
  "Trophies",
  "Medals",
  "Plaques",
  "Merchandise",
  "Corporate Awards",
  "Other",
] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

/** Max accepted logo upload — checked client-side and enforced server-side. */
export const MAX_LOGO_BYTES = 4 * 1024 * 1024; // 4 MB
