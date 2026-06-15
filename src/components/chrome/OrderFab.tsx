"use client";

/**
 * Floating "Order Now" speed-dial — bottom-right, z-[60].
 *
 * Main pill: gold gradient + trophy glyph + sheen sweep, with a subtle
 * attention pulse ring every ~8s (suppressed for reduced motion). Click
 * expands upward into three labelled channels: Call, Email, WhatsApp.
 * Backdrop click + Esc close, aria-expanded, focus cycles through the
 * options while open and returns to the main button on close.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { enquiryWhatsAppLink, mailtoLink, telLink } from "@/lib/order-links";
import { site } from "@/config/site";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const EMAIL_SUBJECT = "Enquiry — Trophies & Awards | The Grace";
const EMAIL_BODY = [
  "Hi The Grace,",
  "",
  "I'd like a quote for trophies / medals / corporate gifts.",
  "",
  "Occasion or event:",
  "Quantity:",
  "Customisation (engraving / logo):",
  "Needed by (date):",
  "",
  "Thank you!",
].join("\n");

function trapTab(e: KeyboardEvent, container: HTMLElement) {
  const nodes = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

export function OrderFab() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLButtonElement>(null);
  const firstActionRef = useRef<HTMLAnchorElement>(null);

  /* Esc closes (returns focus), Tab cycles through the dial */
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => firstActionRef.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        mainRef.current?.focus();
      } else if (e.key === "Tab" && rootRef.current) {
        trapTab(e, rootRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /* links only rendered while open (client-side), so hrefs use the live page URL */
  const actions = [
    {
      key: "call",
      label: `Call ${site.phonePretty()}`,
      short: "Call us now",
      href: telLink(),
      external: false,
      className:
        "border border-gold/30 bg-ink-3/95 text-champagne backdrop-blur-md hover:border-gold hover:bg-ink-4",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-4 w-4"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
        </svg>
      ),
    },
    {
      key: "email",
      label: "Email enquiry",
      short: "Email your brief",
      href: mailtoLink(EMAIL_SUBJECT, EMAIL_BODY),
      external: false,
      className:
        "border border-gold/30 bg-ink-3/95 text-champagne backdrop-blur-md hover:border-gold hover:bg-ink-4",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-4 w-4"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      ),
    },
    {
      key: "whatsapp",
      label: "WhatsApp us",
      short: "Fastest reply",
      href: enquiryWhatsAppLink(),
      external: true,
      className:
        "bg-[#1faa53] text-white shadow-[0_8px_32px_-8px_rgba(37,211,102,0.45)] hover:bg-[#22bb5b]",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
          <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.42-9.43a9.36 9.36 0 0 1 6.66 2.76 9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.23 9.43-9.43 9.43zm8.02-17.44A11.3 11.3 0 0 0 12.03.75C5.8.75.73 5.82.73 12.06c0 1.99.52 3.93 1.51 5.64L.65 23.25l5.68-1.49a11.27 11.27 0 0 0 5.7 1.55h.01c6.23 0 11.3-5.07 11.3-11.3 0-3.02-1.17-5.86-3.28-8z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="fab-backdrop"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[59] bg-ink/55 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <div ref={rootRef} className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
        <style>{`@keyframes fab-pulse{0%,86%{transform:scale(1);opacity:0}88%{transform:scale(1);opacity:.6}100%{transform:scale(1.5);opacity:0}}`}</style>

        {/* speed-dial actions */}
        <AnimatePresence>
          {open && (
            <motion.ul
              key="fab-actions"
              id="order-fab-menu"
              aria-label="Order channels"
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={{
                hidden: {
                  transition: { staggerChildren: reduce ? 0 : 0.04, staggerDirection: -1 },
                },
                show: {
                  transition: {
                    staggerChildren: reduce ? 0 : 0.07,
                    delayChildren: reduce ? 0 : 0.05,
                    staggerDirection: -1,
                  },
                },
              }}
              className="flex flex-col items-end gap-2.5"
            >
              {actions.map((a, i) => (
                <motion.li
                  key={a.key}
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: reduce ? 0 : 14,
                      scale: reduce ? 1 : 0.92,
                      transition: { duration: reduce ? 0 : 0.2, ease: EASE },
                    },
                    show: {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: { duration: reduce ? 0 : 0.35, ease: EASE },
                    },
                  }}
                >
                  <a
                    ref={i === 0 ? firstActionRef : undefined}
                    href={a.href}
                    {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-full py-2.5 pl-3.5 pr-5 text-sm font-medium tracking-wide transition-all duration-300 ease-[var(--ease-lux)] hover:-translate-y-px ${a.className}`}
                  >
                    <span
                      aria-hidden="true"
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10"
                    >
                      {a.icon}
                    </span>
                    <span className="flex flex-col leading-tight">
                      <span>{a.label}</span>
                      <span className="text-[10px] font-normal uppercase tracking-[0.18em] opacity-70">
                        {a.short}
                      </span>
                    </span>
                  </a>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        {/* main button */}
        <button
          ref={mainRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="order-fab-menu"
          aria-label={open ? "Close order options" : "Order now — call, email or WhatsApp"}
          className="gold-sheen group relative inline-flex cursor-pointer items-center gap-2.5 rounded-full bg-[linear-gradient(110deg,#b8902c,#d4af37_45%,#eed688_55%,#d4af37)] bg-[length:200%_100%] p-3.5 text-sm font-semibold tracking-wide text-ink shadow-[var(--shadow-gold)] transition-all duration-300 ease-[var(--ease-lux)] hover:-translate-y-px hover:bg-[position:100%_0] hover:shadow-[0_0_56px_-8px_rgba(212,175,55,0.55)] active:translate-y-0 sm:px-6 sm:py-3.5"
        >
          {/* attention pulse ring (~8s cycle, GPU only, hidden for reduced motion) */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-gold opacity-0 motion-reduce:hidden"
            style={{ animation: "fab-pulse 8s linear infinite" }}
          />
          {open ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
              className="h-5 w-5"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-5 w-5"
            >
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          )}
          <span className="hidden sm:inline">{open ? "Close" : "Order Now"}</span>
        </button>
      </div>
    </>
  );
}
