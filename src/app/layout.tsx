import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/config/site";
import { StoreProvider } from "@/lib/store";
import { SmoothScroll } from "@/components/chrome/SmoothScroll";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { OrderFab } from "@/components/chrome/OrderFab";
import { CursorGlow } from "@/components/chrome/CursorGlow";
import { Toaster } from "@/components/chrome/Toaster";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "The Grace — Premium Trophies & Awards Manufacturer, Delhi",
    template: "%s — The Grace",
  },
  description: site.description,
  keywords: [
    "trophy manufacturer",
    "trophies online India",
    "custom trophies Delhi",
    "corporate awards",
    "medals manufacturer India",
    "corporate gifting Delhi",
    "custom merchandise Delhi",
    "awards Lajpat Nagar",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: site.url,
    siteName: site.name,
    title: "The Grace — Premium Trophies & Awards",
    description: site.tagline + " Custom trophies, medals & corporate awards from Delhi.",
    images: [{ url: "/images/site/og.jpg", width: 1200, height: 630, alt: "The Grace — premium trophies" }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  width: "device-width",
  initialScale: 1,
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.legalName,
  url: site.url,
  logo: `${site.url}/images/site/og.jpg`,
  email: site.email,
  telephone: site.phone,
  sameAs: [site.social.instagram, site.social.linkedin],
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.line,
    addressLocality: `${site.address.locality}, ${site.address.city}`,
    postalCode: site.address.postalCode,
    addressCountry: site.address.country,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* apply the saved mood theme before paint — no flash of the default */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('tg-theme');if(['onyx','ivory','emerald','navy'].indexOf(t)<0)t='onyx';document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='onyx';}})();",
          }}
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <StoreProvider>
          <SmoothScroll />
          <CursorGlow />
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <OrderFab />
          <Toaster />
        </StoreProvider>
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
