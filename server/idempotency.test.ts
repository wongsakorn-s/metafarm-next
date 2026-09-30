import { describe, expect, it } from "vitest";
import { assertMatchingReplay, hashRequest } from "./idempotency";

describe("idempotent create requests", () => {
  it("hashes the same parsed body consistently", async () => {
    expect(await hashRequest({ hiveId: "A", honeyMl: 10 }))
      .toBe(await hashRequest({ hiveId: "A", honeyMl: 10 }));
    expect(await hashRequest({ hiveId: "A", honeyMl: 10 }))
      .not.toBe(await hashRequest({ hiveId: "A", honeyMl: 11 }));
  });

  it("rejects reuse of a key by another actor, operation or body", () => {
    const previous = { actor: "a@example.com", operation: "create-harvest", requestHash: "abc" };
    expect(() => assertMatchingReplay(previous, previous as Parameters<typeof assertMatchingReplay>[1])).not.toThrow();
    expect(() => assertMatchingReplay(previous, { ...previous, actor: "b@example.com" } as Parameters<typeof assertMatchingReplay>[1])).toThrow("คีย์การบันทึกนี้เคยใช้");
    expect(() => assertMatchingReplay(previous, { ...previous, operation: "create-inspection" } as Parameters<typeof assertMatchingReplay>[1])).toThrow("คีย์การบันทึกนี้เคยใช้");
    expect(() => assertMatchingReplay(previous, { ...previous, requestHash: "def" } as Parameters<typeof assertMatchingReplay>[1])).toThrow("คีย์การบันทึกนี้เคยใช้");
  });
});
