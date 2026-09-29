import type { FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { th } from "../../i18n/th";

export function TeamForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-4">
        <h2 className="text-lg font-bold">{th.admin.addTeam}</h2>
        <Field label={th.admin.email} required>
          {(id) => (
            <Input
              id={id}
              required
              type="email"
              maxLength={254}
              name="email"
              autoComplete="email"
            />
          )}
        </Field>
        <Button
          type="submit"
          disabled={busy}
          full
          className="sticky bottom-0 z-10 shadow-float lg:static lg:shadow-none"
        >
          {busy ? th.common.saving : th.admin.grantAccess}
        </Button>
        <p className="text-sm text-stone-600">{th.admin.accessHint}</p>
      </form>
    </Card>
  );
}
