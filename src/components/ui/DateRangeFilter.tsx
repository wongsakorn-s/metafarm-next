import { useEffect, useState, type FormEvent } from "react";
import { th } from "../../i18n/th";
import type { DateRange } from "../../lib/useHistory";
import { Button } from "./Button";
import { Field } from "./Field";
import { Input } from "./Input";

export function DateRangeFilter({
  range,
  loading,
  error,
  resetToken,
  onApply,
  onClear,
}: {
  range: DateRange | null;
  loading: boolean;
  error: string;
  resetToken: string | number;
  onApply: (range: DateRange) => void;
  onClear: () => void;
}) {
  const [from, setFrom] = useState(range?.from ?? "");
  const [to, setTo] = useState(range?.to ?? "");

  useEffect(() => {
    setFrom(range?.from ?? "");
    setTo(range?.to ?? "");
  }, [range?.from, range?.to, resetToken]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply({ from, to });
  }

  function clear() {
    setFrom("");
    setTo("");
    onClear();
  }

  return (
    <form onSubmit={submit} className="mb-4 rounded-card border border-stone-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <Field label={th.admin.fromDate}>
          {(id) => (
            <Input
              id={id}
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => setFrom(event.target.value)}
            />
          )}
        </Field>
        <Field label={th.admin.toDate}>
          {(id) => (
            <Input
              id={id}
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => setTo(event.target.value)}
            />
          )}
        </Field>
        <Button type="submit" disabled={loading || (!from && !to)}>
          {th.admin.filterHistory}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading || (!from && !to && !range)}
          onClick={clear}
        >
          {th.admin.clearFilter}
        </Button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-danger-700">{error}</p>}
    </form>
  );
}
