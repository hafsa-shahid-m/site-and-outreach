import { OPEN_VISIBLE_SECONDS, SEEN_SECONDS } from "./constants";

export type OpenSignals = {
  jsRan: boolean; // the page's JavaScript ran
  visibleSeconds: number; // seconds the page was visible, in total
  actions: number; // human actions so far: scroll, pointerdown, pointermove over 10 px, keydown, touchstart
  owner: boolean; // the server fills this from classify
};

// YOUR TURN start is-opened
export function isOpened(signals: OpenSignals): boolean {
  throw new Error("isOpened is not written yet. Do chapter 5.6.");
}
// YOUR TURN end is-opened

export type SectionTime = {
  secondsHalfOnScreen: number; // seconds this section was at least half on screen while the page was visible
};

// YOUR TURN start is-seen
export function isSeen(section: SectionTime): boolean {
  throw new Error("isSeen is not written yet. Do chapter 5.8.");
}
// YOUR TURN end is-seen
