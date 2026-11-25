"use client";

import { useSyncExternalStore } from "react";

// Pre-wired. Shows the value of one style variable, or a red "not set" chip when it has no value.
export default function VarChip({ name }: { name: string }) {
  // null on the server and during hydration, the real value in the browser
  const value = useSyncExternalStore(
    () => () => {},
    () => getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    () => null,
  );
  if (value === null) return <code>{name}</code>;
  if (value === "") {
    return (
      <code>
        {name}{" "}
        <span style={{ background: "#b00020", color: "#ffffff", padding: "0 0.25em" }} data-not-set>
          not set
        </span>
      </code>
    );
  }
  return (
    <code>
      {name}: {value}
    </code>
  );
}
