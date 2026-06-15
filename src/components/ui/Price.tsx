import { formatINR } from "@/lib/format";

export function Price({
  price,
  compareAtPrice,
  className = "",
  size = "md",
}: {
  price: number;
  compareAtPrice?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "text-sm", md: "text-lg", lg: "text-2xl" };
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className={`${sizes[size]} font-semibold text-champagne`}>{formatINR(price)}</span>
      {compareAtPrice && compareAtPrice > price && (
        <>
          <span className="text-xs text-muted line-through">{formatINR(compareAtPrice)}</span>
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-success">
            {Math.round((1 - price / compareAtPrice) * 100)}% off
          </span>
        </>
      )}
    </span>
  );
}
