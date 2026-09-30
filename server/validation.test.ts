import { describe, expect, it } from "vitest";
import { auditQuery, archivedHiveQuery, harvestInput, harvestUpdate, hiveInput, inspectionInput, inspectionUpdate } from "./validation";

describe("API input validation", () => {
  it("normalizes hive codes", () => {
    expect(
      hiveInput.parse({ code: "mf-001", name: "รังสวนหน้า", status: "Normal" })
        .code,
    ).toBe("MF-001");
  });

  it("rejects negative harvest amounts", () => {
    expect(
      harvestInput.safeParse({
        hiveId: crypto.randomUUID(),
        harvestedAt: "2026-09-28",
        honeyMl: -1,
        propolisG: 0,
      }).success,
    ).toBe(false);
  });

  it("validates historical harvest changes", () => {
    expect(
      harvestUpdate.safeParse({
        hiveId: crypto.randomUUID(),
        harvestedAt: "2026-09-30",
        honeyMl: 10,
        propolisG: 0.5,
      }).success,
    ).toBe(true);
    expect(
      harvestUpdate.safeParse({
        hiveId: crypto.randomUUID(),
        harvestedAt: "2026-02-30",
        honeyMl: 10,
        propolisG: 0.5,
      }).success,
    ).toBe(false);
  });

  it("rejects impossible dates", () => {
    expect(
      inspectionInput.safeParse({
        hiveId: crypto.randomUUID(),
        inspectedAt: "2026-02-30",
        status: "Strong",
      }).success,
    ).toBe(false);
  });

  it("allows an inspection to keep the current hive status", () => {
    expect(
      inspectionInput.parse({
        hiveId: crypto.randomUUID(),
        inspectedAt: "2026-09-29",
      }).status,
    ).toBeUndefined();
  });

  it("validates historical inspection edits", () => {
    expect(inspectionUpdate.safeParse({ inspectedAt: "2026-09-30", status: "Weak", notes: "ตรวจแล้ว" }).success).toBe(true);
    expect(inspectionUpdate.safeParse({ inspectedAt: "2026-02-30", status: "Weak", notes: null }).success).toBe(false);
    expect(inspectionUpdate.safeParse({ inspectedAt: "2026-09-30", status: "Unknown", notes: null }).success).toBe(false);
  });

  it("bounds archive and audit query inputs", () => {
    expect(archivedHiveQuery.parse({ includeArchived: "true" })).toEqual({ includeArchived: "true" });
    expect(archivedHiveQuery.safeParse({ includeArchived: "yes" }).success).toBe(false);
    expect(auditQuery.parse({ entity: "hive", entityId: crypto.randomUUID(), offset: "10" }).offset).toBe(10);
    expect(auditQuery.safeParse({ entity: "other" }).success).toBe(false);
    expect(auditQuery.safeParse({ offset: "-1" }).success).toBe(false);
  });
});
