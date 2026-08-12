import "server-only";

/**
 * Order and testimonial notification emails. Order mail silently no-ops when
 * SMTP env vars are unset, so the site works out of the box and email becomes
 * a config upgrade.
 *
 * Testimonials are the exception: they are NOT stored anywhere (the JSON
 * file store does not survive on Vercel), so email is the only copy. That
 * path reports whether it actually delivered, and the form tells the visitor
 * to use WhatsApp when it did not, rather than thanking them for a message
 * that went nowhere.
 */
import type { Order } from "./types";
import { formatINR } from "./format";
import { site } from "@/config/site";

function orderText(order: Order): string {
  const lines = [
    `Order ${order.id} — ${site.name}`,
    `Placed: ${new Date(order.createdAt).toLocaleString("en-IN")}`,
    ``,
    ...order.items.map(
      (it) =>
        `• ${it.name} (${it.sku}) × ${it.qty}` +
        (it.size && it.size !== "Standard" ? ` — ${it.size}` : "") +
        (it.engraving ? ` — engraving: "${it.engraving}"` : "")
    ),
    ``,
    `Total: ${formatINR(order.total)} (${order.paymentMethod.toUpperCase()})`,
    ``,
    `Customer: ${order.customer.name} — ${order.customer.phone}`,
    order.customer.email ? `Email: ${order.customer.email}` : "",
    order.customer.address
      ? `Ship to: ${order.customer.address}, ${order.customer.city ?? ""} ${order.customer.pincode ?? ""}`
      : "",
    order.customer.gstin ? `GSTIN: ${order.customer.gstin}` : "",
    order.customer.notes ? `Notes: ${order.customer.notes}` : "",
    ``,
    `Track: ${site.url}/track-order?id=${order.id}`,
  ];
  return lines.filter(Boolean).join("\n");
}

export async function sendOrderEmails(order: Order): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ORDER_NOTIFY_EMAIL } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return; // email not configured — skip silently

  try {
    const nodemailer = (await import("nodemailer")).default;
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 587),
      secure: Number(SMTP_PORT ?? 587) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const text = orderText(order);
    const tasks: Promise<unknown>[] = [];
    if (ORDER_NOTIFY_EMAIL) {
      tasks.push(
        transport.sendMail({
          from: `"${site.name}" <${SMTP_USER}>`,
          to: ORDER_NOTIFY_EMAIL,
          subject: `🏆 New order ${order.id} — ${formatINR(order.total)}`,
          text,
        })
      );
    }
    if (order.customer.email) {
      tasks.push(
        transport.sendMail({
          from: `"${site.name}" <${SMTP_USER}>`,
          to: order.customer.email,
          subject: `Your order ${order.id} is confirmed — ${site.name}`,
          text: `Thank you for your order!\n\n${text}\n\nQuestions? WhatsApp us: https://wa.me/${site.whatsapp}`,
        })
      );
    }
    await Promise.allSettled(tasks);
  } catch (err) {
    console.error("[mail] failed to send order emails:", err);
  }
}

export interface TestimonialSubmission {
  name: string;
  role: string;
  organisation: string;
  rating: number;
  quote: string;
  email: string;
  phone: string;
  consent: boolean;
}

/**
 * Email one submitted testimonial to the workshop.
 * Returns false when SMTP is unconfigured or the send failed — the caller
 * must surface that, because nothing else has a copy of the message.
 */
export async function sendTestimonialEmail(t: TestimonialSubmission): Promise<boolean> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ORDER_NOTIFY_EMAIL } = process.env;
  const to = ORDER_NOTIFY_EMAIL || site.email;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !to) return false;

  const text = [
    `New testimonial — ${site.name}`,
    ``,
    `Rating: ${"★".repeat(t.rating)}${"☆".repeat(5 - t.rating)} (${t.rating}/5)`,
    ``,
    `"${t.quote}"`,
    ``,
    `— ${t.name}`,
    t.role || t.organisation
      ? `   ${[t.role, t.organisation].filter(Boolean).join(", ")}`
      : "",
    ``,
    `Contact: ${t.phone || "not given"}${t.email ? ` · ${t.email}` : ""}`,
    `Permission to publish: ${t.consent ? "YES" : "NO — do not publish"}`,
    ``,
    `To publish, add it to QUOTES in src/components/home/Testimonials.tsx.`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const nodemailer = (await import("nodemailer")).default;
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 587),
      secure: Number(SMTP_PORT ?? 587) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transport.sendMail({
      from: `"${site.name}" <${SMTP_USER}>`,
      to,
      replyTo: t.email || undefined,
      subject: `⭐ Testimonial from ${t.name}${t.organisation ? ` (${t.organisation})` : ""}`,
      text,
    });
    return true;
  } catch (err) {
    console.error("[mail] failed to send testimonial:", err);
    return false;
  }
}
