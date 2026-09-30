import { describe, expect, it, vi } from "vitest";
import { photoManifest, sha256Hex } from "./photo-manifest";

const record = { id: "inspection-1", imageKey: "inspections/inspection-1/photo", imageMime: "image/jpeg" };

describe("photo manifest", () => {
  it("returns an empty manifest without photos", async () => {
    const bucket = { head: vi.fn(), get: vi.fn() } as unknown as R2Bucket;
    expect(await photoManifest(bucket, [{ ...record, imageKey: null }])).toEqual([]);
  });

  it("uses stored checksum without downloading the photo", async () => {
    const head = vi.fn().mockResolvedValue({ size: 4, customMetadata: { sha256: "a".repeat(64) } });
    const get = vi.fn();
    const bucket = { head, get } as unknown as R2Bucket;
    expect(await photoManifest(bucket, [record])).toEqual([{
      inspectionId: record.id, key: record.imageKey, mime: "image/jpeg", size: 4, sha256: "a".repeat(64),
    }]);
    expect(get).not.toHaveBeenCalled();
  });

  it("hashes legacy photos and rejects missing objects", async () => {
    const bytes = new TextEncoder().encode("test");
    const bucket = {
      head: vi.fn().mockResolvedValue({ size: bytes.length, customMetadata: {} }),
      get: vi.fn().mockResolvedValue({ arrayBuffer: () => Promise.resolve(bytes.buffer) }),
    } as unknown as R2Bucket;
    expect((await photoManifest(bucket, [record]))[0].sha256).toBe(await sha256Hex(bytes));
    const missing = { head: vi.fn().mockResolvedValue(null) } as unknown as R2Bucket;
    await expect(photoManifest(missing, [record])).rejects.toThrow("สำรองข้อมูลไม่ครบ");
  });
});
