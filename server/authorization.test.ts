import { describe, expect, it } from "vitest";
import { canEditHistoryRecord, requireOwner } from "./authorization";

describe("owner-only actions", () => {
  it("allows owner and rejects staff", () => {
    expect(() => requireOwner({ email: "owner@example.com", role: "owner" })).not.toThrow();
    expect(() => requireOwner({ email: "staff@example.com", role: "staff" })).toThrow(
      "เฉพาะเจ้าของฟาร์ม",
    );
  });
});

describe("history editing window", () => {
  const now = new Date("2026-09-30T12:00:00Z");
  const owner = { email: "owner@example.com", role: "owner" } as const;
  const staff = { email: "staff@example.com", role: "staff" } as const;

  it("lets owner edit legacy records without creator metadata", () => {
    expect(canEditHistoryRecord(owner, null, new Date("2020-01-01"), now)).toBe(true);
  });

  it("lets staff edit only their own record within 24 hours", () => {
    expect(
      canEditHistoryRecord(
        staff,
        "STAFF@example.com",
        new Date("2026-09-29T12:00:00Z"),
        now,
      ),
    ).toBe(true);
    expect(
      canEditHistoryRecord(
        staff,
        "other@example.com",
        new Date("2026-09-30T11:00:00Z"),
        now,
      ),
    ).toBe(false);
    expect(
      canEditHistoryRecord(staff, null, new Date("2026-09-30T11:00:00Z"), now),
    ).toBe(false);
    expect(
      canEditHistoryRecord(
        staff,
        staff.email,
        new Date("2026-09-29T11:59:59Z"),
        now,
      ),
    ).toBe(false);
    expect(
      canEditHistoryRecord(
        staff,
        staff.email,
        new Date("2026-09-30T12:00:01Z"),
        now,
      ),
    ).toBe(false);
  });
});
