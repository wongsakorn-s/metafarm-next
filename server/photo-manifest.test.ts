import { describe, expect, it, vi } from "vitest";
import { listThreshold, photoManifest, sha256Hex } from "./photo-manifest";

const record = { id: "inspection-1", imageKey: "inspections/inspection-1/photo", imageMime: "image/jpeg" };

describe("photo manifest", () => {
  it("returns an empty manifest without photos", async () => {
    const bucket = { head: vi.fn(), get: vi.fn() } as unknown as R2Bucket;
    expect(await photoManifest(bucket, [{ ...record, imageKey: null }])).toEqual({ photos: [], missingPhotos: [] });
  });

  it("uses stored checksum without downloading the photo", async () => {
    const head = vi.fn().mockResolvedValue({ size: 4, customMetadata: { sha256: "a".repeat(64) } });
    const get = vi.fn();
    const bucket = { head, get } as unknown as R2Bucket;
    expect(await photoManifest(bucket, [record])).toEqual({
      photos: [{ inspectionId: record.id, key: record.imageKey, mime: "image/jpeg", size: 4, sha256: "a".repeat(64) }],
      missingPhotos: [],
    });
    expect(get).not.toHaveBeenCalled();
  });

  it("hashes legacy photos", async () => {
    const bytes = new TextEncoder().encode("test");
    const bucket = {
      head: vi.fn().mockResolvedValue({ size: bytes.length, customMetadata: {} }),
      get: vi.fn().mockResolvedValue({ arrayBuffer: () => Promise.resolve(bytes.buffer) }),
    } as unknown as R2Bucket;
    expect((await photoManifest(bucket, [record])).photos[0].sha256).toBe(await sha256Hex(bytes));
  });

  it("uses paged listings instead of one head() per photo for large exports", async () => {
    const many = Array.from({ length: listThreshold + 1 }, (_, index) => ({
      ...record, id: `inspection-${index}`, imageKey: `inspections/${index}/photo`,
    }));
    const objects = many.slice(1).map((item) => ({
      key: item.imageKey, size: 4, customMetadata: { sha256: "c".repeat(64) }, httpMetadata: {},
    }));
    const list = vi.fn()
      .mockResolvedValueOnce({ objects: objects.slice(0, 50), truncated: true, cursor: "next" })
      .mockResolvedValueOnce({ objects: objects.slice(50), truncated: false });
    const head = vi.fn();
    const bucket = { list, head, get: vi.fn() } as unknown as R2Bucket;
    const result = await photoManifest(bucket, many);
    expect(list).toHaveBeenCalledTimes(2);
    expect(list.mock.calls[1][0]).toMatchObject({ cursor: "next", prefix: "inspections/" });
    expect(head).not.toHaveBeenCalled();
    expect(result.photos).toHaveLength(listThreshold);
    expect(result.missingPhotos).toEqual([{ inspectionId: many[0].id, key: many[0].imageKey }]);
  });

  it("reports missing objects without dropping the other photos", async () => {
    const other = { ...record, id: "inspection-2", imageKey: "inspections/inspection-2/photo" };
    const bucket = {
      head: vi.fn(async (key: string) => key === record.imageKey
        ? null
        : { size: 4, customMetadata: { sha256: "b".repeat(64) } }),
      get: vi.fn(),
    } as unknown as R2Bucket;
    const result = await photoManifest(bucket, [record, other]);
    expect(result.missingPhotos).toEqual([{ inspectionId: record.id, key: record.imageKey }]);
    expect(result.photos.map((photo) => photo.inspectionId)).toEqual([other.id]);
  });
});
