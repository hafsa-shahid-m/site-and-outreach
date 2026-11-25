import type { ReactNode } from "react";

// The "What is stored" section of the privacy page. The data-privacy-stored marker is what the capstone
// check looks for. The words inside it are yours.
export default function PrivacyStored({ children }: { children?: ReactNode }) {
  return (
    <section className="privacy-stored" data-privacy-stored aria-labelledby="stored-heading">
      <h2 id="stored-heading">What is stored</h2>
      {children}
    </section>
  );
}
