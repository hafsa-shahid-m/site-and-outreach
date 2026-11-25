import Link from "next/link";
import { firstSentence, formatDate, listPosts } from "../../lib/posts";

export const metadata = { title: "Writing" };

export default function BlogIndex() {
  const posts = listPosts();
  return (
    <main>
      <h1>Writing</h1>
      {/* YOUR TURN start post-list */}
      <p>No articles yet</p>
      {/* YOUR TURN end post-list */}
    </main>
  );
}
