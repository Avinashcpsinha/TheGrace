/**
 * POST /api/orders — places an order.
 *
 * Trust boundary: the client sends only { items:[{slug,size,qty,engraving?,
 * logoNote?}], customer, paymentMethod }. The server looks every product up in
 * the catalog and RE-DERIVES name / sku / image / unit price / bulk totals —
 * the client's prices are never trusted. Hidden or out-of-stock products are
 * rejected. COD orders are marked "cod", WhatsApp/Razorpay start "pending"
 * (Razorpay flips to "paid" in /api/razorpay/verify).
 *
 * Returns { order } (201) or { error } (4xx/5xx).
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type { CartItem, OrderCustomer, PaymentMethod, PaymentStatus } from "@/lib/types";
import { getAllProducts } from "@/lib/catalog";
import { cartTotals } from "@/lib/pricing";
import { createOrder } from "@/lib/orders";
import { sendOrderEmails } from "@/lib/mail";
import { site } from "@/config/site";

export const runtime = "nodejs";

function normalizePhone(v: string): string {
  let d = v.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const itemSchema = z.object({
  slug: z.string().trim().min(1),
  size: z.string().trim().max(60).optional().default("Standard"),
  qty: z.coerce.number().int().min(1).max(100000),
  engraving: z.string().trim().max(200).optional(),
  logoNote: z.string().trim().max(200).optional(),
});

const customerSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(80),
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")),
  email: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().email("Enter a valid email address").max(120).optional()
  ),
  address: z.string().trim().min(5, "Add your delivery address").max(300),
  city: z.string().trim().min(1, "City is required").max(80),
  state: z.string().trim().min(1, "State is required").max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit PIN code"),
  gstin: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z
      .string()
      .trim()
      .transform((s) => s.toUpperCase())
      .pipe(z.string().regex(GSTIN_RE, "Enter a valid 15-character GSTIN"))
      .optional()
  ),
  notes: z.string().trim().max(1000).optional(),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1, "Your cart is empty").max(100),
  customer: customerSchema,
  paymentMethod: z.enum(["razorpay", "cod", "whatsapp"]),
});

function paymentStatusFor(method: PaymentMethod): PaymentStatus {
  return method === "cod" ? "cod" : "pending";
}

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid order details" },
      { status: 400 }
    );
  }
  const { items, customer, paymentMethod } = parsed.data;

  // Razorpay can only be selected when the gateway is actually configured.
  if (paymentMethod === "razorpay" && !site.payments.razorpayKeyId) {
    return NextResponse.json(
      { error: "Online payment is unavailable right now — please choose COD or WhatsApp." },
      { status: 400 }
    );
  }
  if (paymentMethod === "cod" && !site.payments.codEnabled) {
    return NextResponse.json(
      { error: "Cash on Delivery is unavailable — please pay online or order on WhatsApp." },
      { status: 400 }
    );
  }

  const catalog = await getAllProducts(); // excludes hidden products
  const bySlug = new Map(catalog.map((p) => [p.slug, p]));

  const lineItems: CartItem[] = [];
  for (const it of items) {
    const product = bySlug.get(it.slug);
    if (!product) {
      return NextResponse.json(
        { error: `One of your items is no longer available. Please review your cart.` },
        { status: 409 }
      );
    }
    if (!product.inStock) {
      return NextResponse.json(
        { error: `"${product.name}" is currently out of stock. Please remove it to continue.` },
        { status: 409 }
      );
    }
    // resolve size → price delta from the catalog, never from the client
    const size = product.sizes.find((s) => s.label === it.size) ?? product.sizes[0];
    const unitPrice = product.price + (size?.priceDelta ?? 0);

    const line: CartItem = {
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      image: product.images[0]?.thumb ?? "",
      unitPrice,
      size: size?.label ?? "Standard",
      qty: it.qty,
      category: product.category,
    };
    if (it.engraving) line.engraving = it.engraving;
    if (it.logoNote) line.logoNote = it.logoNote;
    lineItems.push(line);
  }

  const totals = cartTotals(lineItems);

  const orderCustomer: OrderCustomer = {
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    pincode: customer.pincode,
  };
  if (customer.email) orderCustomer.email = customer.email;
  if (customer.gstin) orderCustomer.gstin = customer.gstin;
  if (customer.notes) orderCustomer.notes = customer.notes;

  let order;
  try {
    order = await createOrder({
      items: lineItems,
      customer: orderCustomer,
      subtotal: totals.subtotal,
      bulkDiscount: totals.bulkDiscount,
      total: totals.total,
      paymentMethod,
      paymentStatus: paymentStatusFor(paymentMethod),
    });
  } catch {
    return NextResponse.json(
      { error: "We couldn't save your order — please try again in a moment." },
      { status: 500 }
    );
  }

  // Notify now for COD/WhatsApp; Razorpay confirmation email is sent on verify.
  if (paymentMethod !== "razorpay") {
    void sendOrderEmails(order);
  }

  return NextResponse.json({ order }, { status: 201 });
}
