import "./verify-development-db";
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "../server/db";
import { auditLogs, harvests, hives, idempotencyKeys, inspections, staff } from "../server/db/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL ไม่พร้อมใช้งาน");
const db = getDb(databaseUrl);
const workerPort = process.env.SMOKE_WORKER_PORT ?? "8787";
if (!/^\d{2,5}$/.test(workerPort)) throw new Error("SMOKE_WORKER_PORT ต้องเป็นหมายเลขพอร์ต");
const baseUrl = `http://127.0.0.1:${workerPort}/api`;
// Farm dates (and the export's audit date filter) use Thai time.
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
const code = `SMOKE-${crypto.randomUUID().slice(0, 8)}`.toUpperCase();
const teamEmail = `smoke-${crypto.randomUUID()}@example.invalid`;

type CreatedRecord = { id: string };
type HiveRecord = CreatedRecord & { code: string; status: string };
type HiveDetail = {
  hive: HiveRecord;
  totals: { honeyMl: number; propolisG: number; inspectionCount: number };
};
type Page = { items: CreatedRecord[]; nextOffset: number | null };
type ExportData = {
  photosIncluded: boolean;
  photos: Array<{ inspectionId: string; key: string; mime: string; size: number; sha256: string }>;
  hives: HiveRecord[];
  harvests: Array<CreatedRecord & { hiveId: string }>;
  inspections: Array<CreatedRecord & { hiveId: string }>;
  audit: Array<CreatedRecord & { entityId: string; action: string }>;
};
type AuditPage = { items: Array<{ action: string; entity: string; entityId: string }> };
type Summary = { summary: { hiveCount: number; harvestCount: number; inspectionCount: number; totalHoneyMl: number } };

async function request<T>(path: string, method = "GET", body?: object, key?: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as T;
}

