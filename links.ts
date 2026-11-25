// Tracked links. The slug is the part after /go/, the target is where it sends people.
// They live in code, not in the database, so a redirect still works when the database is down.
// These two are examples. Add your own in chapter 6.3.
export const links: Record<string, string> = {
  "example-project": "https://example.com/example-project",
  "example-article": "https://example.com/example-article",
};

// The target for a slug, or undefined. Only your own entries count: never read a target from the request.
export function findLink(slug: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(links, slug) ? links[slug] : undefined;
}
