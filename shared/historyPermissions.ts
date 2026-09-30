export type HistoryActor = { email: string; role: "owner" | "staff" };

export function canEditHistoryRecord(
  actor: HistoryActor,
  createdByEmail: string | null,
  createdAt: Date,
  now = new Date(),
): boolean {
  if (actor.role === "owner") return true;
  return (
    createdByEmail !== null &&
    createdByEmail.toLowerCase() === actor.email.toLowerCase() &&
    createdAt.getTime() <= now.getTime() &&
    now.getTime() - createdAt.getTime() <= 24 * 60 * 60 * 1000
  );
}
