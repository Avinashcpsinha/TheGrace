"use client";

/**
 * ════════════════════════════════════════════════════════════════════
 *  VideoIntroHero — the cinematic landing intro.
 * ════════════════════════════════════════════════════════════════════
 *
 *  Plays public/Grace-Video8k.mp4 (the leather "THE GRACE" book opening)
 *  full-screen on a dark stage, then — once the book is open — freezes on
 *  the open spread and reveals two clickable "pages":
 *
 *     left  page → "Premium Trophies"  → leftPage.href   (/premium)
 *     right page → "General Trophies"  → rightPage.href  (/standard)
 *
 *  The video is constrained to a centred 16:9 box (its native ratio), so
 *  the two hotspot rectangles register against the exact same pixels on
 *  every screen size — no per-viewport recalculation needed.
 *
 *  • Autoplay is muted + playsInline (browser policy); a sound toggle is
 *    offered because the clip carries audio.
 *  • "Skip intro" jumps straight to the open spread.
 *  • prefers-reduced-motion → the open spread + links are shown at once,
 *    no playback.
 *  • The glass Header sits permanently on top of this section, so the intro
 *    carries no logo or theme switcher of its own and the skip button is
 *    offset below var(--header-h).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";

interface IntroPage {
  title: string;
  tagline: string;
  href: string;
}

interface VideoIntroHeroProps {
  videoSrc: string;
  posterCover: string; // first frame (closed book) — shown before playback
  posterOpen: string; // final open spread — the crisp freeze frame
  leftPage: IntroPage;
  rightPage: IntroPage;
}

/* The book finishes opening ~7s into the 10s clip, so playback stops there
   rather than running out the closing hold.

   This MUST stay in step with the frame held in posterOpen — that still is
   grabbed at exactly this timestamp. The video is paused and seeked to it as
   the still fades in, so the crossfade is still-over-identical-still and no
   transition is visible. Change one and you must regrab the other. */
const OPEN_AT = 7.0;

/* Hotspot rectangles as % of the 1280×720 frame, tracing the left
   ("Premium") and right ("General") pages of the open spread. */
/* Measured off the freeze frame — the t=7s frame of Grace-Video8k.mp4, held
   in public/images/site/intro-open.webp. The left page spans 9–49% of the
   16:9 stage, the right 50–90%, both 7–91% vertically. Re-measure these if
   the intro film is ever re-cut or a different frame is grabbed. */
const LEFT_HOTSPOT = { left: "9%", top: "7%", width: "40%", height: "84%" };
const RIGHT_HOTSPOT = { left: "50%", top: "7%", width: "40%", height: "84%" };

