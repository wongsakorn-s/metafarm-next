import type { FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { th } from "../../i18n/th";
import type { Hive } from "../../lib/api";

export function HiveForm({
  hive,
  busy,
  onSubmit,
}: {
  hive?: Hive;
  busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-4">
        <h2 className="text-lg font-bold">
          {hive ? th.admin.editHive : th.admin.addHive}
        </h2>
        {!hive && (
          <Field label={th.admin.hiveCode} required>
            {(id) => (
              <Input
                id={id}
                required
                maxLength={40}
                name="code"
                placeholder="MF-001"
              />
            )}
          </Field>
        )}
        <Field label={th.admin.hiveName} required>
          {(id) => (
            <Input
              id={id}
              required
              maxLength={100}
              name="name"
              defaultValue={hive?.name}
            />
          )}
        </Field>
        <Field label={th.admin.species}>
          {(id) => (
            <Input
              id={id}
              maxLength={100}
              name="species"
              defaultValue={hive?.species ?? ""}
            />
          )}
        </Field>
        <Field label={th.admin.location}>
          {(id) => (
            <Input
              id={id}
              maxLength={200}
              name="location"
              defaultValue={hive?.location ?? ""}
            />
          )}
        </Field>
        <Field label={th.admin.status}>
          {(id) => (
            <Select
              id={id}
              name="status"
              defaultValue={hive?.status ?? "Normal"}
            >
              {Object.entries(th.status).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.icon} {config.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Button
          type="submit"
          disabled={busy}
          full
          className="sticky bottom-0 z-10 shadow-float lg:static lg:shadow-none"
        >
          {busy
            ? th.common.saving
            : hive
              ? th.admin.saveEdit
              : th.admin.saveHive}
        </Button>
      </form>
    </Card>
  );
}
