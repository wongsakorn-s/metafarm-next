import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../hives/StatusBadge";
import { th } from "../../i18n/th";
import type { Dashboard } from "../../lib/api";
import { formatFarmMonth, formatFarmNumber } from "../../lib/date";
import { summarizeDashboard, type HiveStatus } from "./summary";

const statuses: HiveStatus[] = ["Strong", "Normal", "Weak", "Empty"];
const statusBars: Record<HiveStatus, string> = {
  Strong: "bg-hive-strong",
  Normal: "bg-hive-normal",
  Weak: "bg-hive-weak",
  Empty: "bg-hive-empty",
};

export function DashboardSummary({
  data,
  today,
}: {
  data: Dashboard;
  today: string;
}) {
  const summary = summarizeDashboard(data, today);
  return (
    <section aria-label={th.admin.overview} className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          [th.admin.hiveCount, data.hives.length],
          [th.admin.harvestCount, data.harvests.length],
          [th.admin.inspectionCount, data.inspections.length],
        ].map(([label, value]) => (
          <Card key={label} className="p-3 sm:p-5">
            <p className="text-xs text-stone-600 sm:text-sm">{label}</p>
            <p className="mt-2 text-2xl font-black text-leaf-800 sm:text-4xl">
              {formatFarmNumber(Number(value))}
            </p>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold">{th.admin.hiveHealth}</h2>
          <div className="mt-4 space-y-3">
            {statuses.map((status) => {
              const count = summary.hiveStatuses[status];
              const percent = data.hives.length
                ? (count / data.hives.length) * 100
                : 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between gap-3">
                    <StatusBadge status={status} />
                    <span className="font-bold">
                      {formatFarmNumber(count)} ·{" "}
                      {formatFarmNumber(Math.round(percent))}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-stone-100">
                    <div
                      className={`h-full rounded-full ${statusBars[status]}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">{th.admin.monthlyHarvest}</h2>
          <p className="mt-1 text-sm text-stone-600">
            {formatFarmMonth(summary.month)} ·{" "}
            {formatFarmNumber(summary.harvestCount)} {th.admin.harvestEntries}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-control bg-honey-50 p-4">
              <p className="text-sm text-stone-700">{th.admin.honey}</p>
              <p className="mt-1 text-xl font-black text-honey-900">
                {formatFarmNumber(summary.honeyMl)} {th.common.milliliters}
              </p>
            </div>
            <div className="rounded-control bg-leaf-50 p-4">
              <p className="text-sm text-stone-700">{th.admin.propolis}</p>
              <p className="mt-1 text-xl font-black text-leaf-800">
                {formatFarmNumber(summary.propolisG)} {th.common.grams}
              </p>
            </div>
          </div>
          {data.harvests.length === 100 && (
            <p className="mt-3 text-xs text-stone-600">{th.admin.recentOnly}</p>
          )}
        </Card>
      </div>
    </section>
  );
}
