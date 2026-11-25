import type { Share } from "./stats";

// A share written with its base, so a percentage never stands alone.
export function formatShare(s: Share): string {
  if (s.percent === null) return `${s.part} of ${s.base} (${s.label})`;
  return `${s.percent}% (${s.part} of ${s.base})`;
}

export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}
