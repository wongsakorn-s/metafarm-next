import type { FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { th } from "../../i18n/th";
import type { Hive, Inspection } from "../../lib/api";
import { PhotoUpload } from "./PhotoUpload";

export function InspectionForm({
  hives,
  today,
  busy,
  defaultHiveId,
  initial,
  onSubmit,
}: {
  hives: Hive[];
  today: string;
  busy: boolean;
  defaultHiveId?: string;
  initial?: Inspection;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-4">
        <h2 className="text-lg font-bold">{initial ? th.admin.editInspection : th.admin.addInspection}</h2>
        <Field label={th.admin.hive} required>
          {(id) => (
            <Select
              id={id}
              required
              name={initial ? undefined : "hiveId"}
              disabled={Boolean(initial)}
              defaultValue={initial?.hiveId ?? defaultHiveId ?? ""}
            >
              <option value="">{th.admin.selectHive}</option>
              {initial && !hives.some((hive) => hive.id === initial.hiveId) && (
                <option value={initial.hiveId}>{initial.hiveId}</option>
              )}
              {hives.map((hive) => (
                <option key={hive.id} value={hive.id}>
                  {hive.code} · {hive.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
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
          disabled={busy || (!initial && !hives.length)}
          full
          className="sticky bottom-0 z-10 shadow-float lg:static lg:shadow-none"
        >
          {busy ? th.common.saving : initial ? th.admin.saveEdit : th.admin.addInspection}
        </Button>
        {!hives.length && !initial && (
          <p className="text-sm text-warning-700">
            {th.admin.needHiveInspection}
          </p>
        )}
      </form>
    </Card>
  );
}
