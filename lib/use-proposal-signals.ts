import { useEffect } from "react";
import { ACTIVE_WINDOW_SECONDS, POINTER_MOVE_PIXELS, SEEN_RATIO } from "./constants";
import { isOpened, isSeen } from "./open-rule";

// YOUR TURN start thresholds
// Chapter 5.8. Pick a heartbeat interval from 15 to 30 seconds and a cap from 10 to 60 minutes.
export const HEARTBEAT_SECONDS: number = 0;
export const CAP_MINUTES: number = 0;
// YOUR TURN end thresholds

export type OpenedEvent = { visit_key: string; kind: "opened"; jsRan: true; visibleSeconds: number; actions: number };
export type HeartbeatEvent = { visit_key: string; kind: "heartbeat"; visibleSeconds: number; sections: string[] };
export type ProposalEvent = OpenedEvent | HeartbeatEvent;

export type TrackerEnv = {
  visible: () => boolean;
  send: (event: ProposalEvent) => void;
  sendFinal: (event: ProposalEvent) => void; // used when the page is hidden: it must survive the page closing
};

// Pre-wired. Keeps the time and the sections in the page and decides when to send.
// Call tick() once a second. The listeners in useProposalSignals call the other methods.
export function createTracker(visitKey: string, env: TrackerEnv) {
  const capSeconds = CAP_MINUTES * 60;
  let visibleSeconds = 0;
  let secondsSinceAction = Number.POSITIVE_INFINITY;
  let actions = 0;
  let opened = false;
  let capped = false;
  let lastBeatAt = 0;
  let dirty = false;
  const onScreen = new Map<string, boolean>();
  const secondsHalf = new Map<string, number>();
  const seen = new Set<string>();

  const heartbeat = (): HeartbeatEvent => ({
    visit_key: visitKey,
    kind: "heartbeat",
    visibleSeconds,
    sections: [...seen].sort(),
  });

  return {
    action() {
      actions += 1;
      secondsSinceAction = 0;
    },
    // ratio: how much of the section is on screen now (0 to 1)
    section(id: string, halfOnScreen: boolean) {
      onScreen.set(id, halfOnScreen);
    },
    tick() {
      if (!env.visible() || capped) return;
      visibleSeconds += 1;
      secondsSinceAction += 1;
      for (const [id, half] of onScreen) {
        if (!half) continue;
        const total = (secondsHalf.get(id) ?? 0) + 1;
        secondsHalf.set(id, total);
        if (isSeen({ secondsHalfOnScreen: total }) && !seen.has(id)) {
          seen.add(id);
          dirty = true;
        }
      }
      if (!opened) {
        if (isOpened({ jsRan: true, visibleSeconds, actions, owner: false })) {
          opened = true;
          lastBeatAt = visibleSeconds;
          env.send({ visit_key: visitKey, kind: "opened", jsRan: true, visibleSeconds, actions });
        }
        return;
      }
      if (visibleSeconds >= capSeconds) {
        capped = true; // the last send: after this the page stays quiet
        env.send(heartbeat());
        return;
      }
      const active = secondsSinceAction <= ACTIVE_WINDOW_SECONDS;
      if (active && visibleSeconds - lastBeatAt >= HEARTBEAT_SECONDS) {
        lastBeatAt = visibleSeconds;
        dirty = false;
        env.send(heartbeat());
      }
    },
    // The page was hidden or is closing: send what has not been sent yet.
    hidden() {
      if (!opened || capped) return;
      if (visibleSeconds === lastBeatAt && !dirty) return;
      lastBeatAt = visibleSeconds;
      dirty = false;
      env.sendFinal(heartbeat());
    },
    state: () => ({ visibleSeconds, actions, opened, capped, seen: [...seen] }),
  };
}

// The hook the proposal page uses. It wires the browser's events to the tracker above.
export function useProposalSignals(visitKey: string | null): void {
  useEffect(() => {
    if (!visitKey) return;

    const post = (event: ProposalEvent) => {
      fetch("/api/proposal-event", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(event),
        keepalive: true,
      }).catch(() => {});
    };
    const beacon = (event: ProposalEvent) => {
      const body = new Blob([JSON.stringify(event)], { type: "application/json" });
      if (!navigator.sendBeacon("/api/proposal-event", body)) post(event);
    };
    const tracker = createTracker(visitKey, {
      visible: () => document.visibilityState === "visible",
      send: post,
      sendFinal: beacon,
    });

    // Human actions: scroll, pointerdown, pointermove over 10 pixels, keydown, touchstart.
    let lastX = 0;
    let lastY = 0;
    const act = () => tracker.action();
    const move = (event: PointerEvent) => {
      const far = Math.hypot(event.clientX - lastX, event.clientY - lastY) > POINTER_MOVE_PIXELS;
      lastX = event.clientX;
      lastY = event.clientY;
      if (far) tracker.action();
    };
    window.addEventListener("scroll", act, { passive: true });
    window.addEventListener("pointerdown", act, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("keydown", act);
    window.addEventListener("touchstart", act, { passive: true });

    // Sections: at least half of the section on screen, or half of the screen when the section is taller.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const rootHeight = entry.rootBounds?.height ?? window.innerHeight;
          const half =
            entry.isIntersecting &&
            (entry.intersectionRatio >= SEEN_RATIO || entry.intersectionRect.height >= SEEN_RATIO * rootHeight);
          tracker.section(entry.target.id, half);
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    document.querySelectorAll("main section[id]").forEach((element) => observer.observe(element));

    const timer = window.setInterval(() => tracker.tick(), 1000);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") tracker.hidden();
    };
    const onHide = () => tracker.hidden();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);

    return () => {
      window.clearInterval(timer);
      observer.disconnect();
      window.removeEventListener("scroll", act);
      window.removeEventListener("pointerdown", act);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("keydown", act);
      window.removeEventListener("touchstart", act);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
    };
  }, [visitKey]);
}
