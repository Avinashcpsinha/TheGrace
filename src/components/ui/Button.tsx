import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "gold" | "outline" | "ghost" | "whatsapp" | "dark";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium tracking-wide rounded-full transition-all duration-300 ease-[var(--ease-lux)] select-none disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-gold cursor-pointer";

const variants: Record<Variant, string> = {
  gold: "bg-[linear-gradient(110deg,#b8902c,#d4af37_45%,#eed688_55%,#d4af37)] bg-[length:200%_100%] text-ink shadow-[var(--shadow-gold)] hover:bg-[position:100%_0] hover:shadow-[0_0_56px_-8px_rgba(212,175,55,0.55)] hover:-translate-y-px active:translate-y-0",
  outline:
    "border border-gold/50 text-champagne hover:bg-gold/10 hover:border-gold hover:-translate-y-px active:translate-y-0",
  ghost: "text-muted hover:text-ivory hover:bg-white/5",
  whatsapp:
    "bg-[#1faa53] text-white hover:bg-[#22bb5b] shadow-[0_8px_32px_-8px_rgba(37,211,102,0.45)] hover:-translate-y-px active:translate-y-0",
  dark: "bg-ink-3 border border-line text-ivory hover:border-gold/40 hover:-translate-y-px active:translate-y-0",
};

const sizes: Record<Size, string> = {
  sm: "text-xs px-4 py-2",
  md: "text-sm px-6 py-3",
  lg: "text-base px-8 py-4",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

export function Button(props: ButtonProps | LinkProps) {
  const { variant = "gold", size = "md", className = "", children, ...rest } = props;
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if ("href" in props && props.href !== undefined) {
    const { href, ...anchor } = rest as LinkProps;
    const external = /^(https?:|tel:|mailto:)/.test(href as string);
    if (external) {
      return (
        <a href={href as string} className={cls} {...(anchor as AnchorHTMLAttributes<HTMLAnchorElement>)}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href as string} className={cls} {...(anchor as Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">)}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
