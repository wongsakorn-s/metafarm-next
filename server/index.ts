import { env } from 'cloudflare:workers';
import { httpServerHandler } from 'cloudflare:node';
import express from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from './db';
import { harvests, hives, inspections, staff } from './db/schema';
import { getStaff, type AppEnv, type StaffSession } from './auth';
import { harvestInput, hiveInput, hiveUpdate, inspectionInput, teamInput } from './validation';
import { handleError, HttpError, jsonBody, photoBody } from './http';

const bindings = env as AppEnv;
const app = express();
app.disable('x-powered-by');
app.use(jsonBody);

function database() {
  if (!bindings.DATABASE_URL) throw new HttpError(503, 'ฐานข้อมูลยังไม่พร้อมใช้งาน');
  return getDb(bindings.DATABASE_URL);
}

function session(res: express.Response): StaffSession {
  return res.locals.staff as StaffSession;
}

async function assertHive(hiveId: string) {
  const [hive] = await database().select({ id: hives.id }).from(hives).where(eq(hives.id, hiveId)).limit(1);
  if (!hive) throw new HttpError(404, 'ไม่พบรังที่เลือก');
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api', async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'private, no-store');
    const host = req.get('host') ?? 'invalid.local';
    const url = new URL(req.originalUrl, `https://${host}`);
    const headers = new Headers();
    const token = req.get('Cf-Access-Jwt-Assertion');
    if (token) headers.set('Cf-Access-Jwt-Assertion', token);
    const user = await getStaff(new Request(url, { headers }), bindings);
    if (!user) throw new HttpError(403, 'ไม่มีสิทธิ์เข้าถึงหลังบ้าน');
    res.locals.staff = user;
    next();
  } catch (cause) { next(cause); }
});

app.get('/api/me', (_req, res) => res.json(session(res)));

app.get('/api/dashboard', async (_req, res) => {
  const db = database();
  const [hiveRows, harvestRows, inspectionRows, teamRows] = await Promise.all([
    db.select().from(hives).orderBy(desc(hives.createdAt)),
    db.select().from(harvests).orderBy(desc(harvests.harvestedAt), desc(harvests.createdAt)).limit(100),
    db.select().from(inspections).orderBy(desc(inspections.inspectedAt), desc(inspections.createdAt)).limit(100),
    session(res).role === 'owner' ? db.select().from(staff).orderBy(staff.email) : Promise.resolve([])
  ]);
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ staff: session(res), hives: hiveRows, harvests: harvestRows, inspections: inspectionRows, team: teamRows });
});

app.post('/api/hives', async (req, res) => {
  const input = hiveInput.parse(req.body);
  const [hive] = await database().insert(hives).values({ id: crypto.randomUUID(), ...input }).returning();
  res.status(201).json(hive);
});

app.patch('/api/hives/:id', async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const input = hiveUpdate.parse(req.body);
  const [hive] = await database().update(hives).set(input).where(eq(hives.id, id)).returning();
  if (!hive) throw new HttpError(404, 'ไม่พบรัง');
  res.json(hive);
});

app.post('/api/harvests', async (req, res) => {
  const input = harvestInput.parse(req.body);
  await assertHive(input.hiveId);
  const [record] = await database().insert(harvests).values({ id: crypto.randomUUID(), ...input }).returning();
  res.status(201).json(record);
});

app.post('/api/inspections', async (req, res) => {
  const input = inspectionInput.parse(req.body);
  await assertHive(input.hiveId);
  const [record] = await database().insert(inspections).values({ id: crypto.randomUUID(), ...input }).returning();
  res.status(201).json(record);
});

app.put('/api/inspections/:id/photo', photoBody, async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const mime = req.get('Content-Type')?.split(';')[0];
  if (!mime || !['image/jpeg', 'image/png', 'image/webp'].includes(mime) || !Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new HttpError(400, 'รูปต้องเป็น JPEG, PNG หรือ WebP และไม่เกิน 2 MB');
  }
  const db = database();
  const [record] = await db.select().from(inspections).where(eq(inspections.id, id)).limit(1);
  if (!record) throw new HttpError(404, 'ไม่พบบันทึกการตรวจ');
  const key = `inspections/${id}/${crypto.randomUUID()}`;
  await bindings.MEDIA.put(key, req.body, { httpMetadata: { contentType: mime } });
  try {
    await db.update(inspections).set({ imageKey: key, imageMime: mime }).where(eq(inspections.id, id));
  } catch (cause) {
    await bindings.MEDIA.delete(key);
    throw cause;
  }
  if (record.imageKey) await bindings.MEDIA.delete(record.imageKey);
  res.json({ ok: true });
});

app.get('/api/inspections/:id/photo', async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const [record] = await database().select({ key: inspections.imageKey, mime: inspections.imageMime })
    .from(inspections).where(eq(inspections.id, id)).limit(1);
  if (!record?.key || !record.mime) throw new HttpError(404, 'ไม่พบรูป');
  const object = await bindings.MEDIA.get(record.key);
  if (!object) throw new HttpError(404, 'ไม่พบรูป');
  res.set({ 'Content-Type': record.mime, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
  res.send(Buffer.from(await object.arrayBuffer()));
});

app.post('/api/team', async (req, res) => {
  if (session(res).role !== 'owner') throw new HttpError(403, 'เฉพาะเจ้าของฟาร์ม');
  const { email } = teamInput.parse(req.body);
  if (email === bindings.OWNER_EMAIL?.trim().toLowerCase()) throw new HttpError(400, 'เจ้าของฟาร์มมีสิทธิ์อยู่แล้ว');
  await database().insert(staff).values({ email, active: true })
    .onConflictDoUpdate({ target: staff.email, set: { active: true } });
  res.status(201).json({ email, active: true });
});

app.patch('/api/team/:email', async (req, res) => {
  if (session(res).role !== 'owner') throw new HttpError(403, 'เฉพาะเจ้าของฟาร์ม');
  const email = z.email().parse(req.params.email).toLowerCase();
  const { active } = z.object({ active: z.boolean() }).parse(req.body);
  const [member] = await database().update(staff).set({ active }).where(and(eq(staff.email, email), eq(staff.active, !active))).returning();
  if (!member) throw new HttpError(404, 'ไม่พบทีมงานหรือสถานะไม่เปลี่ยน');
  res.json(member);
});

app.use(handleError);

app.listen(3000);
export default httpServerHandler({ port: 3000 });
