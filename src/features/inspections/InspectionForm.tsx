import type { FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { th } from "../../i18n/th";
import type { Hive, Inspection } from "../../lib/api";
import { PhotoUpload } from "./PhotoUpload";
import { useFieldDraft } from "../../lib/useFieldDraft";
import { useOnlineStatus } from "../../lib/useOnlineStatus";

export function InspectionForm({
  hives,
  today,
  busy,
  defaultHiveId,
  lockedHiveId,
  initial,
  onSubmit,
  onInputChange,
  actorEmail,
}: {
  hives: Hive[];
  today: string;
  busy: boolean;
  defaultHiveId?: string;
  lockedHiveId?: string;
  initial?: Inspection;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<boolean | void>;
  onInputChange?: (form: HTMLFormElement, fieldName: string) => void;
  actorEmail?: string;
}) {
  const online = useOnlineStatus();
  const draft = useFieldDraft("inspection", initial ? undefined : actorEmail, lockedHiveId ?? defaultHiveId);
  return (
    <Card>
      <form ref={draft.formRef} onSubmit={async (event) => {
        const saved = await onSubmit(event);
        if (saved === true && !initial) draft.clear();
      }} onInput={(event) => {
        onInputChange?.(event.currentTarget, (event.target as HTMLInputElement).name);
        if (!initial) draft.onInput(event);
      }} className="space-y-4">
        <h2 className="text-lg font-bold">{initial ? th.admin.editInspection : th.admin.addInspection}</h2>
        <Field label={th.admin.hive} required>
          {(id) => (
            <Select
              id={id}
              required
              name={initial || lockedHiveId ? undefined : "hiveId"}
              disabled={Boolean(initial || lockedHiveId)}
              defaultValue={initial?.hiveId ?? lockedHiveId ?? defaultHiveId ?? ""}
            >
              <option value="">{th.admin.selectHive}</option>
              {initial && !hives.some((hive) => hive.id === initial.hiveId) && (
                <option value={initial.hiveId}>{initial.hiveId}</option>
              )}
              {lockedHiveId && !hives.some((hive) => hive.id === lockedHiveId) && (
                <option value={lockedHiveId}>{lockedHiveId}</option>
              )}
              {hives.map((hive) => (
                <option key={hive.id} value={hive.id}>
                  {hive.code} · {hive.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {lockedHiveId && <input type="hidden" name="hiveId" value={lockedHiveId} />}
        <Field label={th.admin.inspectionDate} required>
          {(id) => (
            <Input
              id={id}
              required
              type="date"
              name="inspectedAt"
              defaultValue={initial?.inspectedAt ?? today}
            />
          )}
        </Field>
        <Field label={th.admin.status}>
          {(id) => (
            <Select id={id} name="status" defaultValue={initial?.status ?? ""}>
              {!initial && <option value="">{th.admin.keepStatus}</option>}
              {Object.entries(th.status).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.icon} {config.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={th.admin.notes}>
          {(id) => (
            <textarea
              id={id}
              name="notes"
              maxLength={2000}
              rows={3}
              defaultValue={initial?.notes ?? ""}
              className="mt-1 block w-full rounded-control border border-stone-300 bg-white px-3 py-2"
            />
          )}
        </Field>
        {!initial && <PhotoUpload />}
        <p className="text-xs text-stone-600">{th.admin.networkHint}</p>
        <Button
          type="submit"
          disabled={busy || !online || (!initial && !hives.length)}
          title={!online ? th.admin.offlineSaveDisabled : undefined}
          full
          className="sticky bottom-0 z-10 shadow-float lg:static lg:shadow-none"
        >
          {busy ? th.common.saving : initial ? th.admin.saveEdit : th.admin.addInspection}
        </Button>
        {draft.hasDraft && <p role="status" className="rounded-control bg-warning-50 p-3 text-sm text-warning-700">{th.admin.unsavedDraft}</p>}
        {draft.error && <p role="alert" className="text-sm text-danger-700">{draft.error}</p>}
        {!online && <p className="text-sm text-warning-700">{th.admin.offlineSaveDisabled}</p>}
        {!hives.length && !initial && (
          <p className="text-sm text-warning-700">
            {th.admin.needHiveInspection}
          </p>
        )}
      </form>
    </Card>
  );
}
