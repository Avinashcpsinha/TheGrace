import type { MetadataRoute } from "next";
import { site } from "@/config/site";

/** Allow crawling the storefront; keep admin, API and private commerce pages
 *  (cart/checkout/account/order tracking) out of the index. */
export default function robots(): MetadataRoute.Robots {
  const base = site.url.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/cart", "/checkout", "/account", "/order/", "/track-order"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
