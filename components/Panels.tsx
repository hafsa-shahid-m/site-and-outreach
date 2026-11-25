"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Bars, Lines } from "./Chart";
import { formatShare, formatWhen } from "../lib/format";
import type {
  ClickRow,
  DayViews,
  DayVisitors,
  Filtered,
  Funnel,
  PageViews,
  ProposalRow,
  ReferrerViews,
} from "../lib/stats";

// Pre-wired panels. Each one asks a data route for its numbers, shows "Loading" while it waits
// (a sleeping database takes a few seconds to wake) and says plainly when it could not load.

type State<T> = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: T };

function usePanelData<T>(route: string, from: string, to: string): State<T> {
  const key = `${route}|${from}|${to}`;
  const [result, setResult] = useState<{ key: string; state: State<T> } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/stats/${route}?from=${from}&to=${to}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 401 ? "Log in again." : "The data did not load.");
        return response.json();
      })
      .then((json) => !cancelled && setResult({ key, state: { status: "ready", data: json as T } }))
      .catch((error: Error) => !cancelled && setResult({ key, state: { status: "error", message: error.message } }));
    return () => {
      cancelled = true;
    };
  }, [key, route, from, to]);
  return result && result.key === key ? result.state : { status: "loading" };
}

function Frame({
  id,
  question,
  note,
  state,
  children,
}: {
  id: string;
  question: string;
  note?: string;
  state: State<unknown>;
  children: ReactNode;
}) {
  return (
    <section className="panel" data-panel={id} aria-busy={state.status === "loading"}>
      <h3>{question}</h3>
      {state.status === "loading" ? <p className="panel-state">Loading. The database may be waking up.</p> : null}
      {state.status === "error" ? <p className="panel-state">{state.message} Reload in a few seconds.</p> : null}
      {state.status === "ready" ? children : null}
      {note ? <p className="panel-note">{note}</p> : null}
    </section>
  );
}

type Range = { from: string; to: string };

export function TablePanel({
  id,
  route,
  question,
  columns,
  range,
  note,
}: {
  id: string;
  route: string;
  question: string;
  columns: { key: string; label: string }[];
  range: Range;
  note?: string;
}) {
  const state = usePanelData<Record<string, unknown>[]>(route, range.from, range.to);
  return (
    <Frame id={id} question={question} state={state} note={note}>
      {state.status === "ready" && state.data.length === 0 ? <p className="panel-state">Nothing yet.</p> : null}
      {state.status === "ready" && state.data.length > 0 ? (
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.data.map((row, index) => (
              <tr key={index}>
                {columns.map((c) => (
                  <td key={c.key}>{String(row[c.key] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </Frame>
  );
}

export function TrafficPanel({ range }: { range: Range }) {
  const views = usePanelData<DayViews[]>("views-per-day", range.from, range.to);
  const visitors = usePanelData<DayVisitors[]>("visitors-per-day", range.from, range.to);
  const state: State<unknown> =
    views.status === "error" ? views : visitors.status === "error" ? visitors : views.status === "ready" && visitors.status === "ready" ? views : { status: "loading" };
  return (
    <Frame
      id="traffic"
      question="How many views and visitors a day?"
      state={state}
      note={`${range.from} to ${range.to}, days cut in UTC. Visitors are counted once a day, so the total over days is visitor-days, not people.`}
    >
      {views.status === "ready" && visitors.status === "ready" ? (
        <Lines
          series={[
            { name: "Views", points: views.data.map((d) => ({ x: d.day, y: d.views })) },
            { name: "Visitors", points: visitors.data.map((d) => ({ x: d.day, y: d.visitors })) },
          ]}
        />
      ) : null}
    </Frame>
  );
}

export function BarsPanel({
  id,
  route,
  question,
  labelKey,
  range,
  note,
}: {
  id: string;
  route: string;
  question: string;
  labelKey: "path" | "referrer";
  range: Range;
  note?: string;
}) {
  const state = usePanelData<(PageViews | ReferrerViews)[]>(route, range.from, range.to);
  return (
    <Frame id={id} question={question} state={state} note={note}>
      {state.status === "ready" && state.data.length === 0 ? <p className="panel-state">Nothing yet.</p> : null}
      {state.status === "ready" && state.data.length > 0 ? (
        <Bars
          rows={state.data.map((row) => ({
            label: String((row as unknown as Record<string, unknown>)[labelKey]),
            value: row.views,
          }))}
        />
      ) : null}
    </Frame>
  );
}

export function ProposalsPanel({ range }: { range: Range }) {
  const state = usePanelData<ProposalRow[]>("proposals", range.from, range.to);
  return (
    <Frame id="proposals" question="Who opened their proposal, and how far did they read?" state={state} note="All time. Seen means at least half of a section was on screen for 5 seconds.">
      {state.status === "ready" && state.data.length === 0 ? <p className="panel-state">No links made yet.</p> : null}
      {state.status === "ready" && state.data.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th scope="col">Recipient</th>
              <th scope="col">Link made</th>
              <th scope="col">Fetched</th>
              <th scope="col">First open</th>
              <th scope="col">Opens</th>
              <th scope="col">Visible seconds</th>
              <th scope="col">Sections seen</th>
            </tr>
          </thead>
          <tbody>
            {state.data.map((row) => (
              <tr key={row.recipient_id}>
                <td>{row.name}</td>
                <td>{formatWhen(row.link_made)}</td>
                <td>{row.fetched}</td>
                <td>{row.first_open ? formatWhen(row.first_open) : "not opened yet"}</td>
                <td>{row.open_count}</td>
                <td>{row.visible_seconds}</td>
                <td>{row.sections.length > 0 ? row.sections.join(", ") : "none"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </Frame>
  );
}

export function ClicksPanel({ range }: { range: Range }) {
  const state = usePanelData<ClickRow[]>("clicks", range.from, range.to);
  return (
    <Frame id="clicks" question="Which links did people click?" state={state} note="With recipient means the link carried a recipient's code. Public means a link in a post.">
      {state.status === "ready" && state.data.length === 0 ? <p className="panel-state">No clicks yet.</p> : null}
      {state.status === "ready" && state.data.length > 0 ? (
        <Bars
          rows={state.data.map((row) => ({
            label: row.slug,
            value: row.with_recipient + row.public_clicks,
            note: `${row.with_recipient} with recipient, ${row.public_clicks} public`,
          }))}
        />
      ) : null}
    </Frame>
  );
}

export function FunnelPanel({ range }: { range: Range }) {
  const state = usePanelData<Funnel>("funnel", range.from, range.to);
  return (
    <Frame id="funnel" question="Of the reach-outs I sent, how many were opened and clicked?" state={state} note="Each reach-out counts only what came after it was sent.">
      {state.status === "ready" ? (
        <dl className="funnel">
          <dt>Sent</dt>
          <dd>{state.data.sent}</dd>
          <dt>Opened</dt>
          <dd>{formatShare(state.data.openedShare)}</dd>
          <dt>Clicked</dt>
          <dd>{formatShare(state.data.clickedShare)}</dd>
        </dl>
      ) : null}
    </Frame>
  );
}

export function FilteredTile({ range }: { range: Range }) {
  const state = usePanelData<Filtered>("filtered-share", range.from, range.to);
  return (
    <Frame id="filtered-share" question="How much traffic did the filters drop?" state={state} note="Robots, link previews, prefetches, HEAD requests and the owner, out of the requests the site recorded or dropped.">
      {state.status === "ready" ? (
        <p className="tile">
          {state.data.dropped} of {state.data.base} requests dropped ({formatShare(state.data.share)})
        </p>
      ) : null}
    </Frame>
  );
}
