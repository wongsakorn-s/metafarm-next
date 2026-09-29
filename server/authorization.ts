import type { StaffSession } from "./auth";
import { HttpError } from "./http";
export { canEditHistoryRecord } from "../shared/historyPermissions";

export function requireOwner(staff: StaffSession): void {
  if (staff.role !== "owner") throw new HttpError(403, "เฉพาะเจ้าของฟาร์ม");
}
