import { isbot } from "isbot";
import { readSession } from "./session";
import { readCookie } from "./session-cookie";
import { SESSION_COOKIE } from "./constants";

export type Reason = "owner" | "head" | "prefetch" | "empty-agent" | "robot";
export type Verdict = { person: true } | { person: false; reason: Reason };

// The one place that decides who counts. Anything with headers and an optional method works:
// a route handler passes its Request, a page passes { headers: await headers() }.
// When a request has more than one cause, the reason is the first of:
// owner, head, prefetch, empty-agent, robot.
export async function classify(request: { headers: Headers; method?: string }): Promise<Verdict> {
  // YOUR TURN start classify
  // Chapter 4.7. Until you write the checks, everyone counts as a person.
  return { person: true };
  // YOUR TURN end classify
}
