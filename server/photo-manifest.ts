import { HttpError } from "./http";

export type PhotoManifestEntry = {
  inspectionId: string;
  key: string;
  mime: string;
  size: number;
  sha256: string;
};

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const source = new Uint8Array(bytes.byteLength);
  source.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", source.buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function photoManifest(
  bucket: R2Bucket,
  records: readonly { id: string; imageKey: string | null; imageMime: string | null }[],
): Promise<PhotoManifestEntry[]> {
  const photos = records.filter((record): record is typeof record & { imageKey: string } => Boolean(record.imageKey));
  const result: PhotoManifestEntry[] = [];
  for (let offset = 0; offset < photos.length; offset += 4) {
    const batch = await Promise.all(photos.slice(offset, offset + 4).map(async (record) => {
      const head = await bucket.head(record.imageKey);
      if (!head) throw new HttpError(500, `ไฟล์รูปของบันทึก ${record.id} หายไป สำรองข้อมูลไม่ครบ`);
      let hash = head.customMetadata?.sha256;
      if (!hash) {
        const object = await bucket.get(record.imageKey);
        if (!object) throw new HttpError(500, `ไฟล์รูปของบันทึก ${record.id} หายไป สำรองข้อมูลไม่ครบ`);
        hash = await sha256Hex(new Uint8Array(await object.arrayBuffer()));
      }
      return {
        inspectionId: record.id,
        key: record.imageKey,
        mime: record.imageMime ?? head.httpMetadata?.contentType ?? "application/octet-stream",
        size: head.size,
        sha256: hash,
      };
    }));
    result.push(...batch);
  }
  return result;
}
