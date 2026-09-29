import { useState, type FormEvent } from "react";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Sheet } from "../../components/ui/Sheet";
import type { Hive } from "../../lib/api";
import { th } from "../../i18n/th";
import { HiveForm } from "./HiveForm";
import { StatusBadge } from "./StatusBadge";

export function HiveCard({
  hive,
  busy,
  onUpdate,
}: {
  hive: Hive;
  busy: boolean;
  onUpdate: (event: FormEvent<HTMLFormElement>, hive: Hive) => void;
}) {
  const [open, setOpen] = useState(false);
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
          <StatusBadge status={hive.status} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink href={`/admin/hives/${hive.id}`} variant="secondary">
            {th.admin.details}
          </ButtonLink>
          <Button variant="outline" onClick={() => setOpen(true)}>
            {th.admin.editData}
          </Button>
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
          onSubmit={(event) => onUpdate(event, hive)}
        />
      </Sheet>
    </>
  );
}
