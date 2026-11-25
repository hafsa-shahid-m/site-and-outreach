import { describe, expect, it } from "vitest";
import {
  CAP_MINUTES,
  createTracker,
  HEARTBEAT_SECONDS,
  type ProposalEvent,
} from "../lib/use-proposal-signals";
import { why } from "./helpers/db";

function setup(visible = true) {
  const sent: ProposalEvent[] = [];
  const final: ProposalEvent[] = [];
  const state = { visible };
  const tracker = createTracker("key123", {
    visible: () => state.visible,
    send: (e) => sent.push(e),
    sendFinal: (e) => final.push(e),
  });
  return { tracker, sent, final, state };
}

describe("thresholds (chapter 5.8)", () => {
  it("the heartbeat interval is between 15 and 30 seconds", () => {
    expect(HEARTBEAT_SECONDS, why("5.8", "pick an interval from 15 to 30 seconds")).toBeGreaterThanOrEqual(15);
    expect(HEARTBEAT_SECONDS).toBeLessThanOrEqual(30);
  });
  it("the cap is between 10 and 60 minutes of visible time", () => {
    expect(CAP_MINUTES, why("5.8", "pick a cap from 10 to 60 minutes")).toBeGreaterThanOrEqual(10);
    expect(CAP_MINUTES).toBeLessThanOrEqual(60);
  });
});

describe("the tracker (chapter 5.8)", () => {
  it("sends opened once, after 3 visible seconds and an action", () => {
    const { tracker, sent } = setup();
    tracker.tick();
    tracker.tick();
    tracker.action();
    tracker.tick();
    expect(sent.map((e) => e.kind)).toEqual(["opened"]);
    for (let i = 0; i < 5; i++) tracker.tick();
    expect(sent.filter((e) => e.kind === "opened")).toHaveLength(1);
  });

  it("does not open without an action", () => {
    const { tracker, sent } = setup();
    for (let i = 0; i < 20; i++) tracker.tick();
    expect(sent).toEqual([]);
  });

  it("sends a heartbeat every interval while active, with the visible seconds so far", () => {
    const { tracker, sent } = setup();
    tracker.action();
    for (let i = 0; i < 3; i++) tracker.tick();
    for (let i = 0; i < HEARTBEAT_SECONDS * 2; i++) {
      if (i % 10 === 0) tracker.action();
      tracker.tick();
    }
    const beats = sent.filter((e) => e.kind === "heartbeat");
    expect(beats.length, why("5.8", "one heartbeat per interval while active")).toBeGreaterThanOrEqual(1);
    expect(beats[0].visibleSeconds).toBeGreaterThanOrEqual(3 + HEARTBEAT_SECONDS);
  });

  it("sends nothing while the visitor is idle for more than 30 seconds", () => {
    const { tracker, sent } = setup();
    tracker.action();
    for (let i = 0; i < 3; i++) tracker.tick();
    const before = sent.length;
    for (let i = 0; i < 200; i++) tracker.tick();
    const heartbeats = sent.slice(before).filter((e) => e.kind === "heartbeat");
    // idle after 30 seconds: only the beats that fell inside the first 30 seconds can exist
    expect(heartbeats.length).toBeLessThanOrEqual(Math.ceil(30 / HEARTBEAT_SECONDS));
  });

  it("does not count hidden time", () => {
    const { tracker, state } = setup();
    tracker.action();
    state.visible = false;
    for (let i = 0; i < 100; i++) tracker.tick();
    expect(tracker.state().visibleSeconds).toBe(0);
  });

  it("sends a final heartbeat when the page is hidden", () => {
    const { tracker, final } = setup();
    tracker.action();
    for (let i = 0; i < 7; i++) tracker.tick();
    tracker.hidden();
    expect(final).toHaveLength(1);
    expect(final[0]).toMatchObject({ kind: "heartbeat", visibleSeconds: 7 });
  });

  it("marks a section seen after 5 seconds with half of it on screen", () => {
    const { tracker, final } = setup();
    tracker.action();
    tracker.section("fit", true);
    for (let i = 0; i < 4; i++) tracker.tick();
    expect(tracker.state().seen).toEqual([]);
    tracker.tick();
    expect(tracker.state().seen).toEqual(["fit"]);
    tracker.hidden();
    expect((final[0] as { sections: string[] }).sections).toEqual(["fit"]);
  });

  it("sends no more past the cap", () => {
    const { tracker, sent, final } = setup();
    const capSeconds = CAP_MINUTES * 60;
    for (let i = 0; i < capSeconds + 600; i++) {
      if (i % 20 === 0) tracker.action();
      tracker.tick();
    }
    const total = sent.length;
    for (let i = 0; i < 1000; i++) {
      tracker.action();
      tracker.tick();
    }
    tracker.hidden();
    expect(sent.length, why("5.8", "the page must stop sending after the cap")).toBe(total);
    expect(final).toHaveLength(0);
    expect(tracker.state().visibleSeconds).toBeLessThanOrEqual(capSeconds);
  });
});