let hiveId: string | undefined;
const recordIds: string[] = [];
const retryKeys: string[] = [];
try {
  const baseline = await request<Summary>(`/dashboard?month=${today.slice(0, 7)}`);
  const hive = await request<HiveRecord>("/hives", "POST", {
    code,
    name: "Smoke test",
  });
  hiveId = hive.id;
  assert.equal(hive.status, "Normal");

  const inspectionKey = crypto.randomUUID();
  retryKeys.push(inspectionKey);
  const inspectionInput = {
    hiveId,
    inspectedAt: today,
    status: "Strong",
    notes: "temporary smoke test",
  };
  const firstInspection = await request<CreatedRecord>("/inspections", "POST", inspectionInput, inspectionKey);
  assert.ok(firstInspection.id);
  const retriedInspection = await request<CreatedRecord>("/inspections", "POST", inspectionInput, inspectionKey);
  assert.equal(retriedInspection.id, firstInspection.id);
  recordIds.push(firstInspection.id);
  const secondInspectionKey = crypto.randomUUID();
  retryKeys.push(secondInspectionKey);
  const secondInspection = await request<CreatedRecord>("/inspections", "POST", {
    hiveId,
    inspectedAt: today,
  }, secondInspectionKey);
  assert.ok(secondInspection.id);
  recordIds.push(secondInspection.id);
  const harvestKey = crypto.randomUUID();
  retryKeys.push(harvestKey);
  const harvestInput = {
    hiveId,
    harvestedAt: today,
    honeyMl: 100,
    propolisG: 1.5,
  };
  const createdHarvest = await request<CreatedRecord>("/harvests", "POST", harvestInput, harvestKey);
  const retriedHarvest = await request<CreatedRecord>("/harvests", "POST", harvestInput, harvestKey);
  assert.equal(retriedHarvest.id, createdHarvest.id);
  recordIds.push(createdHarvest.id);
  const conflictingRetry = await fetch(`${baseUrl}/harvests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": harvestKey },
    body: JSON.stringify({ ...harvestInput, honeyMl: 999 }),
  });
  assert.equal(conflictingRetry.status, 409);
  const editedHarvest = await request<CreatedRecord & { honeyMl: number }>(
    `/harvests/${createdHarvest.id}`,
    "PATCH",
    { hiveId, harvestedAt: today, honeyMl: 125, propolisG: 1.5 },
  );
  assert.equal(editedHarvest.honeyMl, 125);
  const editedInspection = await request<CreatedRecord & { notes: string; status: string }>(
    `/inspections/${firstInspection.id}`, "PATCH", {
      inspectedAt: today, status: "Weak", notes: "edited smoke test",
    },
  );
  assert.equal(editedInspection.status, "Weak");
  assert.equal(editedInspection.notes, "edited smoke test");

  const match = await request<CreatedRecord>(`/hives/by-code/${code}`);
  assert.equal(match.id, hiveId);
  const detail = await request<HiveDetail>(`/hives/${hiveId}`);
  assert.equal(detail.hive.status, "Strong");
  assert.equal(detail.totals.honeyMl, 125);
  assert.equal(detail.totals.propolisG, 1.5);
  assert.equal(detail.totals.inspectionCount, 2);
  // Correcting the latest inspection updates the hive's status as well.
  await request(`/inspections/${secondInspection.id}`, "PATCH", {
    inspectedAt: today, status: "Weak", notes: null,
  });
  assert.equal((await request<HiveDetail>(`/hives/${hiveId}`)).hive.status, "Weak");
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
  assert.ok(Array.isArray(exported.photos));
  assert.ok(exported.hives.some((item) => item.id === hiveId));
  assert.equal(exported.harvests.filter((item) => item.hiveId === hiveId).length, 1);
  assert.equal(exported.inspections.filter((item) => item.hiveId === hiveId).length, 2);
  assert.ok(exported.audit.some((item) => item.entityId === hiveId && item.action === "create"));
  const fullExport = await request<ExportData & { fullBackup: boolean }>("/export?full=true");
  assert.equal(fullExport.fullBackup, true);
  assert.equal(fullExport.audit.length, 0);
  const auditExport = await request<{ items: unknown[]; nextOffset: number | null }>("/export/audit");
  assert.ok(auditExport.items.length > 0);
  await request<{ ok: true }>(`/harvests/${createdHarvest.id}`, "DELETE");
  const afterDelete = await request<Page>(`/harvests?hiveId=${hiveId}`);
  assert.equal(afterDelete.items.length, 0);
  const retryAfterDelete = await fetch(`${baseUrl}/harvests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": harvestKey },
    body: JSON.stringify(harvestInput),
  });
  assert.equal(retryAfterDelete.status, 409);
  await request<{ ok: true }>(`/inspections/${firstInspection.id}`, "DELETE");
  const afterInspectionDelete = await request<Page>(`/inspections?hiveId=${hiveId}`);
  assert.equal(afterInspectionDelete.items.length, 1);
  const fullAfterDelete = await request<ExportData>("/export?full=true");
  assert.ok(fullAfterDelete.harvests.some((item) => item.id === createdHarvest.id));
  assert.ok(fullAfterDelete.inspections.some((item) => item.id === firstInspection.id));
  const summaryAfterDelete = await request<Summary>(`/dashboard?month=${today.slice(0, 7)}`);
  assert.equal(summaryAfterDelete.summary.harvestCount, baseline.summary.harvestCount);
  assert.equal(summaryAfterDelete.summary.totalHoneyMl, baseline.summary.totalHoneyMl);
  assert.equal(summaryAfterDelete.summary.inspectionCount, baseline.summary.inspectionCount + 1);
  const harvestAudit = await request<AuditPage>(`/audit?entity=harvest&entityId=${createdHarvest.id}`);
  assert.deepEqual(new Set(harvestAudit.items.map((item) => item.action)),
    new Set(["create", "update", "delete"]));
  const inspectionAudit = await request<AuditPage>(`/audit?entity=inspection&entityId=${firstInspection.id}`);
  assert.deepEqual(new Set(inspectionAudit.items.map((item) => item.action)),
    new Set(["create", "update", "delete"]));
  await request(`/hives/${hiveId}/archive`, "POST");
  const archived = await request<Array<{ id: string; archivedAt: string | null }>>("/hives?includeArchived=true");
  assert.ok(archived.some((item) => item.id === hiveId && item.archivedAt));
  const activeHives = await request<Array<{ id: string }>>("/hives");
  assert.ok(!activeHives.some((item) => item.id === hiveId));
  const summaryAfterArchive = await request<Summary>(`/dashboard?month=${today.slice(0, 7)}`);
  assert.equal(summaryAfterArchive.summary.hiveCount, baseline.summary.hiveCount);
  const archivedEdit = await fetch(`${baseUrl}/hives/${hiveId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Archived edit", status: "Normal" }),
  });
  assert.equal(archivedEdit.status, 409);
  assert.equal(summaryAfterArchive.summary.harvestCount, baseline.summary.harvestCount);
  const rejected = await fetch(`${baseUrl}/harvests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hiveId, harvestedAt: today, honeyMl: 1, propolisG: 0 }),
  });
  assert.equal(rejected.status, 409);
  const rejectedInspection = await fetch(`${baseUrl}/inspections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hiveId, inspectedAt: today, notes: "should reject" }),
  });
  assert.equal(rejectedInspection.status, 409);
  await request(`/hives/${hiveId}/restore`, "POST");
  const hiveAudit = await request<AuditPage>(`/audit?entity=hive&entityId=${hiveId}`);
  assert.ok(hiveAudit.items.some((item) => item.action === "archive"));
  assert.ok(hiveAudit.items.some((item) => item.action === "restore"));
  await request("/team", "POST", { email: teamEmail });
  await request(`/team/${encodeURIComponent(teamEmail)}`, "PATCH", { active: false });
  const teamAudit = await request<AuditPage>(`/audit?entity=team&entityId=${encodeURIComponent(teamEmail)}`);
  assert.ok(teamAudit.items.some((item) => item.action === "create"));
  assert.ok(teamAudit.items.some((item) => item.action === "update"));
  if (!process.env.OPENWEATHER_API_KEY) {
    const weatherResponse = await fetch(`${baseUrl}/weather/current`);
    assert.equal(weatherResponse.status, 503);
  }
  console.log("Local API smoke test passed");
} finally {
  if (hiveId) {
    await db.delete(idempotencyKeys).where(inArray(idempotencyKeys.key, retryKeys));
    await db.delete(auditLogs).where(inArray(auditLogs.entityId, [hiveId, ...recordIds, teamEmail]));
    await db.delete(staff).where(eq(staff.email, teamEmail));
    await db.delete(inspections).where(eq(inspections.hiveId, hiveId));
    await db.delete(harvests).where(eq(harvests.hiveId, hiveId));
    await db.delete(hives).where(eq(hives.id, hiveId));
  }
}
