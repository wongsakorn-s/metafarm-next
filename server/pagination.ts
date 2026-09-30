import { z } from "zod";

const dateRangeFields = {
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
};
const validDateRange = (value: { from?: string; to?: string }) =>
  !value.from || !value.to || value.from <= value.to;
const dateRangeIssue = {
  path: ["to"],
  message: "วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น",
};

export const dateRangeQuery = z.object(dateRangeFields).refine(validDateRange, dateRangeIssue);

export const exportQuery = z.object({
  ...dateRangeFields,
  full: z.enum(["true", "false"]).optional(),
}).refine(validDateRange, dateRangeIssue).refine(
  (value) => value.full !== "true" || (!value.from && !value.to),
  { path: ["full"], message: "การสำรองข้อมูลทั้งหมดต้องไม่ระบุช่วงวันที่" },
);

export const exportAuditQuery = z.object({
  offset: z.coerce.number().int().min(0).max(10_000_000).default(0),
});

export const historyQuery = z.object({
  hiveId: z.uuid().optional(),
  ...dateRangeFields,
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).refine(validDateRange, dateRangeIssue);

export function pageResult<T>(rows: T[], offset: number, limit: number) {
  const hasMore = rows.length > limit;
  return {
    items: rows.slice(0, limit),
    nextOffset: hasMore ? offset + limit : null,
  };
}
