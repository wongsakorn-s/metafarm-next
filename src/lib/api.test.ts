import { afterEach, describe, expect, it, vi } from "vitest";
import { th } from "../i18n/th";
import { api } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("api errors", () => {
  it("uses a Thai message for network failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(api("/dashboard")).rejects.toThrow(th.common.networkError);
  });

  it.each([
    [401, th.common.sessionExpired],
    [403, th.common.accessDenied],
  ])("uses a Thai message for HTTP %i", async (status, message) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status })));
    await expect(api("/dashboard")).rejects.toThrow(message);
  });

  it("does not expose HTML parse errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>Access</html>", {
      headers: { "content-type": "text/html" },
    })));
    await expect(api("/dashboard")).rejects.toThrow(th.common.sessionExpired);
  });

  it("uses a Thai message for malformed JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{broken", {
      headers: { "content-type": "application/json" },
    })));
    await expect(api("/dashboard")).rejects.toThrow(th.common.invalidResponse);
  });
});
