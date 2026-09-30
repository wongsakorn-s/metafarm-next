import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { S3Client } from "@aws-sdk/client-s3";
import { z } from "zod";
import { verifyDeployTarget } from "./deploy-target";

export const photoSchema = z.object({
  inspectionId: z.uuid(),
  key: z.string().regex(/^inspections\/[0-9a-f-]{36}\/[0-9a-f-]{36}$/),
  mime: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().int().positive().max(2_000_000),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
});

const row = z.record(z.string(), z.unknown());
export const exportSchema = z.object({
  formatVersion: z.literal(1),
  exportedAt: z.iso.datetime(),
  hives: z.array(row),
  harvests: z.array(row),
  inspections: z.array(row),
  team: z.array(row),
  audit: z.array(row),
  photos: z.array(photoSchema),
});

export const manifestSchema = z.object({
  formatVersion: z.literal(1),
  createdAt: z.iso.datetime(),
  recordsSha256: z.string().regex(/^[0-9a-f]{64}$/),
  counts: z.object({
    hives: z.number().int().nonnegative(),
    harvests: z.number().int().nonnegative(),
    inspections: z.number().int().nonnegative(),
    team: z.number().int().nonnegative(),
    audit: z.number().int().nonnegative(),
    photos: z.number().int().nonnegative(),
  }),
  photos: z.array(photoSchema),
});

export function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function photoPath(root: string, key: string): string {
  photoSchema.shape.key.parse(key);
  const target = path.resolve(root, "photos", ...key.split("/"));
  if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error("ที่อยู่ไฟล์รูปไม่ปลอดภัย");
  return target;
}

export async function verifyBackupFolder(root: string) {
  const recordsBytes = await readFile(path.join(root, "records.json"));
  const manifest = manifestSchema.parse(JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8")));
  if (sha256(recordsBytes) !== manifest.recordsSha256) throw new Error("checksum ของ records.json ไม่ตรง");
  const records = exportSchema.parse(JSON.parse(recordsBytes.toString("utf8")));
  for (const table of ["hives", "harvests", "inspections", "team", "audit", "photos"] as const) {
    if (records[table].length !== manifest.counts[table]) throw new Error(`จำนวน ${table} ไม่ตรงกับ manifest`);
  }
  if (JSON.stringify(records.photos) !== JSON.stringify(manifest.photos)) throw new Error("รายการรูปไม่ตรงกับ manifest");
  const imageRecords = new Map(records.inspections.map((record) => [record.id, record.imageKey]));
  const listedPhotos = new Set<string>();
  for (const photo of manifest.photos) {
    if (imageRecords.get(photo.inspectionId) !== photo.key || listedPhotos.has(photo.key)) {
      throw new Error(`รายการรูปไม่ตรงกับบันทึกตรวจ: ${photo.inspectionId}`);
    }
    listedPhotos.add(photo.key);
    const bytes = await readFile(photoPath(root, photo.key));
    if (bytes.length !== photo.size || sha256(bytes) !== photo.sha256) {
      throw new Error(`checksum รูปไม่ตรง: ${photo.inspectionId}`);
    }
  }
  for (const key of imageRecords.values()) {
    if (key && !listedPhotos.has(String(key))) throw new Error("บันทึกตรวจอ้างอิงรูปที่ไม่มีใน manifest");
  }
  return { records, manifest };
}

async function devVars(): Promise<Record<string, string>> {
  const content = await readFile(path.resolve(".dev.vars"), "utf8");
  return Object.fromEntries(content.split(/\r?\n/).filter((line) => /^[A-Z_]+=/.test(line)).map((line) => {
    const separator = line.indexOf("=");
    return [line.slice(0, separator), line.slice(separator + 1).replace(/^['"]|['"]$/g, "")];
  }));
}

export async function developmentR2(): Promise<{ client: S3Client; bucket: string }> {
  const vars = await verifyDevelopmentTarget();
  const bucket = vars.R2_BUCKET_NAME;
  const accountId = vars.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = vars.R2_ACCESS_KEY_ID;
  const secretAccessKey = vars.R2_SECRET_ACCESS_KEY;
  if (!/^[0-9a-f]{32}$/i.test(accountId ?? "") || !accessKeyId || !secretAccessKey) {
    throw new Error("ต้องใส่ CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID และ R2_SECRET_ACCESS_KEY ของ bucket development ใน .dev.vars");
  }
  return {
    bucket,
    client: new S3Client({
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      region: "auto",
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}

export async function verifyDevelopmentTarget(): Promise<Record<string, string>> {
  const vars = await devVars();
  const bucket = vars.R2_BUCKET_NAME || "metafarm-next-media-dev";
  verifyDeployTarget("development", process.env.DATABASE_URL, {
    name: "metafarm-next-dev",
    r2_buckets: [{ binding: "MEDIA", bucket_name: bucket }],
  });
  return { ...vars, R2_BUCKET_NAME: bucket };
}
