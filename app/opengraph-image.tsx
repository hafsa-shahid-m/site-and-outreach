import { ImageResponse } from "next/og";

export const alt = "Social card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// YOUR TURN start og-text
// Chapter 3.8. Put your name and your one line here. Use raw colours from your variables.
const CARD = { name: "Your name here", line: "Your one line here", bg: "#ffffff", ink: "#000000", accent: "#000000" };
// YOUR TURN end og-text

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 96,
          background: CARD.bg,
          color: CARD.ink,
        }}
      >
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700, color: CARD.accent }}>{CARD.name}</div>
        <div style={{ display: "flex", fontSize: 48, marginTop: 24 }}>{CARD.line}</div>
      </div>
    ),
    size,
  );
}
