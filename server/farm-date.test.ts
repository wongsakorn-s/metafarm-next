import { describe, expect, it } from "vitest";
import { farmMonth } from "./farm-date";

describe("farmMonth", () => {
  it("uses Thai time at the start of a month", () => {
    expect(farmMonth(new Date("2026-09-30T17:30:00Z"))).toBe("2026-10");
  });

  it("keeps the same month before midnight in Thailand", () => {
    expect(farmMonth(new Date("2026-09-30T16:59:59Z"))).toBe("2026-09");
  });
});
