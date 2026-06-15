"use client";

/**
 * /checkout — single-page flow: Contact → Delivery (saved addresses) →
 * Business (GSTIN, collapsible) → Payment (Razorpay / COD / WhatsApp).
 *
 * The server re-derives all prices in POST /api/orders; this component only
 * sends slugs/sizes/qtys. Razorpay checkout.js is loaded on demand, once.
 */
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { Order, PaymentMethod } from "@/lib/types";
import { useCart } from "@/lib/store";
import { unitPriceFor } from "@/lib/pricing";
import { formatINR } from "@/lib/format";
import { waLink } from "@/lib/order-links";
import { site } from "@/config/site";
import { Button } from "@/components/ui/Button";
import {
  newAddressId,
  readAddresses,
  rememberOrderId,
  writeAddresses,
  type SavedAddress,
} from "./storage";

/* ── Razorpay checkout.js globals ──────────────────────────────────── */

interface RzpHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RzpCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color: string };
  handler: (response: RzpHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RzpCheckout {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RzpCheckoutOptions) => RzpCheckout;
  }
}

let rzpScript: Promise<boolean> | null = null;
function loadRazorpayScript(): Promise<boolean> {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve(true);
  if (!rzpScript) {
    rzpScript = new Promise<boolean>((resolve) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => {
        rzpScript = null;
        resolve(false);
      };
      document.body.appendChild(s);
    });
  }
  return rzpScript;
}

/* ── form model ────────────────────────────────────────────────────── */

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

interface FormState {
  name: string;
  phone: string;
  email: string;
  line: string;
  city: string;
  stateName: string;
  pincode: string;
  gstin: string;
  notes: string;
}

type FieldKey = keyof FormState;

const EMPTY_FORM: FormState = {
  name: "", phone: "", email: "", line: "", city: "",
  stateName: "", pincode: "", gstin: "", notes: "",
};

const FIELD_ORDER: FieldKey[] = [
  "name", "phone", "email", "line", "city", "stateName", "pincode", "gstin",
];

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

function normalizePhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}

interface Notice {
  kind: "info" | "error";
  text: string;
  orderId?: string;
}

interface OrdersResponse { order?: Order; error?: string }
interface RzpOrderResponse {
  key?: string;
  amount?: number;
  currency?: string;
  rzpOrderId?: string;
  name?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  error?: string;
}

function orderWhatsAppMessage(order: Order): string {
  const lines = [`Hi The Grace! I've just placed an order on your website.`, ``, `Order ref: ${order.id}`, ``];
  for (const it of order.items) {
    lines.push(
      `🏆 ${it.name} (${it.sku}) × ${it.qty}` +
        (it.size && it.size !== "Standard" ? ` — ${it.size}` : "") +
        (it.engraving ? ` — engraving: "${it.engraving}"` : "")
    );
  }
  lines.push(``, `Total: ${formatINR(order.total)}`, ``, `Name: ${order.customer.name} · Phone: ${order.customer.phone}`);
  return lines.join("\n");
}

/* ── small presentational helpers ──────────────────────────────────── */

const inputCls = (invalid: boolean) =>
  `w-full rounded-xl border bg-ink-3 px-4 py-3 text-sm text-ivory placeholder:text-muted/50 transition-colors duration-300 focus:border-gold/60 focus:outline-none ${
    invalid ? "border-danger/60" : "border-line"
  }`;

function FieldShell({
  id, label, required, hint, error, children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted">
        {label}
        {required && (
          <span className="text-gold" aria-hidden="true"> *</span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted/80">{hint}</p>
      ) : null}
    </div>
  );
}

function StepHeading({ num, title, sub }: { num: string; title: string; sub?: string }) {
  return (
    <div>
      <h2 className="flex items-baseline gap-3 font-display text-2xl text-ivory">
        <span className="font-body text-xs tracking-[0.3em] text-gold">{num}</span>
        {title}
      </h2>
      {sub && <p className="mt-1 pl-9 text-xs text-muted">{sub}</p>}
    </div>
  );
}

/* ── main component ────────────────────────────────────────────────── */

