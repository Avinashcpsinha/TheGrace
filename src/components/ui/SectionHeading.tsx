import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/** Standard section header: gold eyebrow, big serif headline, optional sub. */
export function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "center",
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  const alignCls = align === "center" ? "text-center items-center" : "text-left items-start";
  return (
    <Reveal className={`flex flex-col gap-4 ${alignCls} ${className}`}>
      {eyebrow && (
        <p className="text-[0.7rem] uppercase tracking-[0.35em] text-gold/90 font-medium">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] text-ivory [text-wrap:balance]">
        {title}
      </h2>
      {sub && <p className="max-w-2xl text-muted text-base md:text-lg leading-relaxed">{sub}</p>}
      <div className="gold-rule w-24 mt-2" aria-hidden="true" />
    </Reveal>
  );
}
