import { useEffect, useState } from "react";
import { ButtonLink } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { LoadMore } from "../../components/ui/LoadMore";
import { th } from "../../i18n/th";
import {
  api,
  type Harvest,
  type HistoryPage,
  type HiveDetailData,
  type Inspection,
} from "../../lib/api";
import { formatFarmDate, formatFarmNumber } from "../../lib/date";
import { StatusBadge } from "./StatusBadge";

export function HiveDetail({ hiveId }: { hiveId: string }) {
  const [data, setData] = useState<HiveDetailData | null>(null);
  const [error, setError] = useState("");
  const [extraHarvests, setExtraHarvests] = useState<Harvest[]>([]);
  const [extraInspections, setExtraInspections] = useState<Inspection[]>([]);
  const [harvestNextOffset, setHarvestNextOffset] = useState<number | null>(null);
  const [inspectionNextOffset, setInspectionNextOffset] = useState<number | null>(null);
  const [harvestLoading, setHarvestLoading] = useState(false);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [harvestLoadError, setHarvestLoadError] = useState("");
  const [inspectionLoadError, setInspectionLoadError] = useState("");

  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    setExtraHarvests([]);
    setExtraInspections([]);
    api<HiveDetailData>(`/hives/${hiveId}`)
      .then((result) => {
        if (active) {
          setData(result);
          setHarvestNextOffset(
            result.totals.harvestCount > result.harvests.length
              ? result.harvests.length
              : null,
          );
          setInspectionNextOffset(
            result.totals.inspectionCount > result.inspections.length
              ? result.inspections.length
              : null,
          );
        }
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

  async function loadMoreHarvests() {
    if (!data || harvestNextOffset === null || harvestLoading) return;
    setHarvestLoading(true);
    setHarvestLoadError("");
    try {
      const page = await api<HistoryPage<Harvest>>(
        `/harvests?hiveId=${encodeURIComponent(hiveId)}&offset=${harvestNextOffset}&limit=50`,
      );
      setExtraHarvests((current) => {
        const seen = new Set([...data.harvests, ...current].map((item) => item.id));
        return [...current, ...page.items.filter((item) => !seen.has(item.id))];
      });
      setHarvestNextOffset(page.nextOffset);
    } catch (cause) {
      setHarvestLoadError(cause instanceof Error ? cause.message : th.admin.loadFailed);
    } finally {
      setHarvestLoading(false);
    }
  }

  async function loadMoreInspections() {
    if (!data || inspectionNextOffset === null || inspectionLoading) return;
    setInspectionLoading(true);
    setInspectionLoadError("");
    try {
      const page = await api<HistoryPage<Inspection>>(
        `/inspections?hiveId=${encodeURIComponent(hiveId)}&offset=${inspectionNextOffset}&limit=50`,
      );
      setExtraInspections((current) => {
        const seen = new Set([...data.inspections, ...current].map((item) => item.id));
        return [...current, ...page.items.filter((item) => !seen.has(item.id))];
      });
      setInspectionNextOffset(page.nextOffset);
    } catch (cause) {
      setInspectionLoadError(cause instanceof Error ? cause.message : th.admin.loadFailed);
    } finally {
      setInspectionLoading(false);
    }
  }

  if (error)
    return <EmptyState title={th.admin.loadFailed} description={error} />;
  if (!data) return <Skeleton />;

  const { hive, totals } = data;
  const harvests = [...data.harvests, ...extraHarvests];
  const inspections = [...data.inspections, ...extraInspections];
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
      <div className="flex flex-wrap gap-3">
        <ButtonLink href={`/admin${hiveQuery}#harvests`}>
          {th.admin.addHarvest}
        </ButtonLink>
        <ButtonLink href={`/admin${hiveQuery}#inspections`} variant="secondary">
          {th.admin.addInspection}
        </ButtonLink>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-label={th.admin.inspections}>
          <h2 className="mb-3 text-lg font-bold">
            {th.admin.inspections} ({formatFarmNumber(totals.inspectionCount)})
          </h2>
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
                description={th.admin.firstInspection}
              />
            )}
            <LoadMore
              hasMore={inspectionNextOffset !== null}
              loading={inspectionLoading}
              error={inspectionLoadError}
              onClick={loadMoreInspections}
            />
          </div>
        </section>
        <section aria-label={th.admin.harvests}>
          <h2 className="mb-3 text-lg font-bold">
            {th.admin.harvests} ({formatFarmNumber(totals.harvestCount)})
          </h2>
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
                description={th.admin.firstHarvest}
              />
            )}
            <LoadMore
              hasMore={harvestNextOffset !== null}
              loading={harvestLoading}
              error={harvestLoadError}
              onClick={loadMoreHarvests}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
