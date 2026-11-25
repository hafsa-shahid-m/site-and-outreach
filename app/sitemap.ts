import type { MetadataRoute } from "next";
import { listPosts } from "../lib/posts";
import { siteUrl } from "../lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const pages = ["", "/about", "/blog", "/privacy"].map((path) => ({ url: `${base}${path}` }));
  const posts = listPosts().map((post) => ({ url: `${base}/blog/${post.slug}` }));
  return [...pages, ...posts];
}
