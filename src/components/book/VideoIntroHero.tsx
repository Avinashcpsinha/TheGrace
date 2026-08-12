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

/* Where the film is parked.
 *
 * The clip is 10s at 24fps. The book has finished opening by ~6.5s, but the
 * camera keeps pushing in afterwards and only comes to rest around 8s —
 * measured as per-frame luma difference, motion falls 3.9 (t=7.0) → 1.1
 * (t=8.0) → 0.5 (t=8.2–9.3), then climbs again past 9.5s as the shot starts
 * moving out. Stopping at 7.0 froze the film mid-move, which is what read as
 * an abrupt ending; 8.25 lands in the dead-calm window, where only the
 * sparkles are still twinkling and the freeze is invisible.
 *
 * 8.25 × 24 = frame 198 exactly, so pausing here always lands on a whole
 * frame rather than mid-frame.
 *
 * This MUST stay in step with the frame held in posterOpen — that still is
 * grabbed at exactly this timestamp. The video is paused on it as the still
 * fades in, so the crossfade is still-over-identical-still and no transition
 * is visible. Change one and you must regrab the other:
 *
 *   ffmpeg -ss 8.25 -i public/Grace-Video8k.mp4 -frames:v 1 open.png
 *   sharp(open.png).resize(2560,1440,{kernel:'lanczos3'})
 *     .sharpen({sigma:0.5,m1:0.4,m2:1.0}).webp({quality:92})
 */
const OPEN_AT = 8.25;

/* One frame at 24fps. Used as the tolerance for "close enough to OPEN_AT" —
   correcting a sub-frame drift would only cause a needless re-decode. */
const FRAME = 1 / 24;

/* Any audio is faded down across the last stretch of playback so an unmuted
   soundtrack settles with the picture instead of being cut off mid-note. */
const AUDIO_FADE = 1.4;

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

  /* Park the film on exactly the frame the still was grabbed from. The clock
     is only corrected when the pause landed more than a frame off: the
     watcher below stops within a single frame, and seeking backwards over
     live sparkles is itself the jump the freeze exists to avoid. */
  const freezeAtOpenFrame = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    if (Math.abs(v.currentTime - OPEN_AT) > FRAME) {
      try {
        v.currentTime = OPEN_AT;
      } catch {
        /* not seekable yet — the still fades in over it regardless */
      }
    }
  }, []);

  /* Frame-accurate stop.
     `timeupdate` fires only ~4×/sec, so it overshot OPEN_AT by up to six
     frames and the correcting seek yanked the picture visibly backwards —
     the single biggest reason the ending did not read as clean.
     requestVideoFrameCallback runs once per *presented* frame, so playback
     halts within one frame and there is nothing left to correct. rAF is the
     fallback where rVFC is missing (Firefox). */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || reduce) return;

    const media = v as HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
      cancelVideoFrameCallback?: (handle: number) => void;
    };
    const useRvfc = typeof media.requestVideoFrameCallback === "function";
    let handle = 0;

    function schedule() {
      handle = useRvfc
        ? media.requestVideoFrameCallback!(tick)
        : window.requestAnimationFrame(tick);
    }

    function tick() {
      handle = 0;
      if (openedRef.current) return;

      const t = v!.currentTime;

      /* ride the soundtrack down with the picture rather than cutting it */
      if (!v!.muted) {
        v!.volume = Math.min(1, Math.max(0, (OPEN_AT - t) / AUDIO_FADE));
      }

      /* Half a frame of lead. Stopping *at* OPEN_AT would hang on float
         error — 8.2499999 fails the test, so the next frame overshoots and
         has to be seeked back, which is the jump we came here to remove.
         The lead can only ever land us on the frame before, and one frame
         apart in this passage is a sparkle, not a movement. */
      if (t >= OPEN_AT - FRAME / 2) {
        freezeAtOpenFrame();
        open();
        return;
      }
      schedule();
    }

    schedule();
    return () => {
      if (!handle) return;
      if (useRvfc) media.cancelVideoFrameCallback?.(handle);
      else window.cancelAnimationFrame(handle);
    };
  }, [reduce, open, freezeAtOpenFrame]);

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
          /* safety net: if the frame watcher never runs, still park on the
             open frame rather than leaving the closing hold under the still */
          onEnded={skip}
        />

        {/* crisp freeze of the open spread, faded in once the book is open */}
        <Image
          src={posterOpen}
          alt={`${leftPage.title} and ${rightPage.title} — open catalogue`}
          fill
          priority
          sizes="100vw"
          /* Long, decelerating dissolve. The frame underneath is identical, so
             the only thing crossfading is the still's extra sharpness — over
             1.2s that reads as the picture settling, not as a cut. */
          className={`object-cover transition-opacity duration-[1200ms] ease-[cubic-bezier(0.33,1,0.68,1)] ${
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

      {/* In-video controls. Faded rather than unmounted: popping them out of
          existence on the same tick the film stopped was its own little jolt
          at the end of the intro. */}
      {/* inset-0 rather than a bare wrapper: fading opacity creates a stacking
          context, so the layer needs its own z-30 to stay above the hotspots,
          and its own box for the buttons to anchor against. */}
      <div
        aria-hidden={opened}
        className={`pointer-events-none absolute inset-0 z-30 transition-opacity duration-500 ease-out ${
          opened ? "opacity-0" : "opacity-100"
        }`}
      >
        <button
          type="button"
          onClick={skip}
          tabIndex={opened ? -1 : 0}
          /* clear of the fixed header, which now overlays the intro */
          className="pointer-events-auto absolute right-4 top-[calc(var(--header-h)+0.75rem)] rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-xs font-medium tracking-[0.18em] text-ivory/90 backdrop-blur-md transition-colors hover:border-gold/40 hover:text-champagne disabled:pointer-events-none"
          disabled={opened}
        >
          SKIP INTRO →
        </button>
        <button
          type="button"
          onClick={toggleSound}
          tabIndex={opened ? -1 : 0}
          disabled={opened}
          aria-label={muted ? "Unmute" : "Mute"}
          title={muted ? "Unmute" : "Mute"}
          className="pointer-events-auto absolute bottom-5 left-4 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/40 text-ivory/90 backdrop-blur-md transition-colors hover:border-gold/40 hover:text-champagne disabled:pointer-events-none"
        >
          {muted ? <IconMuted /> : <IconSound />}
        </button>
      </div>

      {/* invitation, revealed with the open spread */}
      <p
        /* held back until the dissolve is most of the way through, so the line
           arrives on a settled picture instead of racing it */
        className={`pointer-events-none absolute inset-x-0 bottom-6 z-20 mx-auto max-w-xl px-4 text-center text-sm tracking-[0.16em] text-ivory/90 [text-shadow:0_2px_12px_rgba(0,0,0,0.7)] transition-opacity duration-700 ${
          opened ? "opacity-100 delay-700" : "opacity-0"
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
