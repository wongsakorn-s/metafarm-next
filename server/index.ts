import { env } from "cloudflare:workers";
import { httpServerHandler } from "cloudflare:node";
import express from "express";
import { and, desc, eq, gte, lt, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./db";
import { harvests, hives, inspections, staff } from "./db/schema";
import { getStaff, type AppEnv, type StaffSession } from "./auth";
import {
  harvestInput,
  harvestUpdate,
  hiveInput,
  hiveUpdate,
  inspectionInput,
  teamInput,
} from "./validation";
import { handleError, HttpError, jsonBody, photoBody } from "./http";
import { detectImageMime } from "./image";
import { dateRangeQuery, historyQuery, pageResult } from "./pagination";
import { canEditHistoryRecord, requireOwner } from "./authorization";
import { getCurrentWeather } from "./weather";

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
    .select({ id: hives.id })
    .from(hives)
    .where(eq(hives.id, hiveId))
    .limit(1);
  if (!hive) throw new HttpError(404, "ไม่พบรังที่เลือก");
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
  ] = await Promise.all([
    db.select().from(hives).orderBy(desc(hives.createdAt)),
    db
      .select()
      .from(harvests)
      .orderBy(desc(harvests.harvestedAt), desc(harvests.createdAt))
      .limit(100),
    db
      .select()
      .from(inspections)
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
        ),
      ),
    db
      .select({
        count: sql<number>`count(*)::int`,
        honeyMl: sql<string>`coalesce(sum(${harvests.honeyMl}), 0)`,
        propolisG: sql<string>`coalesce(sum(${harvests.propolisG}), 0)`,
      })
      .from(harvests),
    db.select({ count: sql<number>`count(*)::int` }).from(inspections),
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
    hiveCount: hiveRows.length,
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
    harvests: harvestRows,
    inspections: inspectionRows,
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

app.post("/api/hives", async (req, res) => {
  const input = hiveInput.parse(req.body);
  const [hive] = await database()
    .insert(hives)
    .values({ id: crypto.randomUUID(), ...input })
    .returning();
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
      .where(eq(harvests.hiveId, id))
      .orderBy(desc(harvests.harvestedAt), desc(harvests.createdAt))
      .limit(100),
    db
      .select()
      .from(inspections)
      .where(eq(inspections.hiveId, id))
      .orderBy(desc(inspections.inspectedAt), desc(inspections.createdAt))
      .limit(100),
    db
      .select({
        count: sql<number>`count(*)::int`,
        honeyMl: sql<string>`coalesce(sum(${harvests.honeyMl}), 0)`,
        propolisG: sql<string>`coalesce(sum(${harvests.propolisG}), 0)`,
      })
      .from(harvests)
      .where(eq(harvests.hiveId, id)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(inspections)
      .where(eq(inspections.hiveId, id)),
  ]);
  if (!hiveRows[0]) throw new HttpError(404, "ไม่พบรัง");
  res.json({
    hive: hiveRows[0],
    harvests: harvestRows,
    inspections: inspectionRows,
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
      ),
    )
    .orderBy(
      desc(harvests.harvestedAt),
      desc(harvests.createdAt),
      desc(harvests.id),
    )
    .limit(limit + 1)
    .offset(offset);
  res.json(pageResult(rows, offset, limit));
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
      ),
    )
    .orderBy(
      desc(inspections.inspectedAt),
      desc(inspections.createdAt),
      desc(inspections.id),
    )
    .limit(limit + 1)
    .offset(offset);
  res.json(pageResult(rows, offset, limit));
});

app.patch("/api/hives/:id", async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const input = hiveUpdate.parse(req.body);
  const [hive] = await database()
    .update(hives)
    .set(input)
    .where(eq(hives.id, id))
    .returning();
  if (!hive) throw new HttpError(404, "ไม่พบรัง");
  res.json(hive);
});

app.post("/api/harvests", async (req, res) => {
  const input = harvestInput.parse(req.body);
  await assertHive(input.hiveId);
  const [record] = await database()
    .insert(harvests)
    .values({ id: crypto.randomUUID(), ...input, createdByEmail: session(res).email })
    .returning();
  res.status(201).json(record);
});

