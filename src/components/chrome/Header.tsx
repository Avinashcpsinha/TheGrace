"use client";

/**
 * Site header — fixed transparent chrome (h-[var(--header-h)], z-50).
 * See .header-chrome in globals.css: no background, so the hero video and
 * page art run clean underneath.
 *
 * Always visible, on every route including the home video intro. It used to
 * hide itself on "/" until the intro reported EV_BOOK_PROGRESS >= 0.98 so the
 * film played uninterrupted; the brand now wants the nav present over the
 * hero, so the choreography is gone and the glass simply sits on top. The
 * intro's own duplicate logo and theme switcher were removed to match.
 *
 * The mobile menu and SearchOverlay are rendered as siblings of <header>
 * (not children) so the header never becomes the containing block for their
 * fixed positioning.
 */

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useStore } from "@/lib/store";
import categoriesJson from "@/data/categories.json";
import { SearchOverlay } from "./SearchOverlay";
import { ThemeSwitcher } from "./ThemeSwitcher";

interface CategoryLite {
  slug: string;
  name: string;
  count: number;
}

const CATEGORIES: CategoryLite[] = categoriesJson;

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Primary navigation, split either side of the centred wordmark (3 | 4),
 * mirroring the reference layout. Order is the customer's.
 */
const LEFT_LINKS = [
  { href: "/journal", label: "Journal" },
  { href: "/customization", label: "Customized Designs" },
  { href: "/category/gifting", label: "Corporate" },
] as const;

const RIGHT_LINKS = [
  { href: "/craft-your-design", label: "Craft Your Design" },
  { href: "/testimonials", label: "Client Testimonies" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Get In Touch" },
] as const;

/** Flat list for the mobile menu. */
const PRIMARY_LINKS = [...LEFT_LINKS, ...RIGHT_LINKS] as const;

/**
 * Display is deliberately NOT baked in here: `hidden` and `grid` are both
 * display utilities of equal specificity, so appending `hidden` to a class
 * string already containing `grid` does nothing. Callers add their own.
 */
const ICON_BTN_BASE =
  "relative h-10 w-10 place-items-center rounded-full text-muted transition-colors duration-300 hover:bg-white/5 hover:text-champagne cursor-pointer";

const ICON_BTN = `grid ${ICON_BTN_BASE}`;

function trapTab(e: KeyboardEvent, container: HTMLElement) {
  const nodes = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
  );
  if (nodes.length === 0) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  const active = document.activeElement;
  if (e.shiftKey) {
    if (active === first || !container.contains(active)) {
      e.preventDefault();
      last.focus();
    }
  } else if (active === last || !container.contains(active)) {
    e.preventDefault();
    first.focus();
  }
}

