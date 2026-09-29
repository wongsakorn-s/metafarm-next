import { env } from "cloudflare:workers";
import { httpServerHandler } from "cloudflare:node";
import express from "express";
import { and, desc, eq, gte, isNull, lt, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./db";
import { auditLogs, harvests, hives, inspections, staff } from "./db/schema";
import { getStaff, type AppEnv, type StaffSession } from "./auth";
import {
  harvestInput,
  harvestUpdate,
  auditQuery,
  archivedHiveQuery,
  hiveInput,
  hiveUpdate,
  inspectionInput,
  inspectionUpdate,
  teamInput,
} from "./validation";
import { handleError, HttpError, jsonBody, photoBody } from "./http";
import { detectImageMime } from "./image";
import { dateRangeQuery, historyQuery, pageResult } from "./pagination";
import { canEditHistoryRecord, historyPermissions, requireOwner } from "./authorization";
import { getCurrentWeather } from "./weather";
import { auditedChange, noPreviousRecord } from "./audit";

const bindings = env as AppEnv;
const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  const started = Date.now();
  const requestId = crypto.randomUUID();
  res.setHeader("X-Request-ID", requestId);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.on("finish", () =>
    console.info("API request", {
      requestId,
      method: req.method,
      route: req.route?.path ?? "[unmatched]",
      status: res.statusCode,
      durationMs: Date.now() - started,
    }),
  );
  next();
});
app.use(jsonBody);

function database() {
  if (!bindings.DATABASE_URL)
    throw new HttpError(503, "ฐานข้อมูลยังไม่พร้อมใช้งาน");
  return getDb(bindings.DATABASE_URL);
}

function session(res: express.Response): StaffSession {
  return res.locals.staff as StaffSession;
}

async function assertHive(hiveId: string) {
  const [hive] = await database()
    .select({ id: hives.id, archivedAt: hives.archivedAt })
    .from(hives)
    .where(eq(hives.id, hiveId))
    .limit(1);
  if (!hive) throw new HttpError(404, "ไม่พบรังที่เลือก");
  if (hive.archivedAt) throw new HttpError(409, "รังนี้ถูกเก็บถาวรแล้ว ไม่สามารถเพิ่มบันทึกใหม่ได้");
}

function withHistoryPermissions<T extends {
  createdBy: string | null;
  createdAt: Date;
  createdByEmail?: string | null;
}>(row: T, actor: StaffSession) {
  return {
    ...row,
    permissions: historyPermissions(actor, row.createdBy ?? row.createdByEmail ?? null, row.createdAt),
  };
}

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/health/ready", async (_req, res) => {
  await database().execute(sql`select 1`);
  res.json({ ok: true });
});

app.use("/api", async (req, res, next) => {
  try {
    res.setHeader("Cache-Control", "private, no-store");
    const host = req.get("host") ?? "invalid.local";
    const url = new URL(req.originalUrl, `https://${host}`);
    const headers = new Headers();
    const token = req.get("Cf-Access-Jwt-Assertion");
    if (token) headers.set("Cf-Access-Jwt-Assertion", token);
    const user = await getStaff(new Request(url, { headers }), bindings);
    if (!user) throw new HttpError(403, "ไม่มีสิทธิ์เข้าถึงหลังบ้าน");
    res.locals.staff = user;
    next();
  } catch (cause) {
    next(cause);
  }
});

app.get("/api/me", (_req, res) => res.json(session(res)));

app.get("/api/weather/current", async (_req, res) => {
  res.json(await getCurrentWeather(bindings));
});

