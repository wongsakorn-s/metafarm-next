import { describe, expect, it } from "vitest";
import { detectImageMime } from "./image";

describe("inspection photo signatures", () => {
  it("accepts supported image signatures", () => {
    expect(detectImageMime(Uint8Array.from([255, 216, 255]))).toBe(
      "image/jpeg",
    );
    expect(
      detectImageMime(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])),
    ).toBe("image/png");
    expect(detectImageMime(new TextEncoder().encode("RIFF1234WEBP"))).toBe(
      "image/webp",
    );
  });

  it("rejects a renamed non-image", () => {
    expect(
      detectImageMime(new TextEncoder().encode("<script>alert(1)</script>")),
    ).toBeNull();
  });
});
