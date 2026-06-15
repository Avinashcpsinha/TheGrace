"use client";

/**
 * Scroll-reveal wrapper. Children fade/rise into view once via
 * IntersectionObserver. Adds the `in-view` class (which also triggers any
 * nested `.reveal-mask` text reveals). Respects prefers-reduced-motion.
 */
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export function Reveal({
  children,
  className = "",
  delay = 0,
  y = 28,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "li" | "span";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("in-view");
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in-view");
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          io.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style: CSSProperties = {
    opacity: 0,
    transform: `translateY(${y}px)`,
    transition: `opacity 1s var(--ease-lux) ${delay}ms, transform 1s var(--ease-lux) ${delay}ms`,
    willChange: "opacity, transform",
  };

  return (
    // @ts-expect-error — polymorphic tag with shared ref
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}
