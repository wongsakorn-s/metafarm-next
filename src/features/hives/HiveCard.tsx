import { useState, type FormEvent } from "react";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Sheet } from "../../components/ui/Sheet";
import type { Hive } from "../../lib/api";
import { th } from "../../i18n/th";
import { HiveForm } from "./HiveForm";
import { StatusBadge } from "./StatusBadge";

export function HiveCard({
  hive,
  busy,
  onUpdate,
  owner,
  onArchive,
  onRestore,
}: {
  hive: Hive;
  busy: boolean;
  onUpdate: (event: FormEvent<HTMLFormElement>, hive: Hive) => Promise<boolean>;
  owner: boolean;
  onArchive: (id: string) => Promise<boolean>;
  onRestore: (id: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<"archive" | "restore" | null>(null);
  return (
    <>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">
              {hive.code} · {hive.name}
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              {hive.species || "—"} · {hive.location || "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={hive.status} />
            {hive.archivedAt && <Badge tone="warning" icon="▣">{th.admin.archivedHive}</Badge>}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink href={`/admin/hives/${hive.id}`} variant="secondary">
            {th.admin.details}
          </ButtonLink>
          {!hive.archivedAt && (
            <Button variant="outline" onClick={() => setOpen(true)}>
              {th.admin.editData}
            </Button>
          )}
          {owner && (
            <Button variant="outline" disabled={busy} onClick={() => setConfirming(hive.archivedAt ? "restore" : "archive")}>
              {hive.archivedAt ? th.admin.restoreHive : th.admin.archiveHive}
            </Button>
          )}
        </div>
      </Card>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={`${th.admin.editHive} ${hive.code}`}
      >
        <HiveForm
          hive={hive}
          busy={busy}
          onSubmit={async (event) => {
            if (await onUpdate(event, hive)) setOpen(false);
          }}
        />
      </Sheet>
      <ConfirmDialog
        open={confirming !== null}
        title={confirming === "archive" ? th.admin.confirmArchiveHive : th.admin.confirmRestoreHive}
        description={confirming === "archive" ? th.admin.archiveHiveWarning : th.admin.restoreHiveWarning}
        confirmLabel={confirming === "archive" ? th.admin.archiveHive : th.admin.restoreHive}
        destructive={confirming === "archive"}
        busy={busy}
        onClose={() => setConfirming(null)}
        onConfirm={async () => {
          const done = confirming === "archive" ? await onArchive(hive.id) : await onRestore(hive.id);
          if (done) setConfirming(null);
        }}
      />
    </>
  );
}
