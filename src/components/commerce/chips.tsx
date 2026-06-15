/**
 * Status chips shared across the commerce flow (server-safe, no hooks).
 * Paid / delivered → green · in-flight states → champagne gold (amber)
 * · cancelled / failed → muted red.
 */
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/types";

const CHIP_BASE =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] whitespace-nowrap";

const TONE = {
  green: "border-success/40 bg-success/10 text-success",
  amber: "border-gold/40 bg-gold/10 text-gold-bright",
  red: "border-danger/40 bg-danger/10 text-danger",
  muted: "border-line bg-ink-3 text-muted",
} as const;

type Tone = keyof typeof TONE;

const ORDER_META: Record<OrderStatus, { label: string; tone: Tone }> = {
  new: { label: "Placed", tone: "amber" },
  confirmed: { label: "Confirmed", tone: "amber" },
  in_production: { label: "In production", tone: "amber" },
  shipped: { label: "Shipped", tone: "amber" },
  delivered: { label: "Delivered", tone: "green" },
  cancelled: { label: "Cancelled", tone: "red" },
};

export function OrderStatusChip({ status }: { status: OrderStatus }) {
  const meta = ORDER_META[status] ?? { label: status, tone: "muted" as Tone };
  return <span className={`${CHIP_BASE} ${TONE[meta.tone]}`}>{meta.label}</span>;
}

function paymentMeta(method: PaymentMethod, status: PaymentStatus): { label: string; tone: Tone } {
  if (status === "paid") return { label: "Paid online", tone: "green" };
  if (status === "failed") return { label: "Payment failed", tone: "red" };
  if (status === "cod" || method === "cod") return { label: "Cash on Delivery", tone: "amber" };
  if (method === "whatsapp") return { label: "Confirming on WhatsApp", tone: "amber" };
  return { label: "Payment pending", tone: "amber" };
}

export function PaymentChip({
  method,
  status,
}: {
  method: PaymentMethod;
  status: PaymentStatus;
}) {
  const meta = paymentMeta(method, status);
  return <span className={`${CHIP_BASE} ${TONE[meta.tone]}`}>{meta.label}</span>;
}
