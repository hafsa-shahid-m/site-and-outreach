import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "../styles/variables.css";
import "../styles/site.css";
import ViewBeacon from "../components/ViewBeacon";
import { siteUrl } from "../lib/site-url";

// YOUR TURN start font
// Chapter 2.13. Import one family from next/font/google in two weights, here, and use it below.
const font = { variable: "" };
// YOUR TURN end font

// YOUR TURN start site-metadata
// Chapter 3.8. Export metadata with metadataBase, a title template, a description and openGraph.
export const metadata: Metadata = {};
// YOUR TURN end site-metadata

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={font.variable}>
      <body>
        <header>
          <Link href="/" className="site-name">
            {/* YOUR TURN start site-name */}
            Your name
            {/* YOUR TURN end site-name */}
          </Link>
          <nav aria-label="Main">
            <Link href="/">Projects</Link>
            <Link href="/about">About</Link>
            <Link href="/blog">Writing</Link>
          </nav>
        </header>
        {children}
        <footer>
          <p>Live at {siteUrl()}</p>
          {/* YOUR TURN start privacy-link */}
          {null}
          {/* YOUR TURN end privacy-link */}
        </footer>
        <ViewBeacon />
      </body>
    </html>
  );
}