app.get("/api/dashboard", async (req, res) => {
  const db = database();
  const month = z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .parse(req.query.month ?? new Date().toISOString().slice(0, 7));
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = `${month}-01`;
  const nextMonth = new Date(Date.UTC(year, monthNumber, 1))
    .toISOString()
    .slice(0, 10);
  const [
    hiveRows,
    harvestRows,
    inspectionRows,
    teamRows,
    statusRows,
    monthTotals,
    allHarvestTotals,
    inspectionTotals,
    hiveTotals,
  ] = await Promise.all([
    db.select().from(hives).where(isNull(hives.archivedAt)).orderBy(desc(hives.createdAt)),
    db
      .select()
      .from(harvests)
      .where(isNull(harvests.deletedAt))
      .orderBy(desc(harvests.harvestedAt), desc(harvests.createdAt))
      .limit(100),
    db
      .select()
      .from(inspections)
      .where(isNull(inspections.deletedAt))
      .orderBy(desc(inspections.inspectedAt), desc(inspections.createdAt))
      .limit(100),
    session(res).role === "owner"
      ? db.select().from(staff).orderBy(staff.email)
      : Promise.resolve([]),
    db
      .select({ status: hives.status, count: sql<number>`count(*)::int` })
      .from(hives)
      .groupBy(hives.status),
    db
      .select({
        count: sql<number>`count(*)::int`,
        honeyMl: sql<string>`coalesce(sum(${harvests.honeyMl}), 0)`,
        propolisG: sql<string>`coalesce(sum(${harvests.propolisG}), 0)`,
      })
      .from(harvests)
      .where(
        and(
          gte(harvests.harvestedAt, firstDay),
          lt(harvests.harvestedAt, nextMonth),
          isNull(harvests.deletedAt),
        ),
      ),
    db
      .select({
        count: sql<number>`count(*)::int`,
        honeyMl: sql<string>`coalesce(sum(${harvests.honeyMl}), 0)`,
        propolisG: sql<string>`coalesce(sum(${harvests.propolisG}), 0)`,
      })
      .from(harvests)
      .where(isNull(harvests.deletedAt)),
    db.select({ count: sql<number>`count(*)::int` }).from(inspections).where(isNull(inspections.deletedAt)),
    db.select({ count: sql<number>`count(*)::int` }).from(hives),
  ]);
  const hiveStatuses = { Strong: 0, Normal: 0, Weak: 0, Empty: 0 };
  for (const row of statusRows) {
    if (row.status in hiveStatuses)
      hiveStatuses[row.status as keyof typeof hiveStatuses] = row.count;
  }
  const monthly = monthTotals[0];
  const allHarvests = allHarvestTotals[0];
  const summary = {
    month,
    hiveStatuses,
    hiveCount: hiveTotals[0].count,
    harvestCount: allHarvests.count,
    inspectionCount: inspectionTotals[0].count,
    totalHoneyMl: Number(allHarvests.honeyMl),
    totalPropolisG: Number(allHarvests.propolisG),
    monthlyHarvestCount: monthly.count,
    monthlyHoneyMl: Number(monthly.honeyMl),
    monthlyPropolisG: Number(monthly.propolisG),
  };
  res.setHeader("Cache-Control", "private, no-store");
  res.json({
    staff: session(res),
    summary,
    hives: hiveRows,
    harvests: harvestRows.map((row) => withHistoryPermissions(row, session(res))),
    inspections: inspectionRows.map((row) => withHistoryPermissions(row, session(res))),
    team: teamRows,
  });
});

