// Fixed rule numbers. The course fixes these, so the checks can wait for them.

export const RECORDING_NOTE =
  "This page was made for you. Through this link I can see when it is opened, how long it stays on screen, which sections you scroll to and which project links you click. No cookies are set, and nothing is shared.";

// Open rule (chapter 5.5)
export const OPEN_VISIBLE_SECONDS = 3;
export const POINTER_MOVE_PIXELS = 10;
export const HUMAN_ACTIONS = ["scroll", "pointerdown", "pointermove", "keydown", "touchstart"] as const;

// Seen rule (chapter 5.7): half of a section on screen, for this many seconds in total
export const SEEN_RATIO = 0.5;
export const SEEN_SECONDS = 5;

// Heartbeats (chapter 5.8): a human action in the last 30 seconds means the visitor is active
export const ACTIVE_WINDOW_SECONDS = 30;

// Sessions (chapter 4.10)
export const SESSION_DAYS = 30;
export const SESSION_COOKIE = "session";

// Retention (chapter 4.12). db/prune.sql must say the same number of months.
export const RETENTION_MONTHS = 12;

// Reach-outs (chapter 6.4)
export const CHANNELS = ["linkedin", "email", "whatsapp", "other"] as const;
export const NOTE_MAX_CHARACTERS = 500;

// A percentage needs a base of at least this many (chapter 6.5)
export const SHARE_MIN_BASE = 5;
export const TOO_FEW_LABEL = "too few to tell";