export function VideoIntroHero({
  videoSrc,
  posterCover,
  posterOpen,
  leftPage,
  rightPage,
}: VideoIntroHeroProps) {
  const reduce = useReducedMotion() ?? false;
  const videoRef = useRef<HTMLVideoElement>(null);
  const openedRef = useRef(false);
  const [opened, setOpened] = useState(false);
  const [muted, setMuted] = useState(true);

  /* reveal the open spread + the clickable pages (fires exactly once) */
  const open = useCallback(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    setOpened(true);
  }, []);

  /* reduced motion: skip straight to the interactive open spread */
  useEffect(() => {
    if (reduce) open();
  }, [reduce, open]);

  /* nudge autoplay along (some browsers ignore the attribute on mount) */
  useEffect(() => {
    if (reduce) return;
    videoRef.current?.play().catch(() => {
      /* autoplay blocked — the Skip / poster path still works */
    });
  }, [reduce]);

  /* Park the film on exactly the frame the still was grabbed from. timeupdate
     only fires ~4x/sec, so it can overshoot by a few frames — seeking back to
     OPEN_AT removes the drift, and the sparkles behind the book are moving
     enough that a few frames would otherwise register as a jump. */
  const freezeAtOpenFrame = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    try {
      v.currentTime = OPEN_AT;
    } catch {
      /* not seekable yet — the still fades in over it regardless */
    }
  }, []);

  const onTimeUpdate = () => {
    if (opened) return;
    if ((videoRef.current?.currentTime ?? 0) >= OPEN_AT) {
      freezeAtOpenFrame();
      open();
    }
  };

  const skip = () => {
    freezeAtOpenFrame();
    open();
  };

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    setMuted(next);
    if (!next) v.play().catch(() => {});
  };

  return (
    <section
      aria-label="The Grace — opening"
      /* Sticky, not relative: the intro pins to the viewport while the
         storefront below scrolls up and over it (see #after-book in
         app/page.tsx, which sits at z-10 on an opaque background). Sticky
         still establishes a containing block, so .tg-intro-stage and the
         other absolutely-positioned overlays are unaffected. */
      className="sticky top-0 z-0 h-[100svh] w-full overflow-hidden bg-ink"
    >
      {/* full-bleed stage: covers the viewport on desktop, fits (letterboxes)
          on portrait phones — see .tg-intro-stage in globals.css. The video,
          freeze frame and hotspots all live inside it, so the clickable pages
          stay aligned to the book no matter how the frame is cropped. */}
      <div className="tg-intro-stage">
        {/* the film */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={videoSrc}
          poster={posterCover}
          muted={muted}
          playsInline
          autoPlay={!reduce}
          preload="auto"
          onTimeUpdate={onTimeUpdate}
          /* safety net: if timeupdate never fires, still park on the open
             frame rather than leaving the closing hold under the still */
          onEnded={skip}
        />

        {/* crisp freeze of the open spread, faded in once the book is open */}
        <Image
          src={posterOpen}
          alt={`${leftPage.title} and ${rightPage.title} — open catalogue`}
          fill
          priority
          sizes="100vw"
          className={`object-cover transition-opacity duration-700 ${
            opened ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />

        {/* clickable pages */}
        <PageHotspot page={leftPage} rect={LEFT_HOTSPOT} active={opened} align="left" />
        <PageHotspot page={rightPage} rect={RIGHT_HOTSPOT} active={opened} align="right" />
      </div>

      {/* ─── viewport-anchored overlays (independent of the cropped stage) ─── */}

      {/* No logo or theme switcher here any more: the glass header is now
          permanently on top of the intro and already carries the crest and
          the centred wordmark, so both were duplicated — and anything above
          y=var(--header-h) would sit underneath it (header is z-50). */}

      {/* in-video controls (while playing) */}
      {!opened && (
        <>
          <button
            type="button"
            onClick={skip}
            /* clear of the fixed header, which now overlays the intro */
            className="absolute right-4 top-[calc(var(--header-h)+0.75rem)] z-30 rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-xs font-medium tracking-[0.18em] text-ivory/90 backdrop-blur-md transition-colors hover:border-gold/40 hover:text-champagne"
          >
            SKIP INTRO →
          </button>
          <button
            type="button"
            onClick={toggleSound}
            aria-label={muted ? "Unmute" : "Mute"}
            title={muted ? "Unmute" : "Mute"}
            className="absolute bottom-5 left-4 z-30 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/40 text-ivory/90 backdrop-blur-md transition-colors hover:border-gold/40 hover:text-champagne"
          >
            {muted ? <IconMuted /> : <IconSound />}
          </button>
        </>
      )}

      {/* invitation, revealed with the open spread */}
      <p
        className={`pointer-events-none absolute inset-x-0 bottom-6 z-20 mx-auto max-w-xl px-4 text-center text-sm tracking-[0.16em] text-ivory/90 [text-shadow:0_2px_12px_rgba(0,0,0,0.7)] transition-opacity duration-700 ${
          opened ? "opacity-100" : "opacity-0"
        }`}
      >
        Choose a collection — or{" "}
        <a
          href="#after-book"
          className="pointer-events-auto text-champagne underline-offset-4 hover:underline"
        >
          scroll to explore
        </a>{" "}
        the full storefront.
      </p>
    </section>
  );
}

/* one transparent page link, lit with a gold ring + label on hover/focus */
function PageHotspot({
  page,
  rect,
  active,
  align,
}: {
  page: IntroPage;
  rect: { left: string; top: string; width: string; height: string };
  active: boolean;
  align: "left" | "right";
}) {
  return (
    <Link
      href={page.href}
      aria-label={`${page.title} — ${page.tagline}`}
      tabIndex={active ? 0 : -1}
      style={rect}
      className={`group absolute z-10 flex items-end rounded-lg transition-all duration-500 ${
        align === "left" ? "justify-start" : "justify-end"
      } ${
        active
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      } ring-0 ring-gold/0 hover:bg-gold/5 hover:ring-2 hover:ring-gold/50 focus-visible:bg-gold/5 focus-visible:ring-2 focus-visible:ring-gold/60`}
    >
      <span
        className={`m-3 translate-y-2 rounded-full border border-gold/30 bg-ink/80 px-4 py-1.5 text-xs font-medium tracking-[0.14em] text-champagne opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100`}
      >
        {page.title} →
      </span>
    </Link>
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
