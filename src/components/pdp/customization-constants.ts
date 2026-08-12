/**
 * Shared constants for the customization flow — imported by both the client
 * form (src/components/pdp/CustomRequestForm.tsx) and the API route
 * (src/app/api/custom-request/route.ts) so the product-type list and upload
 * cap can never drift apart. No "use client" — safe on both sides.
 */

/**
 * The three things a customer can brief us on. The commission desk asks for
 * the stream first because it changes every question that follows: an award
 * needs engraving text and a ceremony date, a gift box needs a headcount and
 * a delivery address, merchandise needs artwork and sizes.
 *
 * `types` is the second-level detail offered once a stream is chosen; every
 * one of them appears in PRODUCT_TYPES below, which is what the API validates
 * against. Add a type here and the enum widens automatically.
 */
export const STREAMS = [
  {
    key: "awards",
    label: "Trophies & Awards",
    blurb: "Cups, crystal, medals, shields and mementos — anything that gets handed over on a stage.",
    asks: "Ceremony date, quantity and exactly how the names should read.",
    types: ["Trophies", "Medals", "Plaques", "Mementos", "Corporate Awards"],
  },
  {
    key: "gifting",
    label: "Corporate Gifting",
    blurb: "Gift boxes, hampers and welcome kits, presentation-packed and branded to your house style.",
    asks: "Headcount, budget per box and where it all needs to land.",
    types: ["Gift Sets", "Hampers", "Welcome Kits"],
  },
  {
    key: "merchandise",
    label: "Merchandise",
    blurb: "Branded drinkware, desk pieces, bags, apparel, keychains and lapel pins.",
    asks: "Artwork, quantities per item and any size breakdown.",
    types: ["Drinkware", "Desk & Décor", "Bags & Carry", "Apparel", "Keychains & Pins"],
  },
] as const;

export type StreamKey = (typeof STREAMS)[number]["key"];

/**
 * Every accepted productType: the three streams' types, plus "Other" for
 * briefs that do not fit. Written out rather than flattened from STREAMS
 * because zod's z.enum needs a literal non-empty tuple, not an array — the
 * assertion below is what keeps the two lists honest with each other.
 */
export const PRODUCT_TYPES = [
  "Trophies",
  "Medals",
  "Plaques",
  "Mementos",
  "Corporate Awards",
  "Gift Sets",
  "Hampers",
  "Welcome Kits",
  "Drinkware",
  "Desk & Décor",
  "Bags & Carry",
  "Apparel",
  "Keychains & Pins",
  "Other",
] as const;

/* Compile-time guard: every type listed under a stream must exist in
   PRODUCT_TYPES, or the API would reject a value the form can produce. */
type StreamType = (typeof STREAMS)[number]["types"][number];
const _streamTypesAreValid: readonly (typeof PRODUCT_TYPES)[number][] =
  [] as StreamType[];
void _streamTypesAreValid;

export type ProductType = (typeof PRODUCT_TYPES)[number];

/** Max accepted logo upload — checked client-side and enforced server-side. */
export const MAX_LOGO_BYTES = 4 * 1024 * 1024; // 4 MB
