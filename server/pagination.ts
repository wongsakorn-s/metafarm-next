import { z } from "zod";

export const historyQuery = z.object({
  hiveId: z.uuid().optional(),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export function pageResult<T>(rows: T[], offset: number, limit: number) {
  const hasMore = rows.length > limit;
  return {
    items: rows.slice(0, limit),
    nextOffset: hasMore ? offset + limit : null,
  };
}
