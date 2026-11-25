import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateStaticParams } from "../app/blog/[slug]/page";
import { getPost, listPosts, readAllPosts } from "../lib/posts";
import { why } from "./helpers/db";

beforeEach(() => {
  process.env.POSTS_DIR = path.join("tests", "fixtures", "posts");
});
afterEach(() => {
  delete process.env.POSTS_DIR;
  vi.unstubAllEnvs();
});

describe("posts (chapter 3.7)", () => {
  it("the slug of my-first-bug.md is my-first-bug, the file name and not the title", () => {
    const post = readAllPosts().find((p) => p.title === "Why the build broke");
    expect(post?.slug).toBe("my-first-bug");
  });

  it("lists newest first, whether a date is quoted text or an unquoted date", () => {
    vi.stubEnv("NODE_ENV", "production");
    const slugs = listPosts().map((p) => p.slug);
    expect(slugs, why("3.7", "sort-posts: newest first. One date is text and one is a Date object.")).toEqual([
      "unquoted-date",
      "quoted-date",
      "my-first-bug",
    ]);
  });

  it("hides a draft in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(listPosts().map((p) => p.slug), why("3.7", "hide-drafts: a draft must not be listed in production")).not.toContain("draft-post");
  });

  it("shows a draft while you work", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(listPosts().map((p) => p.slug)).toContain("draft-post");
  });

  it("gives a draft no page in production, because getPost uses the same list", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(getPost("draft-post")).toBeUndefined();
    expect(getPost("my-first-bug")).toBeDefined();
  });

  it("generateStaticParams uses the same filter as the list", () => {
    vi.stubEnv("NODE_ENV", "production");
    const params = generateStaticParams().map((p) => p.slug);
    expect(params, why("3.7", "generateStaticParams must return listPosts() slugs, so a draft gets no page")).toEqual(
      listPosts().map((p) => p.slug),
    );
    expect(params.length).toBeGreaterThan(0);
  });
});
