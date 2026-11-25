import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

// A date is text when it is quoted in the frontmatter and a Date when it is not. Know which you hold.
export type Post = {
  slug: string;
  title: string;
  date: string | Date;
  draft: boolean;
  body: string;
};

function postsDir(): string {
  return process.env.POSTS_DIR ?? path.join(process.cwd(), "content", "posts");
}

// Pre-wired. Reads every Markdown file in the posts folder. The slug is the file name, not the title.
export function readAllPosts(): Post[] {
  const dir = postsDir();
  if (!fs.existsSync(/* turbopackIgnore: true */ dir)) return [];
  return fs
    .readdirSync(/* turbopackIgnore: true */ dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const { data, content } = matter(fs.readFileSync(path.join(/* turbopackIgnore: true */ dir, file), "utf8"));
      return {
        slug: file.replace(/\.md$/, ""),
        title: typeof data.title === "string" ? data.title : file.replace(/\.md$/, ""),
        date: (data.date as string | Date | undefined) ?? "",
        draft: data.draft === true,
        body: content,
      };
    });
}

export function timeOf(date: string | Date): number {
  return new Date(date).getTime();
}

// The list the blog index, the article page and generateStaticParams all use.
export function listPosts(): Post[] {
  let posts = readAllPosts();

  // YOUR TURN start hide-drafts
  // Chapter 3.7. Drafts are not hidden yet.
  // YOUR TURN end hide-drafts

  // YOUR TURN start sort-posts
  // Chapter 3.7. The posts are not sorted yet.
  // YOUR TURN end sort-posts

  return posts;
}

export function getPost(slug: string): Post | undefined {
  return listPosts().find((post) => post.slug === slug);
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

// The first sentence of a post body, for the index and for the social card description.
export function firstSentence(body: string): string {
  const text = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^#+\s.*$/gm, " ")
    .replace(/[*_`>#\[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const match = text.match(/^(.+?[.!?])(\s|$)/);
  return (match ? match[1] : text).slice(0, 200);
}
