import type { FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { th } from "../../i18n/th";
import type { Hive } from "../../lib/api";
import { PhotoUpload } from "./PhotoUpload";

export function InspectionForm({
  hives,
  today,
  busy,
  defaultHiveId,
  onSubmit,
}: {
  hives: Hive[];
  today: string;
  busy: boolean;
  defaultHiveId?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-4">
        <h2 className="text-lg font-bold">{th.admin.addInspection}</h2>
        <Field label={th.admin.hive} required>
          {(id) => (
            <Select
              id={id}
              required
              name="hiveId"
              defaultValue={defaultHiveId ?? ""}
            >
              <option value="">{th.admin.selectHive}</option>
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
              defaultValue={today}
            />
          )}
        </Field>
        <Field label={th.admin.status}>
          {(id) => (
            <Select id={id} name="status" defaultValue="">
              <option value="">{th.admin.keepStatus}</option>
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
              className="mt-1 block w-full rounded-control border border-stone-300 bg-white px-3 py-2"
            />
          )}
        </Field>
        <PhotoUpload />
        <p className="text-xs text-stone-600">{th.admin.networkHint}</p>
        <Button
          type="submit"
          disabled={busy || !hives.length}
          full
          className="sticky bottom-0 z-10 shadow-float lg:static lg:shadow-none"
        >
          {busy ? th.common.saving : th.admin.addInspection}
        </Button>
        {!hives.length && (
          <p className="text-sm text-warning-700">
            {th.admin.needHiveInspection}
          </p>
        )}
      </form>
    </Card>
  );
}
