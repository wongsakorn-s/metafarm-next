import "./verify-development-db";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../server/db";
import { auditLogs, harvests, hives, inspections, staff } from "../server/db/schema";
import { developmentR2, photoPath, sha256, verifyBackupFolder, verifyDevelopmentTarget } from "./backup-shared";

const folder = process.argv.slice(2).find((argument) => !argument.startsWith("--"));
if (!folder) throw new Error("ระบุโฟลเดอร์ backup: bun run restore:dev -- <folder> --dry-run");
const apply = process.argv.includes("--apply");
if (apply && process.argv.includes("--dry-run")) throw new Error("เลือก --apply หรือ --dry-run อย่างใดอย่างหนึ่ง");
await verifyDevelopmentTarget();
const root = path.resolve(folder);
const { records, manifest } = await verifyBackupFolder(root);

const iso = z.iso.datetime();
const maybeIso = iso.nullable();
const maybeText = z.string().nullable();
const hiveRows = z.array(z.object({
  id: z.uuid(), code: z.string().max(40), name: z.string().max(100),
  species: maybeText, location: maybeText,
  status: z.enum(["Strong", "Normal", "Weak", "Empty"]),
  createdAt: iso, archivedAt: maybeIso,
})).parse(records.hives);
const harvestRows = z.array(z.object({
  id: z.uuid(), hiveId: z.uuid(), harvestedAt: z.iso.date(),
  honeyMl: z.number().int().nonnegative(), propolisG: z.number().nonnegative(),
  createdByEmail: maybeText, createdAt: iso, createdBy: maybeText,
  updatedAt: maybeIso, updatedBy: maybeText, deletedAt: maybeIso,
})).parse(records.harvests);
const inspectionRows = z.array(z.object({
  id: z.uuid(), hiveId: z.uuid(), inspectedAt: z.iso.date(),
  notes: maybeText, status: z.enum(["Strong", "Normal", "Weak", "Empty"]),
  imageKey: maybeText, imageMime: maybeText, createdAt: iso,
  createdBy: maybeText, updatedAt: maybeIso, updatedBy: maybeText, deletedAt: maybeIso,
})).parse(records.inspections);
const teamRows = z.array(z.object({ email: z.email(), active: z.boolean(), createdAt: iso })).parse(records.team);
const auditRows = z.array(z.object({
  id: z.uuid(), actorEmail: z.email(), action: z.enum(["create", "update", "delete", "archive", "restore"]),
  entity: z.enum(["hive", "harvest", "inspection", "team"]), entityId: z.string().max(254),
  before: z.record(z.string(), z.unknown()).nullable(), after: z.record(z.string(), z.unknown()).nullable(), createdAt: iso,
})).parse(records.audit);

console.log("ตรวจ backup และ checksum ครบแล้ว", manifest.counts);
if (!apply) {
  console.log("Dry-run เท่านั้น ยังไม่ได้เขียน Neon หรือ R2; ใช้ --apply เมื่อตรวจ branch/bucket ว่างและพร้อมแล้ว");
  process.exit(0);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("ไม่มี DATABASE_URL ของ development");
const db = getDb(databaseUrl);
const existing = await Promise.all([
  db.select({ id: hives.id }).from(hives).limit(1),
  db.select({ id: harvests.id }).from(harvests).limit(1),
  db.select({ id: inspections.id }).from(inspections).limit(1),
  db.select({ email: staff.email }).from(staff).limit(1),
  db.select({ id: auditLogs.id }).from(auditLogs).limit(1),
]);
if (existing.some((rows) => rows.length)) throw new Error("Neon development branch ไม่ว่าง ห้าม restore ทับข้อมูลเดิม");

const { client, bucket } = await developmentR2();
for (const photo of manifest.photos) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: photo.key }));
    throw new Error(`R2 development มี key อยู่แล้ว: ${photo.key}`);
  } catch (cause) {
    if (cause instanceof Error && cause.message.startsWith("R2 development มี key")) throw cause;
    const status = typeof cause === "object" && cause !== null && "$metadata" in cause
      ? (cause.$metadata as { httpStatusCode?: number }).httpStatusCode : undefined;
    if (status !== 404) throw cause;
  }
}

for (const photo of manifest.photos) {
  const bytes = await readFile(photoPath(root, photo.key));
  await client.send(new PutObjectCommand({
    Bucket: bucket, Key: photo.key, Body: bytes,
    ContentType: photo.mime, Metadata: { sha256: photo.sha256 },
  }));
  const restored = await client.send(new GetObjectCommand({ Bucket: bucket, Key: photo.key }));
  if (!restored.Body || sha256(await restored.Body.transformToByteArray()) !== photo.sha256) {
    throw new Error(`ตรวจ checksum รูปหลัง restore ไม่ผ่าน: ${photo.inspectionId}`);
  }
}

function batches<T>(rows: readonly T[], size = 100): T[][] {
  const result: T[][] = [];
  for (let offset = 0; offset < rows.length; offset += size) result.push(rows.slice(offset, offset + size));
  return result;
}
for (const batch of batches(teamRows)) await db.insert(staff).values(batch.map((row) => ({ ...row, createdAt: new Date(row.createdAt) })));
for (const batch of batches(hiveRows)) await db.insert(hives).values(batch.map((row) => ({ ...row, createdAt: new Date(row.createdAt), archivedAt: row.archivedAt ? new Date(row.archivedAt) : null })));
for (const batch of batches(harvestRows)) await db.insert(harvests).values(batch.map((row) => ({
  ...row, createdAt: new Date(row.createdAt), updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
  deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
})));
for (const batch of batches(inspectionRows)) await db.insert(inspections).values(batch.map((row) => ({
  ...row, createdAt: new Date(row.createdAt), updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
  deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
})));
for (const batch of batches(auditRows)) await db.insert(auditLogs).values(batch.map((row) => ({
  ...row, createdAt: new Date(row.createdAt),
})));

const counts = {
  hives: (await db.select({ count: sql<number>`count(*)::int` }).from(hives))[0].count,
  harvests: (await db.select({ count: sql<number>`count(*)::int` }).from(harvests))[0].count,
  inspections: (await db.select({ count: sql<number>`count(*)::int` }).from(inspections))[0].count,
  team: (await db.select({ count: sql<number>`count(*)::int` }).from(staff))[0].count,
  audit: (await db.select({ count: sql<number>`count(*)::int` }).from(auditLogs))[0].count,
  photos: manifest.photos.length,
};
if (JSON.stringify(counts) !== JSON.stringify(manifest.counts)) throw new Error("จำนวนแถวหลัง restore ไม่ตรงกับ backup");
console.log("Restore ลง Neon/R2 development และตรวจจำนวน/checksum ครบแล้ว", counts);
