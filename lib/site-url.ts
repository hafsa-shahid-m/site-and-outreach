// The address of this site, with no slash at the end.
// Production: NEXT_PUBLIC_SITE_URL. A preview deploy: https:// plus VERCEL_URL.
// Locally and in CI: http://localhost:3000. A missing value never crashes anything.
export function siteUrl(): string {
  const set = process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (set && set.trim() !== "") return set.trim().replace(/\/+$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
