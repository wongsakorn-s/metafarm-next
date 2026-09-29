import { describe, expect, it } from "vitest";
import type { Dashboard } from "../../lib/api";
import { summarizeDashboard } from "./summary";

describe("dashboard summary", () => {
  it("counts hive conditions and current-month production", () => {
    const data: Dashboard = {
      staff: { email: "owner@example.test", role: "owner" },
      hives: [
        {
          id: "1",
          code: "A",
          name: "A",
          species: null,
          location: null,
          status: "Strong",
        },
        {
          id: "2",
          code: "B",
          name: "B",
          species: null,
          location: null,
          status: "Weak",
        },
      ],
      harvests: [
        {
          id: "1",
          hiveId: "1",
          harvestedAt: "2026-09-01",
          honeyMl: 1250,
          propolisG: 3,
        },
        {
          id: "2",
          hiveId: "1",
          harvestedAt: "2026-08-31",
          honeyMl: 5,
          propolisG: 1,
        },
      ],
      inspections: [],
      team: [],
    };
    const summary = summarizeDashboard(data, "2026-09-29");
    expect(summary.hiveStatuses).toEqual({
      Strong: 1,
      Normal: 0,
      Weak: 1,
      Empty: 0,
    });
    expect(summary.honeyMl).toBe(1250);
    expect(summary.propolisG).toBe(3);
    expect(summary.harvestCount).toBe(1);
  });
});
