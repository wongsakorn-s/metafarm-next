import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DateRangeFilter } from "../../components/ui/DateRangeFilter";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadMore } from "../../components/ui/LoadMore";
import { Sheet } from "../../components/ui/Sheet";
import { StatusBadge } from "../hives/StatusBadge";
import { th } from "../../i18n/th";
import type { Hive, Inspection } from "../../lib/api";
import type { HistoryView } from "../../lib/useHistory";
import { formatFarmDate } from "../../lib/date";
import { PhotoUpload } from "./PhotoUpload";
import { InspectionForm } from "./InspectionForm";
import { useOnlineStatus } from "../../lib/useOnlineStatus";

export function InspectionList({
  history,
  hiveName,
  busy,
  hives,
  today,
  onEdit,
  onDelete,
  onUpload,
  savedVersion,
}: {
  history: HistoryView<Inspection>;
  hiveName: (id: string) => string;
  busy: boolean;
  hives: Hive[];
  today: string;
  onEdit: (id: string, event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onUpload: (event: FormEvent<HTMLFormElement>, id: string) => void;
  savedVersion: number;
}) {
  const online = useOnlineStatus();
  const inspections = history.items;
  const [photoRecordId, setPhotoRecordId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Inspection | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Inspection | null>(null);
  const previousVersion = useRef(savedVersion);
  useEffect(() => {
    if (previousVersion.current !== savedVersion) setPhotoRecordId(null);
    previousVersion.current = savedVersion;
  }, [savedVersion]);
  const photoRecord = inspections.find((record) => record.id === photoRecordId);
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold">{th.admin.latest}</h2>
      <DateRangeFilter
        range={history.range}
        loading={history.loading}
        error={history.errorSource === "filter" ? history.error : ""}
        resetToken="inspections"
        onApply={history.applyFilter}
        onClear={history.clearFilter}
      />
      {!inspections.length && (
        <EmptyState
          title={th.common.noData}
          description={history.range ? th.admin.noHistoryMatch : th.admin.firstInspection}
        />
      )}
      {inspections.map((record) => (
        <Card key={record.id}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-bold">{hiveName(record.hiveId)}</h3>
              <p className="mt-1 text-sm text-stone-600">
                {formatFarmDate(record.inspectedAt)}
              </p>
            </div>
            <StatusBadge status={record.status} />
          </div>
          {record.notes && (
            <p className="mt-3 whitespace-pre-wrap text-sm text-stone-700">
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
          <div className="mt-4 border-t border-stone-100 pt-4">
            <div className="flex flex-wrap gap-2">
              {record.permissions.canEdit && (
                <>
                  <Button variant="outline" disabled={busy} onClick={() => setEditing(record)}>
                    {th.admin.editInspection}
                  </Button>
                  <Button variant="outline" disabled={busy} onClick={() => setPhotoRecordId(record.id)}>
                    {record.imageKey ? th.admin.photoReplace : th.admin.photoAdd}
                  </Button>
                </>
              )}
              {record.permissions.canDelete && (
                <Button variant="outline" disabled={busy} onClick={() => setPendingDelete(record)}>
                  {th.admin.deleteInspection}
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
      <LoadMore
        hasMore={history.hasMore}
        loading={history.loading}
        error={history.errorSource === "more" ? history.error : ""}
        onClick={history.loadMore}
      />
      <Sheet
        open={Boolean(photoRecord)}
        onClose={() => setPhotoRecordId(null)}
        title={
          photoRecord?.imageKey ? th.admin.photoReplace : th.admin.photoAdd
        }
      >
        {photoRecord && (
          <form onSubmit={(event) => onUpload(event, photoRecord.id)}>
            <p className="mb-4 font-semibold text-stone-800">
              {hiveName(photoRecord.hiveId)}
            </p>
            <PhotoUpload required />
            <Button type="submit" disabled={busy || !online} title={!online ? th.admin.offlineSaveDisabled : undefined} full className="mt-5">
              {busy ? th.common.saving : th.common.save}
            </Button>
            {!online && <p className="mt-2 text-sm text-warning-700">{th.admin.offlineSaveDisabled}</p>}
          </form>
        )}
      </Sheet>
      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={th.admin.editInspection}>
        {editing && (
          <InspectionForm
            key={editing.id}
            initial={editing}
            hives={hives}
            today={today}
            busy={busy}
            onSubmit={async (event) => {
              if (await onEdit(editing.id, event)) setEditing(null);
            }}
          />
        )}
      </Sheet>
      <ConfirmDialog
        open={pendingDelete !== null}
        title={th.admin.confirmDeleteInspection}
        description={th.admin.deleteInspectionWarning}
        confirmLabel={th.admin.deleteInspection}
        destructive
        busy={busy}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete && await onDelete(pendingDelete.id)) setPendingDelete(null);
        }}
      />
    </div>
  );
}
