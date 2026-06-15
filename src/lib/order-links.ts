/**
 * WhatsApp / phone / email deep-link builders — the critical ordering path.
 * Every product page, the cart and the floating Order button use these.
 */
import { site } from "@/config/site";
import type { CartItem } from "./types";
import { cartTotals, unitPriceFor } from "./pricing";
import { formatINR } from "./format";

export const telLink = () => `tel:${site.phone.replace(/\s/g, "")}`;

export const waLink = (text: string) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;

export const mailtoLink = (subject: string, body: string) =>
  `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

/** current page URL, safe on the server (falls back to site root) */
const pageUrl = (path?: string) => {
  if (typeof window !== "undefined" && !path) return window.location.href;
  return `${site.url}${path ?? ""}`;
};

export interface ProductOrderInfo {
  name: string;
  sku: string;
  size?: string;
  qty: number;
  unitPrice: number;
  engraving?: string;
  path: string; // e.g. /product/aurelius-cup-ab12
}

/** "Hi The Grace, I'd like to order: …" for a single product */
export function productOrderMessage(p: ProductOrderInfo): string {
  const lines = [
    `Hi The Grace! I'd like to order:`,
    ``,
    `🏆 ${p.name} (${p.sku})`,
    `   Qty: ${p.qty}${p.size ? ` | Size: ${p.size}` : ""}`,
    `   Price: ${formatINR(unitPriceFor(p.unitPrice, p.qty))}/pc`,
  ];
  if (p.engraving) lines.push(`   Engraving: "${p.engraving}"`);
  lines.push(``, pageUrl(p.path));
  return lines.join("\n");
}

export const productWhatsAppLink = (p: ProductOrderInfo) =>
  waLink(productOrderMessage(p));

export const productMailtoLink = (p: ProductOrderInfo) =>
  mailtoLink(`Order enquiry — ${p.name} (${p.sku})`, productOrderMessage(p));

/** full-cart order message */
export function cartOrderMessage(items: CartItem[]): string {
  const t = cartTotals(items);
  const lines = [`Hi The Grace! I'd like to order:`, ``];
  for (const it of items) {
    lines.push(
      `🏆 ${it.name} (${it.sku})`,
      `   Qty: ${it.qty}${it.size && it.size !== "Standard" ? ` | Size: ${it.size}` : ""}` +
        (it.engraving ? ` | Engraving: "${it.engraving}"` : "")
    );
  }
  lines.push(``, `Total: ${formatINR(t.total)}${t.bulkDiscount > 0 ? ` (incl. bulk discount of ${formatINR(t.bulkDiscount)})` : ""}`);
  lines.push(``, pageUrl("/cart"));
  return lines.join("\n");
}

export const cartWhatsAppLink = (items: CartItem[]) => waLink(cartOrderMessage(items));
export const cartMailtoLink = (items: CartItem[]) =>
  mailtoLink("Order enquiry — The Grace", cartOrderMessage(items));

/** generic enquiry (floating button, contact page, empty categories) */
export const enquiryWhatsAppLink = (topic?: string) =>
  waLink(
    `Hi The Grace! I'd like to enquire about ${topic ?? "trophies and awards"}.\n${pageUrl()}`
  );
