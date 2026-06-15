/**
 * Site footer — the closing curtain. Server component.
 * Brand block, Collections, Support and Visit-us columns over bg-ink-2
 * with a gold rule on top; bottom bar with copyright and payment badges.
 * All contact details come from @/config/site; categories from the catalog.
 */
import Link from "next/link";
import { site } from "@/config/site";
import { getCategories } from "@/lib/catalog";

/** +917009112154 → +91 70091 12154 */
function prettyPhone(phone: string): string {
  const p = phone.replace(/\s/g, "");
  return p.length === 13 ? `${p.slice(0, 3)} ${p.slice(3, 8)} ${p.slice(8)}` : phone;
}

const SUPPORT_LINKS = [
  { href: "/products", label: "All Products" },
  { href: "/customization", label: "Customization" },
  { href: "/track-order", label: "Track Order" },
  { href: "/cart", label: "Cart" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

const linkCls =
  "text-sm text-muted transition-colors duration-300 hover:text-ivory";
const headingCls =
  "font-display text-sm font-semibold uppercase tracking-[0.28em] text-champagne";

export function Footer() {
  const categories = getCategories();
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-ink-2">
      <div className="gold-rule" aria-hidden="true" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {/* 1 — brand */}
        <div>
          <Link href="/" aria-label="The Grace — home" className="inline-flex flex-col leading-none">
            <span className="gold-text font-display text-2xl font-semibold tracking-[0.28em]">
              THE GRACE
            </span>
            <span className="mt-1.5 text-[0.55rem] font-medium tracking-[0.42em] text-muted">
              AWARDS · NEW DELHI
            </span>
          </Link>
          <p className="mt-5 font-display text-lg italic text-ivory/90 [text-wrap:balance]">
            {site.tagline}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Makers of the official Khelo India Games awards.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <a
              href={site.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="The Grace on Instagram"
              className="grid h-10 w-10 place-items-center rounded-full border border-line text-muted transition-colors duration-300 hover:border-gold/60 hover:text-gold"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="h-[18px] w-[18px]"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
              </svg>
            </a>
            <a
              href={site.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="The Grace on LinkedIn"
              className="grid h-10 w-10 place-items-center rounded-full border border-line text-muted transition-colors duration-300 hover:border-gold/60 hover:text-gold"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.554V9h3.565v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
              </svg>
            </a>
          </div>
        </div>

        {/* 2 — collections */}
        <nav aria-label="Collections">
          <h2 className={headingCls}>Collections</h2>
          <ul className="mt-5 space-y-2.5">
            <li>
              <Link href="/premium" className={linkCls}>
                Premium
              </Link>
            </li>
            <li>
              <Link href="/standard" className={linkCls}>
                Standard
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className={linkCls}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* 3 — support */}
        <nav aria-label="Support">
          <h2 className={headingCls}>Support</h2>
          <ul className="mt-5 space-y-2.5">
            {SUPPORT_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkCls}>
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/admin"
                className="text-xs text-muted/50 transition-colors duration-300 hover:text-muted"
              >
                Admin
              </Link>
            </li>
          </ul>
        </nav>

        {/* 4 — visit us */}
        <div>
          <h2 className={headingCls}>Visit Us</h2>
          <address className="mt-5 space-y-2.5 text-sm not-italic leading-relaxed text-muted">
            <p>
              {site.address.line},
              <br />
              {site.address.locality}, {site.address.city} — {site.address.postalCode}
            </p>
            <p>
              <a
                href={`tel:${site.phone.replace(/\s/g, "")}`}
                className="transition-colors duration-300 hover:text-champagne"
              >
                {prettyPhone(site.phone)}
              </a>
              <br />
              <a
                href={`tel:${site.phoneSecondary.replace(/\s/g, "")}`}
                className="transition-colors duration-300 hover:text-champagne"
              >
                {prettyPhone(site.phoneSecondary)}
              </a>
            </p>
            <p>
              <a
                href={`mailto:${site.email}`}
                className="transition-colors duration-300 hover:text-champagne"
              >
                {site.email}
              </a>
            </p>
            <p className="text-ivory/80">Mon–Sat · 10:00–19:00 IST</p>
          </address>
        </div>
      </div>

      {/* bottom bar */}
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-muted sm:flex-row">
          <p>
            © {year} {site.name} · Crafted with pride in Delhi
          </p>
          <ul aria-label="Accepted payment methods" className="flex items-center gap-2">
            {["UPI", "Cards", "NetBanking", "COD"].map((m) => (
              <li
                key={m}
                className="rounded border border-line px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-muted/90"
              >
                {m}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
