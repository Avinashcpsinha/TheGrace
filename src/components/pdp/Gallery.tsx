"use client";

/**
 * PDP gallery (client).
 * Warm photo-well panel with blur-up next/image; cursor-following hover zoom
 * (scale transform only — GPU); click opens a full-screen lightbox rendered
 * via portal (ESC + backdrop close, zoom toggle, small focus trap,
 * aria-modal). Thumbnail rail appears when a product has >1 image. Premium
 * badge overlay. Hover zoom is skipped under prefers-reduced-motion.
 */

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";
import type { ProductImage } from "@/lib/types";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ctrlBtn =
  "grid h-10 w-10 place-items-center rounded-full border border-line bg-ink/80 text-ivory backdrop-blur-md transition-colors duration-300 hover:border-gold/60 hover:text-gold cursor-pointer";

export function Gallery({
  images,
  name,
  premium,
}: {
  images: ProductImage[];
  name: string;
  premium: boolean;
}) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const zoomRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const img = images[Math.min(active, Math.max(images.length - 1, 0))];

  /* ── hover zoom: scale(2), transform-origin follows the cursor ────── */
  const onEnter = () => {
    if (prefersReducedMotion() || !zoomRef.current) return;
    zoomRef.current.style.transform = "scale(2)";
  };
  const onMove = (e: ReactMouseEvent<HTMLButtonElement>) => {
    const el = zoomRef.current;
    if (prefersReducedMotion() || !el) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    el.style.transformOrigin = `${x}% ${y}%`;
  };
  const onLeave = () => {
    if (zoomRef.current) zoomRef.current.style.transform = "scale(1)";
  };

  /* ── lightbox ─────────────────────────────────────────────────────── */
  const close = useCallback(() => {
    setOpen(false);
    setZoomed(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "Tab") {
        const root = dialogRef.current;
        if (!root) return;
        const nodes = root.querySelectorAll<HTMLElement>("button");
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [open, close]);

  if (!img) return null;

  const lightbox =
    mounted && open
      ? createPortal(
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${name} — full-screen gallery`}
            data-lenis-prevent
            className="fixed inset-0 z-[90] bg-ink/95 backdrop-blur-md"
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            {/* controls */}
            <div className="absolute right-4 top-4 z-10 flex gap-2">
              <button
                type="button"
                onClick={() => setZoomed((z) => !z)}
                aria-pressed={zoomed}
                aria-label={zoomed ? "Zoom out" : "Zoom in"}
                className={ctrlBtn}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                  <path d="M8 11h6" />
                  {!zoomed && <path d="M11 8v6" />}
                </svg>
              </button>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close full-screen view"
                className={ctrlBtn}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* stage — clicking the image toggles zoom */}
            <button
              type="button"
              onClick={() => setZoomed((z) => !z)}
              aria-label={zoomed ? "Zoom image out" : "Zoom image in"}
              className={`absolute inset-x-4 bottom-24 top-16 overflow-hidden md:inset-x-16 ${
                zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
              }`}
            >
              <span
                className={`absolute inset-0 block transition-transform duration-500 ease-[var(--ease-lux)] will-change-transform ${
                  zoomed ? "scale-[2]" : "scale-100"
                }`}
              >
                <Image
                  src={img.src}
                  alt={`${name} — full-screen product photo`}
                  fill
                  sizes="100vw"
                  placeholder="blur"
                  blurDataURL={img.blur}
                  className="object-contain"
                />
              </span>
            </button>

            {/* caption + thumbs */}
            <div className="absolute inset-x-0 bottom-5 flex flex-col items-center gap-3 px-6">
              {images.length > 1 && (
                <div role="group" aria-label="Choose image" className="flex gap-2">
                  {images.map((im, i) => (
                    <button
                      key={im.src}
                      type="button"
                      onClick={() => {
                        setActive(i);
                        setZoomed(false);
                      }}
                      aria-label={`Show image ${i + 1} of ${images.length}`}
                      aria-current={i === active ? "true" : undefined}
                      className={`photo-well relative h-14 w-12 overflow-hidden rounded-lg border transition-colors duration-300 cursor-pointer ${
                        i === active ? "border-gold" : "border-line hover:border-gold/50"
                      }`}
                    >
                      <Image src={im.thumb} alt="" fill sizes="48px" className="object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted">{name}</p>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div>
      {/* main photo well */}
      <div className="photo-well relative overflow-hidden rounded-3xl border border-line/60 shadow-[var(--shadow-card)]">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          onMouseEnter={onEnter}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          aria-label={`Open full-screen view of ${name}`}
          aria-haspopup="dialog"
          className="relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden"
        >
          <div
            ref={zoomRef}
            className="absolute inset-0 transition-transform duration-500 ease-[var(--ease-lux)] will-change-transform"
          >
            <Image
              src={img.src}
              alt={`${name} — product photo`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              placeholder="blur"
              blurDataURL={img.blur}
              className="object-contain p-8 md:p-10"
            />
          </div>
        </button>

        {premium && (
          <span className="pointer-events-none absolute left-4 top-4 rounded-full border border-gold/40 bg-ink/85 px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-gold">
            Premium
          </span>
        )}

        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-4 right-4 hidden items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.18em] text-muted backdrop-blur-md md:flex"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3M8 11h6M11 8v6" />
          </svg>
          Hover to zoom · click to expand
        </span>
      </div>

      {/* thumbnail rail */}
      {images.length > 1 && (
        <div role="group" aria-label={`${name} images`} className="mt-4 flex flex-wrap gap-3">
          {images.map((im, i) => (
            <button
              key={im.src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={i === active ? "true" : undefined}
              className={`photo-well relative h-20 w-16 overflow-hidden rounded-xl border transition-colors duration-300 cursor-pointer ${
                i === active ? "border-gold" : "border-line hover:border-gold/50"
              }`}
            >
              <Image src={im.thumb} alt="" fill sizes="64px" className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}

      {lightbox}
    </div>
  );
}
