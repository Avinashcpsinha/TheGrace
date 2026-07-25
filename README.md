# The Grace — Cinematic E-Commerce

A complete, production-ready e-commerce experience for **The Grace**, a premium trophy & awards
manufacturer in Lajpat Nagar, New Delhi (makers of official **Khelo India Games** awards).

The site opens on a scroll-driven 3D book: a leather-bound, gold-embossed volume that opens as you
scroll — left page, the Premium Collection; right page, the Standard Collection — then gracefully
hands over to a full storefront: 241 real products, instant search, filters, cart, checkout with
Razorpay/COD, and WhatsApp-first ordering throughout.

---

## Quick start

```bash
npm install
npm run ingest     # builds the catalog from ./public/New products (see below)
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

> No environment variables are required to run. Payments, email and admin password all have safe
> demo defaults — see **Configuration**.

## The catalog comes from the `public/New products/` folder

`npm run ingest` (scripts/ingest.mjs) scans `./public/New products/<Category>/…` — the customer's
photo library — and generates the entire catalog. The folder list below **is** the site
navigation: the header dropdown, the mobile menu, the homepage bento and every
`/category/<slug>` page read the generated `categories.json`, so adding or renaming a folder is
the only edit needed to change what the shop sells.

| Folder | Category | Slug |
|---|---|---|
| `New products/Trophies` | Trophies | `trophies` |
| `New products/Merchandise` | Merchandise | `merchandise` |
| `New products/Gifting` | Corporate Gifting | `gifting` |
| `New products/Medals` | Medals | `medals` |
| `New products/Momentos` | Mementos | `mementos` |
| `New products/Sports` | Sports Awards | `sports` |

The pipeline: content-hash **dedupe** → **black-background keying** (scripts/black-bg.mjs — see
below) → **WebP** renditions (≤1200px main + 480px thumb + 16px blur placeholder, 112 MB →
~19 MB) → deterministic naming (meaningful filenames are prettified; WhatsApp/camera/UUID
filenames get curated house names) → pricing, premium/standard split, sizes, materials,
occasions → `src/data/products.json`, `categories.json`, `hero.json`.

### Every plate is keyed onto black

The library is shot on white and light-grey studio sweeps; the storefront is a black house. So
`scripts/black-bg.mjs` flood-fills the sweep away from the border inward, feathers the silhouette
and premultiplies against `#000000`. The `.photo-well` behind every product image is the same
pure black, so the photo's field and the card are indistinguishable — only the piece shows.

Shots that are already on a dark background pass through untouched. A photo whose subject would
be destroyed by the key (a white product on a white sweep) is dropped rather than published
damaged — the ingest prints the count when that happens.

**To add products:** drop photos into the right folder under `public/New products/` and re-run
`npm run ingest`, then rebuild. Give files meaningful names (`Golden-Lotus-Cup.jpeg`) and those
names are used verbatim. The source folder is git- and deploy-ignored; only the keyed plates
under `public/images/products/` ship.

## Configuration (`.env.local`)

Copy `.env.example` → `.env.local`. Everything is optional:

| Variable | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | wa.me number for all order links (no `+`) | `917009112154` |
| `NEXT_PUBLIC_PHONE` / `_SECONDARY` | click-to-call numbers | real Grace numbers |
| `NEXT_PUBLIC_EMAIL` | mailto + order notifications | `info@thegrace.co.in` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` | enables the online-payment option at checkout (UPI/cards/netbanking). Leave empty → checkout offers COD + WhatsApp only | empty (hidden) |
| `NEXT_PUBLIC_COD_ENABLED` | Cash-on-Delivery toggle | `true` |
| `ADMIN_PASSWORD` | `/admin` password | `grace-admin-2026` |
| `SMTP_*` + `ORDER_NOTIFY_EMAIL` | order confirmation/notification emails (silently skipped if unset) | empty |
| `NEXT_PUBLIC_SITE_URL` | canonical URL for sitemap/OG/WhatsApp backlinks | `http://localhost:3000` |

## Ordering channels (the critical path)

