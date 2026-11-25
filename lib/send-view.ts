// Pre-wired. Runs in the browser. Sends one view with navigator.sendBeacon, which survives a page change.
// Proposal pages, the login page and the dashboard are never counted as views.

const NOT_COUNTED = ["/p/", "/dashboard", "/login", "/api/"];
let firstSend = true;

export function sendView(path: string): void {
  if (NOT_COUNTED.some((start) => path === start.replace(/\/$/, "") || path.startsWith(start))) return;
  // document.referrer is the page that brought the visitor here. After a client-side
  // navigation it is stale, so it is sent for the first view of a page load only.
  const referrer = firstSend ? document.referrer : "";
  firstSend = false;
  const body = new Blob([JSON.stringify({ path, referrer })], { type: "application/json" });
  navigator.sendBeacon("/api/view", body);
}
