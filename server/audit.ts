import { sql, type SQL } from "drizzle-orm";
import type { getDb } from "./db";

export type AuditEntity = "hive" | "harvest" | "inspection" | "team";
export type AuditAction = "create" | "update" | "delete" | "archive" | "restore";

export async function auditedChange(
  db: ReturnType<typeof getDb>,
  input: {
    before: SQL;
    change: SQL;
    actorEmail: string;
    action: AuditAction;
    entity: AuditEntity;
    entityId: string;
  },
): Promise<boolean> {
  const result = await db.execute(sql`
    WITH before_record AS MATERIALIZED (${input.before}),
    changed AS (${input.change}),
    logged AS (
      INSERT INTO audit_logs
        (id, actor_email, action, entity, entity_id, before, after)
      SELECT ${crypto.randomUUID()}::uuid, ${input.actorEmail},
        ${input.action}, ${input.entity}, ${input.entityId},
        before_record.payload, to_jsonb(changed)
      FROM changed CROSS JOIN before_record
      RETURNING id
    )
    SELECT changed.* FROM changed CROSS JOIN logged
  `);
  return result.rows.length > 0;
}

export const noPreviousRecord = sql`SELECT NULL::jsonb AS payload`;
