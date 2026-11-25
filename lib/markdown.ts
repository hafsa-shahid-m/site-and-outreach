import { marked } from "marked";

// Markdown text to an HTML string. The text is the owner's own files, never a visitor's.
export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}
