import type { Request } from "express";
import { eq, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./db";
import { idempotencyKeys } from "./db/schema";
import { HttpError } from "./http";

export type PreparedIdempotency = {
  key: string;
  actor: string;
  operation: "create-harvest" | "create-inspection";
  requestHash: string;
  createdAt: string;
  previousResponse: unknown | null;
};

export async function hashRequest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function assertMatchingReplay(
  previous: { actor: string; operation: string; requestHash: string },
  current: Pick<PreparedIdempotency, "actor" | "operation" | "requestHash">,
) {
  if (previous.actor !== current.actor ||
    previous.operation !== current.operation ||
    previous.requestHash !== current.requestHash)
    throw new HttpError(409, "คีย์การบันทึกนี้เคยใช้กับข้อมูลอื่นแล้ว");
}

export async function prepareIdempotency(
  req: Request,
  db: ReturnType<typeof getDb>,
  actor: string,
  operation: PreparedIdempotency["operation"],
  input: unknown,
): Promise<PreparedIdempotency> {
  const key = z.uuid().parse(req.get("Idempotency-Key") ?? crypto.randomUUID());
  const requestHash = await hashRequest(input);
  await db.delete(idempotencyKeys).where(lt(idempotencyKeys.createdAt, sql`now() - interval '7 days'`));
  const [previous] = await db.select().from(idempotencyKeys).where(eq(idempotencyKeys.key, key)).limit(1);
  if (previous) assertMatchingReplay(previous, { actor, operation, requestHash });
  return { key, actor, operation, requestHash, createdAt: new Date().toISOString(),
    previousResponse: previous?.response ?? null };
}

export async function replayAfterConflict(db: ReturnType<typeof getDb>, input: PreparedIdempotency) {
  const [previous] = await db.select().from(idempotencyKeys).where(eq(idempotencyKeys.key, input.key)).limit(1);
  if (!previous) throw new HttpError(503, "ยังไม่สามารถยืนยันผลการบันทึก กรุณาลองอีกครั้ง");
  assertMatchingReplay(previous, input);
  return previous.response;
}
