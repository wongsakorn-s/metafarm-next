import { describe, expect, it } from "vitest";
import { formatFarmDate, formatFarmMonth, formatFarmNumber } from "./date";

describe("Thai farm display formatting", () => {
  it("formats date-only values without shifting the day", () => {
    expect(formatFarmDate("2026-09-20")).toContain("20");
    expect(formatFarmDate("2026-09-20")).toContain("2569");
    expect(formatFarmDate("invalid")).toBe("invalid");
  });

  it("formats a month and numeric quantities", () => {
    expect(formatFarmMonth("2026-09")).toContain("2569");
    expect(formatFarmNumber(1250)).toBe("1,250");
  });
});