app.patch("/api/harvests/:id", async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const input = harvestUpdate.parse(req.body);
  const db = database();
  const [current] = await db.select().from(harvests).where(eq(harvests.id, id)).limit(1);
  if (!current) throw new HttpError(404, "ไม่พบรายการผลผลิต");
  const actor = session(res);
  if (!canEditHistoryRecord(actor, current.createdByEmail, current.createdAt)) {
    throw new HttpError(403, "ไม่มีสิทธิ์แก้ไขรายการผลผลิตนี้");
  }
  await assertHive(input.hiveId);
  const [updated] = await db
    .update(harvests)
    .set(input)
    .where(and(
      eq(harvests.id, id),
      actor.role === "staff" ? eq(harvests.createdByEmail, actor.email) : undefined,
      actor.role === "staff"
        ? gte(harvests.createdAt, sql`now() - interval '24 hours'`)
        : undefined,
      actor.role === "staff" ? lte(harvests.createdAt, sql`now()`) : undefined,
    ))
    .returning();
  if (!updated) throw new HttpError(403, "หมดเวลาแก้ไขรายการผลผลิตนี้");
  res.json(updated);
});

app.delete("/api/harvests/:id", async (req, res) => {
  requireOwner(session(res));
  const id = z.uuid().parse(req.params.id);
  const [removed] = await database()
    .delete(harvests)
    .where(eq(harvests.id, id))
    .returning({ id: harvests.id });
  if (!removed) throw new HttpError(404, "ไม่พบรายการผลผลิต");
  res.json({ ok: true });
});

app.post("/api/inspections", async (req, res) => {
  const input = inspectionInput.parse(req.body);
  const result = await database().execute(sql`
    WITH current_hive AS (
      UPDATE hives
      SET status = COALESCE(${input.status ?? null}, status)
      WHERE id = ${input.hiveId}::uuid
      RETURNING id, status
    )
    INSERT INTO inspections (id, hive_id, inspected_at, notes, status)
    SELECT ${crypto.randomUUID()}::uuid, id, ${input.inspectedAt}::date, ${input.notes ?? null}, status
    FROM current_hive
    RETURNING id, hive_id AS "hiveId", inspected_at AS "inspectedAt", notes, status,
      image_key AS "imageKey"
  `);
  const record = result.rows[0];
  if (!record) throw new HttpError(404, "ไม่พบรังที่เลือก");
  res.status(201).json(record);
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
    .where(eq(inspections.id, id))
    .limit(1);
  if (!record) throw new HttpError(404, "ไม่พบบันทึกการตรวจ");
  const key = `inspections/${id}/${crypto.randomUUID()}`;
  await bindings.MEDIA.put(key, req.body, {
    httpMetadata: { contentType: mime },
  });
  try {
    await db
      .update(inspections)
      .set({ imageKey: key, imageMime: mime })
      .where(eq(inspections.id, id));
  } catch (cause) {
    await bindings.MEDIA.delete(key);
    throw cause;
  }
  if (record.imageKey) await bindings.MEDIA.delete(record.imageKey);
  res.json({ ok: true });
});

app.get("/api/inspections/:id/photo", async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const [record] = await database()
    .select({ key: inspections.imageKey, mime: inspections.imageMime })
    .from(inspections)
    .where(eq(inspections.id, id))
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
  await database()
    .insert(staff)
    .values({ email, active: true })
    .onConflictDoUpdate({ target: staff.email, set: { active: true } });
  res.status(201).json({ email, active: true });
});

app.patch("/api/team/:email", async (req, res) => {
  requireOwner(session(res));
  const email = z.email().parse(req.params.email).toLowerCase();
  const { active } = z.object({ active: z.boolean() }).parse(req.body);
  const [member] = await database()
    .update(staff)
    .set({ active })
    .where(and(eq(staff.email, email), eq(staff.active, !active)))
    .returning();
  if (!member) throw new HttpError(404, "ไม่พบทีมงานหรือสถานะไม่เปลี่ยน");
  res.json(member);
});

app.use(handleError);

app.listen(3000);
export default httpServerHandler({ port: 3000 });
