import type { FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge } from "../hives/StatusBadge";
import { th } from "../../i18n/th";
import type { Inspection } from "../../lib/api";
import { PhotoUpload } from "./PhotoUpload";

export function InspectionList({
  inspections,
  hiveName,
  busy,
  onUpload,
}: {
  inspections: Inspection[];
  hiveName: (id: string) => string;
  busy: boolean;
  onUpload: (event: FormEvent<HTMLFormElement>, id: string) => void;
}) {
  if (!inspections.length)
    return (
      <EmptyState
        title={th.common.noData}
        description={th.admin.firstInspection}
      />
    );
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold">{th.admin.latest}</h2>
      {inspections.map((record) => (
        <Card key={record.id}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-bold">{hiveName(record.hiveId)}</h3>
              <p className="mt-1 text-sm text-stone-600">
                {record.inspectedAt}
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
          <form
            onSubmit={(event) => onUpload(event, record.id)}
            className="mt-4 border-t border-stone-100 pt-4"
          >
            <PhotoUpload required />
            <Button
              type="submit"
              disabled={busy}
              className="mt-3"
              variant="outline"
            >
              {record.imageKey ? th.admin.photoReplace : th.admin.photoAdd}
            </Button>
          </form>
        </Card>
      ))}
    </div>
  );
}
