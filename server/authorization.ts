import type { StaffSession } from "./auth";
import { canEditHistoryRecord } from "../shared/historyPermissions";
import { HttpError } from "./http";
export { canEditHistoryRecord } from "../shared/historyPermissions";

export function requireOwner(staff: StaffSession): void {
  if (staff.role !== "owner") throw new HttpError(403, "เฉพาะเจ้าของฟาร์ม");
}

export function historyPermissions(
  actor: StaffSession,
  createdBy: string | null,
  createdAt: Date,
  now = new Date(),
) {
  return {
    canEdit: canEditHistoryRecord(actor, createdBy, createdAt, now),
    canDelete: actor.role === "owner",
  };
}
