import { strToU8, zipSync } from "fflate";
import { th } from "../i18n/th";

export type ExportTable = "hives" | "harvests" | "inspections" | "team" | "audit" | "photos";
export type ExportData = Record<ExportTable, readonly Record<string, unknown>[]>;

export function parseExportData(value: unknown): ExportData {
  if (typeof value !== "object" || value === null) throw new Error(th.admin.exportFailed);
  const tables: ExportTable[] = ["hives", "harvests", "inspections", "team", "audit", "photos"];
  const source = value as Record<string, unknown>;
  if (tables.some((table) => !Array.isArray(source[table]) || source[table].some((row: unknown) =>
    typeof row !== "object" || row === null || Array.isArray(row),
  ))) throw new Error(th.admin.exportFailed);
  return Object.fromEntries(tables.map((table) => [table, source[table]])) as ExportData;
}

const columns: Record<ExportTable, readonly string[]> = {
  hives: ["id", "code", "name", "species", "location", "status", "createdAt", "archivedAt"],
  harvests: ["id", "hiveId", "harvestedAt", "honeyMl", "propolisG", "createdByEmail", "createdAt", "createdBy", "updatedAt", "updatedBy", "deletedAt"],
  inspections: ["id", "hiveId", "inspectedAt", "notes", "status", "imageKey", "imageMime", "createdAt", "createdBy", "updatedAt", "updatedBy", "deletedAt"],
  team: ["email", "active", "createdAt"],
  audit: ["id", "actorEmail", "action", "entity", "entityId", "before", "after", "createdAt"],
  photos: ["inspectionId", "key", "mime", "size", "sha256"],
};

function csvValue(value: unknown): string {
  const text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function csvTable(name: ExportTable, rows: readonly Record<string, unknown>[]): string {
  const headings = columns[name];
  return [headings.join(","), ...rows.map((row) => headings.map((heading) => csvValue(row[heading])).join(","))].join("\r\n") + "\r\n";
}

export function csvZip(data: ExportData): Uint8Array {
  const files = Object.fromEntries((Object.keys(columns) as ExportTable[]).map((name) => [
    `${name}.csv`, strToU8(`\uFEFF${csvTable(name, data[name])}`),
  ]));
  return zipSync(files, { level: 6 });
}
