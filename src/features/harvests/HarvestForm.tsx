import type { FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { th } from "../../i18n/th";
import type { Hive } from "../../lib/api";

export function HarvestForm({
  hives,
  today,
  busy,
  onSubmit,
}: {
  hives: Hive[];
  today: string;
  busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-4">
        <h2 className="text-lg font-bold">{th.admin.addHarvest}</h2>
        <Field label={th.admin.hive} required>
          {(id) => (
            <Select id={id} required name="hiveId">
              <option value="">{th.admin.selectHive}</option>
              {hives.map((hive) => (
                <option key={hive.id} value={hive.id}>
                  {hive.code} · {hive.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={th.admin.harvestDate} required>
          {(id) => (
            <Input
              id={id}
              required
              type="date"
              name="harvestedAt"
              defaultValue={today}
            />
          )}
        </Field>
        <Field label={th.admin.honeyMl} required>
          {(id) => (
            <Input
              id={id}
              required
              type="number"
              min="0"
              max="1000000"
              step="1"
              name="honeyMl"
              defaultValue="0"
              inputMode="numeric"
            />
          )}
        </Field>
        <Field label={th.admin.propolisG} required>
          {(id) => (
            <Input
              id={id}
              required
              type="number"
              min="0"
              max="1000000"
              step="0.01"
              name="propolisG"
              defaultValue="0"
              inputMode="decimal"
            />
          )}
        </Field>
        <Button
          type="submit"
          disabled={busy || !hives.length}
          full
          className="sticky bottom-0 z-10 shadow-float lg:static lg:shadow-none"
        >
          {busy ? th.common.saving : th.admin.addHarvest}
        </Button>
        {!hives.length && (
          <p className="text-sm text-warning-700">{th.admin.needHiveHarvest}</p>
        )}
      </form>
    </Card>
  );
}
