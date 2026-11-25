import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { why } from "./helpers/db";

let ogElement: unknown = null;
vi.mock("next/og", () => ({
  ImageResponse: class {
    constructor(element: unknown) {
      ogElement = element;
    }
  },
}));

import AboutPage from "../app/about/page";
import BlogIndex from "../app/blog/page";
import Article, { generateMetadata as articleMetadata } from "../app/blog/[slug]/page";
import { metadata } from "../app/layout";
import Home from "../app/page";
import OgImage from "../app/opengraph-image";
import Privacy from "../app/privacy/page";
import StylePage from "../app/style/page";
import RootLayout from "../app/layout";
import { projects } from "../projects";

beforeEach(() => {
  process.env.POSTS_DIR = path.join("tests", "fixtures", "posts");
});
afterEach(() => {
  delete process.env.POSTS_DIR;
});

const html = (el: React.ReactElement) => renderToStaticMarkup(el);
const count = (text: string, re: RegExp) => (text.match(re) ?? []).length;

describe("the home page (chapter 3.4)", () => {
  it("has exactly one h1 with your name or statement, and an email link", () => {
    const out = html(<Home />);
    expect(count(out, /<h1/g), why("3.4", "write the hero: one h1 and a lead with your email link")).toBe(1);
    expect(out).toContain("mailto:");
  });

  it("shows a card for each project, with what, why and result", () => {
    const out = html(<Home />);
    for (const p of projects) {
      expect(out, why("3.4", `show a card for "${p.title}"`)).toContain(p.title);
      expect(out).toContain(p.result.slice(0, 20));
    }
    expect(projects.length).toBeGreaterThan(0);
  });
});

describe("the about page (chapter 3.5)", () => {
  it("has one h1, a mailto link and a story longer than a few lines", () => {
    const out = html(<AboutPage />);
    expect(count(out, /<h1/g)).toBe(1);
    expect(out, why("3.5", "add your contact and the ask as a mailto link")).toContain("mailto:");
    expect(out.replace(/<[^>]+>/g, " ").split(/\s+/).length, why("3.5", "write the story: one specific moment")).toBeGreaterThan(60);
  });
});

describe("the blog index and the article page (chapter 3.7)", () => {
  it("lists posts newest first with their titles", async () => {
    const out = html(<BlogIndex />);
    expect(out, why("3.7", "list each post with a link to its article")).toContain('href="/blog/my-first-bug"');
    expect(out.indexOf("Unquoted date")).toBeLessThan(out.indexOf("Quoted date"));
  });

  it("shows No articles yet when there are none", () => {
    process.env.POSTS_DIR = path.join("tests", "fixtures", "no-such-folder");
    expect(html(<BlogIndex />), why("3.7", "an empty list shows No articles yet")).toContain("No articles yet");
  });

  it("renders the title and the body of an article", async () => {
    const out = html(await Article({ params: Promise.resolve({ slug: "my-first-bug" }) }));
    expect(out, why("3.7", "show the title and the body")).toContain("Why the build broke");
    expect(out).toContain("The build broke on a Tuesday");
  });

  it("answers not found for an unknown slug", async () => {
    await expect(Article({ params: Promise.resolve({ slug: "nope" }) })).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });
});

describe("the social card (chapter 3.8)", () => {
  it("has site metadata: a base address, a title template, a description and Open Graph", () => {
    const m = metadata as Record<string, any>;
    expect(m.metadataBase, why("3.8", "set metadataBase with new URL(siteUrl())")).toBeInstanceOf(URL);
    expect(m.title?.template ?? m.title, why("3.8", "set a title template")).toBeTruthy();
    expect(m.description).toBeTruthy();
    expect(m.openGraph?.title).toBeTruthy();
    expect(m.openGraph?.description).toBeTruthy();
  });

  it("draws your name and one line on the image, not the placeholder", () => {
    OgImage();
    const text = JSON.stringify(ogElement);
    expect(text, why("3.8", "put your own name in app/opengraph-image.tsx")).not.toContain("Your name here");
    expect(text).not.toContain("Your one line here");
  });

  it("gives each article its title and its first sentence as the description", async () => {
    const m = (await articleMetadata({ params: Promise.resolve({ slug: "my-first-bug" }) })) as Record<string, any>;
    expect(m.title, why("3.8", "return the post's title from generateMetadata")).toBe("Why the build broke");
    expect(m.description).toBe("The build broke on a Tuesday.");
  });
});

describe("the style page (chapter 2.13)", () => {
  it("shows four decisions, each with a choice, a reason and what was rejected", () => {
    const out = html(<StylePage />);
    expect(count(out, /data-decision/g), why("2.13", "fill the four decisions in app/style/page.tsx")).toBe(4);
    for (const label of ["Choice", "Reason", "Rejected"]) expect(count(out, new RegExp(label, "g"))).toBe(4);
    expect(out).not.toMatch(/TODO|lorem/i);
  });
});

describe("the privacy page (chapter 4.12)", () => {
  it("says what is stored, the cookie and the retention in the marked section", () => {
    const out = html(<Privacy />);
    expect(out, "Chapter 4.12: keep your list inside the PrivacyStored section").toContain("data-privacy-stored");
    for (const word of ["referrer", "daily", "session", "months"]) {
      expect(out.toLowerCase(), `Chapter 4.12: the privacy page must mention "${word}"`).toContain(word);
    }
  });

  it("names every table the site stores (chapter 6.8)", () => {
    const out = html(<Privacy />).toLowerCase();
    for (const table of ["views", "dropped", "proposals", "recipients", "proposal visits", "clicks", "reach-outs", "sessions"]) {
      expect(out, `Chapter 6.8: the privacy page must name ${table}`).toContain(table);
    }
  });

  it("is linked from the footer of every page (chapter 4.12)", () => {
    const out = html(<RootLayout>{null}</RootLayout>);
    expect(out, why("4.12", "add a footer link to /privacy in app/layout.tsx")).toContain('href="/privacy"');
  });
});
