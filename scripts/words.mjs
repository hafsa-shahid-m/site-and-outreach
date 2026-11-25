// npm run words -- content/posts/<slug>.md
// Counts the body words the way the rubric does: no frontmatter and no code blocks, so only prose counts.
import fs from "node:fs";

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error("Usage: npm run words -- content/posts/<slug>.md");
  process.exit(1);
}

export function countWords(markdown) {
  const noFrontmatter = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  const noCode = noFrontmatter.replace(/```[\s\S]*?```/g, " ");
  const words = noCode.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w));
  return words.length;
}

console.log(countWords(fs.readFileSync(file, "utf8")));
