import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parseDevVars, photoPath, sha256, verifyBackupFolder } from "./backup-shared";

const folders: string[] = [];
afterEach(async () => {
  for (const folder of folders.splice(0)) await rm(folder, { recursive: true, force: true });
});

describe("backup manifest", () => {
  it("checks record counts and photo checksum before restore", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "metafarm-backup-test-"));
    folders.push(root);
    const inspectionId = "2d88f6f2-19b3-4f12-8971-484cf7491fe3";
    const key = `inspections/${inspectionId}/ed714789-d96b-4d32-ad5f-92257b53cdae`;
    const bytes = new Uint8Array([0xff, 0xd8, 0xff]);
    const photo = { inspectionId, key, mime: "image/jpeg", size: bytes.length, sha256: sha256(bytes) };
    const records = {
      formatVersion: 1, exportedAt: new Date().toISOString(),
      hives: [], harvests: [], inspections: [{ id: inspectionId, imageKey: key }], team: [], audit: [], photos: [photo],
    };
    const recordsBytes = new TextEncoder().encode(JSON.stringify(records));
    const target = photoPath(root, key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
    await writeFile(path.join(root, "records.json"), recordsBytes);
    await writeFile(path.join(root, "manifest.json"), JSON.stringify({
      formatVersion: 1, createdAt: new Date().toISOString(), recordsSha256: sha256(recordsBytes),
      counts: { hives: 0, harvests: 0, inspections: 1, team: 0, audit: 0, photos: 1 }, photos: [photo],
    }));
    expect((await verifyBackupFolder(root)).manifest.counts.photos).toBe(1);
    await writeFile(target, new Uint8Array([0xff, 0xd8, 0x00]));
    await expect(verifyBackupFolder(root)).rejects.toThrow("checksum รูปไม่ตรง");
    expect((await readFile(path.join(root, "records.json"))).length).toBe(recordsBytes.length);
  });

  it("accepts photos recorded as missing, but not unlisted ones", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "metafarm-backup-test-"));
    folders.push(root);
    const inspectionId = "2d88f6f2-19b3-4f12-8971-484cf7491fe3";
    const key = `inspections/${inspectionId}/ed714789-d96b-4d32-ad5f-92257b53cdae`;
    const write = async (missingPhotos: { inspectionId: string; key: string }[]) => {
      const records = {
        formatVersion: 1, exportedAt: new Date().toISOString(), missingPhotos,
        hives: [], harvests: [], inspections: [{ id: inspectionId, imageKey: key }], team: [], audit: [], photos: [],
      };
      const recordsBytes = new TextEncoder().encode(JSON.stringify(records));
      await writeFile(path.join(root, "records.json"), recordsBytes);
      await writeFile(path.join(root, "manifest.json"), JSON.stringify({
        formatVersion: 1, createdAt: new Date().toISOString(), recordsSha256: sha256(recordsBytes),
        counts: { hives: 0, harvests: 0, inspections: 1, team: 0, audit: 0, photos: 0 }, photos: [], missingPhotos,
      }));
    };
    await write([{ inspectionId, key }]);
    expect((await verifyBackupFolder(root)).manifest.missingPhotos).toHaveLength(1);
    await write([]);
    await expect(verifyBackupFolder(root)).rejects.toThrow("ไม่มีใน manifest");
  });

  it("reads variable names that contain digits, such as the R2 credentials", () => {
    const vars = parseDevVars([
      "OWNER_EMAIL=owner@example.com",
      "R2_BUCKET_NAME=metafarm-next-media-dev",
      'R2_ACCESS_KEY_ID="abc"',
      "R2_SECRET_ACCESS_KEY='def'",
      "# comment=ignored",
      "lowercase=ignored",
      "",
    ].join("\r\n"));
    expect(vars).toEqual({
      OWNER_EMAIL: "owner@example.com",
      R2_BUCKET_NAME: "metafarm-next-media-dev",
      R2_ACCESS_KEY_ID: "abc",
      R2_SECRET_ACCESS_KEY: "def",
    });
  });

  it("rejects unsafe R2 keys", () => {
    expect(() => photoPath("C:/backups", "../outside")).toThrow();
  });
});