- **WhatsApp deep links everywhere**: every product page and the cart have a first-class
  *Order on WhatsApp* button that pre-fills product name, SKU, size, quantity, engraving text,
  bulk-discounted price and the page URL. The floating **Order Now** button (bottom-right) expands
  into 📞 Call / ✉️ Email / 💬 WhatsApp on every page.
- **Checkout**: guest checkout with address book, GSTIN field for GST invoices, order notes;
  payment via Razorpay (when keys configured), COD, or "Order via WhatsApp".
- **Tracking**: `/track-order` with a gold timeline; status driven from the admin dashboard.

## Admin dashboard — `/admin`

Password: `ADMIN_PASSWORD` (default `grace-admin-2026` — change it). Manage orders (status
pipeline), products (price / stock / featured / premium / hidden overrides — no re-ingest needed),
and customization requests (with WhatsApp-reply deep links). See **docs/OWNER-GUIDE.md** for the
non-technical walkthrough.

Data persistence is a transparent JSON file store in `./data/` (orders, overrides, requests,
enquiries) — zero external services, perfect for a single-instance deployment. Swap `src/lib/db.ts`
for a hosted DB if you scale out; the function signatures are the contract.

## The Book — reusable hero component

`src/components/book/BookHero.tsx` is self-contained and reusable:

```tsx
<BookHero
  coverTitle="THE GRACE"                    // embossed gold serif on the cover
  coverSubtitle="Awards & Trophies · New Delhi"
  scrollHint="Scroll to open"
  leftPage={{                                // the premium page
    title: "Premium Trophies",
    tagline: "Crafted for moments that matter.",
    href: "/premium",
    image: { src: "/images/site/hero-trophy.webp", alt: "…" },
  }}
  rightPage={{                               // the collage page
    title: "Standard Trophies",
    tagline: "The regular collection…",
    href: "/standard",
    images: [{ src, blur, alt }, …],         // 6 thumbs
  }}
/>
```

Behaviour: scroll-scrubbed GSAP/ScrollTrigger timeline (pinned ~300vh, `scrub: 1` for weighted,
reversible motion), CSS 3D book (GPU transforms only — chosen over WebGL for guaranteed 60 fps on
every device; the component is structured so a WebGL book can be swapped in behind the same props),
canvas dust particles, camera dolly, and an outro that hands off to the page. Emits
`tg:book-progress` events that the glass header listens to. **Accessibility**: a visible
"Open the book" button skips the animation; `prefers-reduced-motion` users get a static open
spread; both pages are keyboard-focusable links. Mobile gets a lighter, still scroll-driven
treatment. To change the hero trophy: `src/data/hero.json` lists 12 curated candidates — copy one
to `public/images/site/hero-trophy.webp` or edit `src/app/page.tsx`.

## Tech

Next.js 15 (App Router, RSC, TypeScript strict) · Tailwind CSS v4 design tokens · GSAP +
ScrollTrigger (scrubbed book timeline) · Lenis smooth scroll (synced to GSAP ticker) ·
Framer Motion micro-interactions · `next/image` with AVIF/WebP + blur placeholders · Razorpay ·
zod-validated API routes · JSON-file persistence.

SEO: per-page metadata, Product + Organization JSON-LD, OpenGraph image, `sitemap.xml`
(all 241 products), `robots.txt`, India-focused keywords. `prefers-reduced-motion` respected
globally; full keyboard navigation.

## Deployment

- **Vercel**: works out of the box (`next build`). Note the JSON store writes to `./data` — on
  Vercel use it read-only/demo, or swap `src/lib/db.ts` for KV/Postgres.
- **Self-hosted (recommended for the file store)**: `npm run build && npm start` behind nginx/IIS;
  persist the `./data` directory.

## Docs

- [docs/OWNER-GUIDE.md](docs/OWNER-GUIDE.md) — 1-page guide for the shop owner (manage products & orders)
- [docs/QA-CHECKLIST.md](docs/QA-CHECKLIST.md) — mobile + desktop QA checklist (60 fps verification)
- [docs/CONTRACT.md](docs/CONTRACT.md) — build conventions / architecture contract

*Stat figures on the homepage (awards delivered, institutions served) are representative marketing
copy — edit them in `src/components/home/CraftStory.tsx`. Demo catalog prices are generated;
set real prices in `/admin/products`.*
