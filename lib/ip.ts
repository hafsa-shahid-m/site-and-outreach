import { ipAddress } from "@vercel/functions";

// The address Vercel saw. A visitor cannot fake it by sending their own x-forwarded-for.
// Locally and in CI there is no such address, so every request is 0.0.0.0.
export function clientIp(request: { headers: Headers }): string {
  if (!process.env.VERCEL) return "0.0.0.0";
  return ipAddress({ headers: request.headers }) ?? "0.0.0.0";
}