export function Header() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { totals, wishlist, hydrated } = useStore();
  const reduce = useReducedMotion() ?? false;
  const menuRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const itemCount = totals.itemCount;
  const wishCount = wishlist.length;

  /* Past the first few pixels the transparent chrome takes on a frosted
     backing (see .header-chrome[data-scrolled] in globals.css) so the nav
     stays readable once page content is running underneath it. Reads are
     batched into a rAF and the state only flips on a change, so the
     listener costs nothing while scrolling. */
  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      setScrolled(window.scrollY > 32);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  /* Ctrl / Cmd + K opens search */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* close overlays on navigation */
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  /* mobile menu: body scroll lock, Esc, focus trap, focus restore */
  useEffect(() => {
    if (!menuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const prevFocus = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
      else if (e.key === "Tab" && menuRef.current) trapTab(e, menuRef.current);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      prevFocus?.focus();
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const menuItem = {
    hidden: { opacity: 0, y: reduce ? 0 : 22 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.55, ease: EASE },
    },
  };

  return (
    <>
      <header
        data-scrolled={scrolled}
        className="header-chrome fixed inset-x-0 top-0 z-50 h-[var(--header-h)]"
      >
        <style>{`@keyframes badge-pop{0%{transform:scale(.4)}55%{transform:scale(1.3)}100%{transform:scale(1)}}`}</style>
        {/*
          Left cluster | wordmark | right cluster. Both clusters are
          flex-1 basis-0, so they claim equal width and the wordmark lands on
          the true midline. That only holds while each cluster fits inside its
          half — which is why the theme switcher lives in the footer, not here:
          with it, the right cluster overflowed and shouldered the wordmark
          off-centre (and then straight over "Craft Your Design").
        */}
        <div className="mx-auto flex h-full max-w-[1560px] items-center gap-2 px-4 sm:gap-4 sm:px-5 2xl:px-8">
          {/* left — crest + first three links */}
          <div className="flex flex-1 basis-0 items-center gap-4">
            <Link href="/" aria-label="The Grace — home" className="flex shrink-0 items-center">
              <Image
                src="/Logo.png"
                alt="The Grace"
                width={255}
                height={138}
                priority
                className="h-9 w-auto"
              />
            </Link>
            <nav aria-label="Primary" className="hidden items-center 2xl:flex">
              {LEFT_LINKS.map((l) => (
                <NavLink key={l.href} href={l.href} label={l.label} active={isActive(l.href)} />
              ))}
            </nav>
          </div>

          {/* centre — the footer wordmark, scaled to the header */}
          <Link
            href="/"
            aria-label="The Grace — home"
            className="flex shrink-0 flex-col items-center leading-none"
          >
            <span className="gold-text font-display text-sm font-semibold tracking-[0.18em] sm:text-base sm:tracking-[0.28em] lg:text-lg">
              THE GRACE
            </span>
            <span className="mt-1 hidden text-[0.5rem] font-medium tracking-[0.42em] text-muted sm:block">
              AWARDS · NEW DELHI
            </span>
          </Link>

          {/* right — last four links + actions */}
          <div className="flex flex-1 basis-0 items-center justify-end gap-3">
            <nav aria-label="Secondary" className="hidden items-center 2xl:flex">
              {RIGHT_LINKS.map((l) => (
                <NavLink key={l.href} href={l.href} label={l.label} active={isActive(l.href)} />
              ))}
            </nav>

            {/* actions */}
            <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search products (Ctrl + K)"
              title="Search — Ctrl + K"
              className={ICON_BTN}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
                className="h-[18px] w-[18px]"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>

            <Link
              href="/wishlist"
              aria-label={`Wishlist — ${wishCount} ${wishCount === 1 ? "item" : "items"} saved`}
              /* below sm the wordmark needs the room; wishlist stays in the menu */
              className={`hidden sm:grid ${ICON_BTN_BASE}`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="h-[18px] w-[18px]"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {hydrated && wishCount > 0 && (
                <span
                  key={`wish-${wishCount}`}
                  aria-hidden="true"
                  className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full border border-gold/40 bg-ink-3 px-1 text-[10px] font-bold leading-none text-champagne animate-[badge-pop_0.45s_var(--ease-lux)] motion-reduce:animate-none"
                >
                  {wishCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              aria-label={`Cart — ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
              className={ICON_BTN}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="h-[18px] w-[18px]"
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {hydrated && itemCount > 0 && (
                <span
                  key={`cart-${itemCount}`}
                  aria-hidden="true"
                  className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold px-1 text-[10px] font-bold leading-none text-ink shadow-[0_0_12px_rgba(212,175,55,0.45)] animate-[badge-pop_0.45s_var(--ease-lux)] motion-reduce:animate-none"
                >
                  {itemCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label="Open menu"
              className={`${ICON_BTN} 2xl:hidden`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
                className="h-5 w-5"
              >
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M7 17h13" />
              </svg>
            </button>
            </div>
          </div>
        </div>
      </header>

      {/* mobile full-screen menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            ref={menuRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            data-lenis-prevent="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}
            className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-ink/90 backdrop-blur-2xl 2xl:hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) setMenuOpen(false);
            }}
          >
            <div className="flex h-[var(--header-h)] shrink-0 items-center justify-between px-6">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                aria-label="The Grace — home"
                className="flex items-center"
              >
                <Image src="/Logo.png" alt="The Grace" width={255} height={138} className="h-8 w-auto" />
              </Link>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className={ICON_BTN}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  aria-hidden="true"
                  className="h-5 w-5"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <motion.nav
              aria-label="Mobile"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: {
                  transition: {
                    staggerChildren: reduce ? 0 : 0.06,
                    delayChildren: reduce ? 0 : 0.1,
                  },
                },
              }}
              className="flex flex-1 flex-col justify-center px-8 pb-12"
            >
              {PRIMARY_LINKS.map((n) => {
                const active = isActive(n.href);
                return (
                  <motion.div key={n.href} variants={menuItem}>
                    <Link
                      href={n.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`block py-2.5 font-display text-3xl tracking-wide transition-colors duration-300 ${
                        active ? "gold-text" : "text-ivory hover:text-champagne"
                      }`}
                    >
                      {n.label}
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div variants={menuItem} className="gold-rule my-6" aria-hidden="true" />

              <motion.div variants={menuItem} className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {CATEGORIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/category/${c.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="text-sm text-muted transition-colors duration-300 hover:text-ivory"
                  >
                    {c.name}
                    <span className="ml-1.5 text-[10px] text-muted/60">
                      {c.count > 0 ? c.count : "made to order"}
                    </span>
                  </Link>
                ))}
              </motion.div>

              <motion.div
                variants={menuItem}
                className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted"
              >
                <Link
                  href="/wishlist"
                  onClick={() => setMenuOpen(false)}
                  className="transition-colors duration-300 hover:text-champagne"
                >
                  Wishlist ({wishCount})
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setMenuOpen(false)}
                  className="transition-colors duration-300 hover:text-champagne"
                >
                  Cart ({itemCount})
                </Link>
                <Link
                  href="/track-order"
                  onClick={() => setMenuOpen(false)}
                  className="transition-colors duration-300 hover:text-champagne"
                >
                  Track Order
                </Link>
              </motion.div>

              <motion.div variants={menuItem} className="mt-8 flex items-center gap-3">
                <span className="text-xs uppercase tracking-[0.2em] text-muted/70">Theme</span>
                <ThemeSwitcher />
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

/* desktop nav link with gold underline accent */
function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative whitespace-nowrap px-2.5 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors duration-300 ${
        active ? "text-champagne" : "text-muted hover:text-ivory"
      }`}
    >
      {label}
      <Underline active={active} />
    </Link>
  );
}

function Underline({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute inset-x-2.5 bottom-0.5 h-px bg-[linear-gradient(90deg,transparent,var(--color-gold),transparent)] transition-opacity duration-300 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
