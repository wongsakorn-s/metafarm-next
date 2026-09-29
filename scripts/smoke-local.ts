import "./verify-development-db";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { harvests, hives, inspections } from "../server/db/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL ไม่พร้อมใช้งาน");
const db = getDb(databaseUrl);
const baseUrl = "http://127.0.0.1:8787/api";
const today = new Date().toISOString().slice(0, 10);
const code = `SMOKE-${crypto.randomUUID().slice(0, 8)}`.toUpperCase();

type CreatedRecord = { id: string };
type HiveRecord = CreatedRecord & { code: string; status: string };
type HiveDetail = {
  hive: HiveRecord;
  totals: { honeyMl: number; propolisG: number; inspectionCount: number };
};
type Page = { items: CreatedRecord[]; nextOffset: number | null };
type ExportData = {
  photosIncluded: boolean;
  hives: HiveRecord[];
  harvests: Array<CreatedRecord & { hiveId: string }>;
  inspections: Array<CreatedRecord & { hiveId: string }>;
};

async function request<T>(path: string, method = "GET", body?: object): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as T;
}

let hiveId: string | undefined;
try {
  const hive = await request<HiveRecord>("/hives", "POST", {
    code,
    name: "Smoke test",
  });
  hiveId = hive.id;
  assert.equal(hive.status, "Normal");

  const firstInspection = await request<CreatedRecord>("/inspections", "POST", {
    hiveId,
    inspectedAt: today,
    status: "Strong",
    notes: "temporary smoke test",
  });
  assert.ok(firstInspection.id);
  const secondInspection = await request<CreatedRecord>("/inspections", "POST", {
    hiveId,
    inspectedAt: today,
  });
  assert.ok(secondInspection.id);
  const createdHarvest = await request<CreatedRecord>("/harvests", "POST", {
    hiveId,
    harvestedAt: today,
    honeyMl: 100,
    propolisG: 1.5,
  });
  const editedHarvest = await request<CreatedRecord & { honeyMl: number }>(
    `/harvests/${createdHarvest.id}`,
    "PATCH",
    { hiveId, harvestedAt: today, honeyMl: 125, propolisG: 1.5 },
  );
  assert.equal(editedHarvest.honeyMl, 125);

  const match = await request<CreatedRecord>(`/hives/by-code/${code}`);
  assert.equal(match.id, hiveId);
  const detail = await request<HiveDetail>(`/hives/${hiveId}`);
  assert.equal(detail.hive.status, "Strong");
  assert.equal(detail.totals.honeyMl, 125);
  assert.equal(detail.totals.propolisG, 1.5);
  assert.equal(detail.totals.inspectionCount, 2);
  const harvestPage = await request<Page>(`/harvests?hiveId=${hiveId}&limit=1`);
  assert.equal(harvestPage.items.length, 1);
  assert.equal(harvestPage.nextOffset, null);
  const filteredHarvests = await request<Page>(
    `/harvests?hiveId=${hiveId}&from=${today}&to=${today}`,
  );
  assert.equal(filteredHarvests.items.length, 1);
  const laterDay = new Date(Date.parse(`${today}T00:00:00Z`) + 86_400_000)
    .toISOString()
    .slice(0, 10);
  const emptyHarvests = await request<Page>(
    `/harvests?hiveId=${hiveId}&from=${laterDay}`,
  );
  assert.equal(emptyHarvests.items.length, 0);
  const firstPage = await request<Page>(`/inspections?hiveId=${hiveId}&limit=1`);
  assert.equal(firstPage.items.length, 1);
  assert.equal(firstPage.nextOffset, 1);
  const nextPage = await request<Page>(`/inspections?hiveId=${hiveId}&limit=1&offset=1`);
  assert.equal(nextPage.items.length, 1);
  assert.equal(nextPage.nextOffset, null);
  assert.notEqual(firstPage.items[0].id, nextPage.items[0].id);
  const exported = await request<ExportData>(
    `/export?from=${today}&to=${today}`,
  );
  assert.equal(exported.photosIncluded, false);
  assert.ok(exported.hives.some((item) => item.id === hiveId));
  assert.equal(exported.harvests.filter((item) => item.hiveId === hiveId).length, 1);
  assert.equal(exported.inspections.filter((item) => item.hiveId === hiveId).length, 2);
  await request<{ ok: true }>(`/harvests/${createdHarvest.id}`, "DELETE");
  const afterDelete = await request<Page>(`/harvests?hiveId=${hiveId}`);
  assert.equal(afterDelete.items.length, 0);
  if (!process.env.OPENWEATHER_API_KEY) {
    const weatherResponse = await fetch(`${baseUrl}/weather/current`);
    assert.equal(weatherResponse.status, 503);
  }
  console.log("Local API smoke test passed");
} finally {
  if (hiveId) {
    await db.delete(inspections).where(eq(inspections.hiveId, hiveId));
    await db.delete(harvests).where(eq(harvests.hiveId, hiveId));
    await db.delete(hives).where(eq(hives.id, hiveId));
  }
}
