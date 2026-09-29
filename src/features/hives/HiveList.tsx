import { useMemo, useState, type FormEvent } from "react";
import { EmptyState } from "../../components/ui/EmptyState";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
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
  onUpdate: (event: FormEvent<HTMLFormElement>, hive: Hive) => Promise<boolean>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const attentionCount = hives.filter(
    (hive) => hive.status === "Weak" || hive.status === "Empty",
  ).length;
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("th-TH");
    return hives.filter(
      (hive) =>
        (!status || hive.status === status) &&
        (!normalized ||
          [hive.code, hive.name, hive.species, hive.location].some((value) =>
            value?.toLocaleLowerCase("th-TH").includes(normalized),
          )),
    );
  }, [hives, query, status]);
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
      <p className="text-sm text-warning-700">
        {th.admin.attentionHives}: {attentionCount}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={th.admin.searchHives}>
          {(id) => (
            <Input
              id={id}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          )}
        </Field>
        <Field label={th.admin.filterStatus}>
          {(id) => (
            <Select
              id={id}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">{th.admin.allStatuses}</option>
              {Object.entries(th.status).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      {filtered.map((hive) => (
        <HiveCard key={hive.id} hive={hive} busy={busy} onUpdate={onUpdate} />
      ))}
      {!filtered.length && <EmptyState title={th.admin.noMatchingHives} />}
    </div>
  );
}
