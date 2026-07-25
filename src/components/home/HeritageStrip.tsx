"use client";

/**
 * HeritageStrip — full-bleed auto-drifting strip of signature award photos.
 * Two motions compose: a slow seamless marquee drift (GSAP, looping
 * xPercent) inside a ScrollTrigger-scrubbed parallax shift (±12vw across the
 * section's pass through the viewport). GPU transforms only.
 * Reduced motion: a static, keyboard-scrollable overflow-x row.
 */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export interface HeritageStripImage {
  src: string;
  blur: string;
  alt: string;
}

export function HeritageStrip({ images }: { images: HeritageStripImage[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrubRef = useRef<HTMLDivElement>(null);
  const driftRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      if (!scrubRef.current || !driftRef.current) return;
      // scroll-scrubbed parallax: the whole strip glides as the band passes
      gsap.fromTo(
        scrubRef.current,
        { x: () => window.innerWidth * 0.12 },
        {
          x: () => -window.innerWidth * 0.12,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
      );
      // perpetual drift: two identical sets, loop by exactly one set width
      gsap.to(driftRef.current, {
        xPercent: -50,
        ease: "none",
        duration: 52,
        repeat: -1,
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const cardSet = (decorative: boolean) => (
    <div className="flex shrink-0 gap-5 pr-5" aria-hidden={decorative || undefined}>
      {images.map((img, i) => (
        <div
          key={`${img.src}-${i}`}
          className="card-surface w-44 shrink-0 overflow-hidden rounded-2xl md:w-56"
        >
          <div className="photo-well relative aspect-[3/4]">
            <Image
              src={img.src}
              alt={decorative ? "" : img.alt}
              fill
              sizes="(max-width: 768px) 11rem, 14rem"
              placeholder="blur"
              blurDataURL={img.blur}
              className="object-contain p-4"
            />
          </div>
        </div>
      ))}
    </div>
  );

  if (reduced) {
    return (
      <div
        role="region"
        aria-label="Signature award pieces from the workshop"
        tabIndex={0}
        className="overflow-x-auto px-6 py-2"
      >
        {cardSet(false)}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative overflow-hidden py-2">
      {/* edge fades into the band background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-[linear-gradient(90deg,var(--color-ink-2),transparent)] md:w-28"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-[linear-gradient(270deg,var(--color-ink-2),transparent)] md:w-28"
      />
      <div ref={scrubRef} className="will-change-transform">
        <div ref={driftRef} className="flex w-max will-change-transform">
          {cardSet(false)}
          {cardSet(true)}
        </div>
      </div>
    </div>
  );
}
