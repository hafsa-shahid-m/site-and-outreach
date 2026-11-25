// Dates are plain YYYY-MM-DD strings, cut in UTC.
export type Range = { from: string; to: string };

export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// The last seven days and today.
export function defaultRange(now: Date = new Date()): Range {
  const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { from: isoDay(from), to: isoDay(now) };
}

export function parseRange(params: URLSearchParams, now: Date = new Date()): Range {
  const fallback = defaultRange(now);
  const ok = (value: string | null) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null);
  return { from: ok(params.get("from")) ?? fallback.from, to: ok(params.get("to")) ?? fallback.to };
}
