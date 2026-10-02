import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/checkout", "/cart", "/order/", "/api/"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
