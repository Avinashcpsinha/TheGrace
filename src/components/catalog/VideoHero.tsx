"use client";

/**
 * VideoHero — a cinematic, full-bleed video hero for collection pages.
 *
 * Same editorial copy treatment as CollectionHero (breadcrumbs, gold eyebrow,
 * masked serif title, supporting line, gold rule) but backed by a looping,
 * muted, autoplaying film instead of a still. The video is confined to the
 * hero stage (min-h-[92svh]); any `children` (e.g. a materials marquee) render
 * below it on the pinned dark palette. A sound toggle is offered because the
 * clip carries audio; prefers-reduced-motion falls back to the poster still.
 */

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

export function VideoHero({
  videoSrc,
  poster,
  eyebrow,
  title,
  sub,
  crumbs,
  children,
}: {
  videoSrc: string;
  poster: string;
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
  crumbs?: Crumb[];
  children?: ReactNode;
}) {
  const reduce = useReducedMotion() ?? false;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  /* nudge autoplay along (some browsers ignore the attribute on mount) */
  useEffect(() => {
    if (reduce) return;
    videoRef.current?.play().catch(() => {
      /* autoplay blocked — the poster still covers the stage */
    });
  }, [reduce]);

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    setMuted(next);
    if (!next) v.play().catch(() => {});
  };

  return (
    <section className="spotlight tg-hero relative overflow-hidden bg-ink">
      <div className="relative min-h-[92svh] w-full">
        {/* the film */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover [filter:saturate(1.15)_contrast(1.03)]"
          src={videoSrc}
          poster={poster}
          muted={muted}
          loop
          playsInline
          autoPlay={!reduce}
          preload="auto"
        />

        {/* legibility scrims — tuck under the header, darken behind the copy,
            and melt the stage into the page colour below */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/65 via-ink/10 to-ink" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 100%, rgba(11,11,13,0.85) 0%, rgba(11,11,13,0.35) 40%, transparent 72%)",
          }}
        />

        {/* copy — breadcrumbs up top, title anchored toward the lower third */}
        <div className="relative z-10 mx-auto flex min-h-[92svh] max-w-7xl flex-col px-6 pb-16 pt-[calc(var(--header-h)+2rem)]">
          {crumbs && crumbs.length > 0 && (
            <Breadcrumbs items={crumbs} className="flex justify-center" />
          )}
          <Reveal className="mt-auto flex flex-col items-center gap-5 pb-4 text-center">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.35em] text-gold/90">
              {eyebrow}
            </p>
            <h1 className="max-w-4xl font-display text-5xl leading-[1.04] text-ivory [text-wrap:balance] md:text-6xl lg:text-7xl">
              <span className="reveal-mask">
                <span>{title}</span>
              </span>
            </h1>
            {sub && (
              <p className="max-w-2xl text-base leading-relaxed text-muted md:text-lg [text-shadow:0_2px_14px_rgba(0,0,0,0.6)]">
                {sub}
              </p>
            )}
            <div className="gold-rule mt-1 w-28" aria-hidden="true" />
          </Reveal>
        </div>

        {/* sound toggle */}
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? "Unmute video" : "Mute video"}
          title={muted ? "Unmute" : "Mute"}
          className="absolute bottom-5 left-5 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/40 text-ivory/90 backdrop-blur-md transition-colors hover:border-gold/40 hover:text-champagne"
        >
          {muted ? <IconMuted /> : <IconSound />}
        </button>
      </div>

      {children && <div className="relative z-10">{children}</div>}
    </section>
  );
}

function IconSound() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-[18px] w-[18px]">
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 5a9 9 0 0 1 0 14" />
    </svg>
  );
}

function IconMuted() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-[18px] w-[18px]">
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="m23 9-6 6" />
      <path d="m17 9 6 6" />
    </svg>
  );
}
