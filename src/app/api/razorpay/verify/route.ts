/**
 * POST /api/razorpay/verify — verifies a Razorpay payment and marks the order
 * paid. Body: { orderId, razorpay_order_id, razorpay_payment_id,
 * razorpay_signature }.
 *
 * Signature = HMAC_SHA256(`${razorpay_order_id}|${razorpay_payment_id}`,
 * key_secret). We also check the razorpay_order_id matches the one we stored on
 * the order in /api/razorpay/order, so a valid signature for some *other*
 * payment can't be replayed onto this order. Returns { ok: true } or { error }.
 */
import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { getOrder, updateOrder } from "@/lib/orders";
import { sendOrderEmails } from "@/lib/mail";

export const runtime = "nodejs";

const schema = z.object({
  orderId: z.string().trim().min(1).max(40),
  razorpay_order_id: z.string().trim().min(1).max(80),
  razorpay_payment_id: z.string().trim().min(1).max(80),
  razorpay_signature: z.string().trim().min(1).max(256),
});

/** constant-time hex compare that never throws on length mismatch */
function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length !== bb.length || ba.length === 0) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export async function POST(req: NextRequest) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: "Payment verification is unavailable." }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Incomplete payment details" }, { status: 400 });
  }
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const order = await getOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json(
      { error: "Payment does not match this order." },
      { status: 409 }
    );
  }

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (!safeEqualHex(expected, razorpay_signature)) {
    await updateOrder(orderId, { paymentStatus: "failed" });
    return NextResponse.json({ error: "Payment signature could not be verified." }, { status: 400 });
  }

  const updated = await updateOrder(orderId, {
    paymentStatus: "paid",
    razorpayPaymentId: razorpay_payment_id,
  });

  if (updated) void sendOrderEmails(updated);

  return NextResponse.json({ ok: true });
}