app.get("/api/export", async (req, res) => {
  requireOwner(session(res));
  const { from, to } = dateRangeQuery.parse(req.query);
  const db = database();
  const maxRows = 10_000;
  const [hiveRows, harvestRows, inspectionRows, teamRows] = await Promise.all([
    db.select().from(hives).orderBy(hives.code).limit(maxRows + 1),
    db
      .select()
      .from(harvests)
      .where(
        and(
          from ? gte(harvests.harvestedAt, from) : undefined,
          to ? lte(harvests.harvestedAt, to) : undefined,
          isNull(harvests.deletedAt),
        ),
      )
      .orderBy(harvests.harvestedAt, harvests.id)
      .limit(maxRows + 1),
    db
      .select()
      .from(inspections)
      .where(
        and(
          from ? gte(inspections.inspectedAt, from) : undefined,
          to ? lte(inspections.inspectedAt, to) : undefined,
          isNull(inspections.deletedAt),
        ),
      )
      .orderBy(inspections.inspectedAt, inspections.id)
      .limit(maxRows + 1),
    db.select().from(staff).orderBy(staff.email).limit(maxRows + 1),
  ]);
  if ([hiveRows, harvestRows, inspectionRows, teamRows].some((rows) => rows.length > maxRows)) {
    throw new HttpError(413, "ข้อมูลเกิน 10,000 รายการต่อประเภท กรุณาเลือกช่วงวันที่ให้สั้นลง");
  }
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="metafarm-records-${new Date().toISOString().slice(0, 10)}.json"`,
  );
  res.json({
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    dateRange: { from: from ?? null, to: to ?? null },
    photosIncluded: false,
    hives: hiveRows,
    harvests: harvestRows,
    inspections: inspectionRows,
    team: teamRows,
  });
});

app.get("/api/audit", async (req, res) => {
  requireOwner(session(res));
  const { entity, entityId, offset } = auditQuery.parse(req.query);
  const rows = await database()
    .select()
    .from(auditLogs)
    .where(and(
      entity ? eq(auditLogs.entity, entity) : undefined,
      entityId ? eq(auditLogs.entityId, entityId) : undefined,
    ))
    .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
    .limit(51)
    .offset(offset);
  res.json(pageResult(rows, offset, 50));
});

app.get("/api/hives", async (req, res) => {
  const { includeArchived } = archivedHiveQuery.parse(req.query);
  if (includeArchived === "true") requireOwner(session(res));
  const rows = await database()
    .select()
    .from(hives)
    .where(includeArchived === "true" ? undefined : isNull(hives.archivedAt))
    .orderBy(desc(hives.createdAt));
  res.json(rows);
});

app.post("/api/hives", async (req, res) => {
  const input = hiveInput.parse(req.body);
  const id = crypto.randomUUID();
  const db = database();
  await auditedChange(db, {
    before: noPreviousRecord,
    change: sql`INSERT INTO hives (id, code, name, species, location, status)
      VALUES (${id}::uuid, ${input.code}, ${input.name}, ${input.species ?? null},
        ${input.location ?? null}, ${input.status}) RETURNING *`,
    actorEmail: session(res).email,
    action: "create", entity: "hive", entityId: id,
  });
  const [hive] = await db.select().from(hives).where(eq(hives.id, id));
  res.status(201).json(hive);
});

app.get("/api/hives/by-code/:code", async (req, res) => {
  const code = z.string().min(1).max(40).parse(req.params.code).toUpperCase();
  const [hive] = await database()
    .select({ id: hives.id, code: hives.code })
    .from(hives)
    .where(eq(hives.code, code))
    .limit(1);
  if (!hive) throw new HttpError(404, "ไม่พบรัง");
  res.json(hive);
});

app.get("/api/hives/:id", async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const db = database();
  const [
    hiveRows,
    harvestRows,
    inspectionRows,
    harvestTotals,
    inspectionTotals,
  ] = await Promise.all([
    db.select().from(hives).where(eq(hives.id, id)).limit(1),
    db
      .select()
      .from(harvests)
      .where(and(eq(harvests.hiveId, id), isNull(harvests.deletedAt)))
      .orderBy(desc(harvests.harvestedAt), desc(harvests.createdAt))
      .limit(100),
    db
      .select()
      .from(inspections)
      .where(and(eq(inspections.hiveId, id), isNull(inspections.deletedAt)))
      .orderBy(desc(inspections.inspectedAt), desc(inspections.createdAt))
      .limit(100),
    db
      .select({
        count: sql<number>`count(*)::int`,
        honeyMl: sql<string>`coalesce(sum(${harvests.honeyMl}), 0)`,
        propolisG: sql<string>`coalesce(sum(${harvests.propolisG}), 0)`,
      })
      .from(harvests)
      .where(and(eq(harvests.hiveId, id), isNull(harvests.deletedAt))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(inspections)
      .where(and(eq(inspections.hiveId, id), isNull(inspections.deletedAt))),
  ]);
  if (!hiveRows[0]) throw new HttpError(404, "ไม่พบรัง");
  res.json({
    hive: hiveRows[0],
    harvests: harvestRows.map((row) => withHistoryPermissions(row, session(res))),
    inspections: inspectionRows.map((row) => withHistoryPermissions(row, session(res))),
    totals: {
      harvestCount: harvestTotals[0].count,
      honeyMl: Number(harvestTotals[0].honeyMl),
      propolisG: Number(harvestTotals[0].propolisG),
      inspectionCount: inspectionTotals[0].count,
    },
  });
});

app.get("/api/harvests", async (req, res) => {
  const { hiveId, from, to, offset, limit } = historyQuery.parse(req.query);
  const rows = await database()
    .select()
    .from(harvests)
    .where(
      and(
        hiveId ? eq(harvests.hiveId, hiveId) : undefined,
        from ? gte(harvests.harvestedAt, from) : undefined,
        to ? lte(harvests.harvestedAt, to) : undefined,
        isNull(harvests.deletedAt),
      ),
    )
    .orderBy(
      desc(harvests.harvestedAt),
      desc(harvests.createdAt),
      desc(harvests.id),
    )
    .limit(limit + 1)
    .offset(offset);
  res.json(pageResult(rows.map((row) => withHistoryPermissions(row, session(res))), offset, limit));
});

app.get("/api/inspections", async (req, res) => {
  const { hiveId, from, to, offset, limit } = historyQuery.parse(req.query);
  const rows = await database()
    .select()
    .from(inspections)
    .where(
      and(
        hiveId ? eq(inspections.hiveId, hiveId) : undefined,
        from ? gte(inspections.inspectedAt, from) : undefined,
        to ? lte(inspections.inspectedAt, to) : undefined,
        isNull(inspections.deletedAt),
      ),
    )
    .orderBy(
      desc(inspections.inspectedAt),
      desc(inspections.createdAt),
      desc(inspections.id),
    )
    .limit(limit + 1)
    .offset(offset);
  res.json(pageResult(rows.map((row) => withHistoryPermissions(row, session(res))), offset, limit));
});

app.patch("/api/hives/:id", async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const input = hiveUpdate.parse(req.body);
  const db = database();
  const changed = await auditedChange(db, {
    before: sql`SELECT id, to_jsonb(h) AS payload FROM hives h WHERE id = ${id}::uuid FOR UPDATE`,
    change: sql`UPDATE hives SET name = ${input.name}, species = ${input.species ?? null},
      location = ${input.location ?? null}, status = ${input.status}
      WHERE id IN (SELECT id FROM before_record) RETURNING *`,
    actorEmail: session(res).email,
    action: "update", entity: "hive", entityId: id,
  });
  if (!changed) throw new HttpError(404, "ไม่พบรัง");
  const [hive] = await db.select().from(hives).where(eq(hives.id, id));
  res.json(hive);
});

app.post("/api/hives/:id/archive", async (req, res) => {
  requireOwner(session(res));
  const id = z.uuid().parse(req.params.id);
  const db = database();
  const changed = await auditedChange(db, {
    before: sql`SELECT id, to_jsonb(h) AS payload FROM hives h
      WHERE id = ${id}::uuid AND archived_at IS NULL FOR UPDATE`,
    change: sql`UPDATE hives SET archived_at = now()
      WHERE id IN (SELECT id FROM before_record) RETURNING *`,
    actorEmail: session(res).email,
    action: "archive", entity: "hive", entityId: id,
  });
  if (!changed) throw new HttpError(409, "รังนี้ถูกเก็บถาวรแล้วหรือไม่พบรัง");
  const [hive] = await db.select().from(hives).where(eq(hives.id, id));
  res.json(hive);
});

app.post("/api/hives/:id/restore", async (req, res) => {
  requireOwner(session(res));
  const id = z.uuid().parse(req.params.id);
  const db = database();
  const changed = await auditedChange(db, {
    before: sql`SELECT id, to_jsonb(h) AS payload FROM hives h
      WHERE id = ${id}::uuid AND archived_at IS NOT NULL FOR UPDATE`,
    change: sql`UPDATE hives SET archived_at = NULL
      WHERE id IN (SELECT id FROM before_record) RETURNING *`,
    actorEmail: session(res).email,
    action: "restore", entity: "hive", entityId: id,
  });
  if (!changed) throw new HttpError(409, "รังนี้ยังใช้งานอยู่หรือไม่พบรัง");
  const [hive] = await db.select().from(hives).where(eq(hives.id, id));
  res.json(hive);
});

app.post("/api/harvests", async (req, res) => {
  const input = harvestInput.parse(req.body);
  await assertHive(input.hiveId);
  const id = crypto.randomUUID();
  const db = database();
  const changed = await auditedChange(db, {
    before: noPreviousRecord,
    change: sql`INSERT INTO harvests
      (id, hive_id, harvested_at, honey_ml, propolis_g, created_by, created_by_email)
      SELECT ${id}::uuid, h.id, ${input.harvestedAt}::date,
        ${input.honeyMl}, ${input.propolisG}, ${session(res).email}, ${session(res).email}
      FROM hives h WHERE h.id = ${input.hiveId}::uuid AND h.archived_at IS NULL
      FOR SHARE OF h
      RETURNING *`,
    actorEmail: session(res).email,
    action: "create", entity: "harvest", entityId: id,
  });
  if (!changed) throw new HttpError(409, "รังนี้ถูกเก็บถาวรแล้ว ไม่สามารถเพิ่มบันทึกใหม่ได้");
  const [record] = await db.select().from(harvests).where(eq(harvests.id, id));
  res.status(201).json(withHistoryPermissions(record, session(res)));
});

app.patch("/api/harvests/:id", async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const input = harvestUpdate.parse(req.body);
  const db = database();
  const [current] = await db.select().from(harvests)
    .where(and(eq(harvests.id, id), isNull(harvests.deletedAt))).limit(1);
  if (!current) throw new HttpError(404, "ไม่พบรายการผลผลิต");
  const actor = session(res);
  if (!canEditHistoryRecord(actor, current.createdBy ?? current.createdByEmail, current.createdAt)) {
    throw new HttpError(403, "ไม่มีสิทธิ์แก้ไขรายการผลผลิตนี้");
  }
  if (input.hiveId !== current.hiveId)
    throw new HttpError(400, "ไม่สามารถย้ายผลผลิตไปยังรังอื่นได้");
  const staffRule = actor.role === "staff"
    ? sql`AND lower(coalesce(created_by, created_by_email)) = lower(${actor.email})
      AND created_at BETWEEN now() - interval '24 hours' AND now()`
    : sql``;
  const changed = await auditedChange(db, {
    before: sql`SELECT id, to_jsonb(h) AS payload FROM harvests h
      WHERE id = ${id}::uuid AND deleted_at IS NULL FOR UPDATE`,
    change: sql`UPDATE harvests SET harvested_at = ${input.harvestedAt}::date,
      honey_ml = ${input.honeyMl}, propolis_g = ${input.propolisG},
      updated_at = now(), updated_by = ${actor.email}
      WHERE id IN (SELECT id FROM before_record) ${staffRule} RETURNING *`,
    actorEmail: actor.email,
    action: "update", entity: "harvest", entityId: id,
  });
  if (!changed) throw new HttpError(403, "หมดเวลาแก้ไขรายการผลผลิตนี้");
  const [updated] = await db.select().from(harvests).where(eq(harvests.id, id));
  res.json(withHistoryPermissions(updated, actor));
});

app.delete("/api/harvests/:id", async (req, res) => {
  requireOwner(session(res));
  const id = z.uuid().parse(req.params.id);
  const changed = await auditedChange(database(), {
    before: sql`SELECT id, to_jsonb(h) AS payload FROM harvests h
      WHERE id = ${id}::uuid AND deleted_at IS NULL FOR UPDATE`,
    change: sql`UPDATE harvests SET deleted_at = now(),
      updated_at = now(), updated_by = ${session(res).email}
      WHERE id IN (SELECT id FROM before_record) RETURNING *`,
    actorEmail: session(res).email,
    action: "delete", entity: "harvest", entityId: id,
  });
  if (!changed) throw new HttpError(404, "ไม่พบรายการผลผลิต");
  res.json({ ok: true });
});

app.post("/api/inspections", async (req, res) => {
  const input = inspectionInput.parse(req.body);
  await assertHive(input.hiveId);
  const id = crypto.randomUUID();
  const actor = session(res);
  const db = database();
  const result = await db.execute(sql`
    WITH previous_hive AS MATERIALIZED (
      SELECT id, to_jsonb(h) AS payload FROM hives h
      WHERE id = ${input.hiveId}::uuid AND archived_at IS NULL FOR UPDATE
    ),
    changed_hive AS (
      UPDATE hives SET status = COALESCE(${input.status ?? null}, status)
      WHERE id IN (SELECT id FROM previous_hive) RETURNING *
    ),
    created AS (
      INSERT INTO inspections (id, hive_id, inspected_at, notes, status, created_by)
      SELECT ${id}::uuid, id, ${input.inspectedAt}::date, ${input.notes ?? null},
        status, ${actor.email}
      FROM changed_hive RETURNING *
    ),
    logged_hive AS (
      INSERT INTO audit_logs (id, actor_email, action, entity, entity_id, before, after)
      SELECT ${crypto.randomUUID()}::uuid, ${actor.email}, 'update', 'hive',
        ${input.hiveId}, previous_hive.payload, to_jsonb(changed_hive)
      FROM changed_hive CROSS JOIN previous_hive RETURNING id
    ),
    logged_inspection AS (
      INSERT INTO audit_logs (id, actor_email, action, entity, entity_id, before, after)
      SELECT ${crypto.randomUUID()}::uuid, ${actor.email}, 'create', 'inspection',
        ${id}, NULL::jsonb, to_jsonb(created)
      FROM created RETURNING id
    )
    SELECT created.id FROM created CROSS JOIN logged_hive CROSS JOIN logged_inspection
  `);
  if (!result.rows.length)
    throw new HttpError(409, "รังนี้ถูกเก็บถาวรแล้ว ไม่สามารถเพิ่มบันทึกใหม่ได้");
  const [record] = await db.select().from(inspections).where(eq(inspections.id, id));
  res.status(201).json(withHistoryPermissions(record, actor));
});

app.patch("/api/inspections/:id", async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const input = inspectionUpdate.parse(req.body);
  const db = database();
  const [current] = await db.select().from(inspections)
    .where(and(eq(inspections.id, id), isNull(inspections.deletedAt))).limit(1);
  if (!current) throw new HttpError(404, "ไม่พบบันทึกการตรวจ");
  const actor = session(res);
  if (!canEditHistoryRecord(actor, current.createdBy, current.createdAt))
    throw new HttpError(403, "ไม่มีสิทธิ์แก้ไขบันทึกการตรวจนี้");
  const staffRule = actor.role === "staff"
    ? sql`AND lower(created_by) = lower(${actor.email})
      AND created_at BETWEEN now() - interval '24 hours' AND now()`
    : sql``;
  const changed = await auditedChange(db, {
    before: sql`SELECT id, to_jsonb(i) AS payload FROM inspections i
      WHERE id = ${id}::uuid AND deleted_at IS NULL FOR UPDATE`,
    change: sql`UPDATE inspections SET inspected_at = ${input.inspectedAt}::date,
      status = ${input.status}, notes = ${input.notes},
      updated_at = now(), updated_by = ${actor.email}
      WHERE id IN (SELECT id FROM before_record) ${staffRule} RETURNING *`,
    actorEmail: actor.email,
    action: "update", entity: "inspection", entityId: id,
  });
  if (!changed) throw new HttpError(403, "หมดเวลาแก้ไขบันทึกการตรวจนี้");
  const [updated] = await db.select().from(inspections).where(eq(inspections.id, id));
  res.json(withHistoryPermissions(updated, actor));
});

app.delete("/api/inspections/:id", async (req, res) => {
  requireOwner(session(res));
  const id = z.uuid().parse(req.params.id);
  const changed = await auditedChange(database(), {
    before: sql`SELECT id, to_jsonb(i) AS payload FROM inspections i
      WHERE id = ${id}::uuid AND deleted_at IS NULL FOR UPDATE`,
    change: sql`UPDATE inspections SET deleted_at = now(),
      updated_at = now(), updated_by = ${session(res).email}
      WHERE id IN (SELECT id FROM before_record) RETURNING *`,
    actorEmail: session(res).email,
    action: "delete", entity: "inspection", entityId: id,
  });
  if (!changed) throw new HttpError(404, "ไม่พบบันทึกการตรวจ");
  res.json({ ok: true });
});

app.put("/api/inspections/:id/photo", photoBody, async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const mime = req.get("Content-Type")?.split(";")[0];
  if (
    !mime ||
    !Buffer.isBuffer(req.body) ||
    req.body.length === 0 ||
    detectImageMime(req.body) !== mime
  ) {
    throw new HttpError(400, "รูปต้องเป็น JPEG, PNG หรือ WebP และไม่เกิน 2 MB");
  }
  const db = database();
  const [record] = await db
    .select()
    .from(inspections)
    .where(and(eq(inspections.id, id), isNull(inspections.deletedAt)))
    .limit(1);
  if (!record) throw new HttpError(404, "ไม่พบบันทึกการตรวจ");
  const actor = session(res);
  if (!canEditHistoryRecord(actor, record.createdBy, record.createdAt))
    throw new HttpError(403, "ไม่มีสิทธิ์แก้ไขรูปบันทึกการตรวจนี้");
  const staffRule = actor.role === "staff"
    ? sql`AND lower(created_by) = lower(${actor.email})
      AND created_at BETWEEN now() - interval '24 hours' AND now()`
    : sql``;
  const key = `inspections/${id}/${crypto.randomUUID()}`;
  await bindings.MEDIA.put(key, req.body, {
    httpMetadata: { contentType: mime },
  });
  try {
    const changed = await auditedChange(db, {
      before: sql`SELECT id, to_jsonb(i) AS payload FROM inspections i
        WHERE id = ${id}::uuid AND deleted_at IS NULL FOR UPDATE`,
      change: sql`UPDATE inspections SET image_key = ${key}, image_mime = ${mime},
        updated_at = now(), updated_by = ${session(res).email}
        WHERE id IN (SELECT id FROM before_record) ${staffRule} RETURNING *`,
      actorEmail: actor.email,
      action: "update", entity: "inspection", entityId: id,
    });
    if (!changed) throw new HttpError(403, "หมดเวลาแก้ไขรูปบันทึกการตรวจนี้");
  } catch (cause) {
    await bindings.MEDIA.delete(key);
    throw cause;
  }
  res.json({ ok: true });
});

app.get("/api/inspections/:id/photo", async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const [record] = await database()
    .select({ key: inspections.imageKey, mime: inspections.imageMime })
    .from(inspections)
    .where(and(eq(inspections.id, id), isNull(inspections.deletedAt)))
    .limit(1);
  if (!record?.key || !record.mime) throw new HttpError(404, "ไม่พบรูป");
  const object = await bindings.MEDIA.get(record.key);
  if (!object) throw new HttpError(404, "ไม่พบรูป");
  res.set({
    "Content-Type": record.mime,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.send(Buffer.from(await object.arrayBuffer()));
});

app.post("/api/team", async (req, res) => {
  requireOwner(session(res));
  const { email } = teamInput.parse(req.body);
  if (email === bindings.OWNER_EMAIL?.trim().toLowerCase())
    throw new HttpError(400, "เจ้าของฟาร์มมีสิทธิ์อยู่แล้ว");
  const db = database();
  const [previous] = await db.select().from(staff).where(eq(staff.email, email)).limit(1);
  await auditedChange(db, {
    before: sql`SELECT (SELECT to_jsonb(s) FROM staff s
      WHERE email = ${email} FOR UPDATE) AS payload`,
    change: sql`INSERT INTO staff (email, active) VALUES (${email}, true)
      ON CONFLICT (email) DO UPDATE SET active = true RETURNING *`,
    actorEmail: session(res).email,
    action: previous ? "update" : "create", entity: "team", entityId: email,
  });
  res.status(201).json({ email, active: true });
});

app.patch("/api/team/:email", async (req, res) => {
  requireOwner(session(res));
  const email = z.email().parse(req.params.email).toLowerCase();
  const { active } = z.object({ active: z.boolean() }).parse(req.body);
  const db = database();
  const changed = await auditedChange(db, {
    before: sql`SELECT email, to_jsonb(s) AS payload FROM staff s
      WHERE email = ${email} AND active = ${!active} FOR UPDATE`,
    change: sql`UPDATE staff SET active = ${active}
      WHERE email IN (SELECT email FROM before_record) RETURNING *`,
    actorEmail: session(res).email,
    action: "update", entity: "team", entityId: email,
  });
  if (!changed) throw new HttpError(404, "ไม่พบทีมงานหรือสถานะไม่เปลี่ยน");
  const [member] = await db.select().from(staff).where(eq(staff.email, email));
  res.json(member);
});

app.use(handleError);

app.listen(3000);
export default httpServerHandler({ port: 3000 });
