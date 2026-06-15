"use client";

/**
 * Warm gold glow that trails the cursor (lerp-smoothed). Desktop pointers
 * only; renders nothing on touch devices or for reduced-motion users.
 */
import { useEffect, useRef, useState } from "react";
import { lerp } from "@/lib/format";

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    setEnabled(true);

    let x = innerWidth / 2, y = innerHeight / 3;
    let tx = x, ty = y;
    let raf = 0;
    const onMove = (e: PointerEvent) => { tx = e.clientX; ty = e.clientY; };
    const tick = () => {
      x = lerp(x, tx, 0.09);
      y = lerp(y, ty, 0.09);
      if (ref.current) ref.current.style.transform = `translate3d(${x - 300}px, ${y - 300}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => { removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, []);

  if (!enabled) return null;
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[5] h-[600px] w-[600px] rounded-full opacity-[0.07] will-change-transform"
      style={{
        background: "radial-gradient(circle, #e9c95e 0%, rgba(212,175,55,0.4) 30%, transparent 65%)",
      }}
    />
  );
}
