import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { renderMarkdown } from "./markdown";

export type ProposalSection = { id: string; heading: string; html: string };
export type Proposal = { slug: string; title: string; introHtml: string; sections: ProposalSection[] };

function proposalsDir(): string {
  return process.env.PROPOSALS_DIR ?? path.join(process.cwd(), "content", "proposals");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Pre-wired. Reads content/proposals/<slug>.md and cuts it into named sections at each "## " heading.
// The section id comes from the heading: "## Trade-offs" becomes id "trade-offs".
export function readProposal(slug: string): Proposal | null {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return null;
  const file = path.join(proposalsDir(), `${slug}.md`);
  if (!fs.existsSync(/* turbopackIgnore: true */ file)) return null;
  const { data, content } = matter(fs.readFileSync(/* turbopackIgnore: true */ file, "utf8"));
  const parts = content.split(/^## +/m);
  const intro = parts.shift() ?? "";
  const sections = parts.map((part) => {
    const newline = part.indexOf("\n");
    const heading = (newline === -1 ? part : part.slice(0, newline)).trim();
    const body = newline === -1 ? "" : part.slice(newline + 1);
    return { id: slugify(heading), heading, html: renderMarkdown(body) };
  });
  return {
    slug,
    title: typeof data.title === "string" ? data.title : slug,
    introHtml: renderMarkdown(intro),
    sections,
  };
}
