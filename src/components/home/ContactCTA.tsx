/**
 * ContactCTA — closing spotlight band. Three first-class channels
 * (Call / WhatsApp / Email — all via @/config/site + @/lib/order-links)
 * plus a ghost link into the customization flow. Server component.
 */
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { site } from "@/config/site";
import { enquiryWhatsAppLink, mailtoLink, telLink } from "@/lib/order-links";

export function ContactCTA() {
  const emailHref = mailtoLink(
    "Event enquiry — awards & trophies",
    "Hi The Grace!\n\nI'm planning an event and would like to discuss trophies, awards or gifting.\n\nOccasion:\nQuantity:\nDate:\n"
  );

  return (
    <section className="spotlight relative overflow-hidden border-t border-line">
      <div className="mx-auto max-w-4xl px-6 py-28 text-center">
        <Reveal>
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.35em] text-gold/90">
            One conversation away
          </p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-ivory md:text-5xl lg:text-6xl [text-wrap:balance]">
            Planning an event?{" "}
            <span className="gold-text">Let&rsquo;s craft the honours.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-muted md:text-lg">
            Tell us the occasion, the quantity and the date — design, engraving
            and delivery are on us.
          </p>
        </Reveal>

        <Reveal
          delay={140}
          className="mt-11 flex flex-wrap items-center justify-center gap-4"
        >
          <Button
            href={telLink()}
            variant="dark"
            size="lg"
            aria-label={`Call The Grace at ${site.phonePretty()}`}
          >
            <span aria-hidden="true">📞</span> Call {site.phonePretty()}
          </Button>
          <Button
            href={enquiryWhatsAppLink("a bulk or custom order")}
            variant="whatsapp"
            size="lg"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with The Grace on WhatsApp"
          >
            <span aria-hidden="true">💬</span> WhatsApp us
          </Button>
          <Button
            href={emailHref}
            variant="outline"
            size="lg"
            aria-label={`Email The Grace at ${site.email}`}
          >
            <span aria-hidden="true">✉️</span> Email us
          </Button>
        </Reveal>

        <Reveal delay={240} className="mt-9">
          <Button href="/customization" variant="ghost">
            Need engraving, logos or bulk pricing? Start a customization request →
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
