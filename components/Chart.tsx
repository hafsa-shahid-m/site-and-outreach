import type { CSSProperties } from "react";

// YOUR TURN start chart-scale
// Chapter 6.7. Map a value to a length. Zero must map to the baseline: 0.
export function scale(value: number, max: number, length: number): number {
  throw new Error("scale is not written yet. Do chapter 6.7.");
}
// YOUR TURN end chart-scale

export type Bar = { label: string; value: number; note?: string };

// Horizontal bars from zero. The label is on the left and the value is written on the mark.
export function Bars({ rows, unit = "" }: { rows: Bar[]; unit?: string }) {
  const max = Math.max(0, ...rows.map((row) => row.value));
  return (
    <ol className="chart-bars">
      {rows.map((row) => (
        <li key={row.label} className="chart-row">
          <span className="chart-label">{row.label}</span>
          <svg className="chart-track" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
            <rect x="0" y="0" height="10" width={scale(row.value, max, 100)} style={{ fill: "var(--accent)" }} />
          </svg>
          <span className="chart-value">
            {row.note ?? row.value}
            {unit}
          </span>
        </li>
      ))}
    </ol>
  );
}

export type Series = { name: string; points: { x: string; y: number }[] };

const WIDTH = 320;
const HEIGHT = 160;
const PAD_LEFT = 8;
const PAD_RIGHT = 88; // room for the label at the end of each line
const PAD_TOP = 12;
const PAD_BOTTOM = 8;

const lineStyles: CSSProperties[] = [
  { stroke: "var(--accent)", fill: "none", strokeWidth: 2 },
  { stroke: "var(--ink)", fill: "none", strokeWidth: 2, strokeDasharray: "6 4" },
];

// Lines from zero, each labelled at its end.
export function Lines({ series }: { series: Series[] }) {
  const max = Math.max(0, ...series.flatMap((s) => s.points.map((p) => p.y)));
  const innerW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const count = Math.max(1, ...series.map((s) => s.points.length));
  const xAt = (index: number) => PAD_LEFT + (count === 1 ? 0 : (index / (count - 1)) * innerW);
  const yAt = (value: number) => PAD_TOP + innerH - scale(value, max, innerH);
  return (
    <svg
      className="chart-lines"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={series.map((s) => s.name).join(" and ")}
      style={{ width: "100%", maxWidth: "22rem", height: "auto" }}
    >
      <line x1={PAD_LEFT} x2={PAD_LEFT + innerW} y1={yAt(0)} y2={yAt(0)} style={{ stroke: "var(--muted)", strokeWidth: 1 }} />
      <text x={PAD_LEFT} y={PAD_TOP - 3} style={{ fill: "var(--muted)", fontSize: "var(--size--1)" }}>
        {max}
      </text>
      {series.map((s, index) => {
        const last = s.points[s.points.length - 1];
        const points = s.points.map((p, i) => `${xAt(i)},${yAt(p.y)}`).join(" ");
        return (
          <g key={s.name}>
            <polyline points={points} style={lineStyles[index % lineStyles.length]} />
            {last ? (
              <text
                x={xAt(s.points.length - 1) + 6}
                y={yAt(last.y) + (index % 2 === 0 ? -2 : 12)}
                style={{ fill: "var(--ink)", fontSize: "var(--size--1)" }}
              >
                {s.name}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
