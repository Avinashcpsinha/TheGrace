import type { Metadata } from "next";
import { site } from "@/config/site";
import { HERO } from "@/lib/hero-images";
import { HeroBackdrop } from "@/components/catalog/HeroBackdrop";
import { enquiryWhatsAppLink, telLink, mailtoLink } from "@/lib/order-links";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact — Talk to The Grace, Delhi",
  description:
    "Call, WhatsApp or email The Grace — premium trophy & awards makers in Lajpat Nagar, New Delhi. Bulk orders, custom design and Khelo India awards.",
  alternates: { canonical: "/contact" },
};

const mapQuery = encodeURIComponent(
  `${site.address.line}, ${site.address.locality}, ${site.address.city} ${site.address.postalCode}`
);

function ChannelCard({
  icon,
  label,
  value,
  href,
  external,
}: {
  icon: string;
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="card-surface group flex items-center gap-4 rounded-2xl p-5 transition-colors duration-300 hover:border-gold/40"
    >
      <span
        aria-hidden="true"
        className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/30 bg-gold/5 text-lg"
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[0.62rem] uppercase tracking-[0.28em] text-muted">{label}</span>
        <span className="mt-0.5 block truncate text-sm text-ivory transition-colors duration-300 group-hover:text-champagne">
          {value}
        </span>
      </span>
    </a>
  );
}

export default function ContactPage() {
  const emailHref = mailtoLink(
    "Enquiry — The Grace",
    "Hi The Grace!\n\nI'd like to discuss:\n\nOccasion:\nQuantity:\nDate:\n"
  );

  return (
    <>
      <section className="spotlight tg-hero relative overflow-hidden">
        <HeroBackdrop src={HERO.contact} />
        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-[calc(var(--header-h)+5rem)]">
          <header className="max-w-2xl">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.35em] text-gold/90">
              One conversation away
            </p>
            <h1 className="mt-4 font-display text-5xl leading-[1.04] text-ivory [text-wrap:balance] md:text-6xl">
              Let&rsquo;s craft the honours
            </h1>
            <p className="mt-5 leading-relaxed text-muted">
              Tell us the occasion, the quantity and the date — we&rsquo;ll handle design,
              engraving and delivery. We usually reply on WhatsApp within hours.
            </p>
            <div className="gold-rule mt-6 w-24" aria-hidden="true" />
          </header>
        </div>
      </section>

      <section className="spotlight">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          {/* Left: channels + visit */}
          <div className="space-y-8">
            <div className="grid gap-3">
              <ChannelCard
                icon="📞"
                label="Call us"
                value={site.phonePretty()}
                href={telLink()}
              />
              <ChannelCard
                icon="💬"
                label="WhatsApp"
                value="Chat with us now"
                href={enquiryWhatsAppLink()}
                external
              />
              <ChannelCard icon="✉️" label="Email" value={site.email} href={emailHref} />
            </div>

            <Reveal className="card-surface rounded-2xl p-6">
              <h2 className="font-display text-2xl text-ivory">Visit the workshop</h2>
              <address className="mt-3 space-y-1 text-sm not-italic leading-relaxed text-muted">
                <p>{site.address.line}</p>
                <p>
                  {site.address.locality}, {site.address.city} — {site.address.postalCode}
                </p>
              </address>
              <p className="mt-3 text-sm text-ivory/80">Mon–Sat · 10:00–19:00 IST</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  variant="outline"
                  size="sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get directions →
                </Button>
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-line">
                <iframe
                  title={`Map to ${site.name}, ${site.address.locality}`}
                  src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-56 w-full grayscale-[0.3] contrast-[1.05]"
                />
              </div>
            </Reveal>
          </div>

          {/* Right: form */}
          <div>
            <ContactForm />
          </div>
        </div>
        </div>
      </section>
    </>
  );
}
