import { useEffect, useState } from "react";
import { ButtonLink } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DateRangeFilter } from "../../components/ui/DateRangeFilter";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { LoadMore } from "../../components/ui/LoadMore";
import { th } from "../../i18n/th";
import {
  api,
  type Harvest,
  type HiveDetailData,
  type Inspection,
} from "../../lib/api";
import { formatFarmDate, formatFarmNumber } from "../../lib/date";
import { useHistory } from "../../lib/useHistory";
import { StatusBadge } from "./StatusBadge";

export function HiveDetail({ hiveId }: { hiveId: string }) {
  const [data, setData] = useState<HiveDetailData | null>(null);
  const [error, setError] = useState("");
  const harvestHistory = useHistory<Harvest>(
    "harvests",
    data?.harvests,
    data?.totals.harvestCount,
    hiveId,
  );
  const inspectionHistory = useHistory<Inspection>(
    "inspections",
    data?.inspections,
    data?.totals.inspectionCount,
    hiveId,
  );

  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    api<HiveDetailData>(`/hives/${hiveId}`)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : th.admin.loadFailed,
          );
      });
    return () => {
      active = false;
    };
  }, [hiveId]);

  if (error)
    return <EmptyState title={th.admin.loadFailed} description={error} />;
  if (!data) return <Skeleton />;

  const { hive, totals } = data;
  const harvests = harvestHistory.items;
  const inspections = inspectionHistory.items;
  const hiveQuery = `?hive=${encodeURIComponent(hive.id)}`;
  return (
    <div className="space-y-6">
      <a
        href="/admin#hives"
        className="inline-flex min-h-11 items-center font-semibold text-leaf-800 underline"
      >
        ← {th.admin.backToHives}
      </a>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-stone-600">
              {th.admin.hiveCode}
            </p>
            <h2 className="text-page font-black">{hive.code}</h2>
            <p className="mt-1 text-lg font-semibold">{hive.name}</p>
          </div>
          <StatusBadge status={hive.status} />
        </div>
        <p className="mt-4 text-stone-700">
          {th.admin.species}: {hive.species || "—"} · {th.admin.location}:{" "}
          {hive.location || "—"}
        </p>
      </Card>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href={`/admin${hiveQuery}#harvests`}>
          {th.admin.addHarvest}
        </ButtonLink>
        <ButtonLink href={`/admin${hiveQuery}#inspections`} variant="secondary">
          {th.admin.addInspection}
        </ButtonLink>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-stone-600">
            {th.admin.honey} {th.admin.allTime}
          </p>
          <p className="mt-2 text-2xl font-black">
            {formatFarmNumber(totals.honeyMl)} {th.common.milliliters}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-stone-600">
            {th.admin.propolis} {th.admin.allTime}
          </p>
          <p className="mt-2 text-2xl font-black">
            {formatFarmNumber(totals.propolisG)} {th.common.grams}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-stone-600">{th.admin.inspectionCount}</p>
          <p className="mt-2 text-2xl font-black">
            {formatFarmNumber(totals.inspectionCount)}
          </p>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-label={th.admin.inspections}>
          <h2 className="mb-3 text-lg font-bold">
            {th.admin.inspections} ({formatFarmNumber(totals.inspectionCount)})
          </h2>
          {(totals.inspectionCount > 0 || inspectionHistory.range) && <DateRangeFilter
            range={inspectionHistory.range}
            loading={inspectionHistory.loading}
            error={inspectionHistory.errorSource === "filter" ? inspectionHistory.error : ""}
            resetToken={hiveId}
            onApply={inspectionHistory.applyFilter}
            onClear={inspectionHistory.clearFilter}
          />}
          <div className="space-y-3">
            {inspections.length ? (
              inspections.map((record) => (
                <Card key={record.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">
                      {formatFarmDate(record.inspectedAt)}
                    </p>
                    <StatusBadge status={record.status} />
                  </div>
                  {record.notes && (
                    <p className="mt-3 whitespace-pre-wrap text-stone-700">
                      {record.notes}
                    </p>
                  )}
                  {record.imageKey && (
                    <a
                      href={`/api/inspections/${record.id}/photo`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex min-h-11 items-center font-semibold text-leaf-800 underline"
                    >
                      {th.common.viewPhoto}
                    </a>
                  )}
                </Card>
              ))
            ) : (
              <EmptyState
                title={th.common.noData}
                description={inspectionHistory.range ? th.admin.noHistoryMatch : th.admin.firstInspection}
              />
            )}
            <LoadMore
              hasMore={inspectionHistory.hasMore}
              loading={inspectionHistory.loading}
              error={inspectionHistory.errorSource === "more" ? inspectionHistory.error : ""}
              onClick={inspectionHistory.loadMore}
            />
          </div>
        </section>
        <section aria-label={th.admin.harvests}>
          <h2 className="mb-3 text-lg font-bold">
            {th.admin.harvests} ({formatFarmNumber(totals.harvestCount)})
          </h2>
          {(totals.harvestCount > 0 || harvestHistory.range) && <DateRangeFilter
            range={harvestHistory.range}
            loading={harvestHistory.loading}
            error={harvestHistory.errorSource === "filter" ? harvestHistory.error : ""}
            resetToken={hiveId}
            onApply={harvestHistory.applyFilter}
            onClear={harvestHistory.clearFilter}
          />}
          <div className="space-y-3">
            {harvests.length ? (
              harvests.map((record) => (
                <Card key={record.id}>
                  <p className="font-semibold">
                    {formatFarmDate(record.harvestedAt)}
                  </p>
                  <p className="mt-2 text-stone-700">
                    {th.admin.honey}: {formatFarmNumber(record.honeyMl)}{" "}
                    {th.common.milliliters}
                  </p>
                  <p className="text-stone-700">
                    {th.admin.propolis}: {formatFarmNumber(record.propolisG)}{" "}
                    {th.common.grams}
                  </p>
                </Card>
              ))
            ) : (
              <EmptyState
                title={th.common.noData}
                description={harvestHistory.range ? th.admin.noHistoryMatch : th.admin.firstHarvest}
              />
            )}
            <LoadMore
              hasMore={harvestHistory.hasMore}
              loading={harvestHistory.loading}
              error={harvestHistory.errorSource === "more" ? harvestHistory.error : ""}
              onClick={harvestHistory.loadMore}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
