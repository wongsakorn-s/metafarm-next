import "./verify-development-db";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { developmentR2, exportSchema, photoPath, sha256 } from "./backup-shared";

const argument = process.argv.indexOf("--out");
if (argument !== -1 && !process.argv[argument + 1]) throw new Error("--out ต้องระบุโฟลเดอร์");
const defaultName = new Date().toISOString().replace(/[:.]/g, "-");
const output = path.resolve(argument === -1 ? path.join("backups", defaultName) : process.argv[argument + 1]);
try {
  await stat(output);
  throw new Error("โฟลเดอร์สำรองมีอยู่แล้ว กรุณาเลือกชื่อใหม่");
} catch (cause) {
  if (!(cause instanceof Error) || !("code" in cause) || cause.code !== "ENOENT") throw cause;
}

const { client, bucket } = await developmentR2();
const response = await fetch("http://127.0.0.1:8787/api/export", { cache: "no-store" });
if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
  throw new Error(`อ่าน JSON export จาก Worker development ไม่สำเร็จ (${response.status})`);
}
const records = exportSchema.parse(await response.json());
await mkdir(output, { recursive: true });
const recordsBytes = new TextEncoder().encode(JSON.stringify(records, null, 2));
await writeFile(path.join(output, "records.json"), recordsBytes);

for (const photo of records.photos) {
  const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: photo.key }));
  if (!object.Body) throw new Error(`ไฟล์รูปหายไป: ${photo.inspectionId}`);
  const bytes = await object.Body.transformToByteArray();
  if (bytes.byteLength !== photo.size || sha256(bytes) !== photo.sha256) {
    throw new Error(`checksum รูปไม่ตรง: ${photo.inspectionId}`);
  }
  const target = photoPath(output, photo.key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
}

const counts = {
  hives: records.hives.length,
  harvests: records.harvests.length,
  inspections: records.inspections.length,
  team: records.team.length,
  audit: records.audit.length,
  photos: records.photos.length,
};
await writeFile(path.join(output, "manifest.json"), JSON.stringify({
  formatVersion: 1,
  createdAt: new Date().toISOString(),
  recordsSha256: sha256(recordsBytes),
  counts,
  photos: records.photos,
}, null, 2));
console.log(`สำรองข้อมูล development ครบแล้วที่ ${output}`);
console.log(counts);
