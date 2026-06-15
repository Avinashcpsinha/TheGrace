"use client";

/**
 * Admin shell — left sidebar (desktop) / sticky top bar (mobile) plus the
 * content well. Functional-first: ink surfaces, hairlines, gold accents,
 * Inter, no heavy animation. The storefront header (fixed, h-[var(--header-h)])
 * sits above everything, so the shell offsets itself below it.
 *
 * /admin/login renders bare (no sidebar) — auth is enforced per-page, not here.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/requests", label: "Requests" },
] as const;

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      /* clearing the cookie failed — still send them to login */
    }
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      aria-label="Log out of the admin console"
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-ink-3 px-3 py-2 text-xs font-medium text-muted transition-colors duration-200 hover:border-gold/40 hover:text-ivory disabled:opacity-50 ${className}`}
    >
      {busy ? "Logging out…" : "Logout"}
    </button>
  );
}

function NavLinks({ pathname, dense = false }: { pathname: string; dense?: boolean }) {
  return (
    <>
      {NAV.map((item) => {
        const active = isActive(pathname, item.href, "exact" in item && item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              dense
                ? `shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 ${
                    active
                      ? "bg-gold/15 text-champagne"
                      : "text-muted hover:bg-white/5 hover:text-ivory"
                  }`
                : `flex items-center gap-2.5 rounded-lg border-l-2 px-3.5 py-2.5 text-sm transition-colors duration-200 ${
                    active
                      ? "border-gold bg-gold/10 font-medium text-champagne"
                      : "border-transparent text-muted hover:bg-white/5 hover:text-ivory"
                  }`
            }
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Login screen: no sidebar — the page itself centers its card.
  if (pathname === "/admin/login") {
    return <div className="min-h-svh bg-ink pt-[var(--header-h)]">{children}</div>;
  }

  return (
    <div className="min-h-svh bg-ink pt-[var(--header-h)]">
      <div className="mx-auto flex w-full max-w-[1440px]">
        {/* Desktop sidebar */}
        <aside
          aria-label="Admin navigation"
          className="sticky top-[var(--header-h)] hidden h-[calc(100svh-var(--header-h))] w-60 shrink-0 flex-col border-r border-line bg-ink-2/70 md:flex"
        >
          <div className="border-b border-line px-5 py-5">
            <p className="font-display text-2xl leading-none">
              <span className="gold-text">The Grace</span>
            </p>
            <p className="mt-1.5 text-[11px] uppercase tracking-[0.22em] text-muted">
              Admin console
            </p>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
            <NavLinks pathname={pathname} />
          </nav>
          <div className="flex flex-col gap-2 border-t border-line px-3 py-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm text-muted transition-colors duration-200 hover:bg-white/5 hover:text-ivory"
            >
              <span aria-hidden="true">←</span> View site
            </Link>
            <LogoutButton className="w-full" />
          </div>
        </aside>

        {/* Content column */}
        <div className="min-w-0 flex-1">
          {/* Mobile top bar */}
          <div className="sticky top-[var(--header-h)] z-30 border-b border-line bg-ink-2/95 backdrop-blur md:hidden">
            <div className="flex items-center justify-between gap-3 px-4 pt-3">
              <p className="font-display text-lg leading-none">
                <span className="gold-text">The Grace</span>{" "}
                <span className="text-[10px] font-body uppercase tracking-[0.2em] text-muted">
                  Admin
                </span>
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="rounded-full px-3 py-1.5 text-xs text-muted transition-colors duration-200 hover:bg-white/5 hover:text-ivory"
                >
                  ← View site
                </Link>
                <LogoutButton />
              </div>
            </div>
            <nav
              aria-label="Admin navigation"
              className="flex gap-1 overflow-x-auto px-4 py-2.5 [scrollbar-width:none]"
            >
              <NavLinks pathname={pathname} dense />
            </nav>
          </div>

          <div className="px-4 py-6 md:px-8 md:py-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
