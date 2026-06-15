import "server-only";

/**
 * Order notification emails. Silently no-ops when SMTP env vars are unset,
 * so the site works out of the box and email becomes a config upgrade.
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
