import { useEffect, useState, type FormEvent } from "react";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DateRangeFilter } from "../../components/ui/DateRangeFilter";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { LoadMore } from "../../components/ui/LoadMore";
import { Sheet } from "../../components/ui/Sheet";
import { th } from "../../i18n/th";
import {
  api,
  type AuditEntry,
  type Harvest,
  type Hive,
  type HiveDetailData,
  type Inspection,
} from "../../lib/api";
import { formatFarmDate, formatFarmNumber } from "../../lib/date";
import { useHistory } from "../../lib/useHistory";
import { StatusBadge } from "./StatusBadge";
import { HarvestForm } from "../harvests/HarvestForm";
import { InspectionForm } from "../inspections/InspectionForm";

export function HiveDetail({
  hiveId, owner, hives, today, busy, savedVersion,
  onEditHarvest, onDeleteHarvest, onEditInspection, onDeleteInspection,
}: {
  hiveId: string;
  owner: boolean;
  hives: Hive[];
  today: string;
  busy: boolean;
  savedVersion: number;
  onEditHarvest: (id: string, event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onDeleteHarvest: (id: string) => Promise<boolean>;
  onEditInspection: (id: string, event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onDeleteInspection: (id: string) => Promise<boolean>;
}) {
  const [data, setData] = useState<HiveDetailData | null>(null);
  const [error, setError] = useState("");
  const [editingHarvest, setEditingHarvest] = useState<Harvest | null>(null);
  const [deletingHarvest, setDeletingHarvest] = useState<Harvest | null>(null);
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);
  const [deletingInspection, setDeletingInspection] = useState<Inspection | null>(null);
  const [activeTab, setActiveTab] = useState<"records" | "audit">("records");
  const [auditRows, setAuditRows] = useState<AuditEntry[] | null>(null);
  const [auditError, setAuditError] = useState("");
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
    setData((current) => current?.hive.id === hiveId ? current : null);
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
  }, [hiveId, savedVersion]);

  useEffect(() => {
    if (!owner || activeTab !== "audit") return;
    let active = true;
    setAuditRows(null);
    setAuditError("");
    api<{ items: AuditEntry[] }>(`/audit?entity=hive&entityId=${encodeURIComponent(hiveId)}`)
      .then((page) => { if (active) setAuditRows(page.items); })
      .catch((cause: unknown) => {
        if (active) setAuditError(cause instanceof Error ? cause.message : th.admin.loadFailed);
      });
    return () => { active = false; };
  }, [owner, activeTab, hiveId, savedVersion]);

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
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={hive.status} />
            {hive.archivedAt && <Badge tone="warning" icon="▣">{th.admin.archivedHive}</Badge>}
          </div>
        </div>
        <p className="mt-4 text-stone-700">
          {th.admin.species}: {hive.species || "—"} · {th.admin.location}:{" "}
          {hive.location || "—"}
        </p>
      </Card>
      {!hive.archivedAt && <div className="flex flex-wrap gap-3">
        <ButtonLink href={`/admin${hiveQuery}#harvests`}>
          {th.admin.addHarvest}
        </ButtonLink>
        <ButtonLink href={`/admin${hiveQuery}#inspections`} variant="secondary">
          {th.admin.addInspection}
        </ButtonLink>
      </div>}
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
      {owner && <div role="tablist" aria-label={th.admin.auditHistory} className="flex flex-wrap gap-2">
        <Button role="tab" aria-selected={activeTab === "records"} variant={activeTab === "records" ? "secondary" : "outline"}
          onClick={() => setActiveTab("records")}>{th.admin.recordHistory}</Button>
        <Button role="tab" aria-selected={activeTab === "audit"} variant={activeTab === "audit" ? "secondary" : "outline"}
          onClick={() => setActiveTab("audit")}>{th.admin.auditHistory}</Button>
      </div>}
      {(!owner || activeTab === "records") && <div role={owner ? "tabpanel" : undefined} className="grid gap-6 xl:grid-cols-2">
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
                  {(record.permissions.canEdit || record.permissions.canDelete) && <div className="mt-4 flex flex-wrap gap-2">
                    {record.permissions.canEdit && <Button variant="outline" disabled={busy} onClick={() => setEditingInspection(record)}>{th.admin.editInspection}</Button>}
                    {record.permissions.canDelete && <Button variant="outline" disabled={busy} onClick={() => setDeletingInspection(record)}>{th.admin.deleteInspection}</Button>}
                  </div>}
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
                  {(record.permissions.canEdit || record.permissions.canDelete) && <div className="mt-4 flex flex-wrap gap-2">
                    {record.permissions.canEdit && <Button variant="outline" disabled={busy} onClick={() => setEditingHarvest(record)}>{th.admin.editHarvest}</Button>}
                    {record.permissions.canDelete && <Button variant="outline" disabled={busy} onClick={() => setDeletingHarvest(record)}>{th.admin.deleteHarvest}</Button>}
                  </div>}
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
      </div>}
      {owner && activeTab === "audit" && <section role="tabpanel" aria-label={th.admin.auditHistory}>
        {auditError && <EmptyState title={th.admin.loadFailed} description={auditError} />}
        {!auditRows && !auditError && <Skeleton />}
        {auditRows?.length === 0 && <EmptyState title={th.admin.auditNoData} />}
        <div className="space-y-3">
          {auditRows?.map((entry) => <Card key={entry.id}>
            <p className="font-semibold">{th.admin.auditActions[entry.action]}</p>
            <p className="mt-1 break-words text-sm text-stone-600">{entry.actorEmail} · {new Date(entry.createdAt).toLocaleString("th-TH")}</p>
          </Card>)}
        </div>
      </section>}
      <Sheet open={editingHarvest !== null} onClose={() => setEditingHarvest(null)} title={th.admin.editHarvest}>
        {editingHarvest && <HarvestForm key={editingHarvest.id} initial={editingHarvest} hives={hives} today={today} busy={busy}
          onSubmit={async (event) => { if (await onEditHarvest(editingHarvest.id, event)) setEditingHarvest(null); }} />}
      </Sheet>
      <Sheet open={editingInspection !== null} onClose={() => setEditingInspection(null)} title={th.admin.editInspection}>
        {editingInspection && <InspectionForm key={editingInspection.id} initial={editingInspection} hives={hives} today={today} busy={busy}
          onSubmit={async (event) => { if (await onEditInspection(editingInspection.id, event)) setEditingInspection(null); }} />}
      </Sheet>
      <ConfirmDialog open={deletingHarvest !== null} title={th.admin.confirmDeleteHarvest}
        description={th.admin.deleteHarvestWarning} confirmLabel={th.admin.deleteHarvest} destructive busy={busy}
        onClose={() => setDeletingHarvest(null)} onConfirm={async () => {
          if (deletingHarvest && await onDeleteHarvest(deletingHarvest.id)) setDeletingHarvest(null);
        }} />
      <ConfirmDialog open={deletingInspection !== null} title={th.admin.confirmDeleteInspection}
        description={th.admin.deleteInspectionWarning} confirmLabel={th.admin.deleteInspection} destructive busy={busy}
        onClose={() => setDeletingInspection(null)} onConfirm={async () => {
          if (deletingInspection && await onDeleteInspection(deletingInspection.id)) setDeletingInspection(null);
        }} />
    </div>
  );
}
