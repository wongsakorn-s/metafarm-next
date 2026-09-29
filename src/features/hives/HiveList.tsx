import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Skeleton } from "../../components/ui/Skeleton";
import { th } from "../../i18n/th";
import { api, type Hive } from "../../lib/api";
import { HiveCard } from "./HiveCard";

export function HiveList({
  hives,
  busy,
  onUpdate,
  owner,
  savedVersion,
  onArchive,
  onRestore,
}: {
  hives: Hive[];
  busy: boolean;
  onUpdate: (event: FormEvent<HTMLFormElement>, hive: Hive) => Promise<boolean>;
  owner: boolean;
  savedVersion: number;
  onArchive: (id: string) => Promise<boolean>;
  onRestore: (id: string) => Promise<boolean>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [allHives, setAllHives] = useState<Hive[] | null>(null);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    if (!showArchived || !owner) return;
    let active = true;
    api<Hive[]>("/hives?includeArchived=true")
      .then((rows) => { if (active) { setAllHives(rows); setLoadError(""); } })
      .catch((cause: unknown) => {
        if (active) setLoadError(cause instanceof Error ? cause.message : th.admin.loadFailed);
      });
    return () => { active = false; };
  }, [showArchived, owner, savedVersion]);
  const visibleHives = showArchived && owner ? allHives ?? hives : hives;
  const attentionCount = visibleHives.filter(
    (hive) => hive.status === "Weak" || hive.status === "Empty",
  ).length;
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("th-TH");
    return visibleHives.filter(
      (hive) =>
        (!status || hive.status === status) &&
        (!normalized ||
          [hive.code, hive.name, hive.species, hive.location].some((value) =>
            value?.toLocaleLowerCase("th-TH").includes(normalized),
          )),
    );
  }, [visibleHives, query, status]);
  return (
    <div className="space-y-3">
      {owner && (
        <Button variant="outline" aria-pressed={showArchived} onClick={() => {
          setShowArchived((value) => !value);
          setAllHives(null);
          setLoadError("");
        }}>
          {showArchived ? th.admin.hideArchivedHives : th.admin.showArchivedHives}
        </Button>
      )}
      <h2 className="text-lg font-bold">
        {th.admin.hiveList} ({visibleHives.length})
      </h2>
      {showArchived && !allHives && !loadError && <Skeleton />}
      {loadError && <EmptyState title={th.admin.loadFailed} description={loadError} />}
      {!visibleHives.length && <EmptyState title={th.admin.noHives} description={th.admin.noHivesDescription} />}
      {visibleHives.length > 0 && <>
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
        <HiveCard key={hive.id} hive={hive} busy={busy} onUpdate={onUpdate}
          owner={owner} onArchive={onArchive} onRestore={onRestore} />
      ))}
      {!filtered.length && <EmptyState title={th.admin.noMatchingHives} />}
      </>}
    </div>
  );
}
