const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatINR = (n: number) => inr.format(n);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** linear interpolation — used by all scroll-smoothing code */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
