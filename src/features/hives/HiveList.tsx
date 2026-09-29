import type { FormEvent } from "react";
import { EmptyState } from "../../components/ui/EmptyState";
import { th } from "../../i18n/th";
import type { Hive } from "../../lib/api";
import { HiveCard } from "./HiveCard";

export function HiveList({
  hives,
  busy,
  onUpdate,
}: {
  hives: Hive[];
  busy: boolean;
  onUpdate: (event: FormEvent<HTMLFormElement>, hive: Hive) => void;
}) {
  if (!hives.length)
    return (
      <EmptyState
        title={th.admin.noHives}
        description={th.admin.noHivesDescription}
      />
    );
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold">
        {th.admin.hiveList} ({hives.length})
      </h2>
      {hives.map((hive) => (
        <HiveCard key={hive.id} hive={hive} busy={busy} onUpdate={onUpdate} />
      ))}
    </div>
  );
}
