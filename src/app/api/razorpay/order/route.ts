/**
 * POST /api/razorpay/order — creates a Razorpay order for an already-placed
 * Grace order and returns the bits checkout.js needs:
 * { key, amount, currency, rzpOrderId, name, prefill }.
 *
 * The Grace order is the source of truth for the amount (re-read here, never
 * trusted from the client). The Razorpay order id is stored back on our order
 * so /api/razorpay/verify can confirm the payment belongs to it.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import Razorpay from "razorpay";
import type { Order } from "@/lib/types";
import { getOrder } from "@/lib/orders";
import { updateCollection } from "@/lib/db";
import { site } from "@/config/site";

export const runtime = "nodejs";

const schema = z.object({ orderId: z.string().trim().min(1).max(40) });

export async function POST(req: NextRequest) {
  const keyId = site.payments.razorpayKeyId;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: "Online payment isn't configured. Please choose COD or WhatsApp." },
      { status: 503 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  const order = await getOrder(parsed.data.orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.paymentStatus === "paid") {
    return NextResponse.json({ error: "This order is already paid." }, { status: 409 });
  }

  let rzpOrder;
  try {
    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    rzpOrder = await rzp.orders.create({
      amount: Math.round(order.total * 100), // paise
      currency: "INR",
      receipt: order.id,
      notes: { graceOrderId: order.id },
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't start the payment with our gateway — please try again." },
      { status: 502 }
    );
  }

  // Record the Razorpay order id on our order (verify cross-checks it).
  await updateCollection<Order[]>("orders", [], (orders) =>
    orders.map((o) =>
      o.id.toUpperCase() === order.id.toUpperCase() ? { ...o, razorpayOrderId: rzpOrder.id } : o
    )
  );

  return NextResponse.json({
    key: keyId,
    amount: Number(rzpOrder.amount),
    currency: rzpOrder.currency,
    rzpOrderId: rzpOrder.id,
    name: site.name,
    prefill: {
      name: order.customer.name,
      email: order.customer.email ?? "",
      contact: order.customer.phone,
    },
  });
}
