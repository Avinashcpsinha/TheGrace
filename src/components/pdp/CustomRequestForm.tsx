"use client";

/**
 * Customization request form (client) — posts FormData to
 * /api/custom-request. Inline validation (aria-describedby), drag-and-drop
 * logo zone (image/PDF, 4 MB client-checked), aria-live status, and a
 * success state with the CR reference, a prefilled WhatsApp button and a
 * route back to the catalogue.
 */

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { waLink } from "@/lib/order-links";
import {
  MAX_LOGO_BYTES,
  PRODUCT_TYPES,
  type ProductType,
} from "@/components/pdp/customization-constants";

type FieldKey = "name" | "phone" | "email" | "quantity" | "logo";
type Errors = Partial<Record<FieldKey, string>>;

const inputCls =
  "mt-2 w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-ivory placeholder:text-muted/50 transition-colors duration-300 focus:border-gold/60";
const labelCls = "text-[0.65rem] uppercase tracking-[0.3em] text-muted";

function validPhone(v: string): boolean {
  let d = v.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d);
}

function prettySize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function CustomRequestForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [productType, setProductType] = useState<ProductType>("Trophies");
  const [quantity, setQuantity] = useState("25");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [serverError, setServerError] = useState("");
  const [refId, setRefId] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearError = (key: FieldKey) =>
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const handleFile = (f: File) => {
    if (f.size > MAX_LOGO_BYTES) {
      setFile(null);
      setErrors((prev) => ({
        ...prev,
        logo: "That file is over 4 MB — compress it, or share it on WhatsApp after submitting.",
      }));
      return;
    }
    const ok =
      f.type.startsWith("image/") || f.type === "application/pdf" || /\.pdf$/i.test(f.name);
    if (!ok) {
      setFile(null);
      setErrors((prev) => ({ ...prev, logo: "Please attach an image or a PDF." }));
      return;
    }
    clearError("logo");
    setFile(f);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const validate = (): Errors => {
    const errs: Errors = {};
    if (name.trim().length < 2) errs.name = "Please tell us your name.";
    if (!validPhone(phone)) errs.phone = "Enter a valid 10-digit mobile number.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = "Enter a valid email address, or leave it blank.";
    const q = parseInt(quantity, 10);
    if (!Number.isFinite(q) || q < 1) errs.quantity = "Quantity must be at least 1.";
    if (errors.logo) errs.logo = errors.logo;
    return errs;
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError("");
    const errs = validate();
    setErrors(errs);
    const first = (["name", "phone", "email", "quantity", "logo"] as FieldKey[]).find(
      (k) => errs[k]
    );
    if (first) {
      const el = document.getElementById(first === "logo" ? "cz-logo" : `cz-${first}`);
      el?.focus();
      return;
    }

    setStatus("sending");
    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("phone", phone.trim());
    fd.set("email", email.trim());
    fd.set("productType", productType);
    fd.set("quantity", quantity.trim());
    fd.set("message", message.trim());
    if (file) fd.set("logo", file, file.name);

    try {
      const res = await fetch("/api/custom-request", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok || !data.id) {
        setServerError(
          data.error ?? "We could not send your request. Please retry, or WhatsApp us directly."
        );
        setStatus("idle");
        return;
      }
      setRefId(data.id);
      setStatus("done");
    } catch {
      setServerError("Network hiccup — please retry, or WhatsApp us directly.");
      setStatus("idle");
    }
  };

  /* ── success state replaces the form ──────────────────────────────── */
  if (status === "done") {
    const wa = waLink(
      `Hi The Grace! I've just submitted customization request ${refId} (${productType}, qty ${quantity}). Sharing my logo / references here.`
    );
    return (
      <div
        role="status"
        aria-live="polite"
        className="card-surface rounded-3xl px-6 py-14 text-center md:px-14"
      >
        <span
          aria-hidden="true"
          className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold/40 bg-gold/10 shadow-[var(--shadow-gold)]"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-gold-bright)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <h3 className="mt-6 font-display text-3xl text-ivory [text-wrap:balance] md:text-4xl">
          Request received
        </h3>
        <p className="mt-3 text-sm text-muted">
          Your reference:{" "}
          <span className="font-semibold tracking-wide text-gold-bright">#{refId}</span> — keep
          it handy.
        </p>
        <p className="mt-1.5 text-sm text-muted">We reply within a few hours (Mon–Sat).</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="whatsapp"
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Continue request ${refId} on WhatsApp`}
          >
            Continue on WhatsApp
          </Button>
          <Button variant="outline" href="/products" aria-label="Browse all products">
            Browse the collection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="card-surface rounded-3xl p-6 md:p-10"
      aria-label="Customization request form"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {/* name */}
        <div>
          <label htmlFor="cz-name" className={labelCls}>
            Your name <span className="text-gold">*</span>
          </label>
          <input
            id="cz-name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearError("name");
            }}
            placeholder="Full name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "cz-name-error" : undefined}
            className={inputCls}
          />
          {errors.name && (
            <p id="cz-name-error" className="mt-1.5 text-xs text-danger">
              {errors.name}
            </p>
          )}
        </div>

        {/* phone */}
        <div>
          <label htmlFor="cz-phone" className={labelCls}>
            Phone <span className="text-gold">*</span>
          </label>
          <input
            id="cz-phone"
            type="tel"
            autoComplete="tel"
            inputMode="numeric"
            required
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              clearError("phone");
            }}
            placeholder="10-digit mobile number"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? "cz-phone-error" : undefined}
            className={inputCls}
          />
          {errors.phone && (
            <p id="cz-phone-error" className="mt-1.5 text-xs text-danger">
              {errors.phone}
            </p>
          )}
        </div>

        {/* email */}
        <div>
          <label htmlFor="cz-email" className={labelCls}>
            Email <span className="normal-case tracking-normal text-muted/70">(optional)</span>
          </label>
          <input
            id="cz-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
            }}
            placeholder="you@company.in"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "cz-email-error" : undefined}
            className={inputCls}
          />
          {errors.email && (
            <p id="cz-email-error" className="mt-1.5 text-xs text-danger">
              {errors.email}
            </p>
          )}
        </div>

        {/* product type */}
        <div>
          <label htmlFor="cz-type" className={labelCls}>
            Product type
          </label>
          <div className="relative">
            <select
              id="cz-type"
              value={productType}
              onChange={(e) => setProductType(e.target.value as ProductType)}
              className={`${inputCls} cursor-pointer appearance-none pr-10`}
            >
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t} className="bg-ink-2 text-ivory">
                  {t}
                </option>
              ))}
            </select>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-muted"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>

        {/* quantity */}
        <div>
          <label htmlFor="cz-quantity" className={labelCls}>
            Quantity
          </label>
          <input
            id="cz-quantity"
            type="number"
            min={1}
            inputMode="numeric"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              clearError("quantity");
            }}
            aria-invalid={errors.quantity ? true : undefined}
            aria-describedby={errors.quantity ? "cz-quantity-error" : undefined}
            className={inputCls}
          />
          {errors.quantity && (
            <p id="cz-quantity-error" className="mt-1.5 text-xs text-danger">
              {errors.quantity}
            </p>
          )}
        </div>

        {/* logo upload */}
        <div>
          <span className={labelCls} id="cz-logo-label">
            Logo / reference{" "}
            <span className="normal-case tracking-normal text-muted/70">(optional)</span>
          </span>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`mt-2 rounded-xl border border-dashed px-4 py-5 text-center transition-colors duration-300 has-[:focus-visible]:border-gold ${
              dragOver ? "border-gold bg-gold/[0.06]" : "border-line bg-ink-2"
            }`}
          >
            <input
              ref={fileInputRef}
              id="cz-logo"
              type="file"
              accept="image/*,.pdf"
              aria-labelledby="cz-logo-label"
              aria-describedby={errors.logo ? "cz-logo-error" : "cz-logo-hint"}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
              className="sr-only"
            />
            {file ? (
              <span className="flex items-center justify-center gap-3 text-sm text-champagne">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="shrink-0 text-gold">
                  <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l8.57-8.57a4 4 0 1 1 5.66 5.66l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                <span className="max-w-[12rem] truncate">{file.name}</span>
                <span className="text-xs text-muted">{prettySize(file.size)}</span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  aria-label={`Remove attached file ${file.name}`}
                  className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-full border border-line text-muted transition-colors duration-300 hover:border-danger/60 hover:text-danger"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ) : (
              <label htmlFor="cz-logo" className="block cursor-pointer text-sm text-muted">
                Drag &amp; drop your logo here, or{" "}
                <span className="text-gold underline decoration-gold/40 underline-offset-4">
                  browse files
                </span>
              </label>
            )}
            <p id="cz-logo-hint" className="mt-1.5 text-[0.65rem] text-muted/70">
              PNG, JPG, SVG or PDF — up to 4 MB.
            </p>
          </div>
          {errors.logo && (
            <p id="cz-logo-error" className="mt-1.5 text-xs text-danger">
              {errors.logo}
            </p>
          )}
        </div>

        {/* message */}
        <div className="sm:col-span-2">
          <label htmlFor="cz-message" className={labelCls}>
            Your brief
          </label>
          <textarea
            id="cz-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us about the event, text to engrave, deadline…"
            className={`${inputCls} resize-y`}
          />
        </div>
      </div>

      {serverError && (
        <p
          role="alert"
          aria-live="assertive"
          className="mt-6 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {serverError}
        </p>
      )}

      <div className="mt-8 flex flex-col items-center gap-4">
        <Button
          type="submit"
          variant="gold"
          size="lg"
          disabled={status === "sending"}
          aria-busy={status === "sending"}
          className="w-full sm:w-auto sm:min-w-72"
        >
          {status === "sending" ? "Sending your request…" : "Send my request"}
        </Button>
        <p className="text-xs text-muted">
          Free design proof before production · No advance for quotes
        </p>
      </div>
    </form>
  );
}
