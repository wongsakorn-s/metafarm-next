import { describe, expect, it } from "vitest";
import { requireOwner } from "./authorization";

describe("owner-only actions", () => {
  it("allows owner and rejects staff", () => {
    expect(() => requireOwner({ email: "owner@example.com", role: "owner" })).not.toThrow();
    expect(() => requireOwner({ email: "staff@example.com", role: "staff" })).toThrow(
      "เฉพาะเจ้าของฟาร์ม",
    );
  });
});
