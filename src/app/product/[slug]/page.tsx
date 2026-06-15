import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllProducts,
  getCategory,
  getProduct,
  getRelatedProducts,
} from "@/lib/catalog";
import { site } from "@/config/site";
import type { Product } from "@/lib/types";
import { Gallery } from "@/components/pdp/Gallery";
import { BuyBox } from "@/components/pdp/BuyBox";
import { Accordion } from "@/components/pdp/Accordion";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return (await getAllProducts()).map((p) => ({ slug: p.slug }));
}

function excerpt(text: string, max = 158): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found" };
  const img = product.images[0];
  return {
    title: product.name,
    description: excerpt(product.description),
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} — ${site.name}`,
      description: excerpt(product.description),
      url: `${site.url}/product/${product.slug}`,
      images: img
        ? [{ url: img.src, width: img.width, height: img.height, alt: product.name }]
        : undefined,
    },
  };
}

function productJsonLd(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => `${site.url}${i.src}`),
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: "The Grace" },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder",
      url: `${site.url}/product/${product.slug}`,
    },
  };
}

function Chips({ heading, values }: { heading: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <div>
      <h2 className="text-[0.65rem] uppercase tracking-[0.3em] text-gold/80">{heading}</h2>
      <ul role="list" className="mt-3 flex flex-wrap gap-2">
        {values.map((v) => (
          <li
            key={v}
            className="rounded-full border border-line bg-ink-3 px-3 py-1.5 text-xs text-champagne"
          >
            {v}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const category = getCategory(product.category);
  const categoryName = category?.name ?? product.category.replace(/-/g, " ");
  const related = await getRelatedProducts(product, 4);

  const accordionItems = [
    {
      title: "Customization & engraving",
      content: (
        <p>
          Engraving is included free with every piece — names, dates and event titles, up
          to 60 characters. Logos can be laser-etched, UV-printed or cast as a metal badge
          depending on the design; share your artwork on WhatsApp after ordering and we
          send a design proof before anything goes into production. For a fully bespoke
          shape, visit our{" "}
          <Link
            href="/customization"
            className="text-gold underline decoration-gold/40 underline-offset-4 transition-colors duration-300 hover:text-gold-bright"
          >
            customization studio
          </Link>
          .
        </p>
      ),
    },
    {
      title: "Bulk & corporate orders",
      content: (
        <p>
          Volume pricing applies automatically — up to 20% off per piece at 100+ units.
          We supply schools, sports federations, PSUs and corporate houses with GST
          invoices, branded packaging and committed production timelines. For tenders,
          annual contracts or 500+ piece ceremonies, call us directly and we will assign a
          dedicated production manager.
        </p>
      ),
    },
    {
      title: "Delivery & care",
      content: (
        <p>
          Every award is foam-cradled and double-boxed in our Lajpat Nagar workshop, then
          delivered PAN India — typically 3–5 days for in-stock pieces and 7–10 days for
          made-to-order work. Care is simple: dust with a soft, dry cloth, keep metal
          finishes away from moisture and abrasives, and store premium pieces in their
          velvet presentation case.
        </p>
      ),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }}
      />

      <div className="mx-auto max-w-7xl px-6 pb-24 pt-[calc(var(--header-h)+2rem)]">
        {/* breadcrumbs */}
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-[0.2em] text-muted">
            <li className="flex items-center gap-2">
              <Link href="/" className="transition-colors duration-300 hover:text-champagne">
                Home
              </Link>
              <span aria-hidden="true" className="text-muted/40">
                /
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Link
                href={`/category/${product.category}`}
                className="transition-colors duration-300 hover:text-champagne"
              >
                {categoryName}
              </Link>
              <span aria-hidden="true" className="text-muted/40">
                /
              </span>
            </li>
            <li>
              <span aria-current="page" className="text-champagne/80">
                {product.name}
              </span>
            </li>
          </ol>
        </nav>

        {/* two-column: sticky gallery left, info right */}
        <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
            <Gallery images={product.images} name={product.name} premium={product.premium} />
          </div>

          <div>
            <BuyBox product={product} />

            {/* details */}
            <div className="gold-rule mt-10" aria-hidden="true" />
            <p className="mt-8 leading-relaxed text-muted">{product.description}</p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <Chips heading="Materials" values={product.materials} />
              <Chips heading="Occasions" values={product.occasions} />
            </div>

            <Accordion items={accordionItems} className="mt-10" />
          </div>
        </div>
      </div>

      {/* related */}
      {related.length > 0 && (
        <section aria-label="Related products" className="spotlight">
          <div className="mx-auto max-w-7xl px-6 pb-24 pt-4">
            <SectionHeading
              eyebrow="Keep exploring"
              title="You may also like"
              align="left"
            />
            <Reveal className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6" delay={120}>
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
