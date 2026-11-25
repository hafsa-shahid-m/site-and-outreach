"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { sendView } from "../lib/send-view";

// Sits in the root layout, so a client-side navigation does not reload it.
// It runs again whenever the path changes, and each new path counts as a new view.
export default function ViewBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    // YOUR TURN start send-when-visible
    // Chapter 4.5. Send one view for this path, when the page is visible.
    // YOUR TURN end send-when-visible
  }, [pathname]);

  return null;
}
