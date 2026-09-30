export type PhotoManifestEntry = {
  inspectionId: string;
  key: string;
  mime: string;
  size: number;
  sha256: string;
};

export type MissingPhoto = { inspectionId: string; key: string };

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const source = new Uint8Array(bytes.byteLength);
  source.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", source.buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Lists every referenced photo with its checksum. Photos missing from R2 are reported rather than
 * thrown, so one lost file does not block exporting all other records; callers decide whether to fail.
 */
export async function photoManifest(
  bucket: R2Bucket,
  records: readonly { id: string; imageKey: string | null; imageMime: string | null }[],
): Promise<{ photos: PhotoManifestEntry[]; missingPhotos: MissingPhoto[] }> {
  const referenced = records.filter((record): record is typeof record & { imageKey: string } => Boolean(record.imageKey));
  const photos: PhotoManifestEntry[] = [];
  const missingPhotos: MissingPhoto[] = [];
  for (let offset = 0; offset < referenced.length; offset += 4) {
    const batch = await Promise.all(referenced.slice(offset, offset + 4).map(async (record): Promise<PhotoManifestEntry | MissingPhoto> => {
      const head = await bucket.head(record.imageKey);
      if (!head) return { inspectionId: record.id, key: record.imageKey } satisfies MissingPhoto;
      let hash = head.customMetadata?.sha256;
      if (!hash) {
        const object = await bucket.get(record.imageKey);
        if (!object) return { inspectionId: record.id, key: record.imageKey } satisfies MissingPhoto;
        hash = await sha256Hex(new Uint8Array(await object.arrayBuffer()));
      }
      return {
        inspectionId: record.id,
        key: record.imageKey,
        mime: record.imageMime ?? head.httpMetadata?.contentType ?? "application/octet-stream",
        size: head.size,
        sha256: hash,
      } satisfies PhotoManifestEntry;
    }));
    for (const entry of batch) {
      if ("sha256" in entry) photos.push(entry);
      else missingPhotos.push(entry);
    }
  }
  return { photos, missingPhotos };
}
