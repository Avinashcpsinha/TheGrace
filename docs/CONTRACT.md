# The Grace — Build Conventions (agent contract)

Read this fully before writing any code. The shared core is **frozen** — build on it, never edit it.

## Stack
Next.js 15 App Router + TypeScript (strict) · Tailwind CSS v4 (tokens in `src/app/globals.css` `@theme`) · GSAP + ScrollTrigger (scroll-scrubbed timelines) · Lenis (already wired in `chrome/SmoothScroll.tsx`, synced to GSAP ticker) · Framer Motion (UI micro-interactions only) · `next/image` everywhere (every product image has `blur` base64 + width/height).

## Frozen shared core (import, never edit)
| Module | Use |
|---|---|
| `@/config/site` | business config: phones, WhatsApp, email, address, socials, payments (`site.payments.razorpayKeyId`, `site.payments.codEnabled`) |
| `@/lib/types` | `Product`, `Category`, `CartItem`, `Order`, `OrderStatus`, `CustomRequest`… |
| `@/lib/catalog` | **server-only** data access: `getAllProducts()`, `getProduct(slug)`, `getProductsByCategory`, `getFeaturedProducts`, `getPremiumProducts`, `getStandardProducts`, `getCategories()`, `getCategory(slug)`, `getRelatedProducts(p)`, `getHeroData()` (all async except categories/hero) |
| `@/lib/db` | server-only JSON-file DB: `readCollection(name, fallback)`, `writeCollection`, `updateCollection`, `generateOrderId()` — data lives in `./data/*.json` |
| `@/lib/orders` | server-only: `listOrders()`, `getOrder(id)`, `createOrder(…)`, `updateOrder(id, patch)` |
| `@/lib/store` | client: `useCart()` → `{cart, totals, addToCart, removeFromCart, setQty, clearCart, hydrated}`; `useWishlist()` → `{wishlist, toggleWishlist}` |
| `@/lib/pricing` | `BULK_TIERS`, `bulkDiscountRate(qty)`, `unitPriceFor(base, qty)`, `cartTotals(items)` |
| `@/lib/order-links` | WhatsApp/tel/mailto builders: `productWhatsAppLink`, `cartWhatsAppLink`, `enquiryWhatsAppLink`, `telLink`, `mailtoLink`, `productOrderMessage`… |
| `@/lib/format` | `formatINR`, `formatDate`, `clamp`, `lerp` |
| `@/lib/events` | `emitBookProgress(p)`, `toast(msg)`, `EV_BOOK_PROGRESS`, `EV_TOAST` |
| `@/lib/mail` | server-only `sendOrderEmails(order)` (no-ops without SMTP env) |
| `@/components/ui/*` | `Button` (variants gold/outline/ghost/whatsapp/dark; href or onClick), `SectionHeading`, `Reveal`, `Magnetic`, `Price` |
| `@/components/product/ProductCard` | the only product card — never roll your own |

Catalog data: `src/data/products.json` (241 products), `categories.json`, `hero.json`. Access via `@/lib/catalog` on the server; pass data down as props. **Never import products.json in a client component** (bundle size).

## Design language
Dark luxury ceremony: bg `ink` (#0B0B0D), gold `gold`/`gold-bright`/`champagne`, text `ivory`, secondary `muted`, hairlines `line`. Headlines `font-display` (Cormorant) with `[text-wrap:balance]`; UI `font-body` (Inter). Utility classes in globals.css: `.gold-text`, `.gold-sheen`, `.glass`, `.card-surface`, `.photo-well` (warm ivory image well — REQUIRED behind product photos), `.grain`, `.spotlight`, `.gold-rule`, `.reveal-mask` (with `Reveal`). Motion: GPU transforms only (`transform`/`opacity`), ease `var(--ease-lux)`, respect `prefers-reduced-motion` in every animation you write. Section rhythm: `px-6 py-24 max-w-7xl mx-auto` unless full-bleed.

## Routes (the full map — do not invent others)
`/` home (book + sections) · `/premium` · `/standard` · `/products` (all, filters/sort/search) · `/category/[slug]` (+ subcategory filter) · `/product/[slug]` · `/customization` · `/about` · `/contact` · `/cart` · `/wishlist` · `/checkout` · `/order/confirmed/[id]` · `/track-order` · `/account` · `/search` · `/admin` (+ subpages) · API under `/app/api/*`.

## Rules
1. Own ONLY the files assigned to you; create them; never edit another area's files or the frozen core. The stub you replace documents its contract in the header comment.
2. Server components by default; `"use client"` only where interaction demands it.
3. Every interactive element keyboard-reachable with `aria-label`s; images get real `alt`; `aria-live` for async status.
4. INR via `formatINR`; never hardcode contact details — always `site.*` / `order-links`.
5. "Order on WhatsApp" is a first-class button wherever Add to Cart exists (`variant="whatsapp"`, `target="_blank" rel="noopener noreferrer"`).
6. Do NOT run `npm run dev`, `npm run build`, or `tsc` — the orchestrator handles verification centrally. Do not install packages.
7. Return a short JSON summary: files written, exports, anything the integrator must check.
