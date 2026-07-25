/** Central business configuration. Every value can be overridden via env. */
export const site = {
  name: "The Grace",
  legalName: "The Grace Awards & Trophies",
  tagline: "Crafted for moments that matter.",
  description:
    "Premium trophy and awards manufacturer in Delhi — custom trophies, medals, mementos, corporate gifting and branded merchandise, handcrafted and engraved to order in Lajpat Nagar.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",

  // ordering channels (critical path)
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "917009112154",
  phone: process.env.NEXT_PUBLIC_PHONE || "+917009112154",
  phoneSecondary: process.env.NEXT_PUBLIC_PHONE_SECONDARY || "+919899976380",
  email: process.env.NEXT_PUBLIC_EMAIL || "info@thegrace.co.in",

  address: {
    line: "D-22, Third Floor, Veer Savarkar Marg, Central Market",
    locality: "Lajpat Nagar II",
    city: "New Delhi",
    postalCode: "110024",
    country: "IN",
  },

  social: {
    instagram: "https://www.instagram.com/thegrace1303/",
    linkedin: "https://www.linkedin.com/company/the-grace-awards-and-trophies/",
  },

  payments: {
    razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
    codEnabled: (process.env.NEXT_PUBLIC_COD_ENABLED ?? "true") === "true",
  },

  /** Display phone in Indian format: +91 70091 12154 */
  phonePretty(): string {
    const p = this.phone.replace(/\s/g, "");
    return p.length === 13 ? `${p.slice(0, 3)} ${p.slice(3, 8)} ${p.slice(8)}` : this.phone;
  },
};

export type Site = typeof site;
