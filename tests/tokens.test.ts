import { describe, expect, it, vi } from "vitest";
import { newToken } from "../lib/tokens";
import { why } from "./helpers/db";

describe("newToken (chapter 5.4)", () => {
  it("is 22 characters", () => {
    expect(newToken(), why("5.4", "16 random bytes in base64url are 22 characters")).toHaveLength(22);
  });

  it("uses only base64url characters, so it is safe in an address", () => {
    expect(newToken()).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });

  it("makes 1000 tokens that are all different", () => {
    const tokens = new Set(Array.from({ length: 1000 }, () => newToken()));
    expect(tokens.size).toBe(1000);
  });

  it("takes 16 bytes from crypto.getRandomValues", () => {
    const spy = vi.spyOn(globalThis.crypto, "getRandomValues");
    newToken();
    expect(spy, why("5.4", "call crypto.getRandomValues, not Math.random")).toHaveBeenCalledTimes(1);
    expect((spy.mock.calls[0][0] as Uint8Array).length).toBe(16);
    spy.mockRestore();
  });
});
