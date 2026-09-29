import type { Dashboard } from "../../lib/api";

export type HiveStatus = "Strong" | "Normal" | "Weak" | "Empty";

export function summarizeDashboard(data: Dashboard, today: string) {
  const hiveStatuses: Record<HiveStatus, number> = {
    Strong: 0,
    Normal: 0,
    Weak: 0,
    Empty: 0,
  };
  for (const hive of data.hives) {
    if (hive.status in hiveStatuses) {
      hiveStatuses[hive.status as HiveStatus] += 1;
    }
  }
  const month = today.slice(0, 7);
  const currentMonthHarvests = data.harvests.filter((item) =>
    item.harvestedAt.startsWith(month),
  );
  return {
    hiveStatuses,
    month,
    honeyMl: currentMonthHarvests.reduce((sum, item) => sum + item.honeyMl, 0),
    propolisG: currentMonthHarvests.reduce(
      (sum, item) => sum + item.propolisG,
      0,
    ),
    harvestCount: currentMonthHarvests.length,
  };
}