export function CheckoutView() {
  const router = useRouter();
  const { cart, totals, clearCart, hydrated } = useCart();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addrChoice, setAddrChoice] = useState<string>("new");
  const [saveAddr, setSaveAddr] = useState(true);
  const [bizOpen, setBizOpen] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>(() =>
    site.payments.razorpayKeyId ? "razorpay" : "whatsapp"
  );
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [placedId, setPlacedId] = useState<string | null>(null);
  const bizOpenRef = useRef(bizOpen);
  bizOpenRef.current = bizOpen;

  useEffect(() => {
    const list = readAddresses();
    setAddresses(list);
    const first = list[0];
    if (first) {
      setAddrChoice(first.id);
      setForm((f) => ({
        ...f,
        line: first.line,
        city: first.city,
        stateName: first.state,
        pincode: first.pincode,
      }));
    }
  }, []);

  const setField =
    (key: FieldKey) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.target.value;
      setForm((f) => ({ ...f, [key]: v }));
      setErrors((er) => (er[key] ? { ...er, [key]: undefined } : er));
    };

  const pickAddress = (id: string) => {
    setAddrChoice(id);
    setErrors((er) => ({ ...er, line: undefined, city: undefined, stateName: undefined, pincode: undefined }));
    if (id === "new") {
      setForm((f) => ({ ...f, line: "", city: "", stateName: "", pincode: "" }));
      return;
    }
    const a = addresses.find((x) => x.id === id);
    if (a) {
      setForm((f) => ({ ...f, line: a.line, city: a.city, stateName: a.state, pincode: a.pincode }));
    }
  };

  const validate = (): Partial<Record<FieldKey, string>> => {
    const er: Partial<Record<FieldKey, string>> = {};
    if (form.name.trim().length < 2) er.name = "Please tell us your name.";
    if (!/^[6-9]\d{9}$/.test(normalizePhone(form.phone)))
      er.phone = "Enter a valid 10-digit mobile number.";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      er.email = "Enter a valid email, or leave it blank.";
    if (form.line.trim().length < 5) er.line = "Add your delivery address.";
    if (!form.city.trim()) er.city = "City is required.";
    if (!form.stateName.trim()) er.stateName = "State is required.";
    if (!/^\d{6}$/.test(form.pincode.trim())) er.pincode = "Enter a 6-digit PIN code.";
    if (form.gstin.trim() && !GSTIN_RE.test(form.gstin.trim().toUpperCase()))
      er.gstin = "GSTIN should be 15 characters, e.g. 07ABCDE1234F1Z5.";
    return er;
  };

  const scrollToFirstError = (er: Partial<Record<FieldKey, string>>) => {
    const first = FIELD_ORDER.find((k) => er[k]);
    if (!first) return;
    if (first === "gstin" && !bizOpenRef.current) setBizOpen(true);
    requestAnimationFrame(() => {
      const el = document.getElementById(`co-${first}`);
      if (!el) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      (el as HTMLElement).focus({ preventScroll: true });
    });
  };

  const finalize = (id: string) => {
    setPlacedId(id);
    clearCart();
    router.push(`/order/confirmed/${id}`);
  };

  async function verifyPayment(orderId: string, resp: RzpHandlerResponse) {
    try {
      const res = await fetch("/api/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, ...resp }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "verification failed");
      finalize(orderId);
    } catch {
      setBusy(false);
      setNotice({
        kind: "error",
        orderId,
        text: `We received the payment response but couldn't verify it automatically. Don't worry — order ${orderId} is saved and we'll confirm everything with you on WhatsApp.`,
      });
    }
  }

  async function payWithRazorpay(order: Order) {
    try {
      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = (await res.json().catch(() => null)) as RzpOrderResponse | null;
      if (!res.ok || !data?.rzpOrderId || !data.key) {
        throw new Error(data?.error ?? "Could not start the payment.");
      }
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        throw new Error("Couldn't load the payment window — check your connection.");
      }
      const rzp = new window.Razorpay({
        key: data.key,
        amount: data.amount ?? order.total * 100,
        currency: data.currency ?? "INR",
        name: data.name ?? site.name,
        description: `Order ${order.id}`,
        order_id: data.rzpOrderId,
        prefill: data.prefill,
        theme: { color: "#D4AF37" },
        handler: (resp) => {
          void verifyPayment(order.id, resp);
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setNotice({
              kind: "info",
              orderId: order.id,
              text: `Payment not completed — your order ${order.id} is saved. You can pay later from the order page, or switch to WhatsApp and we'll take it from there.`,
            });
          },
        },
      });
      rzp.open();
    } catch (e) {
      setBusy(false);
      setNotice({
        kind: "error",
        orderId: order.id,
        text: `${e instanceof Error ? e.message : "Payment could not be started."} Your order ${order.id} is saved — you can complete it on WhatsApp instead.`,
      });
    }
  }

  async function placeOrder() {
    const er = validate();
    if (FIELD_ORDER.some((k) => er[k])) {
      setErrors(er);
      scrollToFirstError(er);
      return;
    }
    setBusy(true);
    setNotice(null);

    const customer: Record<string, string> = {
      name: form.name.trim(),
      phone: normalizePhone(form.phone),
      address: form.line.trim(),
      city: form.city.trim(),
      state: form.stateName.trim(),
      pincode: form.pincode.trim(),
    };
    if (form.email.trim()) customer.email = form.email.trim();
    if (form.gstin.trim()) customer.gstin = form.gstin.trim().toUpperCase();
    if (form.notes.trim()) customer.notes = form.notes.trim();

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, customer, paymentMethod: payment }),
      });
      const data = (await res.json().catch(() => null)) as OrdersResponse | null;
      if (!res.ok || !data?.order) {
        throw new Error(data?.error ?? "Something went wrong placing your order. Please try again.");
      }
      const order = data.order;
      rememberOrderId(order.id);

      if (saveAddr && addrChoice === "new") {
        const next = [
          ...addresses,
          {
            id: newAddressId(),
            line: customer.address,
            city: customer.city,
            state: customer.state,
            pincode: customer.pincode,
          },
        ];
        setAddresses(next);
        writeAddresses(next);
      }

      if (payment === "razorpay") {
        await payWithRazorpay(order);
        return; // busy state resolved inside the payment flow
      }
      if (payment === "whatsapp") {
        window.open(waLink(orderWhatsAppMessage(order)), "_blank", "noopener,noreferrer");
      }
      finalize(order.id);
    } catch (e) {
      setBusy(false);
      setNotice({
        kind: "error",
        text:
          e instanceof Error
            ? e.message
            : "Something went wrong. Please try again, or order on WhatsApp.",
      });
    }
  }

  /* ── render guards ─────────────────────────────────────────────── */

  if (!hydrated) return <div className="min-h-[40vh]" aria-hidden="true" />;

  if (placedId) {
    return (
      <div className="py-24 text-center" aria-live="polite">
        <p className="font-display text-3xl text-ivory">Finalising your order…</p>
        <p className="mt-3 text-sm text-muted">Taking you to your confirmation.</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <h2 className="font-display text-4xl text-ivory [text-wrap:balance]">
          Your cart is empty.
        </h2>
        <p className="mt-4 text-muted">Add a few pieces before checking out.</p>
        <div className="mt-8">
          <Button href="/products" size="lg">
            Browse all products
          </Button>
        </div>
      </div>
    );
  }

  const payOptions: { value: PaymentMethod; title: string; desc: string }[] = [];
  if (site.payments.razorpayKeyId) {
    payOptions.push({
      value: "razorpay",
      title: "Pay online",
      desc: "UPI · Cards · NetBanking — secured by Razorpay",
    });
  }
  if (site.payments.codEnabled) {
    payOptions.push({ value: "cod", title: "Cash on Delivery", desc: "Pay when your order arrives" });
  }
  payOptions.push({
    value: "whatsapp",
    title: "Order via WhatsApp",
    desc: "We'll confirm your order within hours",
  });

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      <form
        id="checkout-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void placeOrder();
        }}
        className="space-y-12"
      >
        {/* 01 · CONTACT */}
        <section aria-label="Contact details" className="space-y-5">
          <StepHeading num="01" title="Contact" />
          <div className="grid gap-5 sm:grid-cols-2">
            <FieldShell id="co-name" label="Full name" required error={errors.name}>
              <input
                id="co-name"
                value={form.name}
                onChange={setField("name")}
                autoComplete="name"
                placeholder="Aarav Sharma"
                aria-required="true"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? "co-name-err" : undefined}
                className={inputCls(!!errors.name)}
              />
            </FieldShell>
            <FieldShell id="co-phone" label="Mobile number" required error={errors.phone}>
              <input
                id="co-phone"
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={setField("phone")}
                autoComplete="tel"
                placeholder="98765 43210"
                aria-required="true"
                aria-invalid={errors.phone ? true : undefined}
                aria-describedby={errors.phone ? "co-phone-err" : undefined}
                className={inputCls(!!errors.phone)}
              />
            </FieldShell>
          </div>
          <FieldShell
            id="co-email"
            label="Email"
            hint="Optional — for your order confirmation."
            error={errors.email}
          >
            <input
              id="co-email"
              type="email"
              value={form.email}
              onChange={setField("email")}
              autoComplete="email"
              placeholder="you@company.com"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "co-email-err" : "co-email-hint"}
              className={inputCls(!!errors.email)}
            />
          </FieldShell>
        </section>

        {/* 02 · DELIVERY */}
        <section aria-label="Delivery address" className="space-y-5">
          <StepHeading num="02" title="Delivery" sub="We ship PAN-India with tracking." />

          {addresses.length > 0 && (
            <fieldset>
              <legend className="sr-only">Choose a delivery address</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition-colors duration-300 ${
                      addrChoice === a.id
                        ? "border-gold/60 bg-gold/5"
                        : "border-line bg-ink-3 hover:border-gold/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="co-address-choice"
                      checked={addrChoice === a.id}
                      onChange={() => pickAddress(a.id)}
                      className="mt-0.5 accent-[#d4af37]"
                      aria-label={`Deliver to ${a.line}, ${a.city}`}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-ivory">{a.line}</span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {a.city}, {a.state} — {a.pincode}
                      </span>
                    </span>
                  </label>
                ))}
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm transition-colors duration-300 ${
                    addrChoice === "new"
                      ? "border-gold/60 bg-gold/5"
                      : "border-line bg-ink-3 hover:border-gold/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="co-address-choice"
                    checked={addrChoice === "new"}
                    onChange={() => pickAddress("new")}
                    className="accent-[#d4af37]"
                    aria-label="Use a new address"
                  />
                  <span className="text-ivory">New address</span>
                </label>
              </div>
            </fieldset>
          )}

          {(addresses.length === 0 || addrChoice === "new") && (
            <div className="space-y-5">
              <FieldShell id="co-line" label="Address" required error={errors.line}>
                <input
                  id="co-line"
                  value={form.line}
                  onChange={setField("line")}
                  autoComplete="street-address"
                  placeholder="Flat / building, street, area"
                  aria-required="true"
                  aria-invalid={errors.line ? true : undefined}
                  aria-describedby={errors.line ? "co-line-err" : undefined}
                  className={inputCls(!!errors.line)}
                />
              </FieldShell>
              <div className="grid gap-5 sm:grid-cols-3">
                <FieldShell id="co-city" label="City" required error={errors.city}>
                  <input
                    id="co-city"
                    value={form.city}
                    onChange={setField("city")}
                    autoComplete="address-level2"
                    placeholder="New Delhi"
                    aria-required="true"
                    aria-invalid={errors.city ? true : undefined}
                    aria-describedby={errors.city ? "co-city-err" : undefined}
                    className={inputCls(!!errors.city)}
                  />
                </FieldShell>
                <FieldShell id="co-stateName" label="State" required error={errors.stateName}>
                  <input
                    id="co-stateName"
                    value={form.stateName}
                    onChange={setField("stateName")}
                    autoComplete="address-level1"
                    list="co-states"
                    placeholder="Delhi"
                    aria-required="true"
                    aria-invalid={errors.stateName ? true : undefined}
                    aria-describedby={errors.stateName ? "co-stateName-err" : undefined}
                    className={inputCls(!!errors.stateName)}
                  />
                  <datalist id="co-states">
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </FieldShell>
                <FieldShell id="co-pincode" label="PIN code" required error={errors.pincode}>
                  <input
                    id="co-pincode"
                    inputMode="numeric"
                    maxLength={6}
                    value={form.pincode}
                    onChange={setField("pincode")}
                    autoComplete="postal-code"
                    placeholder="110024"
                    aria-required="true"
                    aria-invalid={errors.pincode ? true : undefined}
                    aria-describedby={errors.pincode ? "co-pincode-err" : undefined}
                    className={inputCls(!!errors.pincode)}
                  />
                </FieldShell>
              </div>
              <label className="flex items-center gap-2.5 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={saveAddr}
                  onChange={(e) => setSaveAddr(e.target.checked)}
                  className="accent-[#d4af37]"
                />
                Save this address on this device
              </label>
            </div>
          )}
        </section>

        {/* 03 · BUSINESS (collapsible) */}
        <section aria-label="Business details" className="rounded-2xl border border-line">
          <button
            type="button"
            onClick={() => setBizOpen((o) => !o)}
            aria-expanded={bizOpen}
            aria-controls="co-business-panel"
            className="flex w-full items-center justify-between px-5 py-4 text-left cursor-pointer"
          >
            <span className="flex items-baseline gap-3 font-display text-xl text-ivory">
              <span className="font-body text-xs tracking-[0.3em] text-gold">03</span>
              Business <span className="font-body text-xs text-muted">(optional)</span>
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
              className={`text-muted transition-transform duration-300 ease-[var(--ease-lux)] ${bizOpen ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {bizOpen && (
            <div id="co-business-panel" className="space-y-5 border-t border-line px-5 py-5">
              <FieldShell
                id="co-gstin"
                label="GSTIN"
                hint="Optional — 15-character GSTIN for a GST invoice."
                error={errors.gstin}
              >
                <input
                  id="co-gstin"
                  value={form.gstin}
                  onChange={setField("gstin")}
                  maxLength={15}
                  placeholder="07ABCDE1234F1Z5"
                  aria-invalid={errors.gstin ? true : undefined}
                  aria-describedby={errors.gstin ? "co-gstin-err" : "co-gstin-hint"}
                  className={`${inputCls(!!errors.gstin)} uppercase`}
                />
              </FieldShell>
              <FieldShell
                id="co-notes"
                label="Order notes"
                hint="Engraving details, event date, delivery instructions…"
              >
                <textarea
                  id="co-notes"
                  rows={3}
                  maxLength={1000}
                  value={form.notes}
                  onChange={setField("notes")}
                  aria-describedby="co-notes-hint"
                  className={inputCls(false)}
                />
              </FieldShell>
            </div>
          )}
        </section>

        {/* 04 · PAYMENT */}
        <section aria-label="Payment method" className="space-y-5">
          <StepHeading num="04" title="Payment" />
          <fieldset>
            <legend className="sr-only">Choose how you&apos;d like to pay</legend>
            <div className="space-y-3">
              {payOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors duration-300 ${
                    payment === opt.value
                      ? "border-gold/60 bg-gold/5"
                      : "border-line bg-ink-3 hover:border-gold/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="co-payment"
                    value={opt.value}
                    checked={payment === opt.value}
                    onChange={() => setPayment(opt.value)}
                    className="mt-1 accent-[#d4af37]"
                  />
                  <span>
                    <span className="block text-sm font-medium text-ivory">{opt.title}</span>
                    <span className="mt-0.5 block text-xs text-muted">{opt.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </section>
      </form>

      {/* summary rail */}
      <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]" aria-label="Order summary">
        <div className="card-surface rounded-2xl p-6">
          <h2 className="font-display text-2xl text-ivory">Your order</h2>

          <ul className="mt-5 max-h-72 space-y-4 overflow-y-auto pr-1">
            {cart.map((it) => (
              <li key={`${it.slug}__${it.size}`} className="flex items-center gap-3">
                <span className="photo-well relative block h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={it.image}
                    alt={it.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 object-contain p-1"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ivory">{it.name}</span>
                  <span className="block text-xs text-muted">
                    × {it.qty}
                    {it.size && it.size !== "Standard" ? ` · ${it.size}` : ""}
                  </span>
                </span>
                <span className="text-sm text-champagne">
                  {formatINR(unitPriceFor(it.unitPrice, it.qty) * it.qty)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
            <div className="flex items-baseline justify-between">
              <dt className="text-muted">
                Subtotal · {totals.itemCount} pc{totals.itemCount === 1 ? "" : "s"}
              </dt>
              <dd className="text-ivory">{formatINR(totals.subtotal)}</dd>
            </div>
            {totals.bulkDiscount > 0 && (
              <div className="flex items-baseline justify-between text-gold">
                <dt>Bulk savings</dt>
                <dd>−{formatINR(totals.bulkDiscount)}</dd>
              </div>
            )}
            <div className="gold-rule" aria-hidden="true" />
            <div className="flex items-baseline justify-between">
              <dt className="text-ivory">Total</dt>
              <dd className="font-display text-3xl text-champagne">{formatINR(totals.total)}</dd>
            </div>
          </dl>

          <div className="mt-6">
            <Button
              type="submit"
              form="checkout-form"
              size="lg"
              className="w-full"
              disabled={busy}
              aria-busy={busy}
            >
              {busy ? (
                <>
                  <span
                    aria-hidden="true"
                    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink"
                  />
                  Placing your order…
                </>
              ) : payment === "whatsapp" ? (
                "Place order on WhatsApp"
              ) : payment === "razorpay" ? (
                "Place order & pay"
              ) : (
                "Place order"
              )}
            </Button>
          </div>

          <p className="mt-4 text-center text-xs text-muted">
            🔒 Secure · GST invoice · PAN-India delivery
          </p>
        </div>

        {/* async status / friendly notices */}
        <div aria-live="polite">
          {notice && (
            <div
              className={`mt-4 rounded-2xl border p-5 text-sm leading-relaxed ${
                notice.kind === "error"
                  ? "border-danger/40 bg-danger/5 text-ivory"
                  : "border-gold/40 bg-gold/5 text-ivory"
              }`}
            >
              <p>{notice.text}</p>
              {notice.orderId && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button href={`/order/confirmed/${notice.orderId}`} variant="outline" size="sm">
                    View order
                  </Button>
                  <Button
                    href={waLink(
                      `Hi The Grace! I'd like to complete my order ${notice.orderId} via WhatsApp.`
                    )}
                    variant="whatsapp"
                    size="sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Order via WhatsApp
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
