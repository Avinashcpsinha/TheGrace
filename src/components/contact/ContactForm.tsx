"use client";

/**
 * Contact form — composes the visitor's message into a pre-filled WhatsApp
 * (or email) thread rather than posting to a server. This keeps The Grace's
 * "reply on WhatsApp within hours" promise the default path, needs no backend,
 * and means a message is never silently lost in a database the owner forgets
 * to check. Validation is light; the channels are real.
 */
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { waLink, mailtoLink } from "@/lib/order-links";

const TOPICS = [
  "Bulk / corporate order",
  "Custom design",
  "Sports / event awards",
  "Existing order",
  "Something else",
];

interface Errors {
  name?: string;
  message?: string;
}

function buildMessage(name: string, phone: string, topic: string, message: string): string {
  const lines = [`Hi The Grace!`, ``];
  if (topic) lines.push(`Topic: ${topic}`);
  lines.push(``, message.trim());
  lines.push(``, `— ${name.trim()}${phone.trim() ? ` (${phone.trim()})` : ""}`);
  return lines.join("\n");
}

export function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  function validate(): Errors {
    const er: Errors = {};
    if (name.trim().length < 2) er.name = "Please tell us your name.";
    if (message.trim().length < 5) er.message = "Add a line or two so we can help.";
    return er;
  }

  function send(channel: "whatsapp" | "email") {
    const er = validate();
    setErrors(er);
    if (er.name || er.message) return;
    const body = buildMessage(name, phone, topic, message);
    const href =
      channel === "whatsapp"
        ? waLink(body)
        : mailtoLink(`Enquiry — ${topic}`, body);
    window.open(href, channel === "whatsapp" ? "_blank" : "_self", "noopener,noreferrer");
  }

  const inputCls = (invalid?: boolean) =>
    `w-full rounded-xl border bg-ink-3 px-4 py-3 text-sm text-ivory placeholder:text-muted/50 transition-colors duration-300 focus:border-gold/60 focus:outline-none ${
      invalid ? "border-danger/60" : "border-line"
    }`;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        send("whatsapp");
      }}
      className="card-surface space-y-5 rounded-2xl p-6 md:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="ct-name"
            className="mb-1.5 block text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted"
          >
            Your name <span className="text-gold" aria-hidden="true">*</span>
          </label>
          <input
            id="ct-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((x) => ({ ...x, name: undefined }));
            }}
            autoComplete="name"
            placeholder="Aarav Sharma"
            aria-required="true"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "ct-name-err" : undefined}
            className={inputCls(!!errors.name)}
          />
          {errors.name && (
            <p id="ct-name-err" role="alert" className="mt-1.5 text-xs text-danger">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="ct-phone"
            className="mb-1.5 block text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted"
          >
            Phone <span className="text-muted/60">(optional)</span>
          </label>
          <input
            id="ct-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="98765 43210"
            className={inputCls(false)}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="ct-topic"
          className="mb-1.5 block text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted"
        >
          What&rsquo;s it about
        </label>
        <select
          id="ct-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className={`${inputCls(false)} cursor-pointer`}
        >
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="ct-message"
          className="mb-1.5 block text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted"
        >
          Message <span className="text-gold" aria-hidden="true">*</span>
        </label>
        <textarea
          id="ct-message"
          rows={5}
          maxLength={2000}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (errors.message) setErrors((x) => ({ ...x, message: undefined }));
          }}
          placeholder="Tell us the occasion, quantity, any engraving or a date to work to…"
          aria-required="true"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "ct-message-err" : undefined}
          className={inputCls(!!errors.message)}
        />
        {errors.message && (
          <p id="ct-message-err" role="alert" className="mt-1.5 text-xs text-danger">
            {errors.message}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 pt-1">
        <Button type="submit" variant="whatsapp" size="lg">
          <span aria-hidden="true">💬</span> Send on WhatsApp
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => send("email")}>
          <span aria-hidden="true">✉️</span> Send as email
        </Button>
      </div>
      <p className="text-xs text-muted">
        Your message opens in WhatsApp or your email app, pre-filled — nothing is sent until you
        hit send there.
      </p>
    </form>
  );
}
