"use client";

/**
 * Write a Testimonial — posts JSON to /api/testimonial, which emails the
 * workshop. Nothing is stored server-side, so the failure path matters as
 * much as the happy one: if the email cannot be delivered the visitor is
 * offered a WhatsApp link with their own words already in it, rather than a
 * thank-you for a message that went nowhere.
 */

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { waLink } from "@/lib/order-links";

type FieldKey = "name" | "quote" | "email" | "phone" | "consent";
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

export function TestimonialForm() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [serverError, setServerError] = useState("");

  /* the visitor's own words, ready to paste into a chat if email fails */
  const fallbackLink = () =>
    waLink(
      [
        `Hi The Grace! I'd like to leave a testimonial.`,
        ``,
        `${rating}/5`,
        ``,
        quote.trim(),
        ``,
        `— ${name.trim()}${
          role.trim() || organisation.trim()
            ? `, ${[role.trim(), organisation.trim()].filter(Boolean).join(", ")}`
            : ""
        }`,
      ].join("\n")
    );

  const clearError = (key: FieldKey) =>
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const validate = (): Errors => {
    const errs: Errors = {};
    if (name.trim().length < 2) errs.name = "Please tell us your name.";
    if (quote.trim().length < 20)
      errs.quote = "A line or two more, so it reads as a testimonial.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = "Enter a valid email address, or leave it blank.";
    if (phone.trim() && !validPhone(phone))
      errs.phone = "Enter a valid 10-digit mobile number, or leave it blank.";
    if (!consent) errs.consent = "We need your permission before we can publish it.";
    return errs;
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError("");
    const errs = validate();
    setErrors(errs);
    const first = (["name", "quote", "email", "phone", "consent"] as FieldKey[]).find(
      (k) => errs[k]
    );
    if (first) {
      document.getElementById(`tm-${first}`)?.focus();
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/testimonial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim(),
          organisation: organisation.trim(),
          rating,
          quote: quote.trim(),
          email: email.trim(),
          phone: phone.trim(),
          consent,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setServerError(
          data.error ??
            "We could not send your testimonial. Please share it on WhatsApp so it is not lost."
        );
        setStatus("idle");
        return;
      }
      setStatus("done");
    } catch {
      setServerError(
        "Network hiccup — please retry, or share your testimonial on WhatsApp."
      );
      setStatus("idle");
    }
  };

  /* ── thank-you replaces the form ──────────────────────────────────── */
  if (status === "done") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="card-surface rounded-3xl px-6 py-14 text-center md:px-14"
      >
        <span
          aria-hidden="true"
          className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold/40 bg-gold/10 text-2xl shadow-[var(--shadow-gold)]"
        >
          ★
        </span>
        <h3 className="mt-6 font-display text-3xl text-ivory [text-wrap:balance] md:text-4xl">
          Thank you — that means a great deal
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          Your words are with the workshop. If we publish them we will keep them exactly as you
          wrote them, and we will let you know first.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" href="/products">
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
      aria-label="Write a testimonial"
    >
      {/* rating */}
      <fieldset>
        <legend className={labelCls}>How did we do?</legend>
        <div className="mt-3 flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} out of 5`}
              aria-pressed={rating === n}
              className={`grid h-11 w-11 cursor-pointer place-items-center rounded-full border text-lg transition-colors duration-300 ${
                n <= rating
                  ? "border-gold/60 bg-gold/10 text-gold"
                  : "border-line text-muted hover:border-gold/30"
              }`}
            >
              ★
            </button>
          ))}
          <span className="ml-2 text-sm text-muted">{rating} / 5</span>
        </div>
      </fieldset>

      {/* the testimonial */}
      <div className="mt-8">
        <label htmlFor="tm-quote" className={labelCls}>
          Your testimonial <span className="text-gold">*</span>
        </label>
        <textarea
          id="tm-quote"
          rows={5}
          required
          value={quote}
          onChange={(e) => {
            setQuote(e.target.value);
            clearError("quote");
          }}
          placeholder="What did we make for you, and how did it land on the day?"
          aria-invalid={errors.quote ? true : undefined}
          aria-describedby={errors.quote ? "tm-quote-error" : undefined}
          className={`${inputCls} resize-y`}
        />
        {errors.quote && (
          <p id="tm-quote-error" className="mt-1.5 text-xs text-danger">
            {errors.quote}
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {/* name */}
        <div>
          <label htmlFor="tm-name" className={labelCls}>
            Your name <span className="text-gold">*</span>
          </label>
          <input
            id="tm-name"
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
            aria-describedby={errors.name ? "tm-name-error" : undefined}
            className={inputCls}
          />
          {errors.name && (
            <p id="tm-name-error" className="mt-1.5 text-xs text-danger">
              {errors.name}
            </p>
          )}
        </div>

        {/* role */}
        <div>
          <label htmlFor="tm-role" className={labelCls}>
            Role <span className="normal-case tracking-normal text-muted/70">(optional)</span>
          </label>
          <input
            id="tm-role"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Head of HR, Principal, Sports Officer…"
            className={inputCls}
          />
        </div>

        {/* organisation */}
        <div>
          <label htmlFor="tm-organisation" className={labelCls}>
            Organisation{" "}
            <span className="normal-case tracking-normal text-muted/70">(optional)</span>
          </label>
          <input
            id="tm-organisation"
            type="text"
            autoComplete="organization"
            value={organisation}
            onChange={(e) => setOrganisation(e.target.value)}
            placeholder="Company, school or federation"
            className={inputCls}
          />
        </div>

        {/* email */}
        <div>
          <label htmlFor="tm-email" className={labelCls}>
            Email <span className="normal-case tracking-normal text-muted/70">(optional)</span>
          </label>
          <input
            id="tm-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
            }}
            placeholder="you@company.in"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "tm-email-error" : undefined}
            className={inputCls}
          />
          {errors.email && (
            <p id="tm-email-error" className="mt-1.5 text-xs text-danger">
              {errors.email}
            </p>
          )}
        </div>

        {/* phone */}
        <div className="sm:col-span-2">
          <label htmlFor="tm-phone" className={labelCls}>
            Phone <span className="normal-case tracking-normal text-muted/70">(optional)</span>
          </label>
          <input
            id="tm-phone"
            type="tel"
            autoComplete="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              clearError("phone");
            }}
            placeholder="So we can thank you properly"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? "tm-phone-error" : undefined}
            className={inputCls}
          />
          {errors.phone && (
            <p id="tm-phone-error" className="mt-1.5 text-xs text-danger">
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      {/* consent */}
      <div className="mt-8">
        <label htmlFor="tm-consent" className="flex cursor-pointer items-start gap-3">
          <input
            id="tm-consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              clearError("consent");
            }}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? "tm-consent-error" : undefined}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-gold)]"
          />
          <span className="text-sm leading-relaxed text-muted">
            The Grace may publish this on the website with my name
            {organisation.trim() ? " and organisation" : ""}. We will never publish your phone
            number or email.
          </span>
        </label>
        {errors.consent && (
          <p id="tm-consent-error" className="mt-1.5 text-xs text-danger">
            {errors.consent}
          </p>
        )}
      </div>

      {serverError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mt-6 rounded-xl border border-danger/40 bg-danger/10 px-4 py-4 text-sm text-danger"
        >
          <p>{serverError}</p>
          {quote.trim().length >= 20 && name.trim().length >= 2 && (
            <div className="mt-4">
              <Button variant="whatsapp" size="sm" href={fallbackLink()} target="_blank" rel="noopener noreferrer">
                Send it on WhatsApp instead
              </Button>
            </div>
          )}
        </div>
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
          {status === "sending" ? "Sending…" : "Submit my testimonial"}
        </Button>
        <p className="text-xs text-muted">
          Read by the workshop · Published only with your permission
        </p>
      </div>
    </form>
  );
}
