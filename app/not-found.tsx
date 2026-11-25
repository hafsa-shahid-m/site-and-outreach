import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <h1>That page moved. The projects are here.</h1>
      <p>
        <Link href="/">Back to the home page</Link>
      </p>
    </main>
  );
}
