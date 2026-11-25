import type { MetadataRoute } from "next";
import { siteUrl } from "../lib/site-url";

// Allows everything. Never add /p/ here: a crawler that cannot fetch a page cannot see its noindex tag.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${siteUrl()}/sitemap.xml` };
}
