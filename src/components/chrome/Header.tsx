"use client";

/**
 * Site header — fixed glassmorphic chrome (h-[var(--header-h)], z-50).
 *
 * Home ("/") choreography: hidden (translateY(-110%), opacity 0) until the
 * book hero opens. Listens for EV_BOOK_PROGRESS and reveals with a 0.6s
 * var(--ease-lux) slide once progress >= 0.98; once shown it only re-hides
 * when the user scrolls the book fully closed again (progress < 0.9).
 * Fallback for mid-page reloads / reduced motion (no GSAP timeline):
 * reveals when scrollY > 2 viewports. Every other route: always visible.
 *
 * The mobile menu and SearchOverlay are rendered as siblings of <header>
 * (not children) because the header's reveal transform would otherwise
 * become the containing block for their fixed positioning.
 */

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useStore } from "@/lib/store";
import { EV_BOOK_PROGRESS } from "@/lib/events";
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

const PRIMARY_LINKS = [
  { href: "/premium", label: "Premium" },
  { href: "/standard", label: "Standard" },
  { href: "/products", label: "All Products" },
  { href: "/customization", label: "Customization" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

const ICON_BTN =
  "relative grid h-10 w-10 place-items-center rounded-full text-muted transition-colors duration-300 hover:bg-white/5 hover:text-champagne cursor-pointer";

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
  const isHome = pathname === "/";
  const [revealed, setRevealed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { totals, wishlist, hydrated } = useStore();
  const reduce = useReducedMotion() ?? false;
  const menuRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const gotProgress = useRef(false);

  const visible = !isHome || revealed;
  const itemCount = totals.itemCount;
  const wishCount = wishlist.length;

  /* home: reveal once the book opens (with hysteresis), scroll fallback */
  useEffect(() => {
    if (!isHome) return;
    gotProgress.current = false;
    if (window.scrollY > window.innerHeight * 2) setRevealed(true);

    const onProgress = (e: Event) => {
      const p = (e as CustomEvent<{ progress: number }>).detail?.progress;
      if (typeof p !== "number") return;
      gotProgress.current = true;
      setRevealed((shown) => (shown ? p >= 0.9 : p >= 0.98));
    };
    const onScroll = () => {
      // fallback only — once the book reports progress, it owns visibility
      if (!gotProgress.current && window.scrollY > window.innerHeight * 2) {
        setRevealed(true);
      }
    };
    window.addEventListener(EV_BOOK_PROGRESS, onProgress);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener(EV_BOOK_PROGRESS, onProgress);
      window.removeEventListener("scroll", onScroll);
    };
  }, [isHome]);

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
  const productsActive = pathname === "/products" || pathname.startsWith("/category/");

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
        inert={!visible}
        className={`glass fixed inset-x-0 top-0 z-50 h-[var(--header-h)] transition-[transform,opacity] duration-[600ms] ease-[var(--ease-lux)] motion-reduce:transition-none ${
          visible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-[110%] opacity-0"
        }`}
      >
        <style>{`@keyframes badge-pop{0%{transform:scale(.4)}55%{transform:scale(1.3)}100%{transform:scale(1)}}`}</style>
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-6">
          {/* wordmark */}
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

          {/* desktop nav */}
          <nav aria-label="Primary" className="hidden items-center lg:flex">
            <NavLink href="/premium" label="Premium" active={isActive("/premium")} />
            <NavLink href="/standard" label="Standard" active={isActive("/standard")} />

            {/* All Products + categories dropdown */}
            <div className="group relative">
              <Link
                href="/products"
                aria-haspopup="true"
                aria-current={productsActive ? "page" : undefined}
                className={`relative flex items-center gap-1.5 px-3 py-2 text-sm tracking-wide transition-colors duration-300 ${
                  productsActive ? "text-champagne" : "text-muted hover:text-ivory"
                }`}
              >
                All Products
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="h-3 w-3 transition-transform duration-300 ease-[var(--ease-lux)] group-hover:rotate-180 motion-reduce:transition-none"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
                <Underline active={productsActive} />
              </Link>
              <div className="invisible absolute left-1/2 top-full -translate-x-1/2 pt-3 opacity-0 transition-[opacity,visibility] duration-300 ease-[var(--ease-lux)] group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 motion-reduce:transition-none">
                <div className="w-72 rounded-2xl border border-gold/15 bg-ink-2/95 p-2 shadow-[var(--shadow-card)] backdrop-blur-xl">
                  {CATEGORIES.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/category/${c.slug}`}
                      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors duration-200 hover:bg-white/5 hover:text-ivory focus-visible:bg-white/5 focus-visible:text-ivory"
                    >
                      <span>{c.name}</span>
                      <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-muted/70">
                        {c.count > 0 ? c.count : "made to order"}
                      </span>
                    </Link>
                  ))}
                  <div className="gold-rule my-2" aria-hidden="true" />
                  <Link
                    href="/products"
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-champagne transition-colors duration-200 hover:bg-gold/10"
                  >
                    Browse all products
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>

            <NavLink href="/customization" label="Customization" active={isActive("/customization")} />
            <NavLink href="/about" label="About" active={isActive("/about")} />
            <NavLink href="/contact" label="Contact" active={isActive("/contact")} />
          </nav>

          {/* actions */}
          <div className="flex items-center gap-1">
            <ThemeSwitcher className="mr-1.5 hidden sm:flex" />
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
              className={`${ICON_BTN} lg:hidden`}
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
            className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-ink/90 backdrop-blur-2xl lg:hidden"
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
                const active = n.href === "/products" ? productsActive : isActive(n.href);
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
      className={`relative px-3 py-2 text-sm tracking-wide transition-colors duration-300 ${
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
      className={`absolute inset-x-3 bottom-0.5 h-px bg-[linear-gradient(90deg,transparent,var(--color-gold),transparent)] transition-opacity duration-300 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
