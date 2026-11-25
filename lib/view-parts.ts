// Two small facts we keep about a view. Never the full browser string, never the full address.

export type Device = "phone" | "tablet" | "desktop";

export function deviceClass(userAgent: string): Device {
  const ua = userAgent || "";
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet";
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|iPod|Android/i.test(ua)) return "phone";
  return "desktop";
}

// The host only, in lower case, without a leading www. Null when there is none.
export function referrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
    return host === "" ? null : host;
  } catch {
    return null;
  }
}
