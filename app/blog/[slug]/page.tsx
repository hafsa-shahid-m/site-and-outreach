import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { renderMarkdown } from "../../../lib/markdown";
import { firstSentence, formatDate, getPost, listPosts } from "../../../lib/posts";

type Props = { params: Promise<{ slug: string }> };

// YOUR TURN start article-metadata
// Chapter 3.8. Return the post's title and its first sentence as the description.
export async function generateMetadata(): Promise<Metadata> {
  return {};
}
// YOUR TURN end article-metadata

// YOUR TURN start article
// Chapter 3.7. Build the article page. generateStaticParams must use the same list as the index.
export function generateStaticParams() {
  return [];
}
export default function Article() {
  return <main><h1>Article</h1></main>;
}
// YOUR TURN end article
